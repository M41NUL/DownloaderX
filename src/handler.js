/**
 * =============================================
 * MAINUL-X WhatsApp Media Downloader
 * Author: Md. Mainul Islam (MAINUL-X)
 * GitHub: https://github.com/M41NUL
 * Telegram: @mdmainulislaminfo
 * Email: githubmainul@gmail.com
 * =============================================
 */

import fs from "fs"
import path from "path"
import { userState } from "./userState.js"
import { handleYouTubeDownloader } from "./features/youtube.js"
import { handleFacebookDownloader } from "./features/facebook.js"
import { handleInstagramDownloader } from "./features/instagram.js"
import { handleTikTokDownloader } from "./features/tiktok.js"
import { validateUrl, detectPlatform } from "./utils/validateUrl.js"

const menuImagePath = path.join(process.cwd(), "src/assets/menu.jpg")
const BOT_START_TIME = Date.now()

export async function handler(sock, msg) {

if (!msg?.message) return

const from = msg.key.remoteJid
const state = userState.get(from) || { step: "start" }

const text =
msg.message?.conversation ||
msg.message?.extendedTextMessage?.text ||
msg.message?.imageMessage?.caption ||
msg.message?.videoMessage?.caption


if (text?.toLowerCase() === "!ping" || text?.toLowerCase() === "ping") {

const start = Date.now()

await sock.sendMessage(from,{text:"🏓 Pinging..."})

const end = Date.now()

await sock.sendMessage(from,{
text:`⚡ *Pong!*
📶 Response Time: *${end-start}ms*`
})

return
}


if (text?.toLowerCase() === "!uptime" || text?.toLowerCase() === "uptime") {

const uptime = Math.floor((Date.now() - BOT_START_TIME) / 1000)

const hours = Math.floor(uptime / 3600)
const minutes = Math.floor((uptime % 3600) / 60)
const seconds = uptime % 60

await sock.sendMessage(from,{
text:`⏱ *Bot Uptime*

📆 ${hours}h ${minutes}m ${seconds}s
🕒 Since: ${new Date(BOT_START_TIME).toLocaleString()}`
})

return
}


let rowId

try{

if(msg.message?.interactiveResponseMessage?.nativeFlowResponseMessage){

rowId = JSON.parse(
msg.message.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson
).id

}

else if(msg.message?.listResponseMessage?.singleSelectReply?.selectedRowId){

rowId = msg.message.listResponseMessage.singleSelectReply.selectedRowId

}

}catch(err){

console.error("[MAINUL-X] Button parse error",err)

}


const btnId = msg.message?.buttonsResponseMessage?.selectedButtonId

if(btnId === "back_to_menu"){

await sock.sendPresenceUpdate("composing",from)

await new Promise(r=>setTimeout(r,800))

await sendDownloaderMenu(sock,from)

await sock.sendPresenceUpdate("paused",from)

userState.set(from,{step:"menuMain"})

return
}


if(rowId){

switch(rowId){

case "yt_downloader":

userState.set(from,{step:"yt_wait_url"})

await sock.sendMessage(from,{text:"📌 Send your *YouTube* video link"})

break


case "fb_downloader":

userState.set(from,{step:"fb_wait_url"})

await sock.sendMessage(from,{text:"📌 Send your *Facebook* video link"})

break


case "ig_downloader":

userState.set(from,{step:"ig_wait_url"})

await sock.sendMessage(from,{text:"📌 Send your *Instagram* video link"})

break


case "tt_downloader":

userState.set(from,{step:"tt_wait_url"})

await sock.sendMessage(from,{text:"📌 Send your *TikTok* video link"})

break

}

return
}


if(text){

const platform = detectPlatform(text)

if(platform){

let downloader

switch(platform){

case "youtube":
downloader = handleYouTubeDownloader
break

case "facebook":
downloader = handleFacebookDownloader
break

case "instagram":
downloader = handleInstagramDownloader
break

case "tiktok":
downloader = handleTikTokDownloader
break

}

await downloader(sock,from,text)

userState.set(from,{step:"menuMain"})

return
}


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

return
}


if(state.step === "start" || state.step === "menuMain"){

await sendDownloaderMenu(sock,from)

userState.set(from,{step:"menuMain"})

}

}



export async function sendDownloaderMenu(sock,from){

if(!fs.existsSync(menuImagePath)){

await sendTextMenu(sock,from)

return

}

await sock.sendMessage(from,{

image: fs.readFileSync(menuImagePath),

caption:`🤖 *MAINUL-X Media Downloader*

Select a platform to download videos`,

footer:"© 2026 MAINUL-X",

interactiveButtons:[
{
name:"single_select",
buttonParamsJson:JSON.stringify({
title:"📱 Video Downloader",
sections:[
{
title:"Available Platforms",
rows:[
{
title:"🎥 YouTube Downloader",
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
description:"Download Instagram reels",
id:"ig_downloader"
},
{
title:"🎵 TikTok Downloader",
description:"Download TikTok without watermark",
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


async function sendTextMenu(sock,from){

const menuText = `🤖 MAINUL-X Media Downloader

🎥 YouTube Downloader
📘 Facebook Downloader
📸 Instagram Downloader
🎵 TikTok Downloader

Commands
!ping
!uptime

Powered by MAINUL-X`

await sock.sendMessage(from,{text:menuText})

}
