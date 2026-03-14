/**
 * File: src/features/instagram.js
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

export async function handleInstagramDownloader(sock,from,url){

if(!url || !url.startsWith("http")){
await sock.sendMessage(from,{text:"❌ Invalid Instagram URL"})
return
}

if(!/instagram\.com/i.test(url)){
await sock.sendMessage(from,{text:"❌ This is not an Instagram link"})
return
}

const tempFile = `${__dirname}/tmp_ig_${Date.now()}.mp4`

const progress = await startProgress(sock,from,"Downloading Instagram Video")

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
caption:`📸 *Instagram Video Downloaded*

📦 Size : ${size} MB
🔗 Source : Instagram
⚡ Powered by MAINUL-X`
})

fs.unlinkSync(tempFile)

}catch(err){

console.log("Instagram download error:",err.message)

await sock.sendMessage(from,{
text:"❌ Failed to download Instagram video"
})

if(fs.existsSync(tempFile)){
fs.unlinkSync(tempFile)
}

}

}
