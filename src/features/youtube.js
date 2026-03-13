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
 * Utility: Live Progress Bar (Message Edit)
 * =============================================
 */

import fs from "fs"
import { dirname } from "path"
import { fileURLToPath } from "url"
import ytdlpExec from "yt-dlp-exec"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export async function handleYouTubeDownloader(sock, from, url){

if(!url.startsWith("http")){
await sock.sendMessage(from,{
text:"❌ Invalid URL. Please provide a valid YouTube video link."
})
return
}

if(!url.includes("youtube.com") && !url.includes("youtu.be")){
await sock.sendMessage(from,{
text:"❌ This is not a YouTube URL."
})
return
}

const tempFile = `${__dirname}/tmp_yt_${Date.now()}.mp4`

try{

/* ===============================
FETCH VIDEO INFO
================================ */

const videoInfo = await ytdlpExec(url,{
dumpSingleJson:true,
noWarnings:true,
quiet:true
})

const videoTitle = videoInfo?.title || "YouTube Video"
const duration = videoInfo?.duration || 0

const minutes = Math.floor(duration/60)
const seconds = duration%60

const durationText = minutes>0 ? `${minutes}m ${seconds}s` : `${seconds}s`

/* ===============================
START MESSAGE
================================ */

const progressMsg = await sock.sendMessage(from,{
text:`📹 *Video Found*

Title: ${videoTitle.substring(0,50)}
Duration: ${durationText}

⏳ Processing... 0%`
})

/* ===============================
LIVE PROGRESS BAR
================================ */

let progress = 0

const progressInterval = setInterval(async()=>{

progress += 10

if(progress <= 90){

await sock.sendMessage(from,{
text:`⏳ Processing... ${progress}%`,
edit:progressMsg.key
})

}

},1500)

/* ===============================
DOWNLOAD VIDEO
================================ */

await ytdlpExec(url,{
output: tempFile,
format:"mp4",
noCheckCertificates:true,
preferFreeFormats:true
})

clearInterval(progressInterval)

/* ===============================
FINAL 100%
================================ */

await sock.sendMessage(from,{
text:"✅ Processing... 100%",
edit:progressMsg.key
})

/* ===============================
CHECK FILE
================================ */

if(!fs.existsSync(tempFile)){
throw new Error("Download failed")
}

const stats = fs.statSync(tempFile)
const fileSizeMB = (stats.size/(1024*1024)).toFixed(2)

/* ===============================
SEND VIDEO
================================ */

await sock.sendMessage(from,{
video: fs.readFileSync(tempFile),
mimetype:"video/mp4",
caption:`🎥 *YouTube Video Downloaded!*

━━━━━━━━━━━━━━━━━━━━━
📌 Title : ${videoTitle.substring(0,50)}
⏱ Duration : ${durationText}
📦 Size : ${fileSizeMB} MB
🔗 Source : YouTube
━━━━━━━━━━━━━━━━━━━━━
⚡ Powered by MAINUL-X`
})

fs.unlinkSync(tempFile)

console.log("YouTube video sent")

}catch(err){

console.log("YouTube download error",err.message)

await sock.sendMessage(from,{
text:"❌ Failed to download YouTube video."
})

if(fs.existsSync(tempFile)){
fs.unlinkSync(tempFile)
}

}

}
