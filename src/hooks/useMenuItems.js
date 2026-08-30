import { useEffect, useState } from 'react'
import ApiService from '@/services/ApiService'
import { getToken } from '@/services/HttpService'
import { CURRENT_USER_CHANGED_EVENT, getStoredCurrentUser } from '@/utils/currentUser'
import { MENU_ITEMS_CHANGED_EVENT } from '@/utils/menuItems'
import { useLocation } from 'react-router'

const menuCatalogCache = {
  admin: {
    data: null,
    promise: null,
  },
  customer: {
    data: null,
    promise: null,
  },
}

const invalidateMenuCatalogCache = () => {
  menuCatalogCache.admin.data = null
  menuCatalogCache.admin.promise = null
  menuCatalogCache.customer.data = null
  menuCatalogCache.customer.promise = null
}

const loadMenuCatalog = (isCustomerRoute) => {
  const scope = isCustomerRoute ? 'customer' : 'admin'
  const cache = menuCatalogCache[scope]

  if (cache.data) {
    return Promise.resolve(cache.data)
  }

  if (cache.promise) {
    return cache.promise
  }

  const request = isCustomerRoute
    ? ApiService.getCustomerMenus().catch((error) => {
        throw error
      })
    : ApiService.getMenus().catch((error) => {
        throw error
      })

  cache.promise = request
    .then((items) => {
      cache.data = items
      cache.promise = null
      return items
    })
    .catch((error) => {
      cache.promise = null
      throw error
    })

  return cache.promise
}

/**
 * Rebuild a nested menu tree from a flat list of DB records.
 * Each record has: id, slug, label, url, icon, parent_id,
 *   is_title, is_active, badge_text, badge_class, sort_order.
 *
 * The returned shape mirrors data.js so AppMenu renders unchanged.
 */
const buildTree = (flat) => {
  const map = {}
  flat.forEach((item) => {
    map[item.id] = {
      ...item,
      isTitle: Boolean(item.is_title),
      isDisabled: Boolean(item.is_disabled),
      isSpecial: Boolean(item.is_special),
      badge: item.badge_text ? { text: item.badge_text, className: item.badge_class ?? '' } : undefined,
      children: [],
    }
  })

  const roots = []
  flat.forEach((item) => {
    if (item.parent_id && map[item.parent_id]) {
      map[item.parent_id].children.push(map[item.id])
    } else {
      roots.push(map[item.id])
    }
  })

  // Remove empty children arrays to keep parity with data.js shape
  const clean = (node) => {
    if (node.children.length === 0) delete node.children
    else node.children = node.children.map(clean)
    return node
  }

  return roots.map(clean)
}

const getAccessibleMenuIds = (user) => {
  if (!user) return []

  const ids = user.accessible_menu_ids ?? user.accessibleMenuIds ?? user.accessible_menus ?? user.accessibleMenus

  if (Array.isArray(ids)) {
    return ids.map((id) => String(id))
  }

  return []
}

const normalizeMenuPath = (value) => {
  if (typeof value !== 'string') return null

  const trimmed = value.trim()
  if (!trimmed || trimmed === '#' || trimmed === '/') return null

  return `/${trimmed.replace(/^\/+/, '').replace(/\/+$/, '')}`
}

const getAccessibleMenuUrls = (flatMenus = [], accessibleMenuIds = []) => {
  const allowed = new Set(accessibleMenuIds.map((id) => String(id)))

  return flatMenus
    .filter((menu) => allowed.has(String(menu.id)) && normalizeMenuPath(menu.url))
    .map((menu) => normalizeMenuPath(menu.url))
    .filter(Boolean)
}

const filterTreeByAccess = (nodes = [], accessibleMenuIds = []) => {
  const allowed = new Set(accessibleMenuIds.map((id) => String(id)))

  const visit = (node) => {
    const visibleChildren = (node.children || []).map(visit).filter(Boolean)
    const isVisible = allowed.has(String(node.id)) || visibleChildren.length > 0

    if (!isVisible) {
      return null
    }

    const filteredNode = { ...node }

    if (visibleChildren.length > 0) {
      filteredNode.children = visibleChildren
    } else {
      delete filteredNode.children
    }

    return filteredNode
  }

  return nodes.map(visit).filter(Boolean)
}

const findFirstMenuUrl = (nodes = []) => {
  for (const node of nodes) {
    if (node.url) {
      const normalized = normalizeMenuPath(node.url)
      if (normalized) {
        return normalized
      }
    }

    if (Array.isArray(node.children) && node.children.length > 0) {
      const childUrl = findFirstMenuUrl(node.children)
      if (childUrl) {
        return childUrl
      }
    }
  }

  return null
}

/**
 * Fetches menu items from the API and returns them as a nested tree.
 * Falls back to an empty array while loading or on error.
 *
 * Re-fetches automatically when the authenticated user changes (login/logout).
 * Does NOT call setStoredCurrentUser to avoid event-loop feedback.
 */
const useMenuItems = () => {
  const location = useLocation()
  const isCustomerRoute = location.pathname === '/customer' || location.pathname.startsWith('/customer/')
  const [menuItems, setMenuItems] = useState([])
  const [accessibleMenuUrls, setAccessibleMenuUrls] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      // No token – clear menu state immediately, nothing to fetch
      if (!getToken()) {
        if (!cancelled) {
          setMenuItems([])
          setAccessibleMenuUrls([])
          setLoading(false)
        }
        return
      }

      try {
        setLoading(true)

        const [userResponse, flatMenus] = isCustomerRoute
          ? [null, await loadMenuCatalog(true).catch(() => [])]
          : await Promise.all([
              ApiService.getUser().catch(() => null),
              loadMenuCatalog(false).catch(() => []),
            ])

        if (cancelled) return

        const flatMenuList = Array.isArray(flatMenus)
          ? flatMenus.filter((menu) => Boolean(menu.is_active))
          : []

        // Prefer the freshly fetched user; fall back to the one in session storage
        if (isCustomerRoute) {
          const customerMenuList = flatMenuList.filter((menu) => Boolean(menu.show_in_customer_page))
          const tree = buildTree(customerMenuList)
          setMenuItems(tree)
          setAccessibleMenuUrls(getAccessibleMenuUrls(customerMenuList, customerMenuList.map((menu) => menu.id)))
          return
        }

        const currentUser = userResponse?.user ?? userResponse ?? getStoredCurrentUser()
        const accessibleMenuIds = getAccessibleMenuIds(currentUser)
        const tree = buildTree(flatMenuList)

        setMenuItems(filterTreeByAccess(tree, accessibleMenuIds))
        setAccessibleMenuUrls(getAccessibleMenuUrls(flatMenuList, accessibleMenuIds))
      } catch (err) {
        if (!cancelled) setError(err?.message ?? 'Failed to load navigation.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    // Re-fetch when the signed-in user changes, but only invalidate the shared
    // cache when the menu catalog itself changes.
    const handleUserChange = () => {
      if (!cancelled) load()
    }

    const handleMenuChange = () => {
      invalidateMenuCatalogCache()
      if (!cancelled) load()
    }

    window.addEventListener(CURRENT_USER_CHANGED_EVENT, handleUserChange)
    window.addEventListener(MENU_ITEMS_CHANGED_EVENT, handleMenuChange)

    return () => {
      cancelled = true
      window.removeEventListener(CURRENT_USER_CHANGED_EVENT, handleUserChange)
      window.removeEventListener(MENU_ITEMS_CHANGED_EVENT, handleMenuChange)
    }
  }, [isCustomerRoute])

  return { menuItems, accessibleMenuUrls, loading, error, setMenuItems }
}

export { buildTree, filterTreeByAccess, findFirstMenuUrl, getAccessibleMenuIds, getAccessibleMenuUrls, normalizeMenuPath }
export default useMenuItems
