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

import fs from "fs"
import { dirname } from "path"
import { fileURLToPath } from "url"
import ytdlpExec from "yt-dlp-exec"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export async function handleFacebookDownloader(sock, from, url){

if(!url || !url.startsWith("http")){

await sock.sendMessage(from,{
text:"❌ Invalid URL. Please send a valid Facebook video link."
})

return

}

const tempFile = `${__dirname}/tmp_fb_${Date.now()}.mp4`

try{

/* ===============================
START MESSAGE
================================ */

const progressMsg = await sock.sendMessage(from,{
text:"⏳ Processing... 0%"
})

/* ===============================
FAKE PROGRESS BAR
================================ */

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

/* ===============================
DOWNLOAD VIDEO
================================ */

await ytdlpExec(url,{
output:tempFile,
format:"best",
mergeOutputFormat:"mp4",
noCheckCertificates:true,
preferFreeFormats:true,
addHeader:["referer:facebook.com"]
})

clearInterval(progressInterval)

/* ===============================
FINAL PROGRESS
================================ */

try{

await sock.sendMessage(from,{
text:"✅ Processing... 100%",
edit:progressMsg.key
})

}catch{}

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

video:{ url: tempFile },

mimetype:"video/mp4",

caption:`📹 *Facebook Video Downloaded!*

━━━━━━━━━━━━━━━━━━━━━
📦 Size : ${fileSizeMB} MB
🔗 Source : Facebook
━━━━━━━━━━━━━━━━━━━━━
⚡ Powered by MAINUL-X`

})

/* ===============================
DELETE TEMP FILE
================================ */

fs.unlinkSync(tempFile)

console.log("Facebook video sent")

}catch(err){

console.log("Facebook download error:",err.message)

await sock.sendMessage(from,{
text:"❌ Failed to download Facebook video."
})

if(fs.existsSync(tempFile)){

fs.unlinkSync(tempFile)

}

}

}
