/**
 * =============================================
 *      MAINUL-X WhatsApp Media Downloader
 * =============================================
 * Author: Md. Mainul Islam (MAINUL-X)
 * GitHub: https://github.com/M41NUL
 * Telegram: @mdmainulislaminfo
 * Email: githubmainul@gmail.com
 * =============================================
 * Utility: Typing Indicator Wrapper
 * Description: Simulates typing effect for better user experience
 * =============================================
 */

/**
 * Wraps the sendMessage function to add typing indicator
 * @param {Object} sock - WhatsApp socket connection
 */
export function wrapSendMessageGlobally(sock) {
  const originalSendMessage = sock.sendMessage.bind(sock);

  /**
   * Enhanced sendMessage with typing simulation
   * @param {String} jid - Chat ID
   * @param {Object} content - Message content
   * @param {Object} options - Additional options
   * @returns {Promise} - Original sendMessage result
   */
  sock.sendMessage = async (jid, content, options) => {
    try {
      // Subscribe to presence updates
      await sock.presenceSubscribe(jid);
      
      // Show typing indicator
      await sock.sendPresenceUpdate('composing', jid);
      
      // Simulate typing delay (800ms for natural feel)
      await new Promise(resolve => setTimeout(resolve, 800));

      // Send the actual message
      const result = await originalSendMessage(jid, content, options);

      // Hide typing indicator
      await sock.sendPresenceUpdate('paused', jid);

      return result;
    } catch (err) {
      console.error('[MAINUL-X] Typing Error:', err);
      
      // Fallback to original sendMessage if typing fails
      return originalSendMessage(jid, content, options);
    }
  };
}

/**
 * Optional: Function to simulate typing for a specific duration
 * @param {Object} sock - WhatsApp socket connection
 * @param {String} jid - Chat ID
 * @param {Number} duration - Typing duration in ms
 */
export async function simulateTyping(sock, jid, duration = 1000) {
  try {
    await sock.presenceSubscribe(jid);
    await sock.sendPresenceUpdate('composing', jid);
    await new Promise(resolve => setTimeout(resolve, duration));
    await sock.sendPresenceUpdate('paused', jid);
  } catch (err) {
    console.error('[MAINUL-X] Simulate Typing Error:', err);
  }
}
