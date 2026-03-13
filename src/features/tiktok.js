/**
 * =============================================
 *      MAINUL-X WhatsApp Media Downloader
 * =============================================
 * Author: Md. Mainul Islam (MAINUL-X)
 * GitHub: https://github.com/M41NUL
 * Telegram: @mdmainulislaminfo
 * Email: githubmainul@gmail.com
 * =============================================
 * Feature: TikTok Video Downloader with Progress Bar (No Watermark)
 * =============================================
 */

import fs from "fs";
import axios from "axios";
import { dirname } from "path";
import { fileURLToPath } from "url";
import ytdlpExec from "yt-dlp-exec";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function resolveTikTokUrl(url) {
  try {
    const response = await axios.get(url, {
      maxRedirects: 5,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    return response.request?.res?.responseUrl || url;
  } catch (err) {
    console.error("❌ Failed to resolve TikTok URL:", err.message);
    return url;
  }
}

export async function handleTikTokDownloader(sock, from, url) {
  if (!url.startsWith("http")) {
    await sock.sendMessage(from, { text: "❌ Invalid URL" });
    return;
  }

  // Send initial message
  await sock.sendMessage(from, { text: "⏳ Initializing TikTok download..." });

  const tempFile = `${__dirname}/tmp_tt_${Date.now()}.mp4`;

  try {
    // Resolve URL
    await sock.sendMessage(from, { text: "🔍 Processing TikTok link..." });
    const resolvedUrl = await resolveTikTokUrl(url);

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
    await ytdlpExec(resolvedUrl, {
      output: tempFile,
      format: "bv*[height<=1080]+ba/bv*+ba/best",
      quiet: true,
      noWarnings: true,
      preferFreeFormats: true,
    });

    clearInterval(progressInterval);
    await sock.sendMessage(from, { text: "✅ Download complete! Now sending video..." });

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
      mimetype: "video/mp4",
      caption: `🎵 *TikTok Video Downloaded!*\n━━━━━━━━━━━━━━━━━━━━━\n💧 *No Watermark*\n📦 *Size:* ${fileSizeMB} MB\n🔗 *Source:* TikTok\n━━━━━━━━━━━━━━━━━━━━━\n⚡ Powered by MAINUL-X`
    });

    fs.unlinkSync(tempFile);
    console.log(`✅ TikTok video downloaded and sent: ${url}`);

  } catch (err) {
    console.error("❌ TikTok Download Error:", err);
    
    let errorMsg = "❌ Failed to download TikTok video.";
    if (err.message.includes('Private')) {
      errorMsg = "❌ This TikTok video is private or unavailable.";
    }
    
    await sock.sendMessage(from, { text: errorMsg });

    // Clean up temp file if exists
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
  }
}
