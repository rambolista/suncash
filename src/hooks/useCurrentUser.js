import { useEffect, useState } from 'react'
import ApiService from '@/services/ApiService'
import { getToken, removeToken } from '@/services/HttpService'
import { CURRENT_USER_CHANGED_EVENT, clearStoredCurrentUser, getStoredCurrentUser, setStoredCurrentUser } from '@/utils/currentUser'

const currentUserCache = {
  promise: null,
  user: null,
}

export const resetCurrentUserCache = () => {
  currentUserCache.promise = null
  currentUserCache.user = null
}

const isCustomerUser = (user) => {
  return Boolean(user && user.account_number) && (!Array.isArray(user.roles) || user.roles.length === 0)
}

const normalizeUser = (user) => {
  if (!user) {
    return null
  }

  return {
    ...user,
    roles: Array.isArray(user.roles) ? user.roles : [],
  }
}

const loadCurrentUser = async () => {
  if (currentUserCache.user) {
    return currentUserCache.user
  }

  if (!currentUserCache.promise) {
    currentUserCache.promise = ApiService.getUser()
      .then((response) => {
        const user = normalizeUser(response?.user || response?.data?.user || response?.data)
        currentUserCache.user = user
        currentUserCache.promise = null
        return user
      })
      .catch((error) => {
        currentUserCache.promise = null
        throw error
      })
  }

  return currentUserCache.promise
}

const useCurrentUser = () => {
  const [currentUser, setCurrentUser] = useState(() => normalizeUser(getStoredCurrentUser()))

  useEffect(() => {
    const syncUser = () => {
      const storedUser = normalizeUser(getStoredCurrentUser())
      setCurrentUser(storedUser)
      currentUserCache.user = storedUser
    }

    window.addEventListener(CURRENT_USER_CHANGED_EVENT, syncUser)
    window.addEventListener('storage', syncUser)

    return () => {
      window.removeEventListener(CURRENT_USER_CHANGED_EVENT, syncUser)
      window.removeEventListener('storage', syncUser)
    }
  }, [])

  useEffect(() => {
    if (!getToken()) {
      return
    }

    const stored = normalizeUser(getStoredCurrentUser())
    if (stored && (stored.menu_permissions || isCustomerUser(stored))) {
      currentUserCache.user = stored
      return
    }

    let active = true

    loadCurrentUser()
      .then((user) => {
        if (!active || !user) {
          return
        }

        setStoredCurrentUser(user)
        currentUserCache.user = user
      })
      .catch((error) => {
        if (error?.status === 401) {
          removeToken()
          clearStoredCurrentUser()
          currentUserCache.user = null
        } else {
          console.error('Failed to load current user.', error)
        }
      })

    return () => {
      active = false
    }
  }, [])

  return currentUser
}

export default useCurrentUser
