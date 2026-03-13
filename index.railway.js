#!/usr/bin/env node
/**
 * =============================================
 * MAINUL - X DOWNLOADER BOT
 * Railway Production Version
 * =============================================
 */

import { makeWASocket, useMultiFileAuthState, DisconnectReason } from "atexovi-baileys"
import pino from "pino"
import fs from "fs"
import path from "path"

import { handler } from "./src/handler.js"
import { wrapSendMessageGlobally } from "./src/utils/typing.js"
import { WA_NUMBER } from "./config/number.js"

/* =========================
CRASH PROTECTION
========================= */

process.on("uncaughtException",(err)=>{
console.log("CRASH:",err)
})

process.on("unhandledRejection",(err)=>{
console.log("PROMISE ERROR:",err)
})

/* =========================
SESSION PATH
========================= */

const authDir = path.join(process.cwd(),"session")

let messagesProcessed = 0

/* =========================
START BOT
========================= */

async function startBot(){

console.log("🚀 Starting MAINUL - X DOWNLOADER BOT")

if(!fs.existsSync(authDir)){
fs.mkdirSync(authDir)
}

/* =========================
AUTH STATE
========================= */

const { state, saveCreds } = await useMultiFileAuthState(authDir)

const sock = makeWASocket({

auth: state,

logger: pino({ level:"silent" }),

printQRInTerminal:false,

markOnlineOnConnect:true,

syncFullHistory:false

})

wrapSendMessageGlobally(sock)

/* =========================
PAIRING LOGIN
========================= */

const files = fs.readdirSync(authDir).filter(f=>f.endsWith(".json"))

if(files.length === 0){

setTimeout(async ()=>{

try{

const code = await sock.requestPairingCode(WA_NUMBER)

console.log("")
console.log("🔐 Pairing Code :",code)
console.log("📱 Open WhatsApp → Linked Devices → Link Device")
console.log("")

}catch(err){

console.log("Pairing Error:",err.message)

}

},4000)

}

/* =========================
CONNECTION EVENTS
========================= */

sock.ev.on("connection.update",(update)=>{

const { connection, lastDisconnect } = update

if(connection === "connecting"){

console.log("🔄 Connecting to WhatsApp...")

}

if(connection === "open"){

console.log("✅ Bot Connected Successfully")
console.log("🤖 MAINUL - X DOWNLOADER BOT Running")

}

if(connection === "close"){

const shouldReconnect =
lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut

if(shouldReconnect){

console.log("⚠ Connection closed, reconnecting...")

setTimeout(()=>{

startBot()

},3000)

}else{

console.log("❌ Session logged out")

}

}

})

/* =========================
SAVE CREDS
========================= */

sock.ev.on("creds.update",saveCreds)

/* =========================
MESSAGE LISTENER
========================= */

sock.ev.on("messages.upsert",async(m)=>{

try{

const msg = m.messages?.[0]

if(!msg) return
if(!msg.message) return
if(msg.key.fromMe) return
if(m.type !== "notify") return

messagesProcessed++

await handler(sock,msg)

}catch(err){

console.log("Handler Error:",err)

}

})

}

startBot()
