/**
 * File: src/commands/system.js
 * MAINUL-X Downloader Bot
 * Author: Md. Mainul Islam (MAINUL-X)
 * GitHub: https://github.com/M41NUL
 */

import { BOT_NAME } from "../../config/bot.js"

export async function handleSystemCommands(sock,from,text){

if(!text) return false

const cmd = text.toLowerCase().trim()

if(cmd === "!help"){

await sock.sendMessage(from,{
text:`📜 *${BOT_NAME}*

━━━━━━━━━━━━━━

⚙️ *SYSTEM COMMANDS*

!ping
Check bot response speed

!uptime
Show how long the bot is running

!runtime
Display bot runtime status

!alive
Check if the bot is active

━━━━━━━━━━━━━━

👤 *USER COMMANDS*

!menu
Show main menu

!help
Display command list

!owner
Contact bot owner

!dev
Developer information

━━━━━━━━━━━━━━

⬇️ *DOWNLOADER COMMANDS*

!yt
Download YouTube video

!fb
Download Facebook video

!ig
Download Instagram reels/video

!tt
Download TikTok video (No Watermark)

━━━━━━━━━━━━━━
⚡ Powered by MAINUL-X`
})

return true
}

return false

}
