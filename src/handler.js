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

/* ===============================
PING
================================ */

if(text?.toLowerCase()==="!ping"){

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

if(text?.toLowerCase()==="!uptime"){

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

if(text?.toLowerCase()==="!stats"){

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

if(text?.toLowerCase()==="!system"){

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

if(text?.toLowerCase()==="!alive"){

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

if(text?.toLowerCase()==="!runtime"){

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

if(text?.toLowerCase()==="!botinfo"){

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

if(text?.toLowerCase()==="!owner"){

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

if(text?.toLowerCase()==="!dev"){

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
UPDATE
================================ */

if(text?.toLowerCase()==="!update"){

await sock.sendMessage(from,{
text:`🔄 BOT UPDATE

Version : v1.0
Status : Latest Version`
})

return
}

/* ===============================
HELP / COMMAND LIST
================================ */

if(text?.toLowerCase()==="!help"){

await sendCommandList(sock,from)

return
}

/* ===============================
REPO
================================ */

if(text?.toLowerCase()==="!repo"){

await sock.sendMessage(from,{
text:"🌐 GitHub Repository\nhttps://github.com/M41NUL"
})

return
}

/* ===============================
RESTART
================================ */

if(text?.toLowerCase()==="!restart"){

await sock.sendMessage(from,{text:"🔄 Restarting bot..."})

setTimeout(()=>{
process.exit()
},2000)

return
}

/* ===============================
LOGS
================================ */

if(text?.toLowerCase()==="!logs"){

await sock.sendMessage(from,{
text:"📄 Logs feature enabled\nCheck terminal logs."
})

return
}

/* ===============================
MENU
================================ */

if(text?.toLowerCase()==="!menu"){

await sendDownloaderMenu(sock,from)
return
}

/* ===============================
ROW BUTTON
================================ */

let rowId

try{

if(msg.message?.interactiveResponseMessage?.nativeFlowResponseMessage){

rowId = JSON.parse(
msg.message.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson
).id

}

}catch(e){}

if(rowId){

switch(rowId){

case "yt_downloader":

userState.set(from,{step:"yt_wait_url"})
await sock.sendMessage(from,{text:"Send YouTube link"})
break

case "fb_downloader":

userState.set(from,{step:"fb_wait_url"})
await sock.sendMessage(from,{text:"Send Facebook link"})
break

case "ig_downloader":

userState.set(from,{step:"ig_wait_url"})
await sock.sendMessage(from,{text:"Send Instagram link"})
break

case "tt_downloader":

userState.set(from,{step:"tt_wait_url"})
await sock.sendMessage(from,{text:"Send TikTok link"})
break

case "show_commands":

await sendCommandList(sock,from)
break

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
`

await sock.sendMessage(from,{text})

}

/* ===============================
MENU UI
================================ */

export async function sendDownloaderMenu(sock,from){

await sock.sendMessage(from,{

image:fs.readFileSync(menuImagePath),

caption:`MAINUL-X Downloader Bot

Choose a platform`,

footer:"MAINUL-X SYSTEM",

interactiveButtons:[

{
name:"single_select",
buttonParamsJson:JSON.stringify({

title:"Video Downloader",

sections:[

{
title:"Platforms",

rows:[

{
title:"YouTube",
description:"Download YouTube video",
id:"yt_downloader"
},

{
title:"Facebook",
description:"Download Facebook video",
id:"fb_downloader"
},

{
title:"Instagram",
description:"Download Instagram reels",
id:"ig_downloader"
},

{
title:"TikTok",
description:"Download TikTok video",
id:"tt_downloader"
}

]

},

{
title:"System",

rows:[

{
title:"Show Commands",
description:"All command list",
id:"show_commands"
}

]

}

]

})
}

]

})

}
