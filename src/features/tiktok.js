/**
 * =============================================
 * MAINUL-X TikTok Video Downloader (No Watermark)
 * =============================================
 */

import fs from "fs"
import axios from "axios"
import { dirname } from "path"
import { fileURLToPath } from "url"
import ytdlpExec from "yt-dlp-exec"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function resolveTikTokUrl(url){

try{

const response = await axios.get(url,{
maxRedirects:5,
headers:{
"User-Agent":"Mozilla/5.0"
}
})

return response.request?.res?.responseUrl || url

}catch(err){

console.log("Resolve TikTok URL error",err.message)
return url

}

}

export async function handleTikTokDownloader(sock,from,url){

if(!url || !url.startsWith("http")){

await sock.sendMessage(from,{
text:"❌ Invalid URL"
})

return

}

const tempFile = `${__dirname}/tmp_tt_${Date.now()}.mp4`

try{

/* START MESSAGE */

const progressMsg = await sock.sendMessage(from,{
text:"⏳ Processing... 0%"
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

/* RESOLVE SHORT LINK */

const resolvedUrl = await resolveTikTokUrl(url)

/* DOWNLOAD */

await ytdlpExec(resolvedUrl,{
output:tempFile,
format:"best",
mergeOutputFormat:"mp4",
quiet:true,
noWarnings:true,
preferFreeFormats:true,
addHeader:["referer:tiktok.com"]
})

clearInterval(progressInterval)

/* FINAL */

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
caption:`🎵 *TikTok Video Downloaded!*

━━━━━━━━━━━━━━━━━━━━━
💧 No Watermark
📦 Size : ${fileSizeMB} MB
🔗 Source : TikTok
━━━━━━━━━━━━━━━━━━━━━
⚡ Powered by MAINUL-X`
})

fs.unlinkSync(tempFile)

console.log("TikTok video sent")

}catch(err){

console.log("TikTok download error",err.message)

await sock.sendMessage(from,{
text:"❌ Failed to download TikTok video."
})

if(fs.existsSync(tempFile)){
fs.unlinkSync(tempFile)
}

}

}
