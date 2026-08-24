const CHALLENGE_KEY = 'two_factor_login_challenge'

export const getTwoFactorChallenge = () => {
  const value = sessionStorage.getItem(CHALLENGE_KEY)
  if (!value) return null

  try {
    const challenge = JSON.parse(value)
    if (!challenge?.token || !challenge?.expires_at || Date.now() >= challenge.expires_at) {
      sessionStorage.removeItem(CHALLENGE_KEY)
      return null
    }
    return challenge
  } catch {
    sessionStorage.removeItem(CHALLENGE_KEY)
    return null
  }
}

export const setTwoFactorChallenge = ({ challenge, method, expires_in, user_status }) => {
  sessionStorage.setItem(CHALLENGE_KEY, JSON.stringify({
    token: challenge,
    method,
    user_status,
    expires_at: Date.now() + (expires_in * 1000),
  }))
}

export const clearTwoFactorChallenge = () => {
  sessionStorage.removeItem(CHALLENGE_KEY)
}
