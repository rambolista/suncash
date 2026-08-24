export const NOTIFICATIONS_CHANGED_EVENT = 'app-notifications-changed'

export const notifyNotificationsChanged = () => {
  window.dispatchEvent(new CustomEvent(NOTIFICATIONS_CHANGED_EVENT))
}
