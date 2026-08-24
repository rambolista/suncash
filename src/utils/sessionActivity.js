const SESSION_LAST_ACTIVITY_KEY = 'session_last_activity'

export const getLastSessionActivity = () => {
  if (typeof window === 'undefined') {
    return null
  }

  const value = Number(sessionStorage.getItem(SESSION_LAST_ACTIVITY_KEY))
  return Number.isFinite(value) && value > 0 ? value : null
}

export const setLastSessionActivity = (timestamp = Date.now()) => {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(SESSION_LAST_ACTIVITY_KEY, String(timestamp))
  }
}

export const clearLastSessionActivity = () => {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(SESSION_LAST_ACTIVITY_KEY)
  }
}
