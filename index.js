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
 * =============================================
 */

import { default as makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import chalk from 'chalk';
import qrcode from 'qrcode-terminal';
import { fileURLToPath } from 'url';
import { handler } from './src/handler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const authDir = path.join(__dirname, 'session');

const banner = `
${chalk.cyanBright('███╗   ███╗ █████╗ ██╗███╗   ██╗██╗   ██╗██╗     ██╗  ██╗')}
${chalk.cyanBright('████╗ ████║██╔══██╗██║████╗  ██║██║   ██║██║     ██║  ██║')}
${chalk.cyanBright('██╔████╔██║███████║██║██╔██╗ ██║██║   ██║██║     ███████║')}
${chalk.cyanBright('██║╚██╔╝██║██╔══██║██║██║╚██╗██║██║   ██║██║     ██╔══██║')}
${chalk.cyanBright('██║ ╚═╝ ██║██║  ██║██║██║ ╚████║╚██████╔╝███████╗██║  ██║')}
${chalk.cyanBright('╚═╝     ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝')}

${chalk.yellowBright('═══════════════════════════════════════════════════════════')}
${chalk.greenBright('         WhatsApp Media Downloader Bot v2.0')}
${chalk.blueBright('           Created by MAINUL-X 🇧🇩')}
${chalk.yellowBright('═══════════════════════════════════════════════════════════')}
`;

console.log(banner);

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(authDir);

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    browser: ['DownloaderX', 'Chrome', '1.0.0']
  });

  // Handle QR Code
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log(chalk.yellow('\n📱 Scan this QR code with WhatsApp:\n'));
      qrcode.generate(qr, { small: true });
      console.log(chalk.cyan('\nOr use pairing code option...\n'));
    }

    if (connection === 'open') {
      console.log(chalk.greenBright('\n✅ Connected to WhatsApp successfully!'));
      console.log(chalk.cyan(`👤 User: ${sock.user?.id || 'Unknown'}`));
      console.log(chalk.magenta('⚡ Bot is ready! Send any video link to download.\n'));
    } else if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = reason !== DisconnectReason.loggedOut;
      
      if (shouldReconnect) {
        console.log(chalk.yellow('🔄 Connection lost, reconnecting...'));
        startBot();
      } else {
        console.log(chalk.red('❌ Logged out. Please restart the bot.'));
      }
    }
  });

  sock.ev.on('creds.update', saveCreds);

  // Message handler
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg || msg.key.fromMe) return;

    try {
      await handler(sock, msg);
    } catch (err) {
      console.error(chalk.red('[Error]'), err);
    }
  });

  // Handle pairing code if session doesn't exist
  const files = fs.existsSync(authDir) ? fs.readdirSync(authDir).filter(f => f.endsWith('.json')) : [];
  
  if (files.length === 0) {
    try {
      const { number } = await inquirer.prompt([
        {
          type: 'input',
          name: 'number',
          message: chalk.cyan('Enter your WhatsApp number (with country code, no +):'),
          validate: (input) => /^\d{10,}$/.test(input) ? true : 'Invalid number!'
        }
      ]);

      console.log(chalk.yellow('\n⏳ Requesting pairing code...'));
      
      setTimeout(async () => {
        const code = await sock.requestPairingCode(number);
        console.log(chalk.greenBright('\n✅ Your pairing code:'));
        console.log(chalk.bold.magenta(`\n   ${code}\n`));
        console.log(chalk.cyan('Open WhatsApp > Linked Devices > Link a Device'));
      }, 2000);
      
    } catch (err) {
      console.error(chalk.red('Error:'), err);
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log(chalk.yellow('\n\n👋 Shutting down...'));
  process.exit(0);
});

startBot();
