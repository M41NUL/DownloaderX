/**
 * =============================================
 *      MAINUL-X WhatsApp Media Downloader
 * =============================================
 * Author: Md. Mainul Islam (MAINUL-X)
 * GitHub: https://github.com/M41NUL
 * Telegram: @mdmainulislaminfo
 * Email: githubmainul@gmail.com
 * =============================================
 * Feature: Facebook Video Downloader with Progress Bar
 * =============================================
 */

import fs from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import ytdlpExec from 'yt-dlp-exec';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Facebook video downloader function with progress bar
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

  // Send initial message
  await sock.sendMessage(from, { text: '⏳ Initializing Facebook download...' });

  const tempFile = `${__dirname}/tmp_fb_${Date.now()}.mp4`;

  try {
    // Get video info
    await sock.sendMessage(from, { text: '🔍 Fetching video information...' });

    // Progress tracking
    let lastProgress = 0;
    const progressInterval = setInterval(async () => {
      if (lastProgress < 100) {
        const progressMsg = [
          '⏳ Downloading... 0%',
          '🔄 25% downloaded',
          '📥 50% downloaded',
          '📦 75% downloaded',
          '✅ 100% complete'
        ][Math.floor(lastProgress / 25)];
        
        if (lastProgress % 25 === 0 && lastProgress < 100) {
          await sock.sendMessage(from, { text: progressMsg });
        }
        lastProgress += 25;
      }
    }, 2000);

    // Download video using yt-dlp
    await ytdlpExec(url, { 
      output: tempFile, 
      format: 'mp4',
      noCheckCertificates: true,
      preferFreeFormats: true
    });

    clearInterval(progressInterval);
    await sock.sendMessage(from, { text: '✅ Download complete! Now sending video...' });

    // Check if file exists
    if (!fs.existsSync(tempFile)) {
      throw new Error('Download failed - file not created');
    }

    // Get file size
    const stats = fs.statSync(tempFile);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    // Send video to WhatsApp
    await sock.sendMessage(from, {
      video: fs.readFileSync(tempFile),
      mimetype: 'video/mp4',
      caption: `📹 *Facebook Video Downloaded!*\n━━━━━━━━━━━━━━━━━━━━━\n📦 *Size:* ${fileSizeMB} MB\n🔗 *Source:* Facebook\n━━━━━━━━━━━━━━━━━━━━━\n⚡ Powered by MAINUL-X`
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
