/**
 * =============================================
 *      MAINUL-X WhatsApp Media Downloader
 * =============================================
 * Author: Md. Mainul Islam (MAINUL-X)
 * GitHub: https://github.com/M41NUL
 * Telegram: @mdmainulislaminfo
 * Email: githubmainul@gmail.com
 * =============================================
 * Feature: TikTok Video Downloader (No Watermark)
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

  await sock.sendMessage(from, { text: "📥 Downloading TikTok video..." });

  const tempFile = `${__dirname}/tmp_tt_${Date.now()}.mp4`;

  try {
    const resolvedUrl = await resolveTikTokUrl(url);
    await ytdlpExec(resolvedUrl, {
      output: tempFile,
      format: "bv*[height<=1080]+ba/bv*+ba/best",
      quiet: true,
      noWarnings: true,
      preferFreeFormats: true,
    });

    await sock.sendMessage(from, {
      video: fs.readFileSync(tempFile),
      mimetype: "video/mp4",
      caption: "🎵 TikTok Video Downloaded Successfully!\n━━━━━━━━━━━━━━━━━━━━━\n🔗 Source: TikTok\n💧 No Watermark\n⚡ Powered by MAINUL-X"
    });

    fs.unlinkSync(tempFile);
  } catch (err) {
    console.error("❌ TikTok Download Error:", err);
    await sock.sendMessage(from, {
      text: "❌ Failed to download TikTok video.",
    });
  }
}