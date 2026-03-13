/**
 * =============================================
 * MAINUL-X URL Validator
 * =============================================
 */

const URL_PATTERNS = {

youtube:
/^(https?:\/\/)?(www\.|m\.)?(youtube\.com|youtu\.be)\/(watch\?v=|shorts\/|embed\/)?[a-zA-Z0-9_-]{11}/i,

facebook:
/^(https?:\/\/)?(www\.|m\.)?(facebook\.com|fb\.watch)\/(watch|reel|video|videos|share)\/?.+/i,

instagram:
/^(https?:\/\/)?(www\.)?instagram\.com\/(p|reel|tv|stories)\/[a-zA-Z0-9_-]+/i,

tiktok:
/^(https?:\/\/)?((www|m|vt|vm)\.)?tiktok\.com\/.+/i

}

/* ============================================= */

export function validateUrl(url,platform){

if(typeof url !== "string") return false

if(!URL_PATTERNS[platform]) return false

let clean = url.trim()

if(!clean.startsWith("http")){
clean = "https://" + clean
}

return URL_PATTERNS[platform].test(clean)

}

/* ============================================= */

export function detectPlatform(url){

if(typeof url !== "string") return null

let clean = url.trim()

if(!clean.startsWith("http")){
clean = "https://" + clean
}

/* Priority detection */

if(URL_PATTERNS.youtube.test(clean)) return "youtube"

if(URL_PATTERNS.tiktok.test(clean)) return "tiktok"

if(URL_PATTERNS.instagram.test(clean)) return "instagram"

if(URL_PATTERNS.facebook.test(clean)) return "facebook"

return null

}

/* ============================================= */

export function getSupportedPlatforms(){

return Object.keys(URL_PATTERNS)

}

/* ============================================= */

export function extractVideoId(url,platform){

if(!validateUrl(url,platform)) return null

let clean = url.trim()

if(!clean.startsWith("http")){
clean = "https://" + clean
}

switch(platform){

case "youtube":

const yt = clean.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})/)
return yt ? yt[1] : null

case "instagram":

const ig = clean.match(/\/(p|reel|tv)\/([a-zA-Z0-9_-]+)/)
return ig ? ig[2] : null

default:

return null

}

}
