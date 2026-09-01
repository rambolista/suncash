import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router'
import ApiService from '@/services/ApiService'
import { useAuth } from '@/hooks/useAuth'

/**
 * Fires a "visited" entry into Administration > User Activity whenever the
 * authenticated user navigates to a new page. The backend matches the path
 * against the menus table and silently no-ops for paths that aren't a
 * registered menu item (e.g. a detail sub-page), so this is safe to call
 * on every route.
 *
 * The page this hook first mounts on (e.g. the dashboard you land on right
 * after login, or whatever page a refresh reopens) is where the user was
 * placed, not something they navigated to, so it's deliberately never
 * logged — only actual navigation away from it starts logging. Comparing
 * against a captured "initial path" (rather than a simple "have we run
 * yet" flag) keeps this correct even under React StrictMode's dev-only
 * double-invoke of effects, which would otherwise log that landing page
 * twice.
 */
const useLogPageVisit = () => {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  const initialPathRef = useRef(location.pathname)
  const hasNavigatedRef = useRef(false)

  useEffect(() => {
    if (!isAuthenticated) return

    if (!hasNavigatedRef.current) {
      if (location.pathname === initialPathRef.current) return
      hasNavigatedRef.current = true
    }

    ApiService.logPageVisit(location.pathname).catch(() => {})
  }, [isAuthenticated, location.pathname])
}

export default useLogPageVisit
