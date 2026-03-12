/**
 * =============================================
 *      MAINUL-X WhatsApp Media Downloader
 * =============================================
 * Author: Md. Mainul Islam (MAINUL-X)
 * GitHub: https://github.com/M41NUL
 * Telegram: @mdmainulislaminfo
 * Email: githubmainul@gmail.com
 * =============================================
 * Handler: Main message handler for the bot
 * Description: Processes incoming messages and routes to appropriate downloaders
 * =============================================
 */

import fs from 'fs';
import path from 'path';
import { userState } from './userState.js';
import { handleYouTubeDownloader } from './features/youtube.js';
import { handleFacebookDownloader } from './features/facebook.js';
import { handleInstagramDownloader } from './features/instagram.js';
import { handleTikTokDownloader } from './features/tiktok.js';
import { validateUrl, detectPlatform } from './utils/validateUrl.js';

const menuImagePath = path.join(process.cwd(), 'src/assets/menu.jpg');

/**
 * Main message handler function
 * @param {Object} sock - WhatsApp socket connection
 * @param {Object} msg - Message object
 */
export async function handler(sock, msg) {
  if (!msg?.message) return;

  const from = msg.key.remoteJid;
  const state = userState.get(from) || { step: 'start' };

  // Extract text from message
  const text =
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    msg.message?.imageMessage?.caption ||
    msg.message?.videoMessage?.caption;

  // Handle interactive button responses
  let rowId;
  try {
    if (msg.message?.interactiveResponseMessage?.nativeFlowResponseMessage) {
      rowId = JSON.parse(msg.message.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson).id;
    } else if (msg.message?.listResponseMessage?.singleSelectReply?.selectedRowId) {
      rowId = msg.message.listResponseMessage.singleSelectReply.selectedRowId;
    }
  } catch (err) {
    console.error('[MAINUL-X] Error parsing button response:', err);
  }

  // Handle back to menu button
  const btnId = msg.message?.buttonsResponseMessage?.selectedButtonId;
  if (btnId === 'back_to_menu') {
    await sock.sendPresenceUpdate('composing', from);
    await new Promise(r => setTimeout(r, 800));
    await sendDownloaderMenu(sock, from);
    await sock.sendPresenceUpdate('paused', from);
    userState.set(from, { step: 'menuMain' });
    return;
  }

  // Handle platform selection from menu
  if (rowId) {
    switch (rowId) {
      case 'yt_downloader':
        userState.set(from, { step: 'yt_wait_url' });
        await sock.sendMessage(from, { text: '📌 Please send your *YouTube* video link:' });
        break;
      case 'fb_downloader':
        userState.set(from, { step: 'fb_wait_url' });
        await sock.sendMessage(from, { text: '📌 Please send your *Facebook* video link:' });
        break;
      case 'ig_downloader':
        userState.set(from, { step: 'ig_wait_url' });
        await sock.sendMessage(from, { text: '📌 Please send your *Instagram* video/reels link:' });
        break;
      case 'tt_downloader':
        userState.set(from, { step: 'tt_wait_url' });
        await sock.sendMessage(from, { text: '📌 Please send your *TikTok* video link:' });
        break;
      default:
        break;
    }
    return;
  }

  // Handle text messages (URL inputs)
  if (text) {
    switch (state.step) {
      case 'yt_wait_url':
        if (!validateUrl(text, 'youtube')) {
          await sock.sendMessage(from, { 
            text: '❌ Invalid URL. Please send a valid YouTube link.',
            buttons: [{ buttonId: 'back_to_menu', buttonText: { displayText: 'Back to Menu' }, type: 1 }]
          });
          return;
        }
        await handleYouTubeDownloader(sock, from, text);
        break;

      case 'fb_wait_url':
        if (!validateUrl(text, 'facebook')) {
          await sock.sendMessage(from, { 
            text: '❌ Invalid URL. Please send a valid Facebook video link.',
            buttons: [{ buttonId: 'back_to_menu', buttonText: { displayText: 'Back to Menu' }, type: 1 }]
          });
          return;
        }
        await handleFacebookDownloader(sock, from, text);
        break;

      case 'ig_wait_url':
        if (!validateUrl(text, 'instagram')) {
          await sock.sendMessage(from, { 
            text: '❌ Invalid URL. Please send a valid Instagram video/reels link.',
            buttons: [{ buttonId: 'back_to_menu', buttonText: { displayText: 'Back to Menu' }, type: 1 }]
          });
          return;
        }
        await handleInstagramDownloader(sock, from, text);
        break;

      case 'tt_wait_url':
        if (!validateUrl(text, 'tiktok')) {
          await sock.sendMessage(from, { 
            text: '❌ Invalid URL. Please send a valid TikTok video link.',
            buttons: [{ buttonId: 'back_to_menu', buttonText: { displayText: 'Back to Menu' }, type: 1 }]
          });
          return;
        }
        await handleTikTokDownloader(sock, from, text);
        break;

      default:
        await sendDownloaderMenu(sock, from);
        break;
    }

    userState.set(from, { step: 'menuMain' });
    return;
  }

  // Initial state - show menu
  if (state.step === 'start' || state.step === 'menuMain') {
    await sendDownloaderMenu(sock, from);
    userState.set(from, { step: 'menuMain' });
  }
}

/**
 * Send the main downloader menu with buttons
 * @param {Object} sock - WhatsApp socket connection
 * @param {String} from - Chat ID
 */
export async function sendDownloaderMenu(sock, from) {
  // Check if menu image exists
  if (!fs.existsSync(menuImagePath)) {
    console.warn('[MAINUL-X] Menu image not found. Sending text menu instead.');
    await sendTextMenu(sock, from);
    return;
  }

  await sock.sendMessage(from, {
    image: fs.readFileSync(menuImagePath),
    caption: '🤖 *MAINUL-X Media Downloader*\n━━━━━━━━━━━━━━━━━━━━━\nSelect a platform to download videos:',
    footer: '© 2026 MAINUL-X | MIT License',
    interactiveButtons: [
      {
        name: 'single_select',
        buttonParamsJson: JSON.stringify({
          title: '📱 Video Downloader',
          sections: [
            {
              title: 'Available Platforms',
              rows: [
                { 
                  title: '🎥 YouTube Downloader', 
                  description: 'Download videos from YouTube', 
                  id: 'yt_downloader' 
                },
                { 
                  title: '📘 Facebook Downloader', 
                  description: 'Download videos from Facebook', 
                  id: 'fb_downloader' 
                },
                { 
                  title: '📸 Instagram Downloader', 
                  description: 'Download reels & videos from Instagram', 
                  id: 'ig_downloader' 
                },
                { 
                  title: '🎵 TikTok Downloader', 
                  description: 'Download TikTok videos (No Watermark)', 
                  id: 'tt_downloader' 
                },
              ],
            },
          ],
        }),
      },
    ],
  });
}

/**
 * Fallback text menu if image is not available
 * @param {Object} sock - WhatsApp socket connection
 * @param {String} from - Chat ID
 */
async function sendTextMenu(sock, from) {
  const menuText = `🤖 *MAINUL-X Media Downloader*
━━━━━━━━━━━━━━━━━━━━━
🎥 *YouTube Downloader* - Type: yt <url>
📘 *Facebook Downloader* - Type: fb <url>
📸 *Instagram Downloader* - Type: ig <url>
🎵 *TikTok Downloader* - Type: tt <url>
━━━━━━━━━━━━━━━━━━━━━
⚡ Powered by MAINUL-X`;

  await sock.sendMessage(from, { text: menuText });
}