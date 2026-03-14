/**
 * File: index.js (FIXED VERSION)
 * MAINUL-X Downloader Bot
 * Author: Md. Mainul Islam (MAINUL-X)
 */

import { makeWASocket, useMultiFileAuthState, DisconnectReason } from "atexovi-baileys"
import pino from "pino"
import fs from "fs"
import path from "path"
import { handler } from "./src/handler.js"
import { wrapSendMessageGlobally } from "./src/utils/typing.js"
import { WA_NUMBER } from "./config/number.js"
import { BOT_NAME } from "./config/bot.js"

const authDir = path.join(process.cwd(), "session")

async function startBot() {
  console.log("")
  console.log("🚀 Starting MAINUL-X Downloader Bot")
  console.log("📦 Platform : Railway")
  console.log("👨‍💻 Developer : Md. Mainul Islam (MAINUL-X)")
  console.log("")

  // CREATE SESSION FOLDER
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true })
  }

  // AUTH STATE
  const { state, saveCreds } = await useMultiFileAuthState(authDir)

  // CREATE SOCKET
  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    markOnlineOnConnect: true,
    syncFullHistory: false
  })

  wrapSendMessageGlobally(sock)

  // PAIRING CODE (FIRST TIME)
  const credsPath = path.join(authDir, "creds.json")

  if (!fs.existsSync(credsPath)) {
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(WA_NUMBER)
        console.log("")
        console.log("🔐 Pairing Code :", code)
        console.log("📱 WhatsApp → Linked Devices → Link Device")
        console.log("")
      } catch (err) {
        console.log("Pairing Error :", err.message)
      }
    }, 4000)
  }

  // CONNECTION STATUS
  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update

    if (connection === "connecting") {
      console.log("🔄 Connecting to WhatsApp...")
    }

    if (connection === "open") {
      console.log("✅ Bot Connected Successfully")
      console.log(`🤖 ${BOT_NAME} Running`)
    }

    if (connection === "close") {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut

      if (shouldReconnect) {
        console.log("⚠ Connection lost, reconnecting...")
        setTimeout(() => {
          startBot()
        }, 5000)
      } else {
        console.log("❌ Session Logged Out")
      }
    }
  })

  // SAVE SESSION
  sock.ev.on("creds.update", saveCreds)

  /* =========================
  FIXED MESSAGE LISTENER
  ========================= */
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    try {
      
      if (type !== "notify") return

      const msg = messages?.[0]
      if (!msg) return
      

      if (!msg.message) {
        console.log("⚠️ Empty message received")
        return
      }
      
      if (msg.key.fromMe) return

      
      const text = 
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        "non-text"
      
      console.log("📩 Message from:", msg.key.remoteJid, "Text:", text)

      // 👇 হ্যান্ডলার কল করুন
      await handler(sock, msg)

    } catch (err) {
      console.log("❌ Handler Error:", err)
    }
  })
}

startBot()
