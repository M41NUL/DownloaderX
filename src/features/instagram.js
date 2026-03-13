/**
 * =============================================
 *      MAINUL-X WhatsApp Media Downloader
 * =============================================
 * Author: Md. Mainul Islam (MAINUL-X)
 * GitHub: https://github.com/M41NUL
 * Telegram: @mdmainulislaminfo
 * Email: githubmainul@gmail.com
 * =============================================
 * Feature: Instagram Video/Reels Downloader with Progress Bar
 * =============================================
 */

import fs from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import ytdlpExec from 'yt-dlp-exec';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Instagram video/reels downloader function with progress bar
 * @param {Object} sock - WhatsApp socket connection
 * @param {String} from - Sender's chat ID
 * @param {String} url - Instagram video/reels URL
 */
export async function handleInstagramDownloader(sock, from, url) {
  // URL validation
  if (!url.startsWith('http')) {
    await sock.sendMessage(from, { text: '❌ Invalid URL. Please provide a valid Instagram video/reels link.' });
    return;
  }

  // Check if it's Instagram URL
  if (!url.includes('instagram.com')) {
    await sock.sendMessage(from, { text: '❌ This is not an Instagram URL. Please provide a valid Instagram link.' });
    return;
  }

  // Send initial message
  await sock.sendMessage(from, { text: '⏳ Initializing Instagram download...' });

  const tempFile = `${__dirname}/tmp_ig_${Date.now()}.mp4`;

  try {
    // Get video info
    await sock.sendMessage(from, { text: '🔍 Fetching Instagram content...' });

    // Determine content type (video or reels)
    const isReels = url.includes('/reel/') || url.includes('/reels/');
    const contentType = isReels ? 'Reels' : 'Post';

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
      caption: `📹 *Instagram ${contentType} Downloaded!*\n━━━━━━━━━━━━━━━━━━━━━\n📌 *Type:* ${contentType}\n📦 *Size:* ${fileSizeMB} MB\n🔗 *Source:* Instagram\n━━━━━━━━━━━━━━━━━━━━━\n⚡ Powered by MAINUL-X`
    });

    // Clean up temp file
    fs.unlinkSync(tempFile);
    console.log(`✅ Instagram ${contentType} downloaded and sent: ${url}`);

  } catch (err) {
    console.error('❌ Instagram Download Error:', err.message);
    
    // Error message
    let errorMsg = '❌ Failed to download Instagram video.';
    
    if (err.message.includes('Private')) {
      errorMsg = '❌ This Instagram post is private or unavailable.';
    } else if (err.message.includes('404')) {
      errorMsg = '❌ Instagram post not found or has been deleted.';
    } else if (err.message.includes('Login required')) {
      errorMsg = '❌ This Instagram content requires login. Try with a public post.';
    }
    
    await sock.sendMessage(from, { text: errorMsg });

    // Clean up temp file if exists
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
  }
}
