/**
 * File: src/commands/commands.js
 * MAINUL-X Downloader Bot
 * Author: Md. Mainul Islam (MAINUL-X)
 * GitHub: https://github.com/M41NUL
 */

import os from "os"
import {
BOT_NAME,
VERSION,
OWNER_NAME,
OWNER_ALIAS,
WHATSAPP,
TELEGRAM,
GITHUB_URL,
EMAIL_PRIMARY,
EMAIL_DEV
} from "../../config/bot.js"

const BOT_START_TIME = Date.now()

export async function handleCommands(sock,from,text){

const cmd = text?.toLowerCase().trim()

switch(cmd){

case "!ping":{

const start = Date.now()

await sock.sendMessage(from,{text:"🏓 Pinging..."})

const end = Date.now()

await sock.sendMessage(from,{
text:`🏓 Pong
Response : ${end-start} ms`
})

return true
}

case "!uptime":{

const uptime = Math.floor((Date.now()-BOT_START_TIME)/1000)

const h = Math.floor(uptime/3600)
const m = Math.floor((uptime%3600)/60)
const s = uptime%60

await sock.sendMessage(from,{
text:`⏱ BOT UPTIME

${h}h ${m}m ${s}s`
})

return true
}

case "!runtime":{

const runtime = process.uptime()

const h = Math.floor(runtime/3600)
const m = Math.floor((runtime%3600)/60)
const s = Math.floor(runtime%60)

await sock.sendMessage(from,{
text:`⏱ RUNTIME

${h}h ${m}m ${s}s`
})

return true
}

case "!alive":{

await sock.sendMessage(from,{
text:`🤖 ${BOT_NAME}

Status : Online
Version : ${VERSION}
System : Running`
})

return true
}

case "!owner":{

await sock.sendMessage(from,{
text:`👨‍💻 BOT OWNER

Name : ${OWNER_NAME}
Alias : ${OWNER_ALIAS}

WhatsApp : ${WHATSAPP}
Telegram : ${TELEGRAM}

Email : ${EMAIL_DEV}`
})

return true
}

case "!dev":{

await sock.sendMessage(from,{
text:`👨‍💻 Developer

${OWNER_ALIAS}

GitHub : ${GITHUB_URL}
Email : ${EMAIL_DEV}`
})

return true
}

case "!repo":{

await sock.sendMessage(from,{
text:`🌐 GitHub Repository

${GITHUB_URL}`
})

return true
}

case "!help":{

await sock.sendMessage(from,{
text:`📜 ${BOT_NAME}

━━━━━━━━━━━━━━

⚙️ SYSTEM COMMANDS
!ping — Check bot speed
!uptime — Bot running time
!runtime — Bot runtime
!alive — Check bot status

👤 USER COMMANDS
!menu — Show downloader menu
!help — Show command list
!owner — Bot owner info
!dev — Developer info
!repo — GitHub repository

⬇️ DOWNLOADER COMMANDS
!yt — Download YouTube video
!fb — Download Facebook video
!ig — Download Instagram video
!tt — Download TikTok video

━━━━━━━━━━━━━━
⚡ Powered by MAINUL-X`
})

return true
}

}

return false

}
