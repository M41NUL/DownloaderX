#!/usr/bin/env node

/**
 * =============================================
 *        MAINUL-X Downloader Bot Loader
 * =============================================
 * Auto detect environment
 * Termux / Railway / Server
 * =============================================
 */

const isRailway =
process.env.RAILWAY_STATIC_URL ||
process.env.RAILWAY_ENVIRONMENT ||
process.env.RAILWAY_PROJECT_ID

if(isRailway){

console.log("🚀 Running Railway Mode...\n")

import("./index.railway.js")

}else{

console.log("📱 Running Termux Mode...\n")

import("./index.termux.js")

}
