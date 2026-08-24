const CURRENT_USER_KEY = 'current_user'
export const CURRENT_USER_CHANGED_EVENT = 'app-current-user-changed'

const emitCurrentUserChanged = () => {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(new CustomEvent(CURRENT_USER_CHANGED_EVENT))
}

export const getStoredCurrentUser = () => {
  if (typeof window === 'undefined') {
    return null
  }

  const raw = sessionStorage.getItem(CURRENT_USER_KEY)

  if (! raw) {
    return null
  }

  try {
    return JSON.parse(raw)
  } catch (error) {
    console.error('Failed to parse current user from session storage.', error)
    sessionStorage.removeItem(CURRENT_USER_KEY)
    return null
  }
}

export const setStoredCurrentUser = (user) => {
  if (typeof window === 'undefined') {
    return user
  }

  if (! user) {
    clearStoredCurrentUser()
    return null
  }

  sessionStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user))
  emitCurrentUserChanged()
  return user
}

export const clearStoredCurrentUser = () => {
  if (typeof window === 'undefined') {
    return
  }

  sessionStorage.removeItem(CURRENT_USER_KEY)
  emitCurrentUserChanged()
}
