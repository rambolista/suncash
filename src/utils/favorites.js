export const FAVORITES_CHANGED_EVENT = 'app-favorites-changed'

export const notifyFavoritesChanged = () => {
  window.dispatchEvent(new CustomEvent(FAVORITES_CHANGED_EVENT))
}
