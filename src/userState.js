/**
 * =============================================
 *      MAINUL-X WhatsApp Media Downloader
 * =============================================
 * Author: Md. Mainul Islam (MAINUL-X)
 * GitHub: https://github.com/M41NUL
 * Telegram: @mdmainulislaminfo
 * Email: githubmainul@gmail.com
 * =============================================
 * User State Management
 * Description: Stores user session states for the bot
 * =============================================
 */

/**
 * User state management using Map
 * Stores temporary data for each user during their session
 * @type {Map<string, Object>}
 * 
 * Structure:
 * - Key: User's WhatsApp ID (remoteJid)
 * - Value: Object containing user state data
 *   Example: { step: 'yt_wait_url', lastActivity: timestamp }
 */
export const userState = new Map();

/**
 * Helper function to get user state with default values
 * @param {string} userId - User's WhatsApp ID
 * @returns {Object} User state object
 */
export function getUserState(userId) {
  if (!userId) return { step: 'start' };
  
  const state = userState.get(userId);
  if (!state) {
    // Initialize new user state
    const newState = { 
      step: 'start',
      createdAt: Date.now(),
      lastActivity: Date.now()
    };
    userState.set(userId, newState);
    return newState;
  }
  
  // Update last activity
  state.lastActivity = Date.now();
  userState.set(userId, state);
  
  return state;
}

/**
 * Update user state
 * @param {string} userId - User's WhatsApp ID
 * @param {Object} newState - New state data
 * @returns {Object} Updated state
 */
export function updateUserState(userId, newState) {
  if (!userId) return null;
  
  const currentState = userState.get(userId) || {};
  const updatedState = {
    ...currentState,
    ...newState,
    lastActivity: Date.now()
  };
  
  userState.set(userId, updatedState);
  return updatedState;
}

/**
 * Clear user state (logout/reset)
 * @param {string} userId - User's WhatsApp ID
 */
export function clearUserState(userId) {
  if (userId) {
    userState.delete(userId);
  }
}

/**
 * Clean up old/inactive sessions
 * @param {number} maxAge - Maximum age in milliseconds (default: 1 hour)
 */
export function cleanupOldSessions(maxAge = 3600000) {
  const now = Date.now();
  
  for (const [userId, state] of userState.entries()) {
    if (state.lastActivity && (now - state.lastActivity > maxAge)) {
      userState.delete(userId);
      console.log(`[MAINUL-X] Cleaned up inactive session: ${userId}`);
    }
  }
}

/**
 * Get all active users count
 * @returns {number} Number of active users
 */
export function getActiveUsersCount() {
  return userState.size;
}

/**
 * Check if user exists in state
 * @param {string} userId - User's WhatsApp ID
 * @returns {boolean}
 */
export function hasUserState(userId) {
  return userState.has(userId);
}

// Auto cleanup every hour
setInterval(() => {
  cleanupOldSessions();
}, 3600000); // 1 hour