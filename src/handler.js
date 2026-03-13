import fs from "fs"
import path from "path"

import { userState } from "./userState.js"

import { handleDownloaderCommands } from "./commands/downloader.js"
import { handleSystemCommands } from "./commands/system.js"
import { handleAdminCommands } from "./commands/admin.js"

import { detectPlatform } from "./utils/validateUrl.js"

import { autoReact, antiSpam, checkMenuCooldown } from "./utils/security.js"

import {
BOT_NAME,
VERSION,
OWNER_NAME,
OWNER_ALIAS,
WHATSAPP,
TELEGRAM,
GITHUB_URL
} from "../config/bot.js"

const BOT_START_TIME = Date.now()
const messageCache = new Set()

const menuImagePath = path.join(process.cwd(),"src/assets/menu.jpg")

const greetings = [
"hi","hello","hey","hlw","start","menu",
"salam","assalamu alaikum","assalamualaikum"
]

const ADMIN_NUMBERS = [
"8801308850528@s.whatsapp.net",
"01308850528@s.whatsapp.net"
]

const isAdmin = (jid)=>{
return ADMIN_NUMBERS.includes(jid) ||
ADMIN_NUMBERS.includes(jid.split("@")[0]+"@s.whatsapp.net")
}

export async function handler(sock,msg){

if(!msg) return
if(messageCache.has(msg.key?.id)) return

messageCache.add(msg.key?.id)

if(messageCache.size > 1000){
messageCache.clear()
}

await autoReact(sock,msg)

const from = msg.key?.remoteJid
if(!from) return

if(!antiSpam(from)){
await sock.sendMessage(from,{text:"⚠️ Too many messages. Please slow down."})
return
}

const text =
msg.message?.conversation ||
msg.message?.extendedTextMessage?.text ||
msg.message?.imageMessage?.caption ||
msg.message?.videoMessage?.caption ||
""

const lower = (text || "").toLowerCase().trim()

/* ===============================
WELCOME SYSTEM
================================ */

if(greetings.includes(lower)){
await sendWelcomeMenu(sock,from)
return
}

/* ===============================
BUTTON RESPONSE
================================ */

const button = msg.message?.buttonsResponseMessage?.selectedButtonId

if(button){

if(button === "yt_downloader"){
await sock.sendMessage(from,{text:"📺 Send YouTube video link"})
return
}

if(button === "fb_downloader"){
await sock.sendMessage(from,{text:"📘 Send Facebook video link"})
return
}

if(button === "ig_downloader"){
await sock.sendMessage(from,{text:"📸 Send Instagram video link"})
return
}

if(button === "tt_downloader"){
await sock.sendMessage(from,{text:"🎵 Send TikTok video link"})
return
}

if(button === "show_commands"){
await sendCommandList(sock,from)
return
}

}

/* ===============================
COMMAND MODULES
================================ */

if(await handleDownloaderCommands(sock,from,lower,text)){
return
}

if(await handleSystemCommands(
sock,
from,
lower,
{BOT_NAME,VERSION,OWNER_ALIAS},
BOT_START_TIME
)){
return
}

if(await handleAdminCommands(
sock,
from,
lower,
text,
{
isAdmin,
userState,
ADMIN_NUMBERS
}
)){
return
}

/* ===============================
USER COMMANDS
================================ */

if(lower === "!menu"){

if(!checkMenuCooldown(from)){
await sock.sendMessage(from,{text:"⏳ Please wait before opening menu again"})
return
}

await sendWelcomeMenu(sock,from)
return
}

if(lower === "!help"){
await sendCommandList(sock,from)
return
}

if(lower === "!owner"){

await sock.sendMessage(from,{
text:`👨‍💻 BOT OWNER

Name : ${OWNER_NAME}
Alias : ${OWNER_ALIAS}

📱 WhatsApp
${WHATSAPP}

🌐 GitHub
${GITHUB_URL}

📢 Telegram
${TELEGRAM}`
})

return
}

if(lower === "!repo" || lower === "!dev"){

await sock.sendMessage(from,{
text:`🌐 GitHub Repository

MAINUL - X DOWNLOADER BOT

${GITHUB_URL}`
})

return
}

/* ===============================
AUTO LINK DETECT
================================ */

const platform = detectPlatform(text)

if(platform){
await handleDownloaderCommands(sock,from,lower,text)
return
}

}

/* ===============================
WELCOME MENU
================================ */

async function sendWelcomeMenu(sock,from){

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

}

/* ===============================
COMMAND LIST
================================ */

async function sendCommandList(sock,from){

const text = `📜 *MAINUL - X DOWNLOADER BOT COMMAND LIST*

*DOWNLOADER*
!yt → Download YouTube video
!fb → Download Facebook video
!ig → Download Instagram video
!tt → Download TikTok video

*SYSTEM*
!ping → Bot speed
!uptime → Bot running time
!stats → RAM usage
!system → System info
!alive → Bot status
!runtime → Live uptime
!botinfo → Bot information

*USER*
!owner → Contact owner
!dev → Developer info
!repo → GitHub repository
!help → Command menu
!menu → Show menu

━━━━━━━━━━━━━━━━━━
💡 Tip: You can send a video link directly
━━━━━━━━━━━━━━━━━━
👨‍💻 Developer: Md. Mainul Islam (MAINUL-X)
🌐 GitHub: https://github.com/M41NUL
⚡ Powered by MAINUL-X`

await sock.sendMessage(from,{text})

}
