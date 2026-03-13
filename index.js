#!/usr/bin/env node

import { makeWASocket, useMultiFileAuthState, DisconnectReason } from "atexovi-baileys"
import pino from "pino"
import fs from "fs"
import path from "path"
import chalk from "chalk"
import inquirer from "inquirer"
import figlet from "figlet"
import os from "os"
import process from "process"

import { handler } from "./src/handler.js"
import { wrapSendMessageGlobally } from "./src/utils/typing.js"

const authDir = path.join(process.cwd(),"session")

let messagesProcessed = 0
let downloadsToday = 0

const startTime = Date.now()

/* =========================
CLEAR TERMINAL
========================= */

function clearScreen(){
console.clear()
process.stdout.write("\x1Bc")
}

/* =========================
BANNER
========================= */

function showBanner(){

clearScreen()

const banner = figlet.textSync("M X-D L",{font:"Big"})
console.log(chalk.cyan(banner))

}

/* =========================
UPTIME
========================= */

function getUptime(){

const sec = Math.floor((Date.now()-startTime)/1000)

const h = Math.floor(sec/3600)
const m = Math.floor((sec%3600)/60)

return `${h}h ${m}m`

}

/* =========================
CPU USAGE
========================= */

function getCPU(){

const cpus = os.cpus()
let idle = 0
let total = 0

for (const cpu of cpus) {

for (const type in cpu.times) {
total += cpu.times[type]
}

idle += cpu.times.idle

}

const usage = 100 - Math.round(100 * idle / total)

return usage

}

/* =========================
MEMORY
========================= */

function getMemory(){

return Math.round(process.memoryUsage().rss/1024/1024)

}

/* =========================
STATUS DASHBOARD
========================= */

function showStatus(sock){

console.log(chalk.gray("────────────────────────"))

console.log(chalk.green("Status  : Connected"))

console.log(chalk.cyan(`User    : ${sock.user?.id}`))

console.log(chalk.yellow(`Memory  : ${getMemory()} MB`))

console.log(chalk.magenta(`CPU     : ${getCPU()} %`))

console.log(chalk.blue(`Uptime  : ${getUptime()}`))

console.log()

console.log(chalk.green(`Messages processed : ${messagesProcessed}`))

console.log(chalk.green(`Downloads today    : ${downloadsToday}`))

console.log(chalk.gray("────────────────────────"))

console.log()

console.log(chalk.green("YouTube Downloader"))
console.log(chalk.green("Facebook Downloader"))
console.log(chalk.green("Instagram Downloader"))
console.log(chalk.green("TikTok Downloader"))

console.log()

}

/* =========================
DOWNLOAD COUNTER HOOK
========================= */

export function increaseDownload(){
downloadsToday++
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

/* =========================
ENABLE TYPING SYSTEM
========================= */

wrapSendMessageGlobally(sock)

/* =========================
CONNECTION EVENTS
========================= */

sock.ev.on("connection.update",(update)=>{

const { connection, lastDisconnect } = update

if(connection==="open"){

showBanner()
showStatus(sock)

}

if(connection==="close"){

const shouldReconnect =
lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut

if(shouldReconnect){

console.log(chalk.yellow("Reconnecting..."))

setTimeout(()=>{
startBot()
},3000)

}else{

console.log(chalk.red("Session logged out"))

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

console.log(chalk.red("Handler Error"))
console.log(err)

}

})

/* =========================
PAIRING LOGIN
========================= */

const files = fs.readdirSync(authDir).filter(f=>f.endsWith(".json"))

if(files.length===0){

const { waNumber } = await inquirer.prompt([
{
type:"input",
name:"waNumber",
message:chalk.cyan("📱 Enter your WhatsApp number (country code, no +):"),
validate:(input)=> /^\d+$/.test(input) ? true : "Invalid number"
}
])

const code = await sock.requestPairingCode(waNumber)

console.log()
console.log(chalk.green("Pairing Code:"),chalk.bold(code))
console.log(chalk.gray("Open WhatsApp → Linked Devices → Link Device"))
console.log()

}

}

startBot()


