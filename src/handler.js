/**
=============================================
MAINUL-X WhatsApp Media Downloader
Author: Md. Mainul Islam (MAINUL-X)
GitHub: https://github.com/M41NUL
Telegram: @mdmainulislaminfo
Email: githubmainul@gmail.com
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
import { validateUrl, detectPlatform } from "./utils/validateUrl.js"
import {
  BOT_NAME,
  VERSION,
  OWNER_NAME,
  OWNER_ALIAS,
  WHATSAPP,
  TELEGRAM,
  GITHUB_URL,
  EMAIL_PRIMARY,
  EMAIL_SECONDARY
} from "../config/bot.js"
const menuImagePath = path.join(process.cwd(), "src/assets/menu.jpg")
const youtubeImage = path.join(process.cwd(), "src/assets/youtube.png")
const facebookImage = path.join(process.cwd(), "src/assets/facebook.png")
const instagramImage = path.join(process.cwd(), "src/assets/instagram.png")
const tiktokImage = path.join(process.cwd(), "src/assets/tiktok.png")
const BOT_START_TIME = Date.now()
const messageCache = new Set()
const spamTracker = new Map()
/* ===============================
ADMIN CONFIGURATION
================================ */
const ADMIN_NUMBERS = [
  "8801308850528@s.whatsapp.net",
  "01308850528@s.whatsapp.net"
]
const isAdmin = (jid) => {
  return ADMIN_NUMBERS.includes(jid) || ADMIN_NUMBERS.includes(jid.split('@')[0] + '@s.whatsapp.net')
}
/* ===============================
BROADCAST SYSTEM
================================ */
const subscribers = new Set()
/* ===============================
DOWNLOAD STATS
================================ */
const downloadStats = new Map()
function trackDownload(platform, from) {
  const userStats = downloadStats.get(from) || { 
    total: 0, 
    youtube: 0, 
    facebook: 0, 
    instagram: 0, 
    tiktok: 0,
    lastDownload: Date.now()
  }
  userStats.total++
  userStats[platform]++
  userStats.lastDownload = Date.now()
  downloadStats.set(from, userStats)
}
function getStats(from) {
  return downloadStats.get(from) || { total: 0, youtube: 0, facebook: 0, instagram: 0, tiktok: 0 }
}
/* ===============================
AUTO REACTION SYSTEM
================================ */
const reactions = ["⚡", "🔥", "🤖", "🚀", "✨"]
function getRandomReaction() {
  return reactions[Math.floor(Math.random() * reactions.length)]
}
/* ===============================
GREETING LIST
================================ */
const greetings = [
  "hi", "hello", "hlw", "hey", "start",
  "salam", "assalamu alaikum", "assalamualaikum",
  "menu"
]
/* ===============================
CACHE CLEANER
================================ */
setInterval(() => {
  messageCache.clear()
}, 30000)
/* ===============================
COMMAND LIST
================================ */
const validCommands = [
  "!yt", "!fb", "!ig", "!tt",
  "!ping", "!uptime", "!stats", "!system",
  "!alive", "!runtime", "!botinfo",
  "!owner", "!dev", "!repo",
  "!update", "!restart", "!logs",
  "!help", "!menu", "!subscribe", "!unsubscribe",
  "!leaderboard", "!mystats"
]
const adminCommands = [
  "!admin", "!users", "!broadcast", "!adminstats",
  "!clearcache", "!block", "!unblock", "!listadmin"
]
function suggestCommand(input) {
  let best = null
  let score = 0
  for (const cmd of validCommands) {
    let match = 0
    for (let i = 0; i < input.length; i++) {
      if (cmd[i] === input[i]) match++
    }
    if (match > score) {
      score = match
      best = cmd
    }
  }
  return best
}
/* =================================
HANDLER
================================= */
export async function handler(sock, msg) {
  if (!msg) return
  if (messageCache.has(msg.key?.id)) return
  messageCache.add(msg.key?.id)
  const from = msg.key?.remoteJid
  if (!from) return
  const state = userState.get(from) || { step: "start" }
  const text =
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    msg.message?.imageMessage?.caption ||
    msg.message?.videoMessage?.caption ||
    ""
  const lower = (text || "").toLowerCase()
  /* ===============================
  SPAM BLOCK SYSTEM (10 SEC)
  ================================ */
  let spam = spamTracker.get(from) || { count: 0, blockedUntil: 0 }
  const now = Date.now()
  if (now < spam.blockedUntil) return
  spam.count++
  if (spam.count >= 10) {
    spam.blockedUntil = now + 10000
    spam.count = 0
    spamTracker.set(from, spam)
    await sock.sendMessage(from, {
      text: "🚫 Spam detected. Blocked for 10 seconds."
    })
    return
  }
  spamTracker.set(from, spam)
  /* ===============================
  AUTO REACTION
  ================================ */
  try {
    await sock.sendMessage(from, {
      react: { text: getRandomReaction(), key: msg.key }
    })
  } catch { }
  /* ===============================
  MENU BUTTON RESPONSE
  ================================ */
  const selectedButton =
    msg.message?.listResponseMessage?.singleSelectReply?.selectedRowId
  if (selectedButton) {
    if (selectedButton === "yt_downloader") {
      await sock.sendMessage(from, { text: "📺 Send YouTube video link" })
      return
    }
    if (selectedButton === "fb_downloader") {
      await sock.sendMessage(from, { text: "📘 Send Facebook video link" })
      return
    }
    if (selectedButton === "ig_downloader") {
      await sock.sendMessage(from, { text: "📸 Send Instagram reel link" })
      return
    }
    if (selectedButton === "tt_downloader") {
      await sock.sendMessage(from, { text: "🎵 Send TikTok video link" })
      return
    }
    if (selectedButton === "show_commands") {
      await sendCommandList(sock, from)
      return
    }
  }
  /* ===============================
  SMART GREETING SYSTEM
  ================================ */
  if (greetings.includes(lower)) {
    await sock.sendMessage(from, {
      text: `👋 Welcome to *MAINUL - X DOWNLOADER BOT*\n\nSend a video link directly or choose a platform below.\n\n📥 Supported Platforms\n• YouTube\n• Facebook\n• Instagram\n• TikTok\n\n💡 Commands\nType *!help* to see all bot commands`
    })
    await sendDownloaderMenu(sock, from)
    return
  }
  /* ===============================
  SUBSCRIBE SYSTEM
  ================================ */
  if (lower === "!subscribe") {
    subscribers.add(from)
    await sock.sendMessage(from, { text: "✅ You're now subscribed to bot updates!" })
    return
  }
  if (lower === "!unsubscribe") {
    subscribers.delete(from)
    await sock.sendMessage(from, { text: "❌ Unsubscribed from updates" })
    return
  }
  /* ===============================
  LEADERBOARD
  ================================ */
  if (lower === "!leaderboard") {
    const sorted = [...downloadStats.entries()]
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 10)
    if (sorted.length === 0) {
      await sock.sendMessage(from, { text: "📊 No downloads yet!" })
      return
    }
    let msg = "🏆 *DOWNLOAD LEADERBOARD*\n\n"
    sorted.forEach(([user, stats], i) => {
      const shortId = user.split('@')[0].slice(-6)
      msg += `${i + 1}. 📱 ...${shortId} : ${stats.total} downloads\n`
    })
    await sock.sendMessage(from, { text: msg })
    return
  }
  /* ===============================
  MY STATS
  ================================ */
  if (lower === "!mystats") {
    const stats = getStats(from)
    const msg = `📊 *YOUR DOWNLOAD STATS*\n\n📥 Total: ${stats.total}\n🎥 YouTube: ${stats.youtube}\n📘 Facebook: ${stats.facebook}\n📸 Instagram: ${stats.instagram}\n🎵 TikTok: ${stats.tiktok}\n\n⏱️ Last: ${stats.lastDownload ? new Date(stats.lastDownload).toLocaleString() : 'Never'}`
    await sock.sendMessage(from, { text: msg })
    return
  }
  /* ===============================
  PING
  ================================ */
  if (lower === "!ping") {
    const start = Date.now()
    const pingMsg = await sock.sendMessage(from, { text: "🏓 Pinging..." })
    const end = Date.now()
    await sock.sendMessage(from, {
      text: `⚡ Pong\nResponse: ${end - start} ms`,
      edit: pingMsg.key
    })
    return
  }
  /* ===============================
  UPTIME
  ================================ */
  if (lower === "!uptime") {
    const uptime = Math.floor((Date.now() - BOT_START_TIME) / 1000)
    const h = Math.floor(uptime / 3600)
    const m = Math.floor((uptime % 3600) / 60)
    const s = uptime % 60
    await sock.sendMessage(from, {
      text: `⏱ BOT UPTIME\n\n${h}h ${m}m ${s}s`
    })
    return
  }
  /* ===============================
  STATS
  ================================ */
  if (lower === "!stats") {
    const ram = Math.round(process.memoryUsage().rss / 1024 / 1024)
    await sock.sendMessage(from, {
      text: `📊 BOT STATS\n\nRAM Usage : ${ram} MB\nPlatform : Node.js\nStatus : Online`
    })
    return
  }
  /* ===============================
  SYSTEM
  ================================ */
  if (lower === "!system") {
    await sock.sendMessage(from, {
      text: `⚙ SYSTEM INFO\n\nOS : ${os.platform()}\nCPU : ${os.cpus().length} cores\nRAM : ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB\nNode : ${process.version}`
    })
    return
  }
  /* ===============================
  ALIVE
  ================================ */
  if (lower === "!alive") {
    await sock.sendMessage(from, {
      text: `🤖 MAINUL - X DOWNLOADER BOT\n\nStatus : Online\nSystem : Running\nConnection : Stable`
    })
    return
  }
  /* ===============================
  RUNTIME
  ================================ */
  if (lower === "!runtime") {
    const runtime = process.uptime()
    const h = Math.floor(runtime / 3600)
    const m = Math.floor((runtime % 3600) / 60)
    const s = Math.floor(runtime % 60)
    await sock.sendMessage(from, {
      text: `⏱ RUNTIME\n\n${h}h ${m}m ${s}s`
    })
    return
  }
  /* ===============================
  BOTINFO
  ================================ */
  if (lower === "!botinfo") {
    await sock.sendMessage(from, {
      text: `🤖 BOT INFO\n\nName : ${BOT_NAME}\nVersion : v${VERSION}\nPlatform : WhatsApp MD\nDeveloper : ${OWNER_ALIAS}`
    })
    return
  }
  /* ===============================
  OWNER
  ================================ */
  if (lower === "!owner") {
    await sock.sendMessage(from, {
      text: `👨‍💻 BOT OWNER\n\nName : ${OWNER_NAME}\nAlias : ${OWNER_ALIAS}\n\n📱 WhatsApp\n${WHATSAPP}\n\n🌐 GitHub\n${GITHUB_URL}\n\n📢 Telegram\n${TELEGRAM}`
    })
    return
  }
  /* ===============================
  REPO
  ================================ */
  if (lower === "!repo") {
    await sock.sendMessage(from, {
      text: `🌐 GitHub Repository\n\nMAINUL - X DOWNLOADER BOT\n\nhttps://github.com/M41NUL/DownloaderX`
    })
    return
  }
  /* ===============================
  UPDATE
  ================================ */
  if (lower === "!update") {
    await sock.sendMessage(from, {
      text: `🔄 BOT UPDATE\n\nCurrent Version : v1.0\n\nCheck latest updates here:\n\nhttps://github.com/M41NUL/DownloaderX\n\nDeveloper : MAINUL - X`
    })
    return
  }
  /* ===============================
  LOGS
  ================================ */
  if (lower === "!logs") {
    await sock.sendMessage(from, {
      text: `📄 BOT LOGS\n\nStatus : Running\nErrors : None detected\nSystem : Stable\n\nTip:\nCheck server console for detailed logs.`
    })
    return
  }
  /* ===============================
  HELP
  ================================ */
  if (lower === "!help") {
    await sendCommandList(sock, from)
    return
  }
  /* ===============================
  MENU
  ================================ */
  if (lower === "!menu") {
    await sendDownloaderMenu(sock, from)
    return
  }
  /* ===============================
  ADMIN PANEL
  ================================ */
  if (isAdmin(from)) {
    if (lower === "!admin") {
      const msg = `👑 *ADMIN PANEL*\n\n` +
        `!users → Active users\n` +
        `!adminstats → Bot statistics\n` +
        `!broadcast <msg> → Send to all\n` +
        `!clearcache → Clear message cache\n` +
        `!block @user → Block user\n` +
        `!unblock @user → Unblock user\n` +
        `!listadmin → Show admins\n` +
        `!restart → Restart bot`
      await sock.sendMessage(from, { text: msg })
      return
    }
    if (lower === "!users") {
      await sock.sendMessage(from, { 
        text: `👥 *ACTIVE USERS*\n\nTotal: ${userState.size}\nCache: ${messageCache.size}\nSubscribers: ${subscribers.size}` 
      })
      return
    }
    if (lower === "!adminstats") {
      const totalDownloads = [...downloadStats.values()].reduce((acc, curr) => acc + curr.total, 0)
      const msg = `📊 *BOT STATISTICS*\n\n` +
        `👥 Users: ${userState.size}\n` +
        `📥 Downloads: ${totalDownloads}\n` +
        `💾 Cache: ${messageCache.size}\n` +
        `📢 Subscribers: ${subscribers.size}\n` +
        `⏱️ Uptime: ${Math.floor(process.uptime() / 60)} mins`
      await sock.sendMessage(from, { text: msg })
      return
    }
    if (lower.startsWith("!broadcast")) {
      const broadcastMsg = text.replace('!broadcast', '').trim()
      if (!broadcastMsg) {
        await sock.sendMessage(from, { text: "❌ Usage: !broadcast <message>" })
        return
      }
      let sent = 0
      for (const [user] of userState) {
        try {
          await sock.sendMessage(user, { 
            text: `📢 *BROADCAST*\n\n${broadcastMsg}\n\n- MAINUL-X Team` 
          })
          sent++
        } catch (e) { }
      }
      await sock.sendMessage(from, { text: `✅ Broadcast sent to ${sent} users` })
      return
    }
    if (lower === "!clearcache") {
      messageCache.clear()
      await sock.sendMessage(from, { text: "✅ Message cache cleared!" })
      return
    }
    if (lower === "!listadmin") {
      let msg = "👑 *ADMINS*\n\n"
      ADMIN_NUMBERS.forEach((admin, i) => {
        msg += `${i + 1}. ${admin.split('@')[0]}\n`
      })
      await sock.sendMessage(from, { text: msg })
      return
    }
  }
  /* ===============================
  UNKNOWN COMMAND + ANTI SPAM
  ================================ */
  if (text && text.startsWith("!")) {
    if (!validCommands.includes(lower) && !adminCommands.includes(lower)) {
      let data = spamTracker.get(from) || { count: 0, blockedUntil: 0 }
      const now = Date.now()
      if (now < data.blockedUntil) {
        await sock.sendMessage(from, {
          text: "⛔ Too many wrong commands\nTry again in 3 seconds"
        })
        return
      }
      data.count++
      if (data.count >= 3) {
        data.blockedUntil = now + 3000
        data.count = 0
        spamTracker.set(from, data)
        await sock.sendMessage(from, {
          text: "🚫 Command spam detected\nUser suspended for 3 seconds"
        })
        return
      }
      spamTracker.set(from, data)
      const suggestion = suggestCommand(lower)
      await sock.sendMessage(from, {
        text: `❌ Unknown command\n\nDid you mean: *${suggestion}* ?\n\nType *!help* to see command list`
      })
      return
    }
  }
/* ===============================
AUTO WELCOME + MENU
================================ */
await sock.sendMessage(from, {
  disappearingMessagesInChat: 86400
})
if (text && !text.startsWith("!") && !detectPlatform(text)) {
  await sendDownloaderMenu(sock, from)
  return
}
  /* ===============================
  AUTO LINK DETECT
  ================================ */
  if (text) {
    let platform = null
    if (/(youtube\.com|youtu\.be)/i.test(text)) {
      platform = 'youtube'
    }
    else if (/facebook\.com/i.test(text)) {
      platform = 'facebook'
    }
    else if (/instagram\.com/i.test(text)) {
      platform = 'instagram'
    }
    else if (/tiktok\.com/i.test(text)) {
      platform = 'tiktok'
    }
    if (platform) {
      trackDownload(platform, from)
      let downloader
      switch (platform) {
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
      await downloader(sock, from, text)
      return
    }
    const detectedPlatform = detectPlatform(text)
    if (detectedPlatform) {
      trackDownload(detectedPlatform, from)
      let downloader
      switch (detectedPlatform) {
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
      await downloader(sock, from, text)
      return
    }
  }
}
/* ===============================
COMMAND LIST
================================= */
async function sendCommandList(sock, from) {
  const isAdminUser = isAdmin(from)
  let text = `📜 *MAINUL - X DOWNLOADER BOT COMMAND LIST*\n\n*DOWNLOADER*\n!yt → Download YouTube video\n!fb → Download Facebook video\n!ig → Download Instagram video\n!tt → Download TikTok video\n\n*SYSTEM*\n!ping → Bot speed\n!uptime → Bot running time\n!stats → RAM usage\n!system → System info\n!alive → Bot status\n!runtime → Live uptime\n!botinfo → Bot information\n\n*USER*\n!owner → Contact owner\n!dev → Developer info\n!repo → GitHub repository\n!help → Command menu\n!menu → Show menu\n!subscribe → Get updates\n!unsubscribe → Stop updates\n!leaderboard → Top downloaders\n!mystats → Your download stats`
  if (isAdminUser) {
    text += `\n\n👑 *ADMIN COMMANDS*\n!admin → Admin panel\n!users → Active users\n!adminstats → Bot stats\n!broadcast → Send to all\n!clearcache → Clear cache`
  }
  text += `\n\n━━━━━━━━━━━━━━━━━━\n💡 Tip: You can send a video link directly\n━━━━━━━━━━━━━━━━━━\n👨‍💻 Developer: Md. Mainul Islam (MAINUL-X)\n🌐 GitHub: https://github.com/M41NUL\n⚡ Powered by MAINUL-X`
  await sock.sendMessage(from, { text })
}
/* ===============================
MENU UI
================================= */
export async function sendDownloaderMenu(sock, from) {
  await sock.sendMessage(from, {
    image: fs.readFileSync(menuImagePath),
    caption: `🤖 MAINUL-X Downloader Bot\n\nChoose a platform`,
    footer: "MAINUL-X SYSTEM",
    headerType: 4,
    interactiveButtons: [
      {
        name: "single_select",
        buttonParamsJson: JSON.stringify({
          title: "📥 Video Downloader",
          sections: [
            {
              title: "Platforms",
              rows: [
                { title: "YouTube", description: "Download YouTube video", id: "yt_downloader" },
                { title: "Facebook", description: "Download Facebook video", id: "fb_downloader" },
                { title: "Instagram", description: "Download Instagram reels", id: "ig_downloader" },
                { title: "TikTok", description: "Download TikTok video", id: "tt_downloader" }
              ]
            },
            {
              title: "System",
              rows: [
                { title: "Show Commands", description: "All command list", id: "show_commands" }
              ]
            }
          ]
        })
      }
    ]
  })
}
