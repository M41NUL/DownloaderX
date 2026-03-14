/**
 * File: src/utils/validateUrl.js
 * MAINUL-X Downloader Bot
 * Author: Md. Mainul Islam (MAINUL-X)
 * GitHub: https://github.com/M41NUL
 */

export function validateUrl(url, platform){

if(typeof url !== "string") return false

const patterns = {
youtube:/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/i,
facebook:/^(https?:\/\/)?(www\.)?facebook\.com\/.+$/i,
instagram:/^(https?:\/\/)?(www\.)?instagram\.com\/(p|reel|tv)\/.+$/i,
tiktok:/^(https?:\/\/)?((www|m|vt|t)\.)?tiktok\.com\/.+$/i
}

if(!patterns[platform]) return false

return patterns[platform].test(url.trim())

}

export function detectPlatform(url){

if(typeof url !== "string") return null

const patterns = {
youtube:/youtube\.com|youtu\.be/i,
facebook:/facebook\.com|fb\.watch/i,
instagram:/instagram\.com/i,
tiktok:/tiktok\.com|vt\.tiktok\.com/i
}

for(const [platform,pattern] of Object.entries(patterns)){
if(pattern.test(url)) return platform
}

return null

}
