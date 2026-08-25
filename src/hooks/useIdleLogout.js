import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router'
import ApiService from '@/services/ApiService'
import { clearStoredCurrentUser } from '@/utils/currentUser'
import { clearScreenLock } from '@/utils/lockScreen'
import { getLastSessionActivity, setLastSessionActivity } from '@/utils/sessionActivity'
import { clearTwoFactorChallenge } from '@/utils/twoFactorChallenge'
import { removeToken } from '@/services/HttpService'

const IDLE_TIMEOUT_MS = 30 * 60 * 1000
const ACTIVITY_UPDATE_INTERVAL_MS = 1000

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click']

const useIdleLogout = (enabled) => {
  const navigate = useNavigate()
  const location = useLocation()
  const timerRef = useRef(null)
  const lastActivityUpdateRef = useRef(0)
  const loggingOutRef = useRef(false)

  useEffect(() => {
    if (!enabled) {
      return
    }

    loggingOutRef.current = false

    const clearTimer = () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }

    const logout = async () => {
      if (loggingOutRef.current) {
        return
      }

      loggingOutRef.current = true
      clearTimer()

      try {
        await ApiService.logout()
      } catch {
        // The token may already be expired or unreachable; local cleanup must still run.
      } finally {
        clearScreenLock()
        clearTwoFactorChallenge()
        removeToken()
        clearStoredCurrentUser()

        if (location.pathname.startsWith('/customer')) {
          navigate('/auth/sign-in', { replace: true })
        } else {
          navigate('/auth/sign-in', { replace: true })
        }
      }
    }

    const scheduleTimeout = () => {
      clearTimer()
      const lastActivity = getLastSessionActivity()

      if (!lastActivity) {
        const now = Date.now()
        setLastSessionActivity(now)
        lastActivityUpdateRef.current = now
        timerRef.current = window.setTimeout(() => void logout(), IDLE_TIMEOUT_MS)
        return
      }

      const remainingTime = IDLE_TIMEOUT_MS - (Date.now() - lastActivity)
      if (remainingTime <= 0) {
        void logout()
        return
      }

      lastActivityUpdateRef.current = lastActivity
      timerRef.current = window.setTimeout(() => void logout(), remainingTime)
    }

    const handleActivity = () => {
      if (loggingOutRef.current) {
        return
      }

      const now = Date.now()
      if (now - lastActivityUpdateRef.current < ACTIVITY_UPDATE_INTERVAL_MS) {
        return
      }

      lastActivityUpdateRef.current = now
      setLastSessionActivity(now)
      scheduleTimeout()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        scheduleTimeout()
      }
    }

    ACTIVITY_EVENTS.forEach((eventName) => window.addEventListener(eventName, handleActivity, { passive: true }))
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', scheduleTimeout)
    scheduleTimeout()

    return () => {
      clearTimer()
      ACTIVITY_EVENTS.forEach((eventName) => window.removeEventListener(eventName, handleActivity))
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', scheduleTimeout)
    }
  }, [enabled, location.pathname, navigate])
}

export default useIdleLogout
