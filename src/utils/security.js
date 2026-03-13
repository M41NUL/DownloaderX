const reactions = ["⚡","🔥","🤖","🚀","✨","❤️"]

const menuCooldown = new Map()
const spamTracker = new Map()

/* ===============================
AUTO REACTION
=============================== */

export async function autoReact(sock,msg){

try{

const r = reactions[Math.floor(Math.random()*reactions.length)]

await sock.sendMessage(msg.key.remoteJid,{
react:{text:r,key:msg.key}
})

}catch{}

}

/* ===============================
MENU COOLDOWN
=============================== */

export function checkMenuCooldown(user){

const now = Date.now()
const last = menuCooldown.get(user) || 0

if(now - last < 10000){
return false
}

menuCooldown.set(user,now)

return true
}

/* ===============================
ANTI SPAM
=============================== */

export function antiSpam(user){

const now = Date.now()

let data = spamTracker.get(user) || {count:0,time:0}

if(now - data.time > 10000){
data.count = 0
}

data.count++
data.time = now

spamTracker.set(user,data)

if(data.count > 8){
return false
}

return true
}

/* ===============================
DOWNLOAD RETRY SYSTEM
=============================== */

export async function downloadWithRetry(fn,retries=3,delay=2000){

let attempt = 0

while(attempt < retries){

try{

return await fn()

}catch(err){

attempt++

if(attempt >= retries){
throw err
}

await new Promise(res=>setTimeout(res,delay))

}

}

}

/* ===============================
SMART DOWNLOAD QUEUE
=============================== */

const downloadQueue = []
let isDownloading = false

export async function queueDownload(task){

return new Promise((resolve,reject)=>{

downloadQueue.push({task,resolve,reject})

processQueue()

})

}

async function processQueue(){

if(isDownloading) return
if(downloadQueue.length === 0) return

isDownloading = true

const item = downloadQueue.shift()

try{

const result = await item.task()

item.resolve(result)

}catch(err){

item.reject(err)

}

isDownloading = false

processQueue()

}
