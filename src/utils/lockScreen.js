const LOCKED_KEY = 'screen_locked'
const RETURN_PATH_KEY = 'screen_lock_return_path'

export const isScreenLocked = () => sessionStorage.getItem(LOCKED_KEY) === 'true'

export const lockScreen = (returnPath = '/') => {
  sessionStorage.setItem(LOCKED_KEY, 'true')

  if (!sessionStorage.getItem(RETURN_PATH_KEY)) {
    const safeReturnPath = returnPath.startsWith('/auth/lock-screen') ? '/' : returnPath
    sessionStorage.setItem(RETURN_PATH_KEY, safeReturnPath)
  }
}

export const unlockScreen = () => {
  const returnPath = sessionStorage.getItem(RETURN_PATH_KEY) || '/'
  sessionStorage.removeItem(LOCKED_KEY)
  sessionStorage.removeItem(RETURN_PATH_KEY)
  return returnPath
}

export const clearScreenLock = () => {
  sessionStorage.removeItem(LOCKED_KEY)
  sessionStorage.removeItem(RETURN_PATH_KEY)
}
