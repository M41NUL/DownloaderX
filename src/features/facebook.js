/**
 * File: src/features/facebook.js
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

export async function handleFacebookDownloader(sock,from,url){

if(!url || !url.startsWith("http")){
await sock.sendMessage(from,{text:"❌ Invalid Facebook URL"})
return
}

if(!/facebook\.com|fb\.watch/i.test(url)){
await sock.sendMessage(from,{text:"❌ This is not a Facebook link"})
return
}

const tempFile = `${__dirname}/tmp_fb_${Date.now()}.mp4`

const progress = await startProgress(sock,from,"Downloading Facebook Video")

try{

await ytdlpExec(url,{
output:tempFile,
format:"bv*[height<=720]+ba/best",
mergeOutputFormat:"mp4",
preferFreeFormats:true,
noCheckCertificates:true
})

await finishProgress(sock,from,progress)

if(!fs.existsSync(tempFile)){
throw new Error("Download failed")
}

const stats = fs.statSync(tempFile)
const size = (stats.size/(1024*1024)).toFixed(2)

await sock.sendMessage(from,{
video:{url:tempFile},
mimetype:"video/mp4",
caption:`📘 *Facebook Video Downloaded*

📦 Size : ${size} MB
🔗 Source : Facebook
⚡ Powered by MAINUL-X`
})

fs.unlinkSync(tempFile)

}catch(err){

console.log("Facebook download error:",err.message)

await sock.sendMessage(from,{
text:"❌ Failed to download Facebook video"
})

if(fs.existsSync(tempFile)){
fs.unlinkSync(tempFile)
}

}

}
