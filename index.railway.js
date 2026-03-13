#!/usr/bin/env node
/**
 * =============================================
 *        MAINUL-X WhatsApp Downloader Bot
 * =============================================
 * Author : Md. Mainul Islam (MAINUL-X)
 * GitHub : https://github.com/M41NUL
 * Project: DownloaderX - Multi Platform Video Downloader
 * =============================================
 */

import { makeWASocket, useMultiFileAuthState, DisconnectReason } from "atexovi-baileys"
import pino from "pino"
import fs from "fs"
import path from "path"
import chalk from "chalk"
import figlet from "figlet"
import os from "os"

import { handler } from "./src/handler.js"
import { wrapSendMessageGlobally } from "./src/utils/typing.js"
import { WA_NUMBER } from "./config/number.js"

const authDir = path.join(process.cwd(),"session")

let messagesProcessed = 0
let downloadsToday = 0
const startTime = Date.now()

/* =========================
BANNER
========================= */

function showBanner(){

const banner = figlet.textSync("M X-D L BOT",{font:"Big"})
console.log(banner)

}

/* =========================
SYSTEM STATS
========================= */

function getUptime(){

const sec = Math.floor((Date.now()-startTime)/1000)
const h = Math.floor(sec/3600)
const m = Math.floor((sec%3600)/60)

return `${h}h ${m}m`

}

function getMemory(){

return Math.round(process.memoryUsage().rss/1024/1024)

}

function getCPU(){

const cpus = os.cpus()

let idle = 0
let total = 0

for (const cpu of cpus){

for (const type in cpu.times){

total += cpu.times[type]

}

idle += cpu.times.idle

}

return 100 - Math.round(100 * idle / total)

}

/* =========================
STATUS DASHBOARD
========================= */

function showStatus(sock){

console.log("────────────────────────")

console.log("Status  : Connected")
console.log("User    :",sock.user?.id)
console.log("Memory  :",getMemory(),"MB")
console.log("CPU     :",getCPU(),"%")
console.log("Uptime  :",getUptime())

console.log()

console.log("Messages processed :",messagesProcessed)
console.log("Downloads today    :",downloadsToday)

console.log("────────────────────────")

}

/* =========================
START BOT
========================= */

async function startBot(){

showBanner()

if(!fs.existsSync(authDir)){

fs.mkdirSync(authDir)

}

const { state, saveCreds } = await useMultiFileAuthState(authDir)

const sock = makeWASocket({

auth: state,
logger: pino({level:"silent"})

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

console.log("━━━━━━━━━━━━━━━━━━")
console.log("   MAINUL-X BOT LOGIN")
console.log("━━━━━━━━━━━━━━━━━━")

console.log("")

console.log("Pairing Code :",code)

console.log("Device       : Railway Server")

console.log("")

console.log("Open WhatsApp → Linked Devices → Link Device")

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

if(connection === "open"){

showBanner()
showStatus(sock)

}

if(connection === "close"){

const shouldReconnect =
lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut

if(shouldReconnect){

console.log("Reconnecting...")

setTimeout(()=>{

startBot()

},3000)

}else{

console.log("Session logged out")

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

const msg = m.messages?.[0]

if(!msg) return
if(msg.key.fromMe) return

messagesProcessed++

try{

await handler(sock,msg)

}catch(err){

console.log("Handler Error")
console.log(err)

}

})

}

startBot()
