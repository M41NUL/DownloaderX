#!/usr/bin/env node

/**
=============================================
MAINUL-X WhatsApp Media Downloader
Author: Md. Mainul Islam (MAINUL-X)
GitHub: https://github.com/M41NUL
Telegram: @mdmainulislaminfo
Email: githubmainul@gmail.com
=============================================
*/

import { makeWASocket, useMultiFileAuthState, DisconnectReason } from 'atexovi-baileys'
import pino from 'pino'
import fs from 'fs'
import path from 'path'
import inquirer from 'inquirer'
import chalk from 'chalk'
import process from 'process'
import dotenv from 'dotenv'
import figlet from 'figlet'

import { handler } from './src/handler.js'
import { wrapSendMessageGlobally } from './src/utils/typing.js'

dotenv.config({ debug:false })

const originalError = console.error
const originalLog = console.log
const originalStdoutWrite = process.stdout.write

/* ===============================
TERMINAL CLEAR
================================ */

function clearTerminal(){

console.clear()
process.stdout.write('\x1Bc')

}

/* ===============================
BOT START TIME
================================ */

const BOT_START_TIME = Date.now()

/* ===============================
CLEAN LOG FILTER
================================ */

const FILTER_PATTERNS = [
'Bad MAC',
'Failed to decrypt message with any known session',
'Session error:',
'Failed to decrypt',
'Closing open session',
'Closing session:',
'SessionEntry',
'_chains:',
'registrationId:',
'currentRatchet:',
'indexInfo:',
'<Buffer',
'pubKey:',
'privKey:',
'baseKey:',
'remoteIdentityKey:',
'lastRemoteEphemeralKey:',
'ephemeralKeyPair:',
'chainKey:',
'chainType:',
'messageKeys:'
]

process.stdout.write = function(chunk,encoding,callback){

const str = chunk?.toString() || ''
const shouldFilter = FILTER_PATTERNS.some(p=>str.includes(p))

if(shouldFilter){

if(str.includes('Closing open session')){
const cleanMsg = chalk.blue('🔒 Signal encryption updated\n')
return originalStdoutWrite.call(this,Buffer.from(cleanMsg),encoding,callback)
}

if(typeof callback === 'function') callback()
return true
}

return originalStdoutWrite.call(this,chunk,encoding,callback)

}

console.error = function(...args){

const msg = args.join(' ')

if(FILTER_PATTERNS.some(p=>msg.includes(p))){

if(msg.includes('Bad MAC')){
console.log(chalk.yellow('🔄 Signal protocol securing connection...'))
}

return
}

originalError.apply(console,args)

}

console.log = function(...args){

const msg = args.join(' ')

if(FILTER_PATTERNS.some(p=>msg.includes(p))) return

originalLog.apply(console,args)

}

/* ===============================
SESSION DIRECTORY
================================ */

const authDir = path.join(process.cwd(),'session')

/* ===============================
FEATURE LIST
================================ */

const features = [
'YouTube Downloader',
'Facebook Downloader',
'Instagram Downloader',
'TikTok Downloader'
]

/* ===============================
CLI DASHBOARD
================================ */

function showDashboard(user){

const uptimeSec = Math.floor((Date.now() - BOT_START_TIME)/1000)

const hours = Math.floor(uptimeSec / 3600)
const minutes = Math.floor((uptimeSec % 3600)/60)

const memory = Math.round(process.memoryUsage().rss / 1024 / 1024)

clearTerminal()

const banner = figlet.textSync("MAINUL-X BOT",{font:"Big"})

console.log(chalk.cyanBright(banner))

console.log("────────────────────────\n")

console.log(chalk.green("Status : Connected"))
console.log(chalk.cyan(`User   : ${user}`))
console.log(chalk.yellow(`Memory : ${memory} MB`))
console.log(chalk.magenta(`Uptime : ${hours}h ${minutes}m`))

console.log("\n────────────────────────\n")

features.forEach(f=>{
console.log(chalk.green(f))
})

console.log("\n")

}

/* ===============================
MEMORY PROTECTION
================================ */

setInterval(()=>{

const used = process.memoryUsage().heapUsed / 1024 / 1024

if(used > 900){

console.log(chalk.red("⚠ High RAM usage detected. Restarting bot..."))
process.exit()

}

},60000)

/* ===============================
CRASH PROTECTION
================================ */

process.on("uncaughtException",(err)=>{
console.log(chalk.red("Uncaught Exception"))
console.log(err)
})

process.on("unhandledRejection",(err)=>{
console.log(chalk.red("Unhandled Rejection"))
console.log(err)
})

/* ===============================
DUPLICATE MESSAGE PROTECTION
================================ */

const processedMessages = new Set()

/* ===============================
START BOT
================================ */

async function startBot(){

if(!fs.existsSync(authDir)){
fs.mkdirSync(authDir)
}

const { state, saveCreds } = await useMultiFileAuthState(authDir)

const sock = makeWASocket({
auth: state,
logger: pino({ level:'silent' })
})

wrapSendMessageGlobally(sock)

/* ===============================
CONNECTION EVENTS
================================ */

sock.ev.on('connection.update', async(update)=>{

const { connection, lastDisconnect } = update

if(connection === 'open'){

showDashboard(sock.user?.id || "Unknown")

}

else if(connection === 'close'){

const reason = lastDisconnect?.error?.output?.statusCode
const shouldReconnect = reason !== DisconnectReason.loggedOut

if(shouldReconnect){

console.log(chalk.yellow('🔁 Connection lost, reconnecting...\n'))

setTimeout(()=>{
startBot()
},3000)

}

else{

console.log(chalk.red('❌ Session invalid.'))
console.log(chalk.red('Delete the session folder and login again.\n'))

}

}

})

/* ===============================
SAVE CREDS
================================ */

sock.ev.on('creds.update', saveCreds)

/* ===============================
MESSAGE LISTENER
================================ */

sock.ev.on('messages.upsert', async(m)=>{

const msg = m.messages?.[0]

if(!msg) return
if(msg.key.fromMe) return

if(processedMessages.has(msg.key.id)) return
processedMessages.add(msg.key.id)

try{

await handler(sock,msg)

}
catch(err){

console.error(chalk.red('[Handler Error]'),err)

}

})

/* ===============================
PAIRING CODE LOGIN
================================ */

const files = fs.readdirSync(authDir).filter(f=>f.endsWith('.json'))

if(files.length === 0){

let waNumber

try{

const response = await inquirer.prompt([
{
type:'input',
name:'waNumber',
message:chalk.cyanBright('📱 Enter your WhatsApp number (country code, no +):'),
validate:(input)=> /^\d{8,}$/.test(input) ? true : 'Invalid phone number'
}
])

waNumber = response.waNumber

}
catch(err){

if(err.name === 'ExitPromptError') process.exit(0)
else throw err

}

try{

await new Promise(resolve => setTimeout(resolve,4000))

const code = await sock.requestPairingCode(waNumber)

console.log(chalk.greenBright('\n✅ Pairing Code Generated!'))
console.log(chalk.yellowBright('📌 Your Code:'),chalk.bold.magenta(code))
console.log(chalk.cyan('Open WhatsApp → Linked Devices → Link a Device'))
console.log(chalk.greenBright('\nWaiting for connection...\n'))

}
catch(error){

console.error(chalk.red('❌ Error requesting pairing code:'),error)

}

}

}

/* ===============================
AUTO RESTART SYSTEM
================================ */

function runBot(){

startBot().catch(err=>{

console.log(chalk.red("Bot crashed. Restarting..."))

setTimeout(()=>{
runBot()
},5000)

})

}

runBot()
