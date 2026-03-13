#!/usr/bin/env node
import { default as makeWASocket, useMultiFileAuthState } from "@whiskeysockets/baileys";

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
   CLEAR SCREEN FUNCTION
========================= */

function clearScreen() {
  process.stdout.write('\x1Bc');
}

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
   MAINUL-X BANNER
========================= */

const bannerAscii = `
 __       __                  _______               __     
/  |  _  /  |                /       \\             /  |    
$$ | / \\ $$ |  ______        $$$$$$$  |  ______   _$$ |_   
$$ |/$  \\$$ | /      \\       $$ |__$$ | /      \\ / $$   |  
$$ /$$$  $$ | $$$$$$  |      $$    $$< /$$$$$$  |$$$$$$/   
$$ $$/$$ $$ | /    $$ |      $$$$$$$  |$$ |  $$ |  $$ | __ 
$$$$/  $$$$ |/$$$$$$$ |      $$ |__$$ |$$ \\__$$ |  $$ |/  |
$$$/    $$$ |$$    $$ |      $$    $$/ $$    $$/   $$  $$/ 
$$/      $$/  $$$$$$$/       $$$$$$$/   $$$$$$/     $$$$/  
`;

const features = [
  '▷ YouTube Downloader',
  'ⓕ Facebook Downloader',
  '🅾 Instagram Downloader',
  '★ TikTok Downloader'
];

/* =========================
   SHOW BANNER
========================= */

export function showBanner() {
  clearScreen();

  const termWidth = process.stdout.columns || 80;

  bannerAscii.split('\n').forEach(line => {
    const padding = Math.max(0, Math.floor((termWidth - line.length) / 2));
    console.log(' '.repeat(padding) + chalk.cyanBright(line));
  });

  console.log();

  features.forEach(f => {
    const padding = Math.max(0, Math.floor((termWidth - f.length) / 2));
    console.log(' '.repeat(padding) + chalk.greenBright(f));
  });

  console.log();

  console.log(chalk.gray('Developer: Md. Mainul Islam (MAINUL-X)'));
  console.log(chalk.gray('GitHub: https://github.com/M41NUL\n'));
}

/* =========================
   START BOT
========================= */

async function startBot() {

  showBanner();

  const { state, saveCreds } = await useMultiFileAuthState(authDir);

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
  });

  wrapSendMessageGlobally(sock);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'open') {

      console.log(chalk.greenBright('✅ Connected to WhatsApp successfully!'));
      console.log(chalk.cyan(`👤 User: ${sock.user?.id || 'Unknown'}`));
      console.log(chalk.magenta('⚡ Bot is ready!\n'));

    } else if (connection === 'close') {

      const reason = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = reason !== DisconnectReason.loggedOut;

      if (shouldReconnect) {

        console.log(chalk.yellow('🔄 Connection lost. Reconnecting...\n'));

        setTimeout(() => {
          clearScreen();
          startBot();
        }, 2000);

      } else {

        console.log(chalk.red('❌ Session invalid.'));
        console.log(chalk.red('Delete the session folder and login again.\n'));

      }
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages?.[0];

    if (!msg || msg.key.fromMe) return;

    try {
      await handler(sock, msg);
    } catch (err) {
      console.error(chalk.red('[Handler Error]'), err);
    }
  });

  const files = fs.readdirSync(authDir).filter(f => f.endsWith('.json'));

  if (files.length === 0) {

    let waNumber;

    try {

      const response = await inquirer.prompt([
        {
          type: 'input',
          name: 'waNumber',
          message: chalk.cyanBright('📱 Enter your WhatsApp number (country code, no +):'),
          validate: (input) => /^\d{8,}$/.test(input) ? true : 'Invalid phone number',
        },
      ]);

      waNumber = response.waNumber;

    } catch (err) {

      if (err.name === 'ExitPromptError') process.exit(0);
      else throw err;

    }

    try {

      const code = await sock.requestPairingCode(waNumber);

      console.log(chalk.greenBright('\n✅ Pairing Code Generated!'));
      console.log(chalk.yellowBright('📌 Your Code:'), chalk.bold.magenta(code));
      console.log(chalk.cyan('Open WhatsApp → Linked Devices → Link a Device'));
      console.log(chalk.greenBright('\nWaiting for automatic connection...\n'));

    } catch (error) {

      console.error(chalk.red('❌ Failed to request pairing code:'), error);

    }
  }
}

/* =========================
   START
========================= */

startBot();
