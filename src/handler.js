/**
=============================================
MAINUL-X WhatsApp Media Downloader
Author: Md. Mainul Islam (MAINUL-X)
BOT NAME : MAINUL - X DOWNLOADER BOT
=============================================
*/

import fs from "fs"
import path from "path"
import os from "os"

import { userState } from "./userState.js"

import { handleYouTubeDownloader } from "./features/youtube.js"
import { handleFacebookDownloader } from "./features/facebook.js"
import { handleInstagramDownloader } from "./features/instagram.js"
import { handleTikTokDownloader } from "./features/tiktok.js"

import { detectPlatform } from "./utils/validateUrl.js"

import {
BOT_NAME,
VERSION,
OWNER_NAME,
OWNER_ALIAS,
WHATSAPP,
TELEGRAM,
GITHUB_URL
} from "../config/bot.js"

/* ===============================
ASSETS
================================ */

const menuImagePath = path.join(process.cwd(),"src/assets/menu.jpg")
const youtubeImage = path.join(process.cwd(),"src/assets/youtube.png")
const facebookImage = path.join(process.cwd(),"src/assets/facebook.png")
const instagramImage = path.join(process.cwd(),"src/assets/instagram.png")
const tiktokImage = path.join(process.cwd(),"src/assets/tiktok.png")

/* ===============================
SYSTEM
================================ */

const BOT_START_TIME = Date.now()

const messageCache = new Set()
const spamTracker = new Map()

setInterval(()=>{
messageCache.clear()
},30000)

/* ===============================
COMMAND LIST
================================ */

const validCommands = [

"!yt","!fb","!ig","!tt",

"!ping","!uptime","!stats","!system",

"!alive","!runtime","!botinfo",

"!owner","!dev","!repo",

"!update","!restart","!logs",

"!help","!menu"

]

/* ===============================
HANDLER
================================ */

export async function handler(sock,msg){

try{

if(!msg?.message) return

if(messageCache.has(msg.key.id)) return
messageCache.add(msg.key.id)

const from = msg.key.remoteJid

const text =
msg.message?.conversation ||
msg.message?.extendedTextMessage?.text ||
msg.message?.imageMessage?.caption ||
msg.message?.videoMessage?.caption ||
""

const lower = text.toLowerCase()

/* ===============================
BUTTON RESPONSE
================================ */

const selectedButton =
msg.message?.listResponseMessage?.singleSelectReply?.selectedRowId

if(selectedButton){

if(selectedButton === "yt_downloader"){

await sock.sendMessage(from,{
image:fs.readFileSync(youtubeImage),
caption:"📺 Send YouTube video link"
})
return
}

if(selectedButton === "fb_downloader"){

await sock.sendMessage(from,{
image:fs.readFileSync(facebookImage),
caption:"📘 Send Facebook video link"
})
return
}

if(selectedButton === "ig_downloader"){

await sock.sendMessage(from,{
image:fs.readFileSync(instagramImage),
caption:"📸 Send Instagram reel link"
})
return
}

if(selectedButton === "tt_downloader"){

await sock.sendMessage(from,{
image:fs.readFileSync(tiktokImage),
caption:"🎵 Send TikTok video link"
})
return
}

if(selectedButton === "show_commands"){
await sendCommandList(sock,from)
return
}

}

/* ===============================
PING
================================ */

if(lower === "!ping"){

const start = Date.now()

const pingMsg = await sock.sendMessage(from,{text:"🏓 Pinging..."})

const end = Date.now()

await sock.sendMessage(from,{
text:`⚡ Pong\nResponse: ${end-start} ms`,
edit:pingMsg.key
})

return
}

/* ===============================
UPTIME
================================ */

if(lower === "!uptime"){

const uptime = Math.floor((Date.now()-BOT_START_TIME)/1000)

const h = Math.floor(uptime/3600)
const m = Math.floor((uptime%3600)/60)
const s = uptime%60

await sock.sendMessage(from,{
text:`⏱ BOT UPTIME\n\n${h}h ${m}m ${s}s`
})

return
}

/* ===============================
ALIVE
================================ */

if(lower === "!alive"){

await sock.sendMessage(from,{
text:`🤖 ${BOT_NAME}

Status : Online
System : Running
Connection : Stable`
})

return
}

/* ===============================
BOTINFO
================================ */

if(lower === "!botinfo"){

await sock.sendMessage(from,{
text:`🤖 BOT INFO

Name : ${BOT_NAME}
Version : v${VERSION}
Developer : ${OWNER_ALIAS}`
})

return
}

/* ===============================
OWNER
================================ */

if(lower === "!owner"){

await sock.sendMessage(from,{
text:`👨‍💻 BOT OWNER

Name : ${OWNER_NAME}

📱 WhatsApp
${WHATSAPP}

🌐 GitHub
${GITHUB_URL}

📢 Telegram
${TELEGRAM}`
})

return
}

/* ===============================
HELP
================================ */

if(lower === "!help"){
await sendCommandList(sock,from)
return
}

/* ===============================
MENU
================================ */

if(lower === "!menu"){
await sendDownloaderMenu(sock,from)
return
}

/* ===============================
AUTO LINK DETECT
================================ */

if(text){

const ytRegex = /(youtube\.com|youtu\.be)/i
const igRegex = /instagram\.com/i
const fbRegex = /facebook\.com/i
const ttRegex = /tiktok\.com/i

if(ytRegex.test(text)){
await handleYouTubeDownloader(sock,from,text)
return
}

if(igRegex.test(text)){
await handleInstagramDownloader(sock,from,text)
return
}

if(fbRegex.test(text)){
await handleFacebookDownloader(sock,from,text)
return
}

if(ttRegex.test(text)){
await handleTikTokDownloader(sock,from,text)
return
}

}

}catch(err){

console.log("Handler Error:",err)

}

}

/* ===============================
COMMAND LIST
================================ */

async function sendCommandList(sock,from){

const text = `📜 MAINUL - X DOWNLOADER BOT COMMAND LIST

!yt → Download YouTube video
!fb → Download Facebook video
!ig → Download Instagram video
!tt → Download TikTok video

!ping → Bot speed
!uptime → Bot running time
!alive → Bot status
!botinfo → Bot information
!owner → Contact owner
!help → Command menu
`

await sock.sendMessage(from,{text})

}

/* ===============================
MENU UI
================================ */

export async function sendDownloaderMenu(sock,from){

await sock.sendMessage(from,{

image:fs.readFileSync(menuImagePath),

caption:`🤖 MAINUL-X Downloader Bot

Choose a platform`,

footer:"MAINUL-X SYSTEM",

headerType:4,

interactiveButtons:[

{

name:"single_select",

buttonParamsJson:JSON.stringify({

title:"📥 Video Downloader",

sections:[

{
title:"Platforms",

rows:[

{title:"YouTube",description:"Download YouTube video",id:"yt_downloader"},
{title:"Facebook",description:"Download Facebook video",id:"fb_downloader"},
{title:"Instagram",description:"Download Instagram reels",id:"ig_downloader"},
{title:"TikTok",description:"Download TikTok video",id:"tt_downloader"}

]

},

{
title:"System",

rows:[

{title:"Show Commands",description:"All command list",id:"show_commands"}

]

}

]

})

}

]

})

}
