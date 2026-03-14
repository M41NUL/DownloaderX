/**
 * File: index.js
 * MAINUL-X Downloader Bot
 */

import { makeWASocket, useMultiFileAuthState, DisconnectReason } from "atexovi-baileys"

import pino from "pino"
import fs from "fs"

import { handler } from "./src/handler.js"
import { WA_NUMBER } from "./config/number.js"

const authDir = "./session"

async function startBot(){

console.log("🚀 Starting MAINUL-X Downloader Bot")

/* =========================
CREATE SESSION FOLDER
========================= */

if(!fs.existsSync(authDir)){
fs.mkdirSync(authDir)
}

/* =========================
AUTH STATE
========================= */

const { state, saveCreds } = await useMultiFileAuthState(authDir)

/* =========================
SOCKET
========================= */

const sock = makeWASocket({
auth: state,
logger: pino({ level: "silent" }),
printQRInTerminal: false,
markOnlineOnConnect: true,
syncFullHistory: false
})

/* =========================
PAIRING CODE (ONLY FIRST TIME)
========================= */

const credsPath = `${authDir}/creds.json`

if(!fs.existsSync(credsPath)){

setTimeout(async()=>{

try{

const code = await sock.requestPairingCode(WA_NUMBER)

console.log("")
console.log("🔐 Pairing Code :", code)
console.log("📱 WhatsApp → Linked Devices → Link Device")
console.log("")

}catch(err){

console.log("Pairing Error:",err)

}

},3000)

}

/* =========================
CONNECTION UPDATE
========================= */

sock.ev.on("connection.update",(update)=>{

const { connection, lastDisconnect } = update

if(connection === "connecting"){
console.log("🔄 Connecting to WhatsApp...")
}

if(connection === "open"){
console.log("✅ Bot Connected Successfully")
console.log("🤖 MAINUL-X Downloader Bot Running")
}

if(connection === "close"){

const shouldReconnect =
lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut

if(shouldReconnect){

console.log("⚠ Connection closed, reconnecting...")

setTimeout(()=>{
startBot()
},4000)

}else{

console.log("❌ Session Logged Out")

}

}

})

/* =========================
SAVE SESSION
========================= */

sock.ev.on("creds.update", saveCreds)

/* =========================
MESSAGE LISTENER
========================= */

sock.ev.on("messages.upsert", async ({ messages })=>{

try{

const msg = messages?.[0]

if(!msg) return
if(!msg.message) return
if(msg.key.fromMe) return

await handler(sock,msg)

}catch(err){

console.log("Handler Error:",err)

}

})

}

/* =========================
START BOT
========================= */

startBot()
