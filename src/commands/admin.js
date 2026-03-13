export async function handleAdminCommands(
sock,
from,
command,
text,
{
isAdmin,
userState,
subscribers,
messageCache,
downloadStats,
ADMIN_NUMBERS
}
){

if(!isAdmin(from)) return false

/* ===============================
ADMIN PANEL
================================ */

if(command === "!admin"){

const msg =
`👑 *ADMIN PANEL*

!users → Active users
!adminstats → Bot statistics
!broadcast <msg> → Send to all
!clearcache → Clear message cache
!listadmin → Show admins
!restart → Restart bot`

await sock.sendMessage(from,{text:msg})

return true
}

/* ===============================
ACTIVE USERS
================================ */

if(command === "!users"){

await sock.sendMessage(from,{
text:`👥 *ACTIVE USERS*

Total Users : ${userState.size}
Subscribers : ${subscribers.size}
Cache : ${messageCache.size}`
})

return true
}

/* ===============================
ADMIN STATS
================================ */

if(command === "!adminstats"){

const totalDownloads =
[...downloadStats.values()].reduce((acc,curr)=>acc+curr.total,0)

const msg =
`📊 *BOT STATISTICS*

Users : ${userState.size}
Downloads : ${totalDownloads}
Cache : ${messageCache.size}
Subscribers : ${subscribers.size}`

await sock.sendMessage(from,{text:msg})

return true
}

/* ===============================
BROADCAST
================================ */

if(command.startsWith("!broadcast")){

const broadcastMsg = text.replace("!broadcast","").trim()

if(!broadcastMsg){

await sock.sendMessage(from,{
text:"❌ Usage: !broadcast <message>"
})

return true
}

let sent = 0

for(const user of userState.keys()){

try{

await sock.sendMessage(user,{
text:`📢 *BROADCAST*

${broadcastMsg}

- MAINUL-X`
})

sent++

}catch{}

}

await sock.sendMessage(from,{
text:`✅ Broadcast sent to ${sent} users`
})

return true
}

/* ===============================
CLEAR CACHE
================================ */

if(command === "!clearcache"){

messageCache.clear()

await sock.sendMessage(from,{
text:"✅ Message cache cleared"
})

return true
}

/* ===============================
LIST ADMIN
================================ */

if(command === "!listadmin"){

let msg = "👑 *ADMINS*\n\n"

ADMIN_NUMBERS.forEach((admin,i)=>{
msg += `${i+1}. ${admin.split("@")[0]}\n`
})

await sock.sendMessage(from,{text:msg})

return true
}

/* ===============================
RESTART
================================ */

if(command === "!restart"){

await sock.sendMessage(from,{
text:"♻️ Restarting bot..."
})

process.exit()

}

return false
}
