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

async function startBot() {

  const { state, saveCreds } = await useMultiFileAuthState(authDir);

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    browser: ['Ubuntu', 'Chrome', '120.0.0'],
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 0,
    keepAliveIntervalMs: 10000
  });

  // CONNECTION HANDLER
  sock.ev.on('connection.update', async (update) => {

    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log(chalk.yellow('\n📱 Scan this QR code with WhatsApp:\n'));
      qrcode.generate(qr, { small: false });
      console.log(chalk.cyan('\n⚡ QR expires in 60 seconds\n'));
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
      } else {
        console.log(chalk.yellow('\n🔄 Connection closed. Reconnecting...\n'));
        startBot();
      }

    }

  });

  sock.ev.on('creds.update', saveCreds);

  // SESSION CHECK
  const files = fs.existsSync(authDir)
    ? fs.readdirSync(authDir).filter(f => f.endsWith('.json'))
    : [];

  if (files.length === 0) {

    setTimeout(async () => {
      await showLoginMenu(sock);
    }, 1500);

  } else {

    console.log(chalk.green('✅ Existing session found. Connecting...\n'));

  }

}

async function showLoginMenu(sock) {

  console.log(chalk.cyan('\n📋 LOGIN METHOD SELECTION'));
  console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log('  [1] 📱 QR Code (Recommended)');
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

  }

  else if (choice === '2') {

    const { number } = await inquirer.prompt([
      {
        type: 'input',
        name: 'number',
        message: 'Enter WhatsApp number (with country code, no +):',
        validate: (input) => /^\d{10,}$/.test(input) ? true : 'Invalid number!'
      }
    ]);

    try {

      console.log(chalk.yellow('\n⏳ Requesting pairing code...\n'));

      await new Promise(resolve => setTimeout(resolve, 2000));

      const code = await sock.requestPairingCode(number);

      console.log(chalk.greenBright('\n✅ Your pairing code:\n'));
      console.log(chalk.bold.magenta(`   ${code}\n`));

      console.log(chalk.cyan('Open WhatsApp > Linked Devices > Link a Device\n'));

    } catch (err) {

      console.log(chalk.red('\n❌ Failed to get pairing code. Use QR code instead.\n'));
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
  process.exit(0);

});

startBot();
