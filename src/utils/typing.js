/**
 * =============================================
 * MAINUL-X Typing Indicator Utility
 * =============================================
 */

export function wrapSendMessageGlobally(sock){

const originalSendMessage = sock.sendMessage.bind(sock)

sock.sendMessage = async (jid,content,options)=>{

try{

/* Skip typing for groups */

if(jid.endsWith("@g.us")){
return originalSendMessage(jid,content,options)
}

/* Subscribe presence */

await sock.presenceSubscribe(jid)

/* Typing */

await sock.sendPresenceUpdate("composing",jid)

/* Dynamic delay */

let delay = 600

if(content?.text){

const length = content.text.length

if(length > 80) delay = 1000
if(length > 200) delay = 1500

}

await new Promise(r=>setTimeout(r,delay))

/* Send message */

const result = await originalSendMessage(jid,content,options)

/* Stop typing */

await sock.sendPresenceUpdate("paused",jid)

return result

}catch(err){

console.log("[Typing Error]",err.message)

/* Fallback */

return originalSendMessage(jid,content,options)

}

}

}

/* Manual typing */

export async function simulateTyping(sock,jid,duration=1000){

try{

if(jid.endsWith("@g.us")) return

await sock.presenceSubscribe(jid)

await sock.sendPresenceUpdate("composing",jid)

await new Promise(r=>setTimeout(r,duration))

await sock.sendPresenceUpdate("paused",jid)

}catch(err){

console.log("[Typing Error]",err.message)

}

}
