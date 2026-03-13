#!/usr/bin/env node
/**
 * =============================================
 *      MAINUL-X WhatsApp Media Downloader
 * =============================================
 * Author: Md. Mainul Islam (MAINUL-X)
 * GitHub: https://github.com/M41NUL
 * Telegram: @mdmainulislaminfo
 * Email: githubmainul@gmail.com
 * Version: 1.0.0
 * License: MIT
 * =============================================
 * This bot allows you to download videos from:
 * YouTube, Facebook, Instagram, and TikTok
 * directly through WhatsApp chat.
 * =============================================
 */

import { makeWASocket, useMultiFileAuthState, DisconnectReason } from 'mainul-x-baileys';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import chalk from 'chalk';
import process from 'process';
import dotenv from 'dotenv';
import { handler } from './src/handler.js';
import { wrapSendMessageGlobally } from './src/utils/typing.js';

dotenv.config();

const originalError = console.error;
const originalLog = console.log;
const originalStdoutWrite = process.stdout.write;

const FILTER_PATTERNS = [
  'Bad MAC', 'Failed to decrypt message', 'Session error',
  'Closing session', 'SessionEntry', '_chains:', 'registrationId:',
  'currentRatchet:', 'indexInfo:', '<Buffer', 'pubKey:',
  'privKey:', 'baseKey:', 'remoteIdentityKey:', 'chainKey:'
];

process.stdout.write = function(chunk, encoding, callback) {
  const str = chunk?.toString() || '';
  if (FILTER_PATTERNS.some(p => str.includes(p))) {
    if (typeof callback === 'function') callback();
    return true;
  }
  return originalStdoutWrite.call(this, chunk, encoding, callback);
};

console.error = function(...args) {
  const msg = args.join(' ');
  if (!FILTER_PATTERNS.some(p => msg.includes(p))) {
    originalError.apply(console, args);
  }
};

console.log = function(...args) {
  const msg = args.join(' ');
  if (!FILTER_PATTERNS.some(p => msg.includes(p))) {
    originalLog.apply(console, args);
  }
};

const authDir = path.join(process.cwd(), 'session');

const bannerAscii = `
███╗   ███╗ █████╗ ██╗███╗   ██╗██╗   ██╗██╗     ██╗  ██╗
████╗ ████║██╔══██╗██║████╗  ██║██║   ██║██║     ██║  ██║
██╔████╔██║███████║██║██╔██╗ ██║██║   ██║██║     ███████║
██║╚██╔╝██║██╔══██║██║██║╚██╗██║██║   ██║██║     ██╔══██║
██║ ╚═╝ ██║██║  ██║██║██║ ╚████║╚██████╔╝███████╗██║  ██║
╚═╝     ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝
`;

const subBanner = `
╔══════════════════════════════════════════════════════════╗
║            WhatsApp Media Downloader Bot                 ║
║                 Created by MAINUL-X                      ║
╚══════════════════════════════════════════════════════════╝
`;

const features = [
  '🎥 YouTube Downloader',
  '📘 Facebook Downloader',
  '📸 Instagram Downloader',
  '🎵 TikTok Downloader',
];

export function showBanner() {
  console.clear();
  console.log(chalk.cyanBright(bannerAscii));
  console.log(chalk.yellowBright(subBanner));
  console.log();
  features.forEach(f => console.log(chalk.greenBright(`   ${f}`)));
  console.log(chalk.gray('─'.repeat(50)));
  console.log(chalk.blueBright('⚡ Version: 1.0.0 | Made with ❤️ in Bangladesh'));
  console.log();
}

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
      console.log(chalk.greenBright('✅ Connected to WhatsApp!'));
      console.log(chalk.cyan(`👤 User: ${sock.user?.id || 'Unknown'}`));
    } else if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = reason !== DisconnectReason.loggedOut;
      if (shouldReconnect) {
        console.log(chalk.yellow('🔄 Reconnecting...'));
        startBot();
      } else {
        console.log(chalk.red('❌ Session expired. Please restart.'));
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
      console.error(chalk.red('[Error]'), err);
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
          message: chalk.cyanBright('Enter WhatsApp number (without +):'),
          validate: (input) => /^\d{8,}$/.test(input) ? true : 'Invalid number',
        },
      ]);
      waNumber = response.waNumber;
    } catch (err) {
      if (err.name === 'ExitPromptError') process.exit(0);
      else throw err;
    }

    try {
      const code = await sock.requestPairingCode(waNumber);
      console.log(chalk.greenBright('\n✅ Pairing Code:'));
      console.log(chalk.yellowBright('📌 Code:'), chalk.bold.magenta(code));
      console.log(chalk.cyan('Open WhatsApp > Linked Devices > Link Device'));
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error);
    }
  }
}

startBot();