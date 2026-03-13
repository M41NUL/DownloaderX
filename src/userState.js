/**
 * =============================================
 * MAINUL-X User State Manager
 * =============================================
 */

export const userState = new Map()

/* ===============================
GET USER STATE
================================ */

export function getUserState(userId){

if(!userId) return { step:"start" }

let state = userState.get(userId)

if(!state){

state = {
step:"start",
createdAt:Date.now(),
lastActivity:Date.now()
}

userState.set(userId,state)

}else{

state.lastActivity = Date.now()

}

return state

}

/* ===============================
UPDATE STATE
================================ */

export function updateUserState(userId,newState){

if(!userId) return null

const state = userState.get(userId) || {}

const updated = {
...state,
...newState,
lastActivity:Date.now()
}

userState.set(userId,updated)

return updated

}

/* ===============================
CLEAR STATE
================================ */

export function clearUserState(userId){

if(userId){
userState.delete(userId)
}

}

/* ===============================
SESSION CLEANER
================================ */

export function cleanupOldSessions(maxAge=3600000){

const now = Date.now()

for(const [userId,state] of userState){

if(state.lastActivity && now - state.lastActivity > maxAge){

userState.delete(userId)

console.log(`[MAINUL-X] Session removed: ${userId}`)

}

}

}

/* ===============================
UTILS
================================ */

export function getActiveUsersCount(){
return userState.size
}

export function hasUserState(userId){
return userState.has(userId)
}

/* ===============================
AUTO CLEANER
================================ */

const SESSION_CLEAN_INTERVAL = 3600000

setInterval(()=>{

cleanupOldSessions()

},SESSION_CLEAN_INTERVAL)
