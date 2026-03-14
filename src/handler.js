/**
 * File: src/handler.js
 * MAINUL-X Downloader Bot
 * Author: Md. Mainul Islam (MAINUL-X)
 */

import fs from "fs"
import path from "path"

import { userState } from "./userState.js"

import { handleCommands } from "./commands/commands.js"

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

/* =========================
WELCOME MESSAGE
========================= */

if(greetings.includes(lower) && state.step === "start"){

await sock.sendMessage(from,{
text:`👋 Welcome to *MAINUL - X DOWNLOADER BOT*

Send a video link directly or choose a platform below.

📥 Supported Platforms
• YouTube
• Facebook
• Instagram
• TikTok

💡 Commands
Type *!help* to see all commands`
})

await sendDownloaderMenu(sock,from)

userState.set(from,{step:"menuMain"})

return
}

/* =========================
COMMAND SYSTEM
========================= */

if(await handleCommands(sock,from,lower)) return


/* =========================
AUTO LINK DETECT
========================= */

if(validateUrl(text,"youtube")){
await handleYouTubeDownloader(sock,from,text)
userState.set(from,{step:"menuMain"})
return
}

if(validateUrl(text,"facebook")){
await handleFacebookDownloader(sock,from,text)
userState.set(from,{step:"menuMain"})
return
}

if(validateUrl(text,"instagram")){
await handleInstagramDownloader(sock,from,text)
userState.set(from,{step:"menuMain"})
return
}

if(validateUrl(text,"tiktok")){
await handleTikTokDownloader(sock,from,text)
userState.set(from,{step:"menuMain"})
return
}

/* =========================
INTERACTIVE LIST RESPONSE
========================= */

let rowId

try{

if(msg.message?.interactiveResponseMessage?.nativeFlowResponseMessage){

rowId = JSON.parse(
msg.message.interactiveResponseMessage
.nativeFlowResponseMessage.paramsJson
).id

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

/* =========================
STEP HANDLER
========================= */

switch(state.step){

case "yt_wait_url":

if(!validateUrl(text,"youtube")){
await sock.sendMessage(from,{text:"❌ Invalid YouTube link"})
return
}

await handleYouTubeDownloader(sock,from,text)
userState.set(from,{step:"menuMain"})
return


case "fb_wait_url":

if(!validateUrl(text,"facebook")){
await sock.sendMessage(from,{text:"❌ Invalid Facebook link"})
return
}

await handleFacebookDownloader(sock,from,text)
userState.set(from,{step:"menuMain"})
return


case "ig_wait_url":

if(!validateUrl(text,"instagram")){
await sock.sendMessage(from,{text:"❌ Invalid Instagram link"})
return
}

await handleInstagramDownloader(sock,from,text)
userState.set(from,{step:"menuMain"})
return


case "tt_wait_url":

if(!validateUrl(text,"tiktok")){
await sock.sendMessage(from,{text:"❌ Invalid TikTok link"})
return
}

await handleTikTokDownloader(sock,from,text)
userState.set(from,{step:"menuMain"})
return

}

}

/* =========================
INTERACTIVE MENU
========================= */

export async function sendDownloaderMenu(sock, from){

await sock.sendMessage(from,{

image: fs.existsSync(menuImagePath)
? fs.readFileSync(menuImagePath)
: undefined,

caption:`🤖 *MAINUL - X DOWNLOADER BOT*

Choose a platform below`,

footer:"MAINUL-X SYSTEM",

interactiveButtons:[
{
name:"single_select",
buttonParamsJson:JSON.stringify({

title:"📥 Video Downloader",

sections:[
{
title:"Available Platforms",

rows:[
{
title:"📺 YouTube Downloader",
description:"Download videos from YouTube",
id:"yt_downloader"
},
{
title:"📘 Facebook Downloader",
description:"Download videos from Facebook",
id:"fb_downloader"
},
{
title:"📸 Instagram Downloader",
description:"Download reels & videos",
id:"ig_downloader"
},
{
title:"🎵 TikTok Downloader",
description:"Download TikTok (No Watermark)",
id:"tt_downloader"
}
]

}
]

})

}

]

})

}
