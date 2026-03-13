#!/usr/bin/env node

const isRailway =
process.env.RAILWAY_ENVIRONMENT ||
process.env.RAILWAY_PROJECT_ID

console.log(isRailway ? "🚀 Railway Mode\n" : "📱 Termux Mode\n")

import(isRailway ? "./index.railway.js" : "./index.termux.js")
