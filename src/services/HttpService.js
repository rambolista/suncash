/**
 * HttpService — low-level HTTP client
 *
 * Wraps the native Fetch API and adds:
 *   - Automatic Bearer-token injection from sessionStorage
 *   - Unified JSON error normalisation
 *   - Convenience get / post / put / patch / delete helpers
 *
 * NOTE: 401 responses are thrown as { status: 401 } objects.
 * useCurrentUser is the single authoritative place that calls removeToken()
 * on auth expiry — HttpService itself does NOT touch sessionStorage on 401.
 */

import { clearLastSessionActivity, setLastSessionActivity } from '@/utils/sessionActivity'

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/+$/, '')
const TOKEN_KEY = 'token'
const CURRENT_USER_KEY = 'current_user'
// ── Token helpers (exported so ApiService / useAuth can use them) ─────────────
export const getToken = () => sessionStorage.getItem(TOKEN_KEY)
export const setToken = (token) => {
  sessionStorage.setItem(TOKEN_KEY, token)
  setLastSessionActivity()
}
export const removeToken = () => {
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(CURRENT_USER_KEY)
  clearLastSessionActivity()
}

// ── Core class ────────────────────────────────────────────────────────────────
class HttpService {
  #baseURL

  constructor(baseURL = BASE_URL) {
    this.#baseURL = baseURL
  }

  // Build request headers; skip Content-Type when uploading FormData
  #buildHeaders(isFormData = false) {
    const headers = { Accept: 'application/json' }

    if (!isFormData) {
      headers['Content-Type'] = 'application/json'
    }

    const token = getToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    return headers
  }

  /**
   * Core request method.
   * @param {string} method  - HTTP verb
   * @param {string} endpoint - path relative to BASE_URL (e.g. '/auth/login')
   * @param {object|FormData|null} data - request body
   * @param {boolean} isFormData - set true when sending a FormData payload
   * @returns {Promise<any>} parsed JSON response
   * @throws normalised error object { status, message, errors? }
   */
  async request(method, endpoint, data = null, isFormData = false) {
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
    const url = `${this.#baseURL}${normalizedEndpoint}`

    const options = {
      method,
      headers: this.#buildHeaders(isFormData),
    }

    if (data !== null) {
      options.body = isFormData ? data : JSON.stringify(data)
    }

    let response
    try {
      response = await fetch(url, options)
    } catch (networkError) {
      const message = networkError?.message?.includes('Failed to fetch')
        ? 'The API server could not be reached from this browser. Please verify the backend is running and CORS/proxy settings are correct.'
        : 'Network error — could not reach the server.'

      throw {
        status: 0,
        message,
        original: networkError,
      }
    }

    // Sanctum returns 204 (No Content) on logout
    if (response.status === 204) return null

    // Parse JSON (safe — backend always returns JSON for error bodies too)
    let json = null
    try {
      json = await response.json()
    } catch {
      json = { message: response.statusText }
    }

    // 401 — throw so the caller can decide how to handle it.
    // Do NOT call removeToken() here: a background call that happens to return
    // 401 (e.g. a race during navigation) must NOT wipe the user's session.
    // useCurrentUser is the single authoritative place that handles auth expiry.
    if (response.status === 401) {
      throw { status: 401, message: json?.message ?? 'Unauthorized', ...json }
    }

    if (!response.ok) {
      throw { status: response.status, ...json }
    }

    return json
  }

  get(endpoint) {
    return this.request('GET', endpoint)
  }

  post(endpoint, data = null, isFormData = false) {
    return this.request('POST', endpoint, data, isFormData)
  }

  put(endpoint, data = null, isFormData = false) {
    return this.request('PUT', endpoint, data, isFormData)
  }

  patch(endpoint, data = null) {
    return this.request('PATCH', endpoint, data)
  }

  delete(endpoint, data = null) {
    return this.request('DELETE', endpoint, data)
  }
}

export default new HttpService()
