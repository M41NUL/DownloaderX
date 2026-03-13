#!/usr/bin/env node
import { default as makeWASocket, useMultiFileAuthState, DisconnectReason } from "@whiskeysockets/baileys";
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import chalk from 'chalk';
import process from 'process';
import dotenv from 'dotenv';
import figlet from 'figlet';
import { handler } from './src/handler.js';
import { wrapSendMessageGlobally } from './src/utils/typing.js';

dotenv.config({ debug: false });

/* =========================
   CLEAR SCREEN FUNCTION
========================= */

function clearScreen() {
  process.stdout.write('\x1Bc');
}

/* =========================
   LOG FILTER SYSTEM (Clean Output)
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

process.stdout.write = function(chunk, encoding, callback) {
  const str = chunk?.toString() || '';
  const shouldFilter = FILTER_PATTERNS.some(pattern => str.includes(pattern));

  if (shouldFilter) {
    if (str.includes('Closing open session')) {
      const cleanMsg = chalk.blue('🔒 Signal Encryption Updated\n');
      return originalStdoutWrite.call(this, Buffer.from(cleanMsg), encoding, callback);
    }
    if (typeof callback === 'function') callback();
    return true;
  }
  return originalStdoutWrite.call(this, chunk, encoding, callback);
};

console.error = function(...args) {
  const msg = args.join(' ');
  if (FILTER_PATTERNS.some(pattern => msg.includes(pattern))) {
    if (msg.includes('Bad MAC')) {
      console.log(chalk.yellow('🔄 Signal Protocol: Securing connection...'));
    }
    return;
  }
  originalError.apply(console, args);
};

console.log = function(...args) {
  const msg = args.join(' ');
  if (FILTER_PATTERNS.some(pattern => msg.includes(pattern))) {
    return;
  }
  originalLog.apply(console, args);
};

/* =========================
   SESSION DIRECTORY
========================= */

const authDir = path.join(process.cwd(), 'session');

if (!fs.existsSync(authDir)) {
  fs.mkdirSync(authDir, { recursive: true });
}

/* =========================
   DYNAMIC MAINUL-X BANNER
========================= */

const features = [
  '▷ YouTube Downloader',
  'ⓕ Facebook Downloader',
  '🅾 Instagram Downloader',
  '★ TikTok Downloader',
  '⚙ MAINUL-X Core System'
];

export function showBanner() {
  clearScreen();

  const termWidth = process.stdout.columns || 80;
  
  // Generating Banner with Figlet
  const bannerText = figlet.textSync('MAINUL-X', {
      font: 'Slant', // You can try 'Standard', 'Ghost', or 'Block'
      horizontalLayout: 'default',
      verticalLayout: 'default'
  });

  // Centering the Figlet Banner
  bannerText.split('\n').forEach(line => {
    const padding = Math.max(0, Math.floor((termWidth - line.length) / 2));
    console.log(' '.repeat(padding) + chalk.cyanBright(line));
  });

  console.log('\n');

  // Centering Features
  features.forEach(f => {
    const padding = Math.max(0, Math.floor((termWidth - f.length) / 2));
    console.log(' '.repeat(padding) + chalk.greenBright(f));
  });

  console.log('\n');

  // Developer Info
  const devInfo = 'Developer: Md. Mainul Islam (MAINUL-X)';
  const githubInfo = 'GitHub: https://github.com/M41NUL';
  
  console.log(' '.repeat(Math.max(0, Math.floor((termWidth - devInfo.length) / 2))) + chalk.gray(devInfo));
  console.log(' '.repeat(Math.max(0, Math.floor((termWidth - githubInfo.length) / 2))) + chalk.gray(githubInfo) + '\n');
}

/* =========================
   START BOT
========================= */

async function startBot() {

  showBanner();

  const { state, saveCreds } = await useMultiFileAuthState(authDir);

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }), // Set to 'error' if you want to see internal baileys errors
    printQRInTerminal: false, // Jehetu pairing code use korchen
  });

  wrapSendMessageGlobally(sock);

  // Connection Updates
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'open') {
      console.log(chalk.greenBright('✅ Connected to WhatsApp successfully!'));
      console.log(chalk.cyan(`👤 User ID: ${sock.user?.id.split(':')[0] || 'Unknown'}`));
      console.log(chalk.magenta('⚡ MAINUL-X Bot is active and ready!\n'));

    } else if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.data?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      if (shouldReconnect) {
        console.log(chalk.yellow(`🔄 Connection lost (Code: ${statusCode}). Reconnecting in 3 seconds...\n`));
        setTimeout(() => {
          clearScreen();
          startBot();
        }, 3000);
      } else {
        console.log(chalk.red('❌ Session logged out or invalid.'));
        console.log(chalk.red('⚠️ Please delete the "session" folder and pair again.\n'));
        process.exit(0);
      }
    }
  });

  // Save Credentials
  sock.ev.on('creds.update', saveCreds);

  // Handle Messages
  sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages?.[0];

    // Ignore bot's own messages
    if (!msg || msg.key.fromMe) return;

    try {
      await handler(sock, msg);
    } catch (err) {
      console.error(chalk.red('[Handler Error]'), err);
    }
  });

  // Auto Pairing Code Logic
  const files = fs.readdirSync(authDir).filter(f => f.endsWith('.json'));

  if (files.length === 0) {
    let waNumber;
    try {
      const response = await inquirer.prompt([
        {
          type: 'input',
          name: 'waNumber',
          message: chalk.cyanBright('📱 Enter your WhatsApp number (with country code, NO +):'),
          validate: (input) => /^\d{8,}$/.test(input) ? true : 'Invalid phone number format',
        },
      ]);
      waNumber = response.waNumber;
    } catch (err) {
      if (err.name === 'ExitPromptError') process.exit(0);
      else throw err;
    }

    try {
  await new Promise(resolve => setTimeout(resolve, 3000)); 

  if (!sock.authState.creds.registered) {
    const code = await sock.requestPairingCode(waNumber);
    const formattedCode = code?.match(/.{1,4}/g)?.join('-') || code;
    
    console.log(chalk.greenBright('\n✅ Pairing Code Generated!'));
    console.log(chalk.yellowBright('📌 Your Code: '), chalk.bgBlue.white.bold(` ${formattedCode} `));
    console.log(chalk.cyan('Open WhatsApp → Linked Devices → Link a Device → Link with Phone Number'));
    console.log(chalk.gray('\nWaiting for automatic connection...\n'));
  }
} catch (error) {
  console.error(chalk.red('❌ Connection Error:'), error);
}

  }
}

/* =========================
   EXECUTE
========================= */

startBot();

