import { useEffect, useMemo, useState } from 'react'
import ApiService from '@/services/ApiService'
import { getModulePermission } from '@/utils/modulePermissions'

/**
 * Tabs + tab_layout for a `menu_tabs`-driven page (e.g. Merchant Management,
 * Kiosk Reports). `currentUser.menu_permissions` is a per-session snapshot
 * that's only refetched once per real page load (see useCurrentUser.js), so
 * on its own it can lag behind a Menus-screen edit — an admin who changes a
 * tab's label or tab_layout and navigates back via the SPA (no hard reload)
 * would otherwise keep seeing the old value. This additionally fetches the
 * caller's live accessible-menus list and prefers its tab config/tab_layout
 * whenever it's available, falling back to the cached snapshot until it is.
 */
const useModuleTabs = (currentUser, routePath) => {
  const permission = useMemo(() => getModulePermission(currentUser, routePath), [currentUser, routePath])
  const [configuredMenu, setConfiguredMenu] = useState(undefined)

  useEffect(() => {
    let active = true
    ApiService.getMenus()
      .then((menus) => {
        if (!active || !Array.isArray(menus)) return
        setConfiguredMenu(menus.find((menu) => menu.url === routePath) || null)
      })
      .catch(() => {
        if (active) setConfiguredMenu(null)
      })

    return () => {
      active = false
    }
  }, [routePath])

  const tabs = useMemo(() => {
    const permittedTabs = permission.tabs.filter((tab) => tab.can_view)
    if (!configuredMenu) return permittedTabs

    const permissionsByKey = new Map(permittedTabs.map((tab) => [tab.key, tab]))
    return (configuredMenu.tabs || [])
      .filter((tab) => tab.is_active && permissionsByKey.has(tab.key))
      .map((tab) => ({ ...permissionsByKey.get(tab.key), ...tab }))
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  }, [configuredMenu, permission.tabs])

  const tabLayout = (configuredMenu?.tab_layout || permission.raw?.tab_layout) === 'vertical' ? 'vertical' : 'horizontal'

  return { tabs, tabLayout, permission }
}

export default useModuleTabs
