/**
 * =============================================
 *      MAINUL-X WhatsApp Media Downloader
 * =============================================
 * Author: Md. Mainul Islam (MAINUL-X)
 * GitHub: https://github.com/M41NUL
 * Telegram: @mdmainulislaminfo
 * Email: githubmainul@gmail.com
 * =============================================
 * Feature: YouTube Video Downloader with Progress Bar
 * =============================================
 */

import fs from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import ytdlpExec from 'yt-dlp-exec';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * YouTube video downloader function with progress bar
 * @param {Object} sock - WhatsApp socket connection
 * @param {String} from - Sender's chat ID
 * @param {String} url - YouTube video URL
 */
export async function handleYouTubeDownloader(sock, from, url) {
  // URL validation
  if (!url.startsWith('http')) {
    await sock.sendMessage(from, { text: '❌ Invalid URL. Please provide a valid YouTube video link.' });
    return;
  }

  // Check if it's YouTube URL
  if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
    await sock.sendMessage(from, { text: '❌ This is not a YouTube URL. Please provide a valid YouTube link.' });
    return;
  }

  // Send initial message
  await sock.sendMessage(from, { text: '⏳ Initializing YouTube download...' });

  const tempFile = `${__dirname}/tmp_yt_${Date.now()}.mp4`;

  try {
    // Get video info first
    await sock.sendMessage(from, { text: '🔍 Fetching video information...' });
    
    const videoInfo = await ytdlpExec(url, {
      dumpSingleJson: true,
      noWarnings: true,
      quiet: true
    });

    const videoTitle = videoInfo?.title || 'YouTube Video';
    const videoDuration = videoInfo?.duration || 0;
    const minutes = Math.floor(videoDuration / 60);
    const seconds = videoDuration % 60;
    const durationText = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

    await sock.sendMessage(from, { text: `📹 *Video Found*\nTitle: ${videoTitle}\nDuration: ${durationText}\n\n⬇️ Starting download...` });

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

    // Download video
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
      caption: `🎥 *YouTube Video Downloaded!*\n━━━━━━━━━━━━━━━━━━━━━\n📌 *Title:* ${videoTitle.substring(0, 50)}${videoTitle.length > 50 ? '...' : ''}\n⏱️ *Duration:* ${durationText}\n📦 *Size:* ${fileSizeMB} MB\n🔗 *Source:* YouTube\n━━━━━━━━━━━━━━━━━━━━━\n⚡ Powered by MAINUL-X`
    });

    // Clean up temp file
    fs.unlinkSync(tempFile);
    console.log(`✅ YouTube video downloaded and sent: ${url}`);

  } catch (err) {
    console.error('❌ YouTube Download Error:', err.message);
    
    // Error message
    let errorMsg = '❌ Failed to download YouTube video.';
    
    if (err.message.includes('Video unavailable')) {
      errorMsg = '❌ This YouTube video is unavailable or private.';
    } else if (err.message.includes('Copyright')) {
      errorMsg = '❌ This video is unavailable due to copyright restrictions.';
    } else if (err.message.includes('age-restricted')) {
      errorMsg = '❌ This video is age-restricted and cannot be downloaded.';
    }
    
    await sock.sendMessage(from, { text: errorMsg });

    // Clean up temp file if exists
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
  }
}
