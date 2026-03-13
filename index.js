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

// Memory Leak Fix: Listener limit bariye deya
process.setMaxListeners(0);

const authDir = path.join(process.cwd(), 'session');
if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });

function clearScreen() { process.stdout.write('\x1Bc'); }

// LOG FILTER SYSTEM
const originalStdoutWrite = process.stdout.write;
const FILTER_PATTERNS = ['Bad MAC', 'Failed to decrypt', 'Closing session', 'registrationId', 'messageKeys'];

process.stdout.write = function(chunk, encoding, callback) {
    const str = chunk?.toString() || '';
    if (FILTER_PATTERNS.some(p => str.includes(p))) {
        if (typeof callback === 'function') callback();
        return true;
    }
    return originalStdoutWrite.call(this, chunk, encoding, callback);
};

export function showBanner() {
    clearScreen();
    const termWidth = process.stdout.columns || 80;
    const bannerText = figlet.textSync('MAINUL-X', { font: 'Slant' });
    bannerText.split('\n').forEach(line => {
        console.log(' '.repeat(Math.max(0, Math.floor((termWidth - line.length) / 2))) + chalk.cyanBright(line));
    });
    console.log(chalk.greenBright('\n▷ YouTube Downloader | ⓕ Facebook | 🅾 Instagram | ★ TikTok\n'.padStart(termWidth/2 + 25)));
    console.log(chalk.gray(`Developer: Md. Mainul Islam (MAINUL-X)`.padStart(termWidth/2 + 18)));
}

async function startBot() {
    showBanner();
    const { state, saveCreds } = await useMultiFileAuthState(authDir);

    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        mobile: false, // Node v24 e mobile true thakle jhamela kore
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 30000,
    });

    wrapSendMessageGlobally(sock);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'open') {
            console.log(chalk.greenBright('\n✅ Connected to WhatsApp successfully!'));
            console.log(chalk.magenta('⚡ MAINUL-X Bot is active!\n'));
        } else if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.data?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

            if (shouldReconnect) {
                // Warning fixed: Purano listeners remove kore notun bot start kora
                console.log(chalk.yellow(`\n🔄 Connection lost (Code: ${statusCode}). Reconnecting...`));
                sock.ev.removeAllListeners(); 
                setTimeout(() => startBot(), 5000); 
            } else {
                console.log(chalk.red('\n❌ Session invalid. Delete "session" folder and pair again.'));
                process.exit(0);
            }
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages?.[0];
        if (!msg || msg.key.fromMe) return;
        try { await handler(sock, msg); } catch (err) { console.error(chalk.red('[Handler Error]'), err); }
    });

    // Auto Pairing Code Logic Fix
    if (!sock.authState.creds.registered) {
        console.log(chalk.white('--- LOGIN SYSTEM ---'));
        const { waNumber } = await inquirer.prompt([
            {
                type: 'input',
                name: 'waNumber',
                message: chalk.cyanBright('📱 Enter WhatsApp number (Ex: 88017...):'),
                validate: (input) => /^\d{10,}$/.test(input) ? true : 'Invalid format',
            },
        ]);

        try {
            // Wait for stable socket before requesting code
            await new Promise(resolve => setTimeout(resolve, 6000)); 
            const code = await sock.requestPairingCode(waNumber.replace(/[^0-9]/g, ''));
            const formattedCode = code?.match(/.{1,4}/g)?.join('-') || code;
            
            console.log(chalk.greenBright('\n✅ Pairing Code:'), chalk.bgBlue.white.bold(` ${formattedCode} `));
            console.log(chalk.cyan('Link via WhatsApp -> Linked Devices -> Link with Phone Number\n'));
        } catch (error) {
            console.error(chalk.red('❌ Pairing Failed:'), error.message);
            if(error.message.includes('405')) {
                console.log(chalk.yellow('💡 Solution: rm -rf session && npm start'));
                process.exit(0);
            }
        }
    }
}

startBot();
