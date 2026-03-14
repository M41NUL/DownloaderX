/**
 * File: src/handler.js
 * MAINUL-X Downloader Bot
 * Author: Md. Mainul Islam (MAINUL-X)
 * GitHub: https://github.com/M41NUL
 */

import fs from "fs"
import path from "path"

import { userState } from "./userState.js"

import { handleYouTubeDownloader } from "./features/youtube.js"
import { handleFacebookDownloader } from "./features/facebook.js"
import { handleInstagramDownloader } from "./features/instagram.js"
import { handleTikTokDownloader } from "./features/tiktok.js"

import { validateUrl } from "./utils/validateUrl.js"

const menuImagePath = path.join(process.cwd(),"src/assets/menu.jpg")

const greetings = [
"hi","hello","hey","hlw","menu","start",
"salam","assalamu alaikum","assalamualaikum",
"bot","active","on"
]

export async function handler(sock,msg){

if(!msg?.message) return

const from = msg.key.remoteJid
const state = userState.get(from) || {step:"start"}

const text =
msg.message?.conversation ||
msg.message?.extendedTextMessage?.text ||
msg.message?.imageMessage?.caption ||
msg.message?.videoMessage?.caption ||
""

const lower = text.toLowerCase().trim()

/* ===============================
WELCOME MESSAGE
================================ */

if(greetings.includes(lower)){

await sock.sendMessage(from,{
text:`👋 Welcome to *MAINUL - X DOWNLOADER BOT*

Send a video link directly or choose a platform below.

📥 Supported Platforms
• YouTube
• Facebook
• Instagram
• TikTok

💡 Commands
Type *!help* to see all bot commands`
})

await sendDownloaderMenu(sock,from)

return
}

/* ===============================
AUTO LINK DETECT
================================ */

if(validateUrl(text,"youtube")){
await handleYouTubeDownloader(sock,from,text)
return
}

if(validateUrl(text,"facebook")){
await handleFacebookDownloader(sock,from,text)
return
}

if(validateUrl(text,"instagram")){
await handleInstagramDownloader(sock,from,text)
return
}

if(validateUrl(text,"tiktok")){
await handleTikTokDownloader(sock,from,text)
return
}

/* ===============================
BUTTON / MENU RESPONSE
================================ */

let rowId

try{

if(msg.message?.interactiveResponseMessage?.nativeFlowResponseMessage){
rowId = JSON.parse(msg.message.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson).id
}

if(msg.message?.listResponseMessage?.singleSelectReply?.selectedRowId){
rowId = msg.message.listResponseMessage.singleSelectReply.selectedRowId
}

}catch{}

if(rowId){

switch(rowId){

case "yt_downloader":
userState.set(from,{step:"yt_wait_url"})
await sock.sendMessage(from,{text:"📺 Send YouTube video link"})
return

case "fb_downloader":
userState.set(from,{step:"fb_wait_url"})
await sock.sendMessage(from,{text:"📘 Send Facebook video link"})
return

case "ig_downloader":
userState.set(from,{step:"ig_wait_url"})
await sock.sendMessage(from,{text:"📸 Send Instagram video link"})
return

case "tt_downloader":
userState.set(from,{step:"tt_wait_url"})
await sock.sendMessage(from,{text:"🎵 Send TikTok video link"})
return

}

}

/* ===============================
STEP HANDLER
================================ */

switch(state.step){

case "yt_wait_url":

if(!validateUrl(text,"youtube")){
await sock.sendMessage(from,{text:"❌ Invalid YouTube link"})
return
}

await handleYouTubeDownloader(sock,from,text)
break

case "fb_wait_url":

if(!validateUrl(text,"facebook")){
await sock.sendMessage(from,{text:"❌ Invalid Facebook link"})
return
}

await handleFacebookDownloader(sock,from,text)
break

case "ig_wait_url":

if(!validateUrl(text,"instagram")){
await sock.sendMessage(from,{text:"❌ Invalid Instagram link"})
return
}

await handleInstagramDownloader(sock,from,text)
break

case "tt_wait_url":

if(!validateUrl(text,"tiktok")){
await sock.sendMessage(from,{text:"❌ Invalid TikTok link"})
return
}

await handleTikTokDownloader(sock,from,text)
break

default:

await sendDownloaderMenu(sock,from)

break

}

userState.set(from,{step:"menuMain"})

}

/* ===============================
MENU SYSTEM
================================ */

export async function sendDownloaderMenu(sock,from){

await sock.sendMessage(from,{

image: fs.existsSync(menuImagePath)
? fs.readFileSync(menuImagePath)
: undefined,

caption:"🤖 *MAINUL-X Downloader Bot*\n\nChoose a platform below",

footer:"MAINUL-X SYSTEM",

buttons:[
{buttonId:"yt_downloader",buttonText:{displayText:"📺 YouTube"},type:1},
{buttonId:"fb_downloader",buttonText:{displayText:"📘 Facebook"},type:1},
{buttonId:"ig_downloader",buttonText:{displayText:"📸 Instagram"},type:1},
{buttonId:"tt_downloader",buttonText:{displayText:"🎵 TikTok"},type:1}
]

})

}
