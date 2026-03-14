#!/usr/bin/env node
/**
 * MAINUL-X Downloader Bot
 * Author: Md. Mainul Islam (MAINUL-X)
 */

import { makeWASocket, useMultiFileAuthState, DisconnectReason } from 'atexovi-baileys';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import chalk from 'chalk';
import process from 'process';
import dotenv from 'dotenv';

import { handler } from './src/handler.js';
import { wrapSendMessageGlobally } from './src/utils/typing.js';

dotenv.config({ debug: false });

/* =========================
LOG FILTER SYSTEM
========================= */

const originalError = console.error;
const originalLog = console.log;
const originalStdoutWrite = process.stdout.write;

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
];

process.stdout.write = function(chunk, encoding, callback){

const str = chunk?.toString() || '';

const shouldFilter = FILTER_PATTERNS.some(p => str.includes(p));

if(shouldFilter){

if(str.includes('Closing open session')){
const cleanMsg = chalk.blue('🔒 WhatsApp Signal Updated\n');
return originalStdoutWrite.call(this, Buffer.from(cleanMsg), encoding, callback);
}

if(typeof callback === 'function') callback();
return true;

}

return originalStdoutWrite.call(this, chunk, encoding, callback);

};

console.error = function(...args){

const msg = args.join(' ');

if(FILTER_PATTERNS.some(p => msg.includes(p))){

if(msg.includes('Bad MAC')){
console.log(chalk.yellow('🔄 Signal Protocol Securing Connection...'));
}

return;
}

originalError.apply(console,args);

};

console.log = function(...args){

const msg = args.join(' ');

if(FILTER_PATTERNS.some(p => msg.includes(p))){
return;
}

originalLog.apply(console,args);

};

/* =========================
SESSION PATH
========================= */

const authDir = path.join(process.cwd(),'session');

/* =========================
MAINUL-X BANNER
========================= */

const bannerAscii = `
 __  __   ___   ___   _   _   _   _   _       __   __
|  \\/  | / _ \\ |_ _| | \\ | | | | | | | |     \\ \\ / /
| |\\/| || | | | | |  |  \\| | | | | | | |      \\ V / 
| |  | || |_| | | |  | |\\  | | |_| | | |___    | |  
|_|  |_| \\___/ |___| |_| \\_|  \\___/  |_____|   |_|  

           MAINUL-X DOWNLOADER BOT
`;

const features = [
' ▷ YouTube Downloader',
' ⓕ Facebook Downloader',
' 🅾 Instagram Downloader',
'【ꚠ】TikTok Downloader'
];

export function showBanner(){

console.clear();

const termWidth = process.stdout.columns || 80;

bannerAscii.split('\n').forEach(line =>{

const padding = Math.max(0, Math.floor((termWidth-line.length)/2));

console.log(' '.repeat(padding)+chalk.cyanBright(line));

});

console.log();

features.forEach(f=>{

const padding = Math.max(0,Math.floor((termWidth-f.length)/2));

console.log(' '.repeat(padding)+chalk.greenBright(f));

});

console.log();

}

/* =========================
START BOT
========================= */

async function startBot(){

showBanner();

if(!fs.existsSync(authDir)){
fs.mkdirSync(authDir,{recursive:true});
}

const { state, saveCreds } = await useMultiFileAuthState(authDir);

const sock = makeWASocket({

auth: state,
logger: pino({ level:'silent' })

});

wrapSendMessageGlobally(sock);

/* =========================
CONNECTION EVENTS
========================= */

sock.ev.on('connection.update', async(update)=>{

const { connection, lastDisconnect } = update;

if(connection === 'open'){

console.log(chalk.greenBright('✅ Connected to WhatsApp'));
console.log(chalk.cyan(`👤 Bot User: ${sock.user?.id || 'Unknown'}`));

}

else if(connection === 'close'){

const reason = lastDisconnect?.error?.output?.statusCode;

const shouldReconnect = reason !== DisconnectReason.loggedOut;

if(shouldReconnect){

console.log(chalk.yellow('🔁 Connection lost, reconnecting...'));

startBot();

}else{

console.log(chalk.red('❌ Session invalid, delete session/ and reconnect'));

}

}

});

sock.ev.on('creds.update', saveCreds);

/* =========================
MESSAGE LISTENER
========================= */

sock.ev.on('messages.upsert', async(m)=>{

const msg = m.messages?.[0];

if(!msg || msg.key.fromMe) return;

try{

await handler(sock,msg);

}catch(err){

console.error(chalk.red('[Handler Error]'),err);

}

});

/* =========================
PAIRING SYSTEM
========================= */

const files = fs.readdirSync(authDir).filter(f=>f.endsWith('.json'));

if(files.length === 0){

let waNumber;

try{

const response = await inquirer.prompt([{

type:'input',
name:'waNumber',
message:chalk.cyanBright('📱 Enter WhatsApp number (without +):'),

validate:(input)=>/^\d{8,}$/.test(input) ? true : 'Invalid number'

}]);

waNumber = response.waNumber;

}catch(err){

if(err.name === 'ExitPromptError') process.exit(0);
else throw err;

}

try{

const code = await sock.requestPairingCode(waNumber);

console.log(chalk.greenBright('\n✅ Pairing Code Generated!'));
console.log(chalk.yellowBright('📌 Code:'), chalk.bold.magenta(code));
console.log(chalk.cyan('Open WhatsApp → Linked Devices → Link Device'));
console.log(chalk.greenBright('\nWaiting for connection...'));

}catch(error){

console.error(chalk.red('❌ Pairing request failed:'),error);

}

}

}

startBot();
