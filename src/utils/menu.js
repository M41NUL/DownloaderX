/**
 * File: src/utils/menu.js
 * MAINUL-X Downloader Bot
 * Author: Md. Mainul Islam (MAINUL-X)
 */

import fs from "fs"
import path from "path"

const menuImagePath = path.join(process.cwd(), "src/assets/menu.jpg")

export async function sendDownloaderMenu(sock, from){

await sock.sendMessage(from,{

image: fs.existsSync(menuImagePath)
? fs.readFileSync(menuImagePath)
: undefined,

caption:`🤖 *MAINUL - X DOWNLOADER BOT*

Choose a platform below`,

footer:"MAINUL-X SYSTEM",

interactiveButtons:[
{
name:"single_select",
buttonParamsJson:JSON.stringify({

title:"📥 Video Downloader",

sections:[
{
title:"Available Platforms",

rows:[
{
title:"📺 YouTube Downloader",
description:"Download videos from YouTube",
id:"yt_downloader"
},
{
title:"📘 Facebook Downloader",
description:"Download videos from Facebook",
id:"fb_downloader"
},
{
title:"📸 Instagram Downloader",
description:"Download reels & videos",
id:"ig_downloader"
},
{
title:"🎵 TikTok Downloader",
description:"Download TikTok (No Watermark)",
id:"tt_downloader"
}
]

}
]

})

}

]

})

}
