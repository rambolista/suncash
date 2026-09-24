import { useEffect, useState } from 'react'
import ApiService from '@/services/ApiService'
import { getToken } from '@/services/HttpService'
import { CURRENT_USER_CHANGED_EVENT } from '@/utils/currentUser'
import { FAVORITES_CHANGED_EVENT, notifyFavoritesChanged } from '@/utils/favorites'

const cache = { ids: null, promise: null }

const invalidateFavoritesCache = () => {
  cache.ids = null
  cache.promise = null
}

const loadFavorites = () => {
  if (cache.ids) return Promise.resolve(cache.ids)
  if (cache.promise) return cache.promise

  cache.promise = ApiService.getFavorites()
    .then((ids) => {
      cache.ids = new Set((ids || []).map(Number))
      cache.promise = null
      return cache.ids
    })
    .catch((error) => {
      cache.promise = null
      throw error
    })

  return cache.promise
}

/**
 * Current user's favorited menu ids, kept in sync across every mounted
 * instance (Sidenav's Favorites section, the star on every page's
 * PageBreadcrumb) via a shared cache + a change event.
 */
const useFavorites = () => {
  const [favoriteIds, setFavoriteIds] = useState(() => cache.ids ?? new Set())

  useEffect(() => {
    let cancelled = false

    const load = () => {
      if (!getToken()) {
        setFavoriteIds(new Set())
        return
      }
      loadFavorites()
        .then((ids) => { if (!cancelled) setFavoriteIds(new Set(ids)) })
        .catch(() => {})
    }

    load()

    const handleUserChange = () => {
      invalidateFavoritesCache()
      if (!cancelled) load()
    }
    const handleFavoritesChange = () => { if (!cancelled) load() }

    window.addEventListener(CURRENT_USER_CHANGED_EVENT, handleUserChange)
    window.addEventListener(FAVORITES_CHANGED_EVENT, handleFavoritesChange)

    return () => {
      cancelled = true
      window.removeEventListener(CURRENT_USER_CHANGED_EVENT, handleUserChange)
      window.removeEventListener(FAVORITES_CHANGED_EVENT, handleFavoritesChange)
    }
  }, [])

  const isFavorite = (menuId) => favoriteIds.has(Number(menuId))

  const toggleFavorite = async (menuId) => {
    const { is_favorite: isFavorite } = await ApiService.toggleFavorite(menuId)

    if (cache.ids) {
      isFavorite ? cache.ids.add(Number(menuId)) : cache.ids.delete(Number(menuId))
    }
    notifyFavoritesChanged()

    return isFavorite
  }

  return { favoriteIds, isFavorite, toggleFavorite }
}

export default useFavorites
