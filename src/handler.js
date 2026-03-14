/**
 * File: src/handler.js
 * MAINUL-X Downloader Bot
 * Author: Md. Mainul Islam (MAINUL-X)
 * GitHub: https://github.com/M41NUL
 */

import fs from "fs"
import path from "path"

import { BOT_NAME } from "../config/bot.js"
import { WA_NUMBER } from "../config/number.js"

import { userState } from "./userState.js"

import { handleYouTubeDownloader } from "./features/youtube.js"
import { handleFacebookDownloader } from "./features/facebook.js"
import { handleInstagramDownloader } from "./features/instagram.js"
import { handleTikTokDownloader } from "./features/tiktok.js"

import { validateUrl } from "./utils/validateUrl.js"
import { checkSecurity } from "./utils/security.js"
import { startProgress, finishProgress } from "./utils/progress.js"

import { handleSystemCommands } from "./commands/system.js"
import { handleCommands } from "./commands/commands.js"

const menuImagePath = path.join(process.cwd(),"src/assets/menu.jpg")

/* =========================
MAIN HANDLER
========================= */

export async function handler(sock,msg){

if(!msg?.message) return

const from = msg.key.remoteJid

const state = userState.get(from) || { step:"start" }

const text =
msg.message?.conversation ||
msg.message?.extendedTextMessage?.text ||
msg.message?.imageMessage?.caption ||
msg.message?.videoMessage?.caption

if(!text){

if(state.step === "start"){

await sendWelcome(sock,from)

userState.set(from,{step:"menuMain"})

}

return
}

const lower = text.toLowerCase().trim()

/* =========================
SECURITY SYSTEM
========================= */

const blocked = await checkSecurity(from)

if(blocked) return

/* =========================
WELCOME TRIGGER
========================= */

const greet = [
"hi",
"hello",
"start",
"bot",
"assalamu alaikum",
"active",
"on"
]

if(greet.includes(lower)){

await sendWelcome(sock,from)

return
}

/* =========================
SYSTEM COMMANDS
========================= */

if(await handleSystemCommands(sock,from,lower)) return

/* =========================
CUSTOM COMMANDS
========================= */

if(await handleCommands(sock,from,lower)) return

/* =========================
SMART COMMAND DOWNLOADER
========================= */

if(lower.startsWith("!yt ")){

const url = text.split(" ")[1]

if(validateUrl(url,"youtube")){
await handleYouTubeDownloader(sock,from,url)
}

return
}

if(lower.startsWith("!fb ")){

const url = text.split(" ")[1]

if(validateUrl(url,"facebook")){
await handleFacebookDownloader(sock,from,url)
}

return
}

if(lower.startsWith("!ig ")){

const url = text.split(" ")[1]

if(validateUrl(url,"instagram")){
await handleInstagramDownloader(sock,from,url)
}

return
}

if(lower.startsWith("!tt ")){

const url = text.split(" ")[1]

if(validateUrl(url,"tiktok")){
await handleTikTokDownloader(sock,from,url)
}

return
}

/* =========================
AUTO LINK DETECT
========================= */

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

/* =========================
MENU INTERACTION
========================= */

let rowId

try{

if(msg.message?.interactiveResponseMessage?.nativeFlowResponseMessage){

rowId = JSON.parse(
msg.message.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson
).id

}

}catch{}

if(rowId){

switch(rowId){

case "yt_downloader":

userState.set(from,{step:"yt_wait_url"})

await sock.sendMessage(from,{
text:"📌 Send a *YouTube* video link"
})

break

case "fb_downloader":

userState.set(from,{step:"fb_wait_url"})

await sock.sendMessage(from,{
text:"📌 Send a *Facebook* video link"
})

break

case "ig_downloader":

userState.set(from,{step:"ig_wait_url"})

await sock.sendMessage(from,{
text:"📌 Send an *Instagram* video link"
})

break

case "tt_downloader":

userState.set(from,{step:"tt_wait_url"})

await sock.sendMessage(from,{
text:"📌 Send a *TikTok* video link"
})

break

case "command_list":

await handleSystemCommands(sock,from,"!help")

break

}

return
}

/* =========================
WAIT MODE
========================= */

switch(state.step){

case "yt_wait_url":

if(validateUrl(text,"youtube")){
await handleYouTubeDownloader(sock,from,text)
}

break

case "fb_wait_url":

if(validateUrl(text,"facebook")){
await handleFacebookDownloader(sock,from,text)
}

break

case "ig_wait_url":

if(validateUrl(text,"instagram")){
await handleInstagramDownloader(sock,from,text)
}

break

case "tt_wait_url":

if(validateUrl(text,"tiktok")){
await handleTikTokDownloader(sock,from,text)
}

break

default:

await sendDownloaderMenu(sock,from)

break

}

userState.set(from,{step:"menuMain"})

}

/* =========================
WELCOME MESSAGE
========================= */

async function sendWelcome(sock,from){

await sock.sendMessage(from,{
text:`👋 Welcome to *${BOT_NAME}*

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

}

/* =========================
DOWNLOADER MENU
========================= */

export async function sendDownloaderMenu(sock,from){

await sock.sendMessage(from,{
image:fs.readFileSync(menuImagePath),
caption:`🤖 ${BOT_NAME}

Choose a platform below`,
footer:"MAINUL-X SYSTEM",
interactiveButtons:[
{
name:"single_select",
buttonParamsJson:JSON.stringify({
title:"Video Downloader",
sections:[
{
title:"Available Platforms",
rows:[
{
title:"YouTube Downloader",
description:"Download videos from YouTube",
id:"yt_downloader"
},
{
title:"Facebook Downloader",
description:"Download videos from Facebook",
id:"fb_downloader"
},
{
title:"Instagram Downloader",
description:"Download reels & videos from Instagram",
id:"ig_downloader"
},
{
title:"TikTok Downloader",
description:"Download TikTok videos (No Watermark)",
id:"tt_downloader"
}
]
},
{
title:"System",
rows:[
{
title:"Show Command List",
description:"Display all bot commands",
id:"command_list"
}
]
}
]
})
}
]
})

}
