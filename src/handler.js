console.log("HANDLER WORKING")
/**
=============================================
MAINUL - X DOWNLOADER BOT
Main Message Handler
=============================================
*/

import fs from "fs"
import path from "path"

const menuImagePath = path.join(process.cwd(),"src/assets/menu.jpg")

const greetings = [
"hi","hello","hey","hlw","start","menu",
"salam","assalamu alaikum","assalamualaikum"
]

export async function handler(sock,msg){

const from = msg.key.remoteJid

const text =
msg.message?.conversation ||
msg.message?.extendedTextMessage?.text ||
msg.message?.imageMessage?.caption ||
msg.message?.videoMessage?.caption ||
""

const lower = text.toLowerCase().trim()

/* =========================
WELCOME MENU
========================= */

if(greetings.includes(lower)){

await sock.sendMessage(from,{

image: fs.existsSync(menuImagePath)
? fs.readFileSync(menuImagePath)
: undefined,

caption:`👋 Welcome to *MAINUL - X DOWNLOADER BOT*

Send a video link directly or choose a platform below.

📥 Supported Platforms
• YouTube
• Facebook
• Instagram
• TikTok

💡 Commands
Type *!help* to see all bot commands`,

footer:"MAINUL-X SYSTEM",

buttons:[
{buttonId:"yt_downloader",buttonText:{displayText:"📺 YouTube"},type:1},
{buttonId:"fb_downloader",buttonText:{displayText:"📘 Facebook"},type:1},
{buttonId:"ig_downloader",buttonText:{displayText:"📸 Instagram"},type:1},
{buttonId:"tt_downloader",buttonText:{displayText:"🎵 TikTok"},type:1},
{buttonId:"show_commands",buttonText:{displayText:"📜 Commands"},type:1}
]

})

return
}

/* =========================
PING COMMAND
========================= */

if(lower === "!ping"){

await sock.sendMessage(from,{
text:"🏓 Pong! Bot working."
})

return
}

/* =========================
DEV COMMAND
========================= */

if(lower === "!dev"){

await sock.sendMessage(from,{
text:`👨‍💻 Developer

Name : MAINUL-X
GitHub : https://github.com/M41NUL`
})

return
}

}
