import useMenuItems from '@/hooks/useMenuItems'
import { routes } from '@/routes'
import { getToken, removeToken } from '@/services/HttpService'
import { clearStoredCurrentUser, getStoredCurrentUser } from '@/utils/currentUser'
import { getTwoFactorChallenge } from '@/utils/twoFactorChallenge'
import { Navigate, useLocation, useRoutes } from 'react-router'
import { isScreenLocked } from '@/utils/lockScreen'
import useCurrentUser from '@/hooks/useCurrentUser'
import useIdleLogout from '@/hooks/useIdleLogout'
import { useEffect } from 'react'

const PUBLIC_PATHS = new Set(['/error/403', '/error/404', '/error/401', '/error/400', '/error/408', '/error/500', '/error/maintenance', '/landing'])
const PUBLIC_AUTH_PAGES = new Set(['sign-in', 'sign-up', 'reset-pass', 'new-pass', 'success-mail', 'two-factor'])
const PUBLIC_CUSTOMER_AUTH_PATHS = new Set(['/customer/login', '/customer/sign-up', '/customer/register', '/customer/reset-pass', '/customer/forgot-password', '/customer/new-pass', '/customer/success-mail', '/customer/two-factor'])
const CUSTOMER_APP_PATHS = new Set(['/customer', '/customer/dashboard', '/customer/overview', '/customer/view-customer-details', '/customer/my-bills', '/customer/payments', '/customer/my-portal-account', '/customer/enroll-account', '/customer/manage-enrolled-accounts'])
const CUSTOMER_PUBLIC_PATHS = new Set(['/customer/error/404', '/customer/error/menu-unavailable'])

const normalizePath = (path) => {
  if (!path) return '/'
  const trimmed = path.trim()
  if (!trimmed || trimmed === '/') return '/'
  return `/${trimmed.replace(/^\/+/, '').replace(/\/+$/, '')}`
}

/**
 * Check if the stored user's menu_permissions allow viewing a route.
 * This is synchronous so it works immediately after login (before the async
 * hook re-fetch completes).
 */
const canAccessViaStoredPermissions = (pathname) => {
  const storedUser = getStoredCurrentUser()
  if (!storedUser) return false

  const perms = Array.isArray(storedUser.menu_permissions) ? storedUser.menu_permissions : []
  if (perms.length === 0) return false

  return perms.some((perm) => {
    if (!perm.can_view) return false
    const permUrl = perm.url ? normalizePath(perm.url) : null
    const permSlug = perm.slug ? normalizePath(perm.slug) : null
    return (permUrl && (permUrl === pathname || pathname.startsWith(`${permUrl}/`)))
      || (permSlug && (permSlug === pathname || pathname.startsWith(`${permSlug}/`)))
  })
}

const getStoredDefaultPath = (user) => {
  const perms = Array.isArray(user?.menu_permissions) ? user.menu_permissions : []

  for (const perm of perms) {
    if (!perm?.can_view) continue
    const candidate = perm.url ? normalizePath(perm.url) : normalizePath(perm.slug)
    if (candidate) return candidate
  }

  return null
}

const App = () => {
  const element = useRoutes(routes)
  const location = useLocation()
  const { accessibleMenuUrls, loading } = useMenuItems()
  const currentUser = useCurrentUser()

  const pathname = normalizePath(location.pathname)
  const hasToken = Boolean(getToken())
  const storedUser = getStoredCurrentUser()
  const authPage = pathname.startsWith('/auth/') ? pathname.split('/').pop() : null
  const isCustomerPath = pathname.startsWith('/customer')
  const hasCustomerTwoFactorChallenge = Boolean(getTwoFactorChallenge())
  const userStatus = currentUser?.status ?? storedUser?.status
  const activeUser = currentUser ?? storedUser
  const isCustomerUser = Boolean(activeUser?.account_number) && (!Array.isArray(activeUser?.roles) || activeUser.roles.length === 0)
  useIdleLogout(hasToken)

  useEffect(() => {
    if (userStatus !== 'suspended') return
    removeToken()
    clearStoredCurrentUser()
  }, [userStatus])

  if (isCustomerUser) {
    if (pathname === '/error/404') {
      return <Navigate to="/customer/error/404" replace />
    }

    if (PUBLIC_PATHS.has(pathname)) {
      return element
    }

    if (isCustomerPath) {
      if (CUSTOMER_PUBLIC_PATHS.has(pathname)) {
        return element
      }

      if (pathname === '/customer/two-factor') {
        return element
      }

      if (PUBLIC_CUSTOMER_AUTH_PATHS.has(pathname)) {
        if (!hasToken) {
          return element
        }

        return <Navigate to="/customer/dashboard" replace />
      }

      if (!hasToken) {
        return <Navigate to="/customer/login" replace />
      }

      if (loading) return null

      if (pathname === '/customer') {
        return element
      }

      if (CUSTOMER_APP_PATHS.has(pathname)) {
        return accessibleMenuUrls.includes(pathname) ? element : <Navigate to="/customer/error/menu-unavailable" replace />
      }

      return <Navigate to="/customer/error/404" replace />
    }

    if (!hasToken) {
      return <Navigate to="/customer/login" replace />
    }

    return <Navigate to="/customer/dashboard" replace />
  }

  if (isCustomerPath) {
    if (CUSTOMER_PUBLIC_PATHS.has(pathname)) {
      return element
    }

    if (pathname === '/customer/two-factor' && hasCustomerTwoFactorChallenge) {
      return element
    }

    if (PUBLIC_CUSTOMER_AUTH_PATHS.has(pathname)) {
      return element
    }

    return <Navigate to="/customer/login" replace />
  }

  if (userStatus === 'suspended') {
    return <Navigate to="/auth/sign-in" replace />
  }

  if (hasToken && userStatus === 'inactive') {
    return authPage === 'delete-account' ? element : <Navigate to="/auth/delete-account" replace />
  }

  if (hasToken && authPage === 'delete-account') {
    return <Navigate to="/" replace />
  }

  if (pathname === '/') {
    const defaultPath = accessibleMenuUrls[0] ?? getStoredDefaultPath(storedUser)

    if (!defaultPath && loading) return null

    return <Navigate to={defaultPath ?? '/error/403'} replace />
  }

  if (hasToken && isScreenLocked() && !['lock-screen', 'login-pin'].includes(authPage)) {
    return <Navigate to="/auth/lock-screen" replace />
  }

  if (['lock-screen', 'login-pin', 'delete-account'].includes(authPage) && !hasToken) {
    return <Navigate to="/auth/sign-in" replace />
  }

  if (PUBLIC_PATHS.has(pathname) || PUBLIC_AUTH_PAGES.has(authPage) || ['lock-screen', 'login-pin'].includes(authPage)) {
    return element
  }

  // Must have a token for everything else
  if (!hasToken) {
    return <Navigate to="/auth/sign-in" replace />
  }

  if (pathname === '/project-setup') {
    if (!currentUser) return null
    return currentUser.super_admin ? element : <Navigate to="/error/403" replace />
  }

  // Protected route access check:
  // 1. While the hook is (re-)fetching after login, show nothing to avoid a
  //    premature 403 flash.
  // 2. Once the hook has data, prefer it (authoritative server-side list).
  // 3. As an immediate fallback (right after login, before hook re-fetch
  //    completes), use the stored user's menu_permissions so navigate() never
  //    shows a false 403.
  const hookHasData = accessibleMenuUrls.length > 0
  if (!hookHasData && loading) return null

  const hasAccess = accessibleMenuUrls.some((url) => pathname === url || pathname.startsWith(`${url}/`))
    || canAccessViaStoredPermissions(pathname)
  return hasAccess ? element : <Navigate to="/error/403" replace />
}

export default App
