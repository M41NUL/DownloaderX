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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const authDir = path.join(__dirname, 'session');

// Beautiful Banner
const banner = `
${chalk.cyan('╔══════════════════════════════════════════════════════════╗')}
${chalk.cyan('║')}          ${chalk.yellow('███╗   ███╗ █████╗ ██╗███╗   ██╗██╗   ██╗██╗')}          ${chalk.cyan('║')}
${chalk.cyan('║')}          ${chalk.yellow('████╗ ████║██╔══██╗██║████╗  ██║██║   ██║██║')}          ${chalk.cyan('║')}
${chalk.cyan('║')}          ${chalk.yellow('██╔████╔██║███████║██║██╔██╗ ██║██║   ██║██║')}          ${chalk.cyan('║')}
${chalk.cyan('║')}          ${chalk.yellow('██║╚██╔╝██║██╔══██║██║██║╚██╗██║██║   ██║██║')}          ${chalk.cyan('║')}
${chalk.cyan('║')}          ${chalk.yellow('██║ ╚═╝ ██║██║  ██║██║██║ ╚████║╚██████╔╝███████╗')}      ${chalk.cyan('║')}
${chalk.cyan('║')}          ${chalk.yellow('╚═╝     ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚══════╝')}      ${chalk.cyan('║')}
${chalk.cyan('╠══════════════════════════════════════════════════════════╣')}
${chalk.cyan('║')}        ${chalk.green('WhatsApp Media Downloader Bot v1.0')}          ${chalk.cyan('║')}
${chalk.cyan('║')}              ${chalk.blue('Created by MAINUL-X 🇧🇩')}                    ${chalk.cyan('║')}
${chalk.cyan('╚══════════════════════════════════════════════════════════╝')}
`;

console.log(banner);

// Reconnect counter
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 3;

async function startBot() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState(authDir);

    const sock = makeWASocket({
      auth: state,
      logger: pino({ level: 'silent' }),
      printQRInTerminal: false,
      browser: ['DownloaderX', 'Chrome', '2.0.0']
    });

    // Connection update handler
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log(chalk.yellow('\n📱 Scan this QR code with WhatsApp:\n'));
        qrcode.generate(qr, { small: true });
        console.log(chalk.cyan('\n⚡ Or use pairing code option...\n'));
      }

      if (connection === 'open') {
        reconnectAttempts = 0;
        console.log(chalk.green('\n✅ Connected to WhatsApp successfully!'));
        console.log(chalk.cyan(`👤 User: ${sock.user?.id || 'Unknown'}`));
        console.log(chalk.magenta('⚡ Bot is ready! Send any video link.\n'));
      }

      if (connection === 'close') {
        const reason = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = reason !== DisconnectReason.loggedOut;
        
        if (shouldReconnect && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts++;
          console.log(chalk.yellow(`\n🔄 Reconnecting... Attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}\n`));
          setTimeout(startBot, 3000);
        } else if (reason === DisconnectReason.loggedOut) {
          console.log(chalk.red('\n❌ Logged out. Delete session folder and restart.\n'));
        } else {
          console.log(chalk.red('\n❌ Max reconnection attempts reached. Please restart.\n'));
        }
      }
    });

    sock.ev.on('creds.update', saveCreds);

    // Handle pairing code if no session
    const files = fs.existsSync(authDir) ? fs.readdirSync(authDir).filter(f => f.endsWith('.json')) : [];
    
    if (files.length === 0) {
      const { method } = await inquirer.prompt([
        {
          type: 'list',
          name: 'method',
          message: chalk.cyan('Choose login method:'),
          choices: [
            { name: '📱 QR Code (Recommended)', value: 'qr' },
            { name: '🔢 Pairing Code', value: 'pair' }
          ]
        }
      ]);

      if (method === 'pair') {
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
          try {
            const code = await sock.requestPairingCode(number);
            console.log(chalk.greenBright('\n✅ Your pairing code:'));
            console.log(chalk.bold.magenta(`\n   ${code}\n`));
            console.log(chalk.cyan('Open WhatsApp > Linked Devices > Link a Device'));
          } catch (err) {
            console.log(chalk.red('\n❌ Failed to get pairing code. Please use QR code.\n'));
          }
        }, 2000);
      }
    }

  } catch (err) {
    console.error(chalk.red('\n❌ Fatal error:'), err);
    console.log(chalk.yellow('\n🔄 Restarting...\n'));
    setTimeout(startBot, 5000);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n\n👋 Shutting down...\n'));
  process.exit(0);
});

startBot();
