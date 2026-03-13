#!/usr/bin/env node

process.stdout.write("\x1Bc");

import { default as makeWASocket, useMultiFileAuthState } from "@whiskeysockets/baileys";
import pino from "pino";
import fs from "fs";
import path from "path";
import inquirer from "inquirer";
import chalk from "chalk";
import qrcode from "qrcode-terminal";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const authDir = path.join(__dirname, "session");

if (!fs.existsSync(authDir)) {
  fs.mkdirSync(authDir, { recursive: true });
}

// Banner
console.log(chalk.yellow("╔══════════════════════════════════════════╗"));
console.log(chalk.yellow("║") + chalk.green("   WhatsApp Media Downloader Bot v1.0") + chalk.yellow("   ║"));
console.log(chalk.yellow("║") + chalk.blue("        Created by MAINUL-X 🇧🇩") + chalk.yellow("         ║"));
console.log(chalk.yellow("╚══════════════════════════════════════════╝\n"));

// MENU
async function showMenu() {

  console.log(chalk.cyan("📋 LOGIN METHOD SELECTION"));
  console.log(chalk.cyan("━━━━━━━━━━━━━━━━━━━━━━━━"));
  console.log("  [1] 📱 QR Code");
  console.log("  [2] 🔢 Pairing Code");
  console.log("  [3] ℹ️ Developer Info");
  console.log("  [4] 🚪 Exit");
  console.log(chalk.cyan("━━━━━━━━━━━━━━━━━━━━━━━━\n"));

  const { choice } = await inquirer.prompt([
    {
      type: "input",
      name: "choice",
      message: "Enter your choice (1-4):",
    },
  ]);

  return choice;
}

async function startBot(method) {

  const { state, saveCreds } = await useMultiFileAuthState(authDir);

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    browser: ["Ubuntu", "Chrome", "120"],
  });

  sock.ev.on("connection.update", async (update) => {

    const { connection, qr } = update;

    if (method === "1" && qr) {

      console.log(chalk.yellow("\n📱 Scan this QR code:\n"));
      qrcode.generate(qr, { small: false });

    }

    if (connection === "open") {

      console.log(chalk.green("\n✅ Connected Successfully!\n"));
      console.log(chalk.magenta("⚡ Bot Ready!\n"));

    }

  });

  sock.ev.on("creds.update", saveCreds);

  if (method === "2") {

    const { number } = await inquirer.prompt([
      {
        type: "input",
        name: "number",
        message: "Enter WhatsApp number (country code without +):",
      },
    ]);

    const code = await sock.requestPairingCode(number);

    console.log(chalk.green("\nYour Pairing Code:\n"));
    console.log(chalk.magenta(code));

  }

}

async function main() {

  const choice = await showMenu();

  if (choice === "1" || choice === "2") {

    await startBot(choice);

  }

  else if (choice === "3") {

    console.log(chalk.yellow("\nDeveloper: MAINUL-X"));
    console.log(chalk.cyan("GitHub: https://github.com/M41NUL\n"));

    main();

  }

  else {

    console.log(chalk.yellow("\n👋 Goodbye!\n"));
    process.exit();

  }

}

main();
