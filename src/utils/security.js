/**
 * File: src/utils/security.js
 * MAINUL-X Downloader Bot
 * Author: Md. Mainul Islam (MAINUL-X)
 * GitHub: https://github.com/M41NUL
 */

const spamTracker = new Map()

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

const downloadQueue = []
let downloading = false

export async function queueDownload(task){

return new Promise((resolve,reject)=>{

downloadQueue.push({task,resolve,reject})

processQueue()

})

}

async function processQueue(){

if(downloading) return

const item = downloadQueue.shift()

if(!item) return

downloading = true

try{

const result = await item.task()

item.resolve(result)

}catch(err){

item.reject(err)

}

downloading = false

processQueue()

}
