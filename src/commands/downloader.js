import { handleYouTubeDownloader } from "../features/youtube.js"
import { handleFacebookDownloader } from "../features/facebook.js"
import { handleInstagramDownloader } from "../features/instagram.js"
import { handleTikTokDownloader } from "../features/tiktok.js"

export async function handleDownloaderCommands(sock, from, command, text){

if(command === "!yt"){
await sock.sendMessage(from,{text:"📺 Send YouTube video link"})
return true
}

if(command === "!fb"){
await sock.sendMessage(from,{text:"📘 Send Facebook video link"})
return true
}

if(command === "!ig"){
await sock.sendMessage(from,{text:"📸 Send Instagram video link"})
return true
}

if(command === "!tt"){
await sock.sendMessage(from,{text:"🎵 Send TikTok video link"})
return true
}

/* direct link downloader */

if(text){

if(/(youtube\.com|youtu\.be)/i.test(text)){
await handleYouTubeDownloader(sock,from,text)
return true
}

if(/facebook\.com/i.test(text)){
await handleFacebookDownloader(sock,from,text)
return true
}

if(/instagram\.com/i.test(text)){
await handleInstagramDownloader(sock,from,text)
return true
}

if(/tiktok\.com|vt\.tiktok\.com/i.test(text)){
await handleTikTokDownloader(sock,from,text)
return true
}

}

return false

}
