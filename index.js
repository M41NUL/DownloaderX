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

import { setMaxListeners } from 'events';
setMaxListeners(50);

// লাইন ১৪-১৫ এটা দিয়ে replace করুন
import makeWASocket, { useMultiFileAuthState, DisconnectReason } from 'atexovi-baileys';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import chalk from 'chalk';
import qrcode from 'qrcode-terminal';
import { fileURLToPath } from 'url';

// 👇 এই দুইটা import যোগ করুন
import { handler } from './src/handler.js';
import { wrapSendMessageGlobally } from './src/utils/typing.js';

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

let sock = null;
let reconnectTimer = null;

async function startBot() {
  try {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
    }

    const { state, saveCreds } = await useMultiFileAuthState(authDir);

    sock = makeWASocket({
      auth: state,
      logger: pino({ level: 'silent' }),
      printQRInTerminal: false,
      browser: ['MAINUL-X', 'Chrome', '1.0.0'],
      syncFullHistory: false,
      markOnlineOnConnect: false,
      connectTimeoutMs: 60000
    });

    // 👇 typing.js wrapper যোগ করুন
    wrapSendMessageGlobally(sock);

    const files = fs.existsSync(authDir) ? fs.readdirSync(authDir).filter(f => f.endsWith('.json')) : [];
    const hasSession = files.length > 0;

    if (hasSession) {
      console.log(chalk.green('✅ Existing session found. Connecting...\n'));
    }

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      if (qr && !hasSession) {
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
        
        console.log(chalk.red(`\n❌ Disconnected (Code: ${statusCode})`));
        
        if (statusCode === 405) {
          console.log(chalk.yellow('⏳ Waiting 30 seconds before reconnect...\n'));
          reconnectTimer = setTimeout(() => {
            console.log(chalk.cyan('🔄 Attempting to reconnect...\n'));
            startBot();
          }, 30000);
        } else if (statusCode === 401) {
          console.log(chalk.red('❌ Logged out. Delete session folder and restart.\n'));
          fs.rmSync(authDir, { recursive: true, force: true });
        } else {
          console.log(chalk.yellow('🔄 Reconnecting in 10 seconds...\n'));
          reconnectTimer = setTimeout(() => {
            startBot();
          }, 10000);
        }
      }
    });

    sock.ev.on('creds.update', saveCreds);

    // 👇 message handler যোগ করুন
    sock.ev.on('messages.upsert', async (m) => {
      const msg = m.messages?.[0];
      if (!msg || msg.key.fromMe) return;

      try {
        await handler(sock, msg);
      } catch (err) {
        console.error(chalk.red('[Handler Error]'), err);
      }
    });

    if (!hasSession) {
      await showLoginMenu(sock);
    }

  } catch (err) {
    console.error(chalk.red('\n❌ Fatal error:'), err.message);
    reconnectTimer = setTimeout(() => {
      startBot();
    }, 10000);
  }
}

async function showLoginMenu(sock) {
  console.log(chalk.cyan('\n📋 LOGIN METHOD'));
  console.log(chalk.cyan('━━━━━━━━━━━━━━━━'));
  console.log('  [1] 📱 QR Code');
  console.log('  [2] 🔢 Pairing Code');
  console.log('  [3] ℹ️  Info');
  console.log('  [4] 🚪 Exit');
  console.log(chalk.cyan('━━━━━━━━━━━━━━━━\n'));

  const { choice } = await inquirer.prompt([
    {
      type: 'input',
      name: 'choice',
      message: 'Enter choice (1-4):',
      validate: (input) => /^[1-4]$/.test(input)
    }
  ]);

  if (choice === '1') {
    console.log(chalk.green('\n✅ QR Code selected. Waiting...\n'));
  }
  else if (choice === '2') {
    const { number } = await inquirer.prompt([
      {
        type: 'input',
        name: 'number',
        message: 'Enter WhatsApp number (Ex: 88017...):',
        validate: (input) => /^\d{10,}$/.test(input.replace(/\D/g, ''))
      }
    ]);
    
    try {
      console.log(chalk.yellow('\n⏳ Getting pairing code...'));
      const code = await sock.requestPairingCode(number.replace(/\D/g, ''));
      console.log(chalk.greenBright('\n✅ Pairing Code:'), chalk.bold.magenta(code));
    } catch {
      console.log(chalk.red('\n❌ Failed. Use QR code.'));
      await showLoginMenu(sock);
    }
  }
  else if (choice === '3') {
    console.log(chalk.cyan('\n👑 MAINUL-X v1.0 🇧🇩\n'));
    await showLoginMenu(sock);
  }
  else {
    console.log(chalk.yellow('\n👋 Bye!\n'));
    process.exit(0);
  }
}

process.on('SIGINT', () => {
  console.log(chalk.yellow('\n\n👋 Shutting down...\n'));
  if (sock) sock.end();
  if (reconnectTimer) clearTimeout(reconnectTimer);
  process.exit(0);
});

startBot();

