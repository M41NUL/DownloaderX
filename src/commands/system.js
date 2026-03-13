import os from "os"

export async function handleSystemCommands(sock, from, command, config, startTime){

if(command === "!ping"){

const start = Date.now()

const msg = await sock.sendMessage(from,{text:"🏓 Pinging..."})

const end = Date.now()

await sock.sendMessage(from,{
text:`⚡ Pong\nResponse: ${end-start} ms`,
edit:msg.key
})

return true

}

if(command === "!uptime"){

const uptime = Math.floor((Date.now()-startTime)/1000)

const h = Math.floor(uptime/3600)
const m = Math.floor((uptime%3600)/60)
const s = uptime%60

await sock.sendMessage(from,{
text:`⏱ BOT UPTIME\n\n${h}h ${m}m ${s}s`
})

return true

}

if(command === "!stats"){

const ram = Math.round(process.memoryUsage().rss/1024/1024)

await sock.sendMessage(from,{
text:`📊 BOT STATS

RAM Usage : ${ram} MB
Platform : Node.js
Status : Online`
})

return true

}

if(command === "!system"){

await sock.sendMessage(from,{
text:`⚙ SYSTEM INFO

OS : ${os.platform()}
CPU : ${os.cpus().length} cores
RAM : ${(os.totalmem()/1024/1024/1024).toFixed(2)} GB
Node : ${process.version}`
})

return true

}

if(command === "!alive"){

await sock.sendMessage(from,{
text:`🤖 ${config.BOT_NAME}

Status : Online
System : Running
Connection : Stable`
})

return true

}

if(command === "!runtime"){

const runtime = process.uptime()

const h = Math.floor(runtime/3600)
const m = Math.floor((runtime%3600)/60)
const s = Math.floor(runtime%60)

await sock.sendMessage(from,{
text:`⏱ RUNTIME

${h}h ${m}m ${s}s`
})

return true

}

if(command === "!botinfo"){

await sock.sendMessage(from,{
text:`🤖 BOT INFO

Name : ${config.BOT_NAME}
Version : v${config.VERSION}
Platform : WhatsApp MD
Developer : ${config.OWNER_ALIAS}`
})

return true

}

return false

}
