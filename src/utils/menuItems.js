export const MENU_ITEMS_CHANGED_EVENT = 'app-menu-items-changed'

export const notifyMenuItemsChanged = () => {
  window.dispatchEvent(new CustomEvent(MENU_ITEMS_CHANGED_EVENT))
}
