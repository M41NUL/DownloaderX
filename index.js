#!/usr/bin/env node
/**
 * =============================================
 *      MAINUL-X WhatsApp Media Downloader v1
 * =============================================
 * Author: Md. Mainul Islam (MAINUL-X)
 * GitHub: https://github.com/M41NUL
 * Version: 1.0.0
 * =============================================
 */

// Clear screen first
process.stdout.write("\x1Bc");

import { default as makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import chalk from 'chalk';
import qrcode from 'qrcode-terminal';
import { fileURLToPath } from 'url';
import figlet from 'figlet';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const authDir = path.join(__dirname, 'session');

// Ensure session folder exists
if (!fs.existsSync(authDir)) {
  fs.mkdirSync(authDir, { recursive: true });
}

// Figlet Banner
console.log(
  chalk.cyan(
    figlet.textSync('MAINUL-X', {
      font: 'ANSI Shadow',
      horizontalLayout: 'default',
      verticalLayout: 'default',
      width: 80
    })
  )
);

console.log(chalk.yellow('╔══════════════════════════════════════════════════════════╗'));
console.log(chalk.yellow('║') + chalk.green('         WhatsApp Media Downloader Bot v1.0') + chalk.yellow('          ║'));
console.log(chalk.yellow('║') + chalk.blue('              Created by MAINUL-X 🇧🇩') + chalk.yellow('                 ║'));
console.log(chalk.yellow('╚══════════════════════════════════════════════════════════╝\n'));

async function startBot() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState(authDir);

    const sock = makeWASocket({
      auth: state,
      logger: pino({ level: 'silent' }),
      printQRInTerminal: false,
      browser: ['Ubuntu', 'Chrome', '120.0.0']
    });

    // Check if session exists
    const files = fs.existsSync(authDir) ? fs.readdirSync(authDir).filter(f => f.endsWith('.json')) : [];
    
    // If no session, show login menu
    if (files.length === 0) {
      await showLoginMenu(sock);
    }

    // Connection update handler
    sock.ev.on('connection.update', async (update) => {
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
        const reason = lastDisconnect?.error?.output?.statusCode;
        if (reason === DisconnectReason.loggedOut) {
          console.log(chalk.red('\n❌ Logged out. Delete session folder and restart.\n'));
          process.exit(1);
        }
      }
    });

    sock.ev.on('creds.update', saveCreds);

  } catch (err) {
    console.error(chalk.red('\n❌ Fatal error:'), err);
    process.exit(1);
  }
}

async function showLoginMenu(sock) {
  console.log(chalk.cyan('\n╔════════════════════════════════════╗'));
  console.log(chalk.cyan('║       LOGIN METHOD SELECTION      ║'));
  console.log(chalk.cyan('╠════════════════════════════════════╣'));
  console.log(chalk.cyan('║') + '  [1] 📱 QR Code (Recommended)    ' + chalk.cyan('║'));
  console.log(chalk.cyan('║') + '  [2] 🔢 Pairing Code             ' + chalk.cyan('║'));
  console.log(chalk.cyan('║') + '  [3] ℹ️  Developer Info          ' + chalk.cyan('║'));
  console.log(chalk.cyan('║') + '  [4] 🚪 Exit                     ' + chalk.cyan('║'));
  console.log(chalk.cyan('╚════════════════════════════════════╝\n'));

  const { choice } = await inquirer.prompt([
    {
      type: 'input',
      name: 'choice',
      message: chalk.yellow('Enter your choice (1-4):'),
      validate: (input) => {
        const num = parseInt(input);
        if (num >= 1 && num <= 4) return true;
        return 'Please enter a number between 1 and 4';
      }
    }
  ]);

  const selected = parseInt(choice);

  if (selected === 1) {
    console.log(chalk.green('\n✅ QR Code selected. Waiting for QR...\n'));
    // QR code will show automatically from connection.update
  }
  else if (selected === 2) {
    const { number } = await inquirer.prompt([
      {
        type: 'input',
        name: 'number',
        message: chalk.cyan('Enter your WhatsApp number (with country code, no +):'),
        validate: (input) => /^\d{10,}$/.test(input) ? true : 'Invalid number!'
      }
    ]);

    console.log(chalk.yellow('\n⏳ Requesting pairing code...'));
    
    try {
      const code = await sock.requestPairingCode(number);
      console.log(chalk.greenBright('\n✅ Your pairing code:'));
      console.log(chalk.bold.magenta(`\n   ${code}\n`));
      console.log(chalk.cyan('Open WhatsApp > Linked Devices > Link a Device'));
    } catch (err) {
      console.log(chalk.red('\n❌ Failed to get pairing code. Please use QR code.\n'));
      await showLoginMenu(sock);
    }
  }
  else if (selected === 3) {
    console.log(chalk.cyan('\n╔════════════════════════════════════╗'));
    console.log(chalk.cyan('║                                    ║'));
    console.log(chalk.cyan('║') + '     👑 *MAINUL-X*                ' + chalk.cyan('║'));
    console.log(chalk.cyan('║') + '     WhatsApp Media Downloader    ' + chalk.cyan('║'));
    console.log(chalk.cyan('║') + '     Version: 1.0.0               ' + chalk.cyan('║'));
    console.log(chalk.cyan('║') + '     GitHub: @M41NUL              ' + chalk.cyan('║'));
    console.log(chalk.cyan('║') + '     🇧🇩 From Bangladesh           ' + chalk.cyan('║'));
    console.log(chalk.cyan('║                                    ║'));
    console.log(chalk.cyan('╚════════════════════════════════════╝\n'));
    
    await showLoginMenu(sock);
  }
  else if (selected === 4) {
    console.log(chalk.yellow('\n👋 Goodbye!\n'));
    process.exit(0);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n\n👋 Shutting down...\n'));
  process.exit(0);
});

startBot();
