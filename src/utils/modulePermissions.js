import { MENU_ACTIONS } from './menuPermissions'

const normalizeRoute = (value) => {
  if (value == null) {
    return ''
  }

  const trimmed = String(value).trim()
  if (!trimmed) {
    return ''
  }

  return `/${trimmed.replace(/^\/+|\/+$/g, '')}`
}

const findPermissionEntry = (currentUser, routePath) => {
  const normalizedRoute = normalizeRoute(routePath)
  const permissions = Array.isArray(currentUser?.menu_permissions) ? currentUser.menu_permissions : []

  if (!permissions.length || !normalizedRoute) {
    return null
  }

  const lastSegment = normalizeRoute(normalizedRoute.split('/').filter(Boolean).pop() || '')

  // Collect ALL entries that match (multiple rows can share the same URL).
  // Merge them with OR logic so any role granting a flag is honoured.
  const matches = permissions.filter((entry) => {
    const entryUrl = normalizeRoute(entry?.url)
    const entrySlug = normalizeRoute(entry?.slug)

    return entryUrl === normalizedRoute || entrySlug === normalizedRoute || entrySlug === lastSegment || entryUrl === lastSegment
  })

  if (matches.length === 0) return null
  if (matches.length === 1) return matches[0]

  return matches.reduce((merged, entry) => {
    const next = { ...merged, ...entry }
    MENU_ACTIONS.forEach(({ key }) => {
      next[key] = Boolean(merged[key]) || Boolean(entry[key])
    })
    next.tabs = [...(merged.tabs || []), ...(entry.tabs || [])]
      .reduce((tabs, tab) => {
        const existing = tabs.find((item) => item.tab_id === tab.tab_id || item.key === tab.key)
        if (existing) {
          MENU_ACTIONS.forEach(({ key }) => {
            existing[key] = Boolean(existing[key]) || Boolean(tab[key])
          })
        } else {
          tabs.push({ ...tab })
        }
        return tabs
      }, [])
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))

    return next
  })
}

export const getModulePermission = (currentUser, routePath) => {
  const permission = findPermissionEntry(currentUser, routePath)

  return {
    ...MENU_ACTIONS.reduce((result, { key }) => ({
      ...result,
      [key]: Boolean(permission?.[key]),
    }), {}),
    tabs: Array.isArray(permission?.tabs) ? permission.tabs : [],
    raw: permission ?? null,
  }
}

export const canAccessModule = (currentUser, routePath, action = 'can_view') => {
  const modulePermission = getModulePermission(currentUser, routePath)
  return Boolean(modulePermission[action])
}
