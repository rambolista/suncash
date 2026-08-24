import ApiService from '@/services/ApiService'
import { clearStoredCurrentUser, setStoredCurrentUser } from '@/utils/currentUser'
import { removeToken, setToken } from '@/services/HttpService'
import { resetCurrentUserCache } from '@/hooks/useCurrentUser'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { clearTwoFactorChallenge, getTwoFactorChallenge, setTwoFactorChallenge } from '@/utils/twoFactorChallenge'

const useCustomerAuth = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const establishSession = (data) => {
    resetCurrentUserCache()
    setToken(data.token)
    setStoredCurrentUser(data.user ?? null)
    navigate('/customer/dashboard', { replace: true })
  }

  const login = async (email, password) => {
    try {
      setLoading(true)
      setError(null)
      const data = await ApiService.customerLogin(email, password)
      if (data.two_factor_required) {
        clearStoredCurrentUser()
        removeToken()
        setTwoFactorChallenge(data)
        navigate('/customer/two-factor', { replace: true })
        return
      }
      establishSession(data)
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
      const data = await ApiService.customerRegister(payload)
      establishSession(data)
    } catch (err) {
      setError(err.message ?? 'Registration failed. Please try again.')
      return err.errors ?? null
    } finally {
      setLoading(false)
    }
  }

  const forgotPassword = async (email) => {
    try {
      setLoading(true)
      setError(null)
      const data = await ApiService.customerForgotPassword(email)
      return data.message
    } catch (err) {
      setError(err.message ?? 'Could not send reset link. Please try again.')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (token, email, password, password_confirmation) => {
    try {
      setLoading(true)
      setError(null)
      const data = await ApiService.customerResetPassword(token, email, password, password_confirmation)
      navigate('/customer/login', { replace: true })
      return data.message
    } catch (err) {
      setError(err.message ?? 'Password reset failed. Please try again.')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const verifyTwoFactor = async (code) => {
    const challenge = getTwoFactorChallenge()
    if (!challenge) {
      setError('Your verification challenge expired. Please sign in again.')
      navigate('/customer/login', { replace: true })
      return false
    }

    try {
      setLoading(true)
      setError(null)
      const data = await ApiService.customerVerifyTwoFactorChallenge(challenge.token, code)
      clearTwoFactorChallenge()
      establishSession(data)
      return true
    } catch (err) {
      setError(err?.errors?.code?.[0] ?? err?.errors?.challenge?.[0] ?? err?.message ?? 'Verification failed.')
      return false
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    clearTwoFactorChallenge()
    resetCurrentUserCache()
    removeToken()
    clearStoredCurrentUser()
    navigate('/customer/login', { replace: true })
  }

  return {
    login,
    register,
    forgotPassword,
    resetPassword,
    logout,
    verifyTwoFactor,
    loading,
    error,
  }
}

export default useCustomerAuth
