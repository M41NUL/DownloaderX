/**
 * =============================================
 *      MAINUL-X WhatsApp Media Downloader
 * =============================================
 * Author: Md. Mainul Islam (MAINUL-X)
 * GitHub: https://github.com/M41NUL
 * Telegram: @mdmainulislaminfo
 * Email: githubmainul@gmail.com
 * =============================================
 * Feature: YouTube Video Downloader
 * =============================================
 */

import fs from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import ytdlpExec from 'yt-dlp-exec';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * YouTube video downloader function
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

  // Send processing message
  await sock.sendMessage(from, { text: '📥 Downloading YouTube video... Please wait.' });

  const tempFile = `${__dirname}/tmp_yt_${Date.now()}.mp4`;

  try {
    // Get video info first
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

    // Download video
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
      caption: `🎥 YouTube Video Downloaded Successfully!\n━━━━━━━━━━━━━━━━━━━━━\n📌 Title: ${videoTitle.substring(0, 50)}${videoTitle.length > 50 ? '...' : ''}\n⏱️ Duration: ${durationText}\n🔗 Source: YouTube\n⚡ Powered by MAINUL-X`
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