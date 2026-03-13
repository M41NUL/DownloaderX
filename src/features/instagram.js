/**
 * =============================================
 * MAINUL-X Instagram Video/Reels Downloader
 * =============================================
 */

import fs from "fs"
import { dirname } from "path"
import { fileURLToPath } from "url"
import ytdlpExec from "yt-dlp-exec"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export async function handleInstagramDownloader(sock, from, url){

if(!url.startsWith("http")){
await sock.sendMessage(from,{
text:"❌ Invalid URL. Please provide a valid Instagram link."
})
return
}

if(!url.includes("instagram.com")){
await sock.sendMessage(from,{
text:"❌ This is not an Instagram URL."
})
return
}

const tempFile = `${__dirname}/tmp_ig_${Date.now()}.mp4`

try{

/* ===============================
START MESSAGE
================================ */

const progressMsg = await sock.sendMessage(from,{
text:"⏳ Processing... 0%"
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
const fileSizeMB = (stats.size / (1024*1024)).toFixed(2)

/* ===============================
SEND VIDEO
================================ */

await sock.sendMessage(from,{
video: fs.readFileSync(tempFile),
mimetype:"video/mp4",
caption:`📹 *Instagram Video Downloaded!*

━━━━━━━━━━━━━━━━━━━━━
📦 Size : ${fileSizeMB} MB
🔗 Source : Instagram
━━━━━━━━━━━━━━━━━━━━━
⚡ Powered by MAINUL-X`
})

fs.unlinkSync(tempFile)

console.log("Instagram video sent")

}catch(err){

console.log("Instagram download error",err.message)

await sock.sendMessage(from,{
text:"❌ Failed to download Instagram video."
})

if(fs.existsSync(tempFile)){
fs.unlinkSync(tempFile)
}

}

}
