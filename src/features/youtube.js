/**
 * =============================================
 * MAINUL-X YouTube Video Downloader
 * =============================================
 */

import fs from "fs"
import { dirname } from "path"
import { fileURLToPath } from "url"
import ytdlpExec from "yt-dlp-exec"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export async function handleYouTubeDownloader(sock, from, url){

if(!url || !url.startsWith("http")){
await sock.sendMessage(from,{
text:"❌ Invalid URL. Please provide a valid YouTube video link."
})
return
}

if(!/youtube\.com|youtu\.be/i.test(url)){
await sock.sendMessage(from,{
text:"❌ This is not a YouTube URL."
})
return
}

const tempFile = `${__dirname}/tmp_yt_${Date.now()}.mp4`

try{

/* FETCH VIDEO INFO */

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

/* START MESSAGE */

const progressMsg = await sock.sendMessage(from,{
text:`📹 *Video Found*

Title: ${videoTitle.substring(0,50)}
Duration: ${durationText}

⏳ Processing... 0%`
})

/* FAKE PROGRESS */

let progress = 0

const progressInterval = setInterval(async()=>{

progress += 10

if(progress <= 90){

try{
await sock.sendMessage(from,{
text:`⏳ Processing... ${progress}%`,
edit:progressMsg.key
})
}catch{}

}

},1500)

/* DOWNLOAD */

await ytdlpExec(url,{
output: tempFile,
format:"bv*[height<=720]+ba/best",
mergeOutputFormat:"mp4",
noCheckCertificates:true,
preferFreeFormats:true
})

clearInterval(progressInterval)

try{
await sock.sendMessage(from,{
text:"✅ Processing... 100%",
edit:progressMsg.key
})
}catch{}

if(!fs.existsSync(tempFile)){
throw new Error("Download failed")
}

const stats = fs.statSync(tempFile)
const fileSizeMB = (stats.size/(1024*1024)).toFixed(2)

/* SEND VIDEO */

await sock.sendMessage(from,{
video:{ url: tempFile },
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
