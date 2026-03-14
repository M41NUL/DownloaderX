/**
 * File: src/features/tiktok.js
 * MAINUL-X Downloader Bot
 * Author: Md. Mainul Islam (MAINUL-X)
 * GitHub: https://github.com/M41NUL
 */

import fs from "fs"
import axios from "axios"
import { dirname } from "path"
import { fileURLToPath } from "url"
import ytdlpExec from "yt-dlp-exec"
import { startProgress, finishProgress } from "../utils/progress.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function resolveTikTokUrl(url){

try{

const response = await axios.get(url,{
maxRedirects:5,
headers:{ "User-Agent":"Mozilla/5.0" }
})

return response.request?.res?.responseUrl || url

}catch{
return url
}

}

export async function handleTikTokDownloader(sock,from,url){

if(!url || !url.startsWith("http")){
await sock.sendMessage(from,{text:"❌ Invalid TikTok URL"})
return
}

if(!/tiktok\.com|vt\.tiktok\.com/i.test(url)){
await sock.sendMessage(from,{text:"❌ This is not a TikTok link"})
return
}

const tempFile = `${__dirname}/tmp_tt_${Date.now()}.mp4`

const progress = await startProgress(sock,from,"Downloading TikTok Video")

try{

const resolvedUrl = await resolveTikTokUrl(url)

await ytdlpExec(resolvedUrl,{
output:tempFile,
format:"bv*[height<=1080]+ba/best",
mergeOutputFormat:"mp4",
preferFreeFormats:true,
quiet:true,
noWarnings:true
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
caption:`🎵 *TikTok Video Downloaded*

💧 No Watermark
📦 Size : ${size} MB
🔗 Source : TikTok
⚡ Powered by MAINUL-X`
})

fs.unlinkSync(tempFile)

}catch(err){

console.log("TikTok download error:",err.message)

await sock.sendMessage(from,{
text:"❌ Failed to download TikTok video"
})

if(fs.existsSync(tempFile)){
fs.unlinkSync(tempFile)
}

}

}
