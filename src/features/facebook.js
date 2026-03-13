/**
 * =============================================
 *      MAINUL-X WhatsApp Media Downloader
 * =============================================
 * Author: Md. Mainul Islam (MAINUL-X)
 * GitHub: https://github.com/M41NUL
 * Telegram: @mdmainulislaminfo
 * Email: githubmainul@gmail.com
 * =============================================
 * Feature: Facebook Video Downloader
 * =============================================
 */

import fs from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import ytdlpExec from 'yt-dlp-exec';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Facebook video downloader function
 * @param {Object} sock - WhatsApp socket connection
 * @param {String} from - Sender's chat ID
 * @param {String} url - Facebook video URL
 */
export async function handleFacebookDownloader(sock, from, url) {
  // URL validation
  if (!url.startsWith('http')) {
    await sock.sendMessage(from, { text: '❌ Invalid URL. Please provide a valid Facebook video link.' });
    return;
  }

  // Send processing message
  await sock.sendMessage(from, { text: '📥 Downloading Facebook video... Please wait.' });

  const tempFile = `${__dirname}/tmp_fb_${Date.now()}.mp4`;

  try {
    // Download video using yt-dlp
    await ytdlpExec(url, { 
      output: tempFile, 
      format: 'mp4',
      noCheckCertificates: true,
      preferFreeFormats: true
    });

    // Check if file exists
    if (!fs.existsSync(tempFile)) {
      throw new Error('Download failed - file not created');
    }

    // Send video to WhatsApp
    await sock.sendMessage(from, {
      video: fs.readFileSync(tempFile),
      mimetype: 'video/mp4',
      caption: '📹 Facebook Video Downloaded Successfully!\n━━━━━━━━━━━━━━━━━━━━━\n🔗 Source: Facebook\n⚡ Powered by MAINUL-X'
    });

    // Clean up temp file
    fs.unlinkSync(tempFile);
    console.log(`✅ Facebook video downloaded and sent: ${url}`);

  } catch (err) {
    console.error('❌ Facebook Download Error:', err.message);
    
    // Error message
    let errorMsg = '❌ Failed to download Facebook video.';
    if (err.message.includes('Private video')) {
      errorMsg = '❌ This video is private or unavailable.';
    } else if (err.message.includes('Invalid URL')) {
      errorMsg = '❌ Invalid Facebook URL. Please check and try again.';
    }
    
    await sock.sendMessage(from, { text: errorMsg });

    // Clean up temp file if exists
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
  }
}
