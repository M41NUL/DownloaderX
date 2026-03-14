/**
 * File: src/utils/progress.js
 * MAINUL-X Downloader Bot
 * Author: Md. Mainul Islam (MAINUL-X)
 * GitHub: https://github.com/M41NUL
 */

export async function startProgress(sock, jid, title){

const msg = await sock.sendMessage(jid,{
text:`⏳ ${title}\n\nProcessing... 0%`
})

let progress = 0

const interval = setInterval(async()=>{

progress += 10

if(progress <= 90){

try{
await sock.sendMessage(jid,{
text:`⏳ ${title}\n\nProcessing... ${progress}%`,
edit:msg.key
})
}catch{}

}

},1500)

return { msg, interval }

}

export async function finishProgress(sock, jid, data){

try{
clearInterval(data.interval)

await sock.sendMessage(jid,{
text:`✅ Processing... 100%`,
edit:data.msg.key
})
}catch{}

}
