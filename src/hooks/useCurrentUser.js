import { useEffect, useState } from 'react'
import ApiService from '@/services/ApiService'
import { getToken, removeToken } from '@/services/HttpService'
import { CURRENT_USER_CHANGED_EVENT, clearStoredCurrentUser, getStoredCurrentUser, setStoredCurrentUser } from '@/utils/currentUser'

const currentUserCache = {
  promise: null,
  user: null,
  hasRefreshedThisPageLoad: false,
}

export const resetCurrentUserCache = () => {
  currentUserCache.promise = null
  currentUserCache.user = null
  currentUserCache.hasRefreshedThisPageLoad = false
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

/** Always hits the server (deduping concurrent callers via the shared in-flight promise) — never short-circuits on an already-cached user. */
const fetchCurrentUserFromServer = () => {
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

const loadCurrentUser = async () => {
  if (currentUserCache.user) {
    return currentUserCache.user
  }

  return fetchCurrentUserFromServer()
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
    const hasUsableStoredCopy = stored && (stored.menu_permissions || isCustomerUser(stored))
    if (hasUsableStoredCopy) {
      currentUserCache.user = stored
    }

    // A stored copy only proves permissions were correct as of whenever this
    // browser tab first logged in, not that they still are — e.g. a menu or
    // action granted via a later migration wouldn't show up otherwise until
    // an explicit logout. The stored value already painted instantly via
    // useState's initializer above; once per real page load (not per SPA
    // navigation — every route mounts a fresh component that calls this
    // hook, and refetching on every one of those would be excessive) this
    // quietly refetches in the background to pick up any changes.
    //
    // Deliberately no unmount guard here: this effect never calls a local
    // state setter directly (the OTHER effect's CURRENT_USER_CHANGED_EVENT
    // listener does that, and cleans itself up on unmount), it only updates
    // the shared cache/sessionStorage — which stays correct even if the
    // component that happened to kick off the fetch has since unmounted
    // (a real, observed case: the initial route-redirect chain right after
    // a full page load mounts and unmounts several components in quick
    // succession, before the very first fetch has time to resolve). Only
    // flipping the "already refreshed" flag on actual success, rather than
    // before the fetch even starts, means an interrupted attempt doesn't
    // permanently block every later component on the same page load from
    // retrying.
    if (hasUsableStoredCopy && currentUserCache.hasRefreshedThisPageLoad) {
      return
    }

    fetchCurrentUserFromServer()
      .then((user) => {
        currentUserCache.hasRefreshedThisPageLoad = true
        if (!user) {
          return
        }

        setStoredCurrentUser(user)
        currentUserCache.user = user
      })
      .catch((error) => {
        if (error?.status === 401) {
          currentUserCache.hasRefreshedThisPageLoad = true
          removeToken()
          clearStoredCurrentUser()
          currentUserCache.user = null
        } else if (!hasUsableStoredCopy) {
          console.error('Failed to load current user.', error)
        }
      })
  }, [])

  return currentUser
}

export default useCurrentUser
