import fs from "fs"
import path from "path"

const dpPath = path.join(process.cwd(),"src/assets/botwppic.png")

export async function setBotProfile(sock){

try{

/* NAME */

await sock.updateProfileName("MAINUL-X BOT")

/* BIO */

await sock.updateProfileStatus(
`⚡ Smart Media Downloader
🎬 YouTube • Facebook • Instagram • TikTok
🤖 Powered by MAINUL-X`
)

/* PROFILE PHOTO */

if(fs.existsSync(dpPath)){

await sock.updateProfilePicture(
sock.user.id,
{ url: dpPath }
)

}

}catch(err){

console.log("Profile setup error:",err.message)

}

}
