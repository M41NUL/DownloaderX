/**
=============================================
MAINUL-X WhatsApp Media Downloader
Author: Md. Mainul Islam (MAINUL-X)
GitHub: https://github.com/M41NUL
Telegram: @mdmainulislaminfo
Email: githubmainul@gmail.com
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

import { validateUrl, detectPlatform } from "./utils/validateUrl.js"

const menuImagePath = path.join(process.cwd(),"src/assets/menu.jpg")

const BOT_START_TIME = Date.now()

const messageCache = new Set()
const spamTracker = new Map()

/* ===============================
CACHE CLEANER
================================ */

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

function suggestCommand(input){

let best=null
let score=0

for(const cmd of validCommands){

let match=0

for(let i=0;i<input.length;i++){

if(cmd[i]===input[i]) match++

}

if(match>score){

score=match
best=cmd

}

}

return best

}

/* =================================
HANDLER
================================= */

export async function handler(sock,msg){

if(!msg?.message) return

if(messageCache.has(msg.key.id)) return
messageCache.add(msg.key.id)

const from = msg.key.remoteJid

const state = userState.get(from) || {step:"start"}

const text =
msg.message?.conversation ||
msg.message?.extendedTextMessage?.text ||
msg.message?.imageMessage?.caption ||
msg.message?.videoMessage?.caption

const lower = text?.toLowerCase()

/* ===============================
PING
================================ */

if(lower==="!ping"){

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

if(lower==="!uptime"){

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
STATS
================================ */

if(lower==="!stats"){

const ram = Math.round(process.memoryUsage().rss/1024/1024)

await sock.sendMessage(from,{
text:`📊 BOT STATS

RAM Usage : ${ram} MB
Platform : Node.js
Status : Online`
})

return
}

/* ===============================
SYSTEM
================================ */

if(lower==="!system"){

await sock.sendMessage(from,{
text:`⚙ SYSTEM INFO

OS : ${os.platform()}
CPU : ${os.cpus().length} cores
RAM : ${(os.totalmem()/1024/1024/1024).toFixed(2)} GB
Node : ${process.version}`
})

return
}

/* ===============================
ALIVE
================================ */

if(lower==="!alive"){

await sock.sendMessage(from,{
text:`🤖 MAINUL-X BOT

Status : Online
System : Running
Connection : Stable`
})

return
}

/* ===============================
RUNTIME
================================ */

if(lower==="!runtime"){

const runtime = process.uptime()

const h = Math.floor(runtime/3600)
const m = Math.floor((runtime%3600)/60)
const s = Math.floor(runtime%60)

await sock.sendMessage(from,{
text:`⏱ RUNTIME

${h}h ${m}m ${s}s`
})

return
}

/* ===============================
BOTINFO
================================ */

if(lower==="!botinfo"){

await sock.sendMessage(from,{
text:`🤖 BOT INFO

Name : MAINUL-X Downloader
Version : v1.0
Platform : WhatsApp MD
Developer : MAINUL-X`
})

return
}

/* ===============================
OWNER
================================ */

if(lower==="!owner"){

await sock.sendMessage(from,{
text:`👨‍💻 BOT OWNER

Name : Md. Mainul Islam
Alias : MAINUL-X

Telegram
@mdmainulislaminfo

GitHub
https://github.com/M41NUL`
})

return
}

/* ===============================
DEV
================================ */

if(lower==="!dev"){

await sock.sendMessage(from,{
text:`👨‍💻 Developer Information

Name: Md. Mainul Islam
Alias: MAINUL-X

GitHub:
https://github.com/M41NUL

Telegram:
https://t.me/mdmainulislaminfo

Email:
githubmainul@gmail.com`
})

return
}

/* ===============================
HELP
================================ */

if(lower==="!help"){
await sendCommandList(sock,from)
return
}

/* ===============================
MENU
================================ */

if(lower==="!menu"){
await sendDownloaderMenu(sock,from)
return
}

/* ===============================
UNKNOWN COMMAND + ANTI SPAM
================================ */

if(text && text.startsWith("!")){

if(!validCommands.includes(lower)){

let data = spamTracker.get(from) || {count:0,blockedUntil:0}

const now = Date.now()

if(now < data.blockedUntil){

await sock.sendMessage(from,{
text:"⛔ Too many wrong commands\nTry again in 3 seconds"
})

return
}

data.count++

if(data.count>=3){

data.blockedUntil = now + 3000
data.count = 0

spamTracker.set(from,data)

await sock.sendMessage(from,{
text:"🚫 Command spam detected\nUser suspended for 3 seconds"
})

return
}

spamTracker.set(from,data)

const suggestion = suggestCommand(lower)

await sock.sendMessage(from,{
text:`❌ Unknown command

Did you mean: *${suggestion}* ?

Type *!help* to see command list`
})

return

}

}

  
/* ===============================
AUTO WELCOME + MENU
================================ */

if(text && !text.startsWith("!") && !detectPlatform(text)){

await sock.sendMessage(from,{
text:`👋 Welcome to *MAINUL-X Downloader Bot*

Send a video link directly or choose a platform below.

📥 Supported Platforms
• YouTube
• Facebook
• Instagram
• TikTok`
})

if(state.step !== "menuShown"){

await sendDownloaderMenu(sock,from)

userState.set(from,{step:"menuShown"})

}

return

}

/* ===============================
AUTO LINK DETECT
================================ */

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

return

}

}

}

/* ===============================
COMMAND LIST
================================ */

async function sendCommandList(sock,from){

const text = `📜 MAINUL-X COMMAND LIST

!yt → Download YouTube video
!fb → Download Facebook video
!ig → Download Instagram video
!tt → Download TikTok video

!ping → Bot speed
!uptime → Bot running time
!stats → RAM usage
!system → System info

!alive → Bot status
!runtime → Live uptime
!botinfo → Bot information

!owner → Contact owner
!dev → Developer info
!repo → GitHub repository

!update → Bot update
!restart → Restart bot
!logs → Error logs
!help → Command menu

━━━━━━━━━━━━━━━━━━

💡 Tip:
You can send a video link directly
without using commands.

━━━━━━━━━━━━━━━━━━

👨‍💻 Developer
Md. Mainul Islam (MAINUL-X)

🌐 GitHub
https://github.com/M41NUL

⚡ Powered by MAINUL-X
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

