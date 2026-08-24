import favicon from '@/assets/images/favicon.ico'
import logoBlack from '@/assets/images/logo-black.png'
import logoSm from '@/assets/images/logo-sm.png'
import logo from '@/assets/images/logo.png'
import authBackground from '@/assets/images/auth.jpg'
import sidenavImage from '@/assets/images/sidenav-bg.jpg'
import { META_DATA } from '@/config/constants'
import ApiService from '@/services/ApiService'
import { createContext, use, useCallback, useEffect, useMemo, useState } from 'react'

const DEFAULT_SETTINGS = {
  name: META_DATA.name,
  author: META_DATA.author,
  year: new Date().getFullYear(),
  description: META_DATA.description,
  authentication_type: 'basic',
  customer_authentication_type: 'basic',
  landing_page_id: null,
  sidenav_gradient_start: '#1a455f',
  sidenav_gradient_end: '#262549',
  topbar_gradient_start: '#1a455f',
  topbar_gradient_end: '#262549',
  favicon_url: favicon,
  logo_sm_url: logoSm,
  logo_dark_url: logoBlack,
  logo_light_url: logo,
  auth_background_url: authBackground,
  sidenav_image_url: sidenavImage,
}

const ProjectSettingsContext = createContext(undefined)

export const useProjectSettingsContext = () => {
  const context = use(ProjectSettingsContext)
  if (!context) {
    throw new Error('useProjectSettingsContext must be used within ProjectSettingsProvider')
  }
  return context
}

const normalizeSettings = (settings = {}) => ({
  ...DEFAULT_SETTINGS,
  ...settings,
  favicon_url: settings.favicon_url || DEFAULT_SETTINGS.favicon_url,
  logo_sm_url: settings.logo_sm_url || DEFAULT_SETTINGS.logo_sm_url,
  logo_dark_url: settings.logo_dark_url || DEFAULT_SETTINGS.logo_dark_url,
  logo_light_url: settings.logo_light_url || DEFAULT_SETTINGS.logo_light_url,
  auth_background_url: settings.auth_background_url || DEFAULT_SETTINGS.auth_background_url,
  sidenav_image_url: settings.sidenav_image_url || DEFAULT_SETTINGS.sidenav_image_url,
})

export const ProjectSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)

  const applySettings = useCallback((nextSettings) => {
    const normalized = normalizeSettings(nextSettings)
    setSettings(normalized)
    Object.assign(META_DATA, {
      name: normalized.name,
      title: normalized.name,
      author: normalized.author,
      description: normalized.description,
    })
    return normalized
  }, [])

  const refreshSettings = useCallback(async () => {
    setLoading(true)
    try {
      const response = await ApiService.getProjectSettings()
      applySettings(response?.settings)
    } catch (error) {
      console.error('Failed to load project settings.', error)
      applySettings(DEFAULT_SETTINGS)
    } finally {
      setLoading(false)
    }
  }, [applySettings])

  useEffect(() => {
    refreshSettings()
  }, [refreshSettings])

  useEffect(() => {
    if (loading) return

    document.title = settings.name

    let descriptionMeta = document.querySelector('meta[name="description"]')
    if (!descriptionMeta) {
      descriptionMeta = document.createElement('meta')
      descriptionMeta.setAttribute('name', 'description')
      document.head.appendChild(descriptionMeta)
    }
    descriptionMeta.setAttribute('content', settings.description || '')

    let faviconLink = document.querySelector('link[rel="icon"]')
    if (!faviconLink) {
      faviconLink = document.createElement('link')
      faviconLink.setAttribute('rel', 'icon')
      document.head.appendChild(faviconLink)
    }
    faviconLink.setAttribute('href', settings.favicon_url)
    document.documentElement.style.setProperty('--auth-background-image', `url("${settings.auth_background_url}")`)
    document.documentElement.style.setProperty('--project-sidenav-gradient-start', settings.sidenav_gradient_start)
    document.documentElement.style.setProperty('--project-sidenav-gradient-end', settings.sidenav_gradient_end)
    document.documentElement.style.setProperty('--project-topbar-gradient-start', settings.topbar_gradient_start)
    document.documentElement.style.setProperty('--project-topbar-gradient-end', settings.topbar_gradient_end)
    document.documentElement.style.setProperty('--project-sidenav-image', `url("${settings.sidenav_image_url}")`)
  }, [settings, loading])

  return (
    <ProjectSettingsContext
      value={useMemo(
        () => ({ settings, loading, applySettings, refreshSettings }),
        [settings, loading, applySettings, refreshSettings]
      )}
    >
      {children}
    </ProjectSettingsContext>
  )
}
