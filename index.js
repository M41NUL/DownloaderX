#!/usr/bin/env node
/**
 * =============================================
 *      MAINUL-X WhatsApp Media Downloader
 * =============================================
 * Author: Md. Mainul Islam (MAINUL-X)
 * GitHub: https://github.com/M41NUL
 * Version: 1.0.0
 * =============================================
 */

process.stdout.write("\x1Bc");

// MaxListeners warning fix
import { setMaxListeners } from 'events';
setMaxListeners(50);

import { default as makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import chalk from 'chalk';
import qrcode from 'qrcode-terminal';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const authDir = path.join(__dirname, 'session');

if (!fs.existsSync(authDir)) {
  fs.mkdirSync(authDir, { recursive: true });
}

// Banner
console.log(chalk.yellow('╔══════════════════════════════════════════╗'));
console.log(chalk.yellow('║') + chalk.green('   WhatsApp Media Downloader Bot v1.0') + chalk.yellow('   ║'));
console.log(chalk.yellow('║') + chalk.blue('        Created by MAINUL-X 🇧🇩') + chalk.yellow('         ║'));
console.log(chalk.yellow('╚══════════════════════════════════════════╝\n'));

let sock = null; // Global socket reference

async function startBot() {
  try {
    // Clear previous listeners if socket exists
    if (sock) {
      sock.ev.removeAllListeners();
    }

    const { state, saveCreds } = await useMultiFileAuthState(authDir);

    sock = makeWASocket({
      auth: state,
      logger: pino({ level: 'silent' }),
      printQRInTerminal: false,
      browser: ['Ubuntu', 'Chrome', '120.0.0'],
      syncFullHistory: false,
      markOnlineOnConnect: false
    });

    // Handle connection updates
    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      if (qr) {
        console.log(chalk.yellow('\n📱 Scan this QR code with WhatsApp:\n'));
        qrcode.generate(qr, { small: true });
      }
      
      if (connection === 'open') {
        console.log(chalk.green('\n✅ Connected to WhatsApp successfully!'));
        console.log(chalk.cyan(`👤 User: ${sock.user?.id || 'Unknown'}`));
        console.log(chalk.magenta('⚡ Bot is ready! Send any video link.\n'));
      }
      
      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const reason = lastDisconnect?.error?.message || 'Unknown';
        
        console.log(chalk.red(`\n❌ Disconnected: ${reason} (Code: ${statusCode})`));
        
        if (statusCode === 405) {
          console.log(chalk.yellow('⏳ Waiting 10 seconds before reconnect...\n'));
          setTimeout(() => {
            console.log(chalk.cyan('🔄 Attempting to reconnect...\n'));
            startBot();
          }, 10000);
        } else if (statusCode === 401) {
          console.log(chalk.red('❌ Logged out. Please delete session folder.\n'));
        } else {
          console.log(chalk.yellow('🔄 Reconnecting in 5 seconds...\n'));
          setTimeout(() => {
            startBot();
          }, 5000);
        }
      }
    });

    sock.ev.on('creds.update', saveCreds);

    // Check session and show menu
    const files = fs.existsSync(authDir) ? fs.readdirSync(authDir).filter(f => f.endsWith('.json')) : [];
    
    if (files.length === 0) {
      await showLoginMenu(sock);
    } else {
      console.log(chalk.green('✅ Existing session found. Connecting...\n'));
    }

  } catch (err) {
    console.error(chalk.red('\n❌ Fatal error:'), err.message);
    console.log(chalk.yellow('🔄 Restarting in 5 seconds...\n'));
    setTimeout(() => {
      startBot();
    }, 5000);
  }
}

async function showLoginMenu(sock) {
  console.log(chalk.cyan('\n📋 LOGIN METHOD SELECTION'));
  console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log('  [1] 📱 QR Code');
  console.log('  [2] 🔢 Pairing Code');
  console.log('  [3] ℹ️  Developer Info');
  console.log('  [4] 🚪 Exit');
  console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━\n'));

  const { choice } = await inquirer.prompt([
    {
      type: 'input',
      name: 'choice',
      message: 'Enter your choice (1-4):',
      validate: (input) => {
        const num = parseInt(input);
        return (num >= 1 && num <= 4) ? true : 'Please enter 1-4';
      }
    }
  ]);

  if (choice === '1') {
    console.log(chalk.green('\n✅ QR Code selected. Waiting for QR...\n'));
    // QR will show automatically
  }
  else if (choice === '2') {
    const { number } = await inquirer.prompt([
      {
        type: 'input',
        name: 'number',
        message: 'Enter WhatsApp number (Ex: 88017XXXXXXXX):',
        validate: (input) => {
          const clean = input.replace(/\D/g, '');
          return clean.length >= 10 ? true : 'Invalid number!';
        }
      }
    ]);
    
    const cleanNumber = number.replace(/\D/g, '');
    
    try {
      console.log(chalk.yellow('\n⏳ Requesting pairing code...'));
      const code = await sock.requestPairingCode(cleanNumber);
      console.log(chalk.greenBright('\n✅ Your 8-digit pairing code:'));
      console.log(chalk.bold.magenta(`\n   ${code}\n`));
      console.log(chalk.cyan('Open WhatsApp > Linked Devices > Link a Device'));
      console.log(chalk.cyan('Select "Link with phone number" and enter the code\n'));
    } catch (err) {
      console.log(chalk.red('\n❌ Failed to get pairing code.'));
      console.log(chalk.yellow('Use QR code instead.\n'));
      await showLoginMenu(sock);
    }
  }
  else if (choice === '3') {
    console.log(chalk.cyan('\n━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.yellow('   👑 MAINUL-X'));
    console.log(chalk.green('   WhatsApp Downloader Bot'));
    console.log(chalk.blue('   Version: 1.0.0'));
    console.log(chalk.magenta('   GitHub: @M41NUL'));
    console.log(chalk.cyan('   🇧🇩 From Bangladesh'));
    console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━\n'));
    await showLoginMenu(sock);
  }
  else {
    console.log(chalk.yellow('\n👋 Goodbye!\n'));
    process.exit(0);
  }
}

process.on('SIGINT', () => {
  console.log(chalk.yellow('\n\n👋 Shutting down...\n'));
  if (sock) {
    sock.end();
  }
  process.exit(0);
});

startBot();
