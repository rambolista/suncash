import ApiService from '@/services/ApiService'
import { getToken } from '@/services/HttpService'
import { CURRENT_USER_CHANGED_EVENT, getStoredCurrentUser, setStoredCurrentUser } from '@/utils/currentUser'
import { getSystemTheme, toggleAttribute } from '@/utils/layout'
import { createContext, use, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNotificationContext } from '@/context/useNotificationContext'
import { useLocation } from 'react-router'

const ADMIN_DEFAULT_STATE = {
  skin: 'default',
  theme: 'light',
  orientation: 'vertical',
  sidenavSize: 'default',
  sidenavColor: 'dark',
  sidenavStyle: 'default',
  topbarColor: 'light',
  width: 'fluid',
  position: 'fixed',
  dir: 'ltr',
}

const CUSTOMER_DEFAULT_STATE = {
  skin: 'default',
  theme: 'light',
  orientation: 'vertical',
  sidenavSize: 'default',
  sidenavColor: 'dark',
  sidenavStyle: 'default',
  topbarColor: 'light',
  width: 'fluid',
  position: 'fixed',
  dir: 'ltr',
}

const debounce = (fn, delay) => {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      fn(...args)
    }, delay)
  }
}

export const showBackdrop = () => {
  const htmlEl = document.documentElement
  const backdropEl = document.createElement('div')
  backdropEl.id = 'custom-backdrop'
  backdropEl.className = 'offcanvas-backdrop fade show'
  document.body.appendChild(backdropEl)
  document.body.style.overflow = 'hidden'
  htmlEl.classList.add('sidebar-enable')
  if (window.outerWidth > 767) {
    document.body.style.paddingRight = '15px'
  }
  backdropEl.addEventListener('click', () => {
    hideBackdrop()
  })
}

export const hideBackdrop = () => {
  const htmlEl = document.documentElement
  htmlEl.classList.remove('sidebar-enable')
  const backdropEl = document.getElementById('custom-backdrop')
  if (backdropEl) {
    document.body.removeChild(backdropEl)
    document.body.style.overflow = ''
    document.body.style.paddingRight = ''
  }
}

const LayoutContext = createContext(undefined)

export const useLayoutContext = () => {
  const context = use(LayoutContext)
  if (!context) {
    throw new Error('useLayoutContext can only be used within LayoutProvider')
  }
  return context
}

export const LayoutProvider = ({ children }) => {
  const { showNotification } = useNotificationContext()
  const location = useLocation()
  const isCustomerRoute = location.pathname.startsWith('/customer')
  const [adminSettings, setAdminSettings] = useState(ADMIN_DEFAULT_STATE)
  const [customerSettings, setCustomerSettings] = useState(CUSTOMER_DEFAULT_STATE)
  const [initializing, setInitializing] = useState(true)
  const [themePreference, setThemePreference] = useState(() => getStoredCurrentUser()?.theme_preference ?? null)
  const [themePreview, setThemePreview] = useState(null)
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false)
  const [isCustomerCustomizerOpen, setIsCustomerCustomizerOpen] = useState(false)
  const adminPersistedRef = useRef(ADMIN_DEFAULT_STATE)
  const customerPersistedRef = useRef(CUSTOMER_DEFAULT_STATE)
  const adminPendingRef = useRef({})
  const customerPendingRef = useRef({})
  const adminSaveTimerRef = useRef(null)
  const customerSaveTimerRef = useRef(null)

  const updateAdminSettings = useCallback(
    (_newSettings, persist = true) => {
      setAdminSettings((prevSettings) => ({
        ...prevSettings,
        ..._newSettings,
      }))

      if (!persist || !getStoredCurrentUser()?.super_admin) return

      adminPersistedRef.current = {
        ...adminPersistedRef.current,
        ..._newSettings,
      }
      adminPendingRef.current = {
        ...adminPendingRef.current,
        ..._newSettings,
      }

      window.clearTimeout(adminSaveTimerRef.current)
      adminSaveTimerRef.current = window.setTimeout(async () => {
        const pendingSettings = adminPendingRef.current
        adminPendingRef.current = {}

        try {
          await ApiService.updateLayoutSettings(pendingSettings, 'admin')
          showNotification({ title: 'Success', message: 'Layout settings saved.', variant: 'success' })
        } catch (error) {
          console.error('Failed to save admin layout settings.', error)
          showNotification({ title: 'Failed', message: error?.message ?? 'Failed to save layout settings.', variant: 'danger' })
          try {
            const response = await ApiService.getLayoutSettings('admin')
            const serverSettings = { ...ADMIN_DEFAULT_STATE, ...(response?.settings ?? {}) }
            adminPersistedRef.current = serverSettings
            setAdminSettings(serverSettings)
          } catch (reloadError) {
            console.error('Failed to reload admin layout settings.', reloadError)
          }
        }
      }, 300)
    },
    [showNotification]
  )

  const updateCustomerSettings = useCallback(
    (_newSettings, persist = true) => {
      setCustomerSettings((prevSettings) => ({
        ...prevSettings,
        ..._newSettings,
      }))

      if (!persist || !getStoredCurrentUser()?.super_admin) return

      customerPersistedRef.current = {
        ...customerPersistedRef.current,
        ..._newSettings,
      }
      customerPendingRef.current = {
        ...customerPendingRef.current,
        ..._newSettings,
      }

      window.clearTimeout(customerSaveTimerRef.current)
      customerSaveTimerRef.current = window.setTimeout(async () => {
        const pendingSettings = customerPendingRef.current
        customerPendingRef.current = {}

        try {
          await ApiService.updateLayoutSettings(pendingSettings, 'customer')
          showNotification({ title: 'Success', message: 'Customer layout settings saved.', variant: 'success' })
        } catch (error) {
          console.error('Failed to save customer layout settings.', error)
          showNotification({ title: 'Failed', message: error?.message ?? 'Failed to save customer layout settings.', variant: 'danger' })
          try {
            const response = await ApiService.getLayoutSettings('customer')
            const serverSettings = { ...CUSTOMER_DEFAULT_STATE, ...(response?.settings ?? {}) }
            customerPersistedRef.current = serverSettings
            setCustomerSettings(serverSettings)
          } catch (reloadError) {
            console.error('Failed to reload customer layout settings.', reloadError)
          }
        }
      }, 300)
    },
    [showNotification]
  )

  const updateSettings = updateAdminSettings

  const resetAdminSettings = useCallback(() => {
    setAdminSettings(ADMIN_DEFAULT_STATE)
    adminPersistedRef.current = ADMIN_DEFAULT_STATE
    updateAdminSettings(ADMIN_DEFAULT_STATE)
  }, [updateAdminSettings])

  const resetCustomerSettings = useCallback(() => {
    setCustomerSettings(CUSTOMER_DEFAULT_STATE)
    customerPersistedRef.current = CUSTOMER_DEFAULT_STATE
    updateCustomerSettings(CUSTOMER_DEFAULT_STATE)
  }, [updateCustomerSettings])

  const toggleCustomizer = useCallback(() => {
    if (!getStoredCurrentUser()?.super_admin) return
    setIsCustomizerOpen((prevValue) => !prevValue)
  }, [])

  const toggleCustomerCustomizer = useCallback(() => {
    if (!getStoredCurrentUser()?.super_admin) return
    setIsCustomerCustomizerOpen((prevValue) => !prevValue)
  }, [])

  const reset = resetAdminSettings

  useEffect(() => {
    if (!location.pathname.startsWith('/landing')) {
      setThemePreview(null)
    }
  }, [location.pathname])

  const updateThemePreference = useCallback(async (theme) => {
    if (!['light', 'dark', 'system'].includes(theme)) return

    const previousTheme = themePreference
    setThemePreference(theme)

    try {
      const response = await ApiService.updateThemePreference(theme)
      const storedUser = getStoredCurrentUser()
      if (storedUser) {
        setStoredCurrentUser({
          ...storedUser,
          theme_preference: response?.theme_preference ?? theme,
        })
      }
      showNotification({ title: 'Success', message: 'Theme preference saved.', variant: 'success' })
    } catch (error) {
      setThemePreference(previousTheme)
      console.error('Failed to save theme preference.', error)
      showNotification({ title: 'Failed', message: error?.message ?? 'Failed to save theme preference.', variant: 'danger' })
    }
  }, [showNotification, themePreference])

  const updateGlobalTheme = useCallback(async (theme) => {
    if (!['light', 'dark', 'system'].includes(theme) || !getStoredCurrentUser()?.super_admin) return

    const previousSettings = adminSettings
    const previousThemePreference = themePreference
    setAdminSettings((current) => ({ ...current, theme }))
    setThemePreference(theme)

    try {
      const response = await ApiService.updateGlobalTheme(theme)
      const serverSettings = { ...ADMIN_DEFAULT_STATE, ...(response?.settings ?? {}) }
      adminPersistedRef.current = serverSettings
      setAdminSettings(serverSettings)
      setThemePreference(response?.theme_preference ?? theme)

      const storedUser = getStoredCurrentUser()
      if (storedUser) {
        setStoredCurrentUser({
          ...storedUser,
          theme_preference: response?.theme_preference ?? theme,
        })
      }

      showNotification({ title: 'Success', message: 'Global and personal themes synchronized.', variant: 'success' })
    } catch (error) {
      adminPersistedRef.current = previousSettings
      setAdminSettings(previousSettings)
      setThemePreference(previousThemePreference)
      showNotification({ title: 'Failed', message: error?.message ?? 'Failed to synchronize themes.', variant: 'danger' })
    }
  }, [adminSettings, showNotification, themePreference])

  useEffect(() => {
    let active = true

    const loadSettings = async () => {
      const storedThemePreference = getStoredCurrentUser()?.theme_preference ?? null
      setThemePreference(storedThemePreference)

      if (!getToken()) {
        setIsCustomizerOpen(false)
        setIsCustomerCustomizerOpen(false)
      }

      try {
        const [adminResponse, customerResponse] = await Promise.all([
          ApiService.getLayoutSettings('admin').catch(() => null),
          ApiService.getLayoutSettings('customer').catch(() => null),
        ])

        if (!active) return

        const nextAdminSettings = { ...ADMIN_DEFAULT_STATE, ...(adminResponse?.settings ?? {}) }
        const nextCustomerSettings = { ...CUSTOMER_DEFAULT_STATE, ...(customerResponse?.settings ?? {}) }

        adminPersistedRef.current = nextAdminSettings
        customerPersistedRef.current = nextCustomerSettings
        setAdminSettings(nextAdminSettings)
        setCustomerSettings(nextCustomerSettings)
      } catch (error) {
        if (active) {
          console.error('Failed to load layout settings.', error)
          showNotification({ title: 'Failed', message: error?.message ?? 'Failed to load layout settings.', variant: 'danger' })
        }
      } finally {
        if (active) setInitializing(false)
      }
    }

    loadSettings()
    window.addEventListener(CURRENT_USER_CHANGED_EVENT, loadSettings)
    window.addEventListener('focus', loadSettings)

    return () => {
      active = false
      window.clearTimeout(adminSaveTimerRef.current)
      window.clearTimeout(customerSaveTimerRef.current)
      window.removeEventListener(CURRENT_USER_CHANGED_EVENT, loadSettings)
      window.removeEventListener('focus', loadSettings)
    }
  }, [showNotification])

  const activeSettings = isCustomerRoute
    ? {
        ...adminSettings,
        ...customerSettings,
      }
    : adminSettings

  useEffect(() => {
    if (!activeSettings.sidenavSize?.includes('on-hover')) hideBackdrop()
    toggleAttribute('data-layout', activeSettings.orientation === 'horizontal' ? 'topnav' : '')
    toggleAttribute('data-layout-position', activeSettings.position)
    toggleAttribute('data-topbar-color', activeSettings.topbarColor)
    toggleAttribute('data-menu-color', activeSettings.sidenavColor)
    document.documentElement.classList.toggle('sidebar-no-icons', activeSettings.sidenavStyle === 'no-icons-with-lines')
    document.documentElement.classList.toggle('sidebar-with-line', activeSettings.sidenavStyle === 'no-icons-with-lines' || activeSettings.sidenavStyle === 'with-lines')
    toggleAttribute('data-skin', activeSettings.skin)
    toggleAttribute('data-sidenav-size', activeSettings.sidenavSize)
    toggleAttribute('data-layout-width', activeSettings.width)
    toggleAttribute('dir', activeSettings.dir)
  }, [activeSettings])

  const effectiveTheme = isCustomerRoute
    ? (themePreview ?? themePreference ?? activeSettings.theme ?? 'light')
    : (themePreview ?? themePreference ?? activeSettings.theme)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const applyTheme = () => {
      toggleAttribute('data-bs-theme', effectiveTheme === 'system' ? getSystemTheme() : effectiveTheme)
    }

    applyTheme()

    if (effectiveTheme === 'system') {
      mediaQuery.addEventListener('change', applyTheme)
      return () => mediaQuery.removeEventListener('change', applyTheme)
    }
  }, [effectiveTheme])

  useEffect(() => {
    if (!isCustomerRoute) {
      setIsCustomerCustomizerOpen(false)
    }
  }, [isCustomerRoute])

  useEffect(() => {
    const handleResize = () => {
      const width = window.outerWidth
      if (activeSettings.orientation === 'vertical') {
        if (width <= 768) {
          updateSettings({
            sidenavSize: 'offcanvas',
          }, false)
        } else if (width <= 1140 && activeSettings.sidenavSize !== 'offcanvas') {
          updateSettings({
            sidenavSize: 'condensed',
          }, false)
        } else {
          updateSettings({
            sidenavSize: adminPersistedRef.current.sidenavSize,
          }, false)
        }
      } else if (activeSettings.orientation === 'horizontal') {
        if (width < 992) {
          updateSettings({
            sidenavSize: 'offcanvas',
          }, false)
        } else {
          updateSettings({
            sidenavSize: adminPersistedRef.current.sidenavSize,
          }, false)
        }
      }
    }
    const debouncedResize = debounce(handleResize, 200)
    window.addEventListener('resize', debouncedResize)
    return () => {
      window.removeEventListener('resize', debouncedResize)
    }
  }, [activeSettings.orientation, activeSettings.sidenavSize, updateSettings])

  return (
    <LayoutContext
      value={useMemo(
        () => ({
          ...activeSettings,
          settings: activeSettings,
          adminSettings,
          customerSettings,
          theme: effectiveTheme,
          globalTheme: adminSettings.theme,
          customerTheme: customerSettings.theme,
          themePreference,
          themePreview,
          updateSettings,
          updateAdminSettings,
          updateCustomerSettings,
          updateThemePreference,
          setThemePreview,
          updateGlobalTheme,
          reset,
          resetAdminSettings,
          resetCustomerSettings,
          isCustomizerOpen,
          toggleCustomizer,
          isCustomerCustomizerOpen,
          toggleCustomerCustomizer,
        }),
        [
          activeSettings,
          adminSettings,
          customerSettings,
          effectiveTheme,
          themePreference,
          themePreview,
          updateSettings,
          updateAdminSettings,
          updateCustomerSettings,
          updateThemePreference,
          setThemePreview,
          updateGlobalTheme,
          reset,
          resetAdminSettings,
          resetCustomerSettings,
          isCustomizerOpen,
          toggleCustomizer,
          isCustomerCustomizerOpen,
          toggleCustomerCustomizer,
        ]
      )}
    >
      {initializing ? (
        <div className="min-vh-100 d-flex align-items-center justify-content-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading theme...</span>
          </div>
        </div>
      ) : children}
    </LayoutContext>
  )
}
