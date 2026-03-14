/**
 * File: src/features/youtube.js
 * MAINUL-X Downloader Bot
 * Author: Md. Mainul Islam (MAINUL-X)
 * GitHub: https://github.com/M41NUL
 */

import fs from "fs"
import { dirname } from "path"
import { fileURLToPath } from "url"
import ytdlpExec from "yt-dlp-exec"
import { startProgress, finishProgress } from "../utils/progress.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export async function handleYouTubeDownloader(sock,from,url){

if(!url || !url.startsWith("http")){
await sock.sendMessage(from,{text:"❌ Invalid YouTube URL"})
return
}

if(!/youtube\.com|youtu\.be/i.test(url)){
await sock.sendMessage(from,{text:"❌ This is not a YouTube link"})
return
}

const tempFile = `${__dirname}/tmp_yt_${Date.now()}.mp4`

const progress = await startProgress(sock,from,"Downloading YouTube Video")

try{

/* DOWNLOAD VIDEO (WHATSAPP COMPATIBLE MP4) */

await ytdlpExec(url,{
output: tempFile,
format: "best[ext=mp4][height<=720]",
mergeOutputFormat: "mp4",
noCheckCertificates: true
})

await finishProgress(sock,from,progress)

if(!fs.existsSync(tempFile)){
throw new Error("Download failed")
}

/* FILE SIZE */

const stats = fs.statSync(tempFile)
const sizeMB = stats.size / (1024*1024)

const size = sizeMB.toFixed(2)

/* WHATSAPP LIMIT CHECK */

if(sizeMB > 90){

await sock.sendMessage(from,{
text:`⚠ Video is too large (${size} MB)\nMax supported ~90MB`
})

fs.unlinkSync(tempFile)
return

}

/* SEND VIDEO */

await sock.sendMessage(from,{
video: fs.readFileSync(tempFile),
mimetype: "video/mp4",
caption:`🎥 *YouTube Video Downloaded*

📦 Size : ${size} MB
🔗 Source : YouTube
⚡ Powered by MAINUL-X`
})

fs.unlinkSync(tempFile)

}catch(err){

console.log("YouTube download error:",err.message)

await sock.sendMessage(from,{
text:"❌ Failed to download YouTube video"
})

if(fs.existsSync(tempFile)){
fs.unlinkSync(tempFile)
}

}

}
