/**
 * =============================================
 *      MAINUL-X WhatsApp Media Downloader
 * =============================================
 * Author: Md. Mainul Islam (MAINUL-X)
 * GitHub: https://github.com/M41NUL
 * Telegram: @mdmainulislaminfo
 * Email: githubmainul@gmail.com
 * =============================================
 * Utility: URL Validation for Different Platforms
 * Description: Validates URLs for YouTube, Facebook, Instagram, TikTok
 * =============================================
 */

/**
 * URL validation patterns for different platforms
 */
const URL_PATTERNS = {
  /**
   * YouTube URL patterns:
   * - youtube.com/watch?v=xxxx
   * - youtu.be/xxxx
   * - youtube.com/shorts/xxxx
   * - youtube.com/embed/xxxx
   */
  youtube: /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/(watch\?v=|shorts\/|embed\/)?[a-zA-Z0-9_-]{11}(&.*)?$/,

  /**
   * Facebook URL patterns:
   * - facebook.com/watch?v=xxxx
   * - facebook.com/username/videos/xxxx
   * - fb.watch/xxxx
   * - facebook.com/reel/xxxx
   */
  facebook: /^(https?:\/\/)?(www\.|m\.)?(facebook\.com|fb\.watch)\/(watch\?v=|reel\/|[a-zA-Z0-9._-]+\/videos\/|[a-zA-Z0-9._-]+\?v=)?[a-zA-Z0-9._-]+/,

  /**
   * Instagram URL patterns:
   * - instagram.com/p/xxxx
   * - instagram.com/reel/xxxx
   * - instagram.com/tv/xxxx
   * - instagram.com/stories/username/xxxx
   */
  instagram: /^(https?:\/\/)?(www\.)?instagram\.com\/(p|reel|tv|stories)\/[a-zA-Z0-9_-]+(\/)?(\?.*)?$/,

  /**
   * TikTok URL patterns:
   * - tiktok.com/@username/video/xxxx
   * - tiktok.com/v/xxxx
   * - m.tiktok.com/v/xxxx
   * - vt.tiktok.com/xxxx
   * - tiktok.com/t/xxxx
   */
  tiktok: /^(https?:\/\/)?((www|m|vt|t)\.)?tiktok\.com\/(@[a-zA-Z0-9_.]+\/video\/|[a-zA-Z0-9]+\/)?[a-zA-Z0-9_-]+(\/)?(\?.*)?$/
};

/**
 * Validates a URL for a specific platform
 * @param {string} url - The URL to validate
 * @param {string} platform - Platform name (youtube, facebook, instagram, tiktok)
 * @returns {boolean} - True if URL is valid for the platform
 */
export function validateUrl(url, platform) {
  // Check if URL is a string
  if (typeof url !== "string") {
    return false;
  }

  // Check if platform exists
  if (!URL_PATTERNS[platform]) {
    console.warn(`[MAINUL-X] Unknown platform: ${platform}`);
    return false;
  }

  // Trim whitespace and test
  const trimmedUrl = url.trim();
  const isValid = URL_PATTERNS[platform].test(trimmedUrl);

  if (!isValid) {
    console.log(`[MAINUL-X] Invalid ${platform} URL: ${trimmedUrl.substring(0, 50)}...`);
  }

  return isValid;
}

/**
 * Auto-detect platform from URL
 * @param {string} url - The URL to check
 * @returns {string|null} - Platform name or null if not recognized
 */
export function detectPlatform(url) {
  if (typeof url !== "string") return null;
  
  const trimmedUrl = url.trim();
  
  for (const [platform, pattern] of Object.entries(URL_PATTERNS)) {
    if (pattern.test(trimmedUrl)) {
      return platform;
    }
  }
  
  return null;
}

/**
 * Get all supported platforms
 * @returns {string[]} - Array of platform names
 */
export function getSupportedPlatforms() {
  return Object.keys(URL_PATTERNS);
}