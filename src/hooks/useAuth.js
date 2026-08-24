import ApiService from '@/services/ApiService'
import { getToken, removeToken, setToken } from '@/services/HttpService'
import { buildTree, filterTreeByAccess, findFirstMenuUrl, getAccessibleMenuIds } from '@/hooks/useMenuItems'
import { clearStoredCurrentUser, setStoredCurrentUser } from '@/utils/currentUser'
import { clearScreenLock } from '@/utils/lockScreen'
import { clearTwoFactorChallenge, getTwoFactorChallenge, setTwoFactorChallenge } from '@/utils/twoFactorChallenge'
import { resetCurrentUserCache } from '@/hooks/useCurrentUser'
import { useState } from 'react'
import { useNavigate } from 'react-router'

export const useAuth = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const resolveInitialRedirectPath = async (user) => {
    const accessibleMenuIds = getAccessibleMenuIds(user)
    const menus = await ApiService.getMenus().catch(() => [])
    const flatMenus = Array.isArray(menus) ? menus : []
    const tree = buildTree(flatMenus)
    const visibleTree = filterTreeByAccess(tree, accessibleMenuIds)
    const firstMenuUrl = findFirstMenuUrl(visibleTree)

    return firstMenuUrl || '/error/403'
  }

  const establishSession = async (data) => {
    clearScreenLock()
    resetCurrentUserCache()
    setToken(data.token)
    const nextUser = data.user ?? null
    setStoredCurrentUser(nextUser)

    if (nextUser?.status === 'inactive') {
      clearTwoFactorChallenge()
      navigate('/auth/delete-account', { replace: true })
      return
    }

    const redirectPath = await resolveInitialRedirectPath(nextUser)
    clearTwoFactorChallenge()
    navigate(redirectPath, { replace: true })
  }

  const login = async (email, password) => {
    try {
      setLoading(true)
      setError(null)
      const data = await ApiService.login(email, password)
      if (data.two_factor_required) {
        clearScreenLock()
        removeToken()
        clearStoredCurrentUser()
        setTwoFactorChallenge(data)
        navigate('/auth/two-factor', { replace: true })
        return
      }
      await establishSession(data)
    } catch (err) {
      setError(err?.errors?.email?.[0] ?? err.message ?? 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const register = async (payload) => {
    try {
      setLoading(true)
      setError(null)
      const data = await ApiService.register(payload)
      await establishSession(data)
    } catch (err) {
      setError(err.message ?? 'Registration failed. Please try again.')
      // Return validation errors so the form can display them per-field
      return err.errors ?? null
    } finally {
      setLoading(false)
    }
  }

  const verifyTwoFactor = async (code) => {
    const challenge = getTwoFactorChallenge()
    if (!challenge) {
      setError('Your verification challenge expired. Please sign in again.')
      navigate('/auth/sign-in', { replace: true })
      return false
    }

    try {
      setLoading(true)
      setError(null)
      const data = await ApiService.verifyTwoFactorChallenge(challenge.token, code)
      await establishSession(data)
      return true
    } catch (err) {
      setError(err?.errors?.code?.[0] ?? err?.errors?.challenge?.[0] ?? err?.message ?? 'Verification failed.')
      return false
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await ApiService.logout()
    } catch {
      // Swallow — token may already be invalid; we still clear it locally
    } finally {
      clearScreenLock()
      clearTwoFactorChallenge()
      resetCurrentUserCache()
      removeToken()
      clearStoredCurrentUser()
      navigate('/auth/sign-in', { replace: true })
    }
  }

  const forgotPassword = async (email) => {
    try {
      setLoading(true)
      setError(null)
      const data = await ApiService.forgotPassword(email)
      return data.message
    } catch (err) {
      setError(err.message ?? 'Could not send reset link. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (token, email, password, password_confirmation) => {
    try {
      setLoading(true)
      setError(null)
      const data = await ApiService.resetPassword(token, email, password, password_confirmation)
      navigate('/auth/sign-in', { replace: true })
      return data.message
    } catch (err) {
      setError(err.message ?? 'Password reset failed. Please try again.')
      return err.errors ?? null
    } finally {
      setLoading(false)
    }
  }

  const isAuthenticated = Boolean(getToken())

  return {
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    verifyTwoFactor,
    isAuthenticated,
    loading,
    error,
  }
}
