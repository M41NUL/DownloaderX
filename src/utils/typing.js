/**
 * File: src/utils/typing.js
 * MAINUL-X Downloader Bot
 * Author: Md. Mainul Islam (MAINUL-X)
 * GitHub: https://github.com/M41NUL
 */

export function wrapSendMessageGlobally(sock){

const originalSendMessage = sock.sendMessage.bind(sock)

sock.sendMessage = async (jid, content, options)=>{

try{

await sock.presenceSubscribe(jid)
await sock.sendPresenceUpdate("composing", jid)

await new Promise(r => setTimeout(r,800))

const result = await originalSendMessage(jid, content, options)

await sock.sendPresenceUpdate("paused", jid)

return result

}catch(err){

console.log("Typing Error:",err)

return originalSendMessage(jid, content, options)

}

}

}
