import Icon from '@/components/wrappers/Icon'
import { SimpleBar } from '@/components/wrappers/SimpleBar'
import ApiService from '@/services/ApiService'
import { NOTIFICATIONS_CHANGED_EVENT } from '@/utils/notifications'
import { useCallback, useEffect, useState } from 'react'
import { Button, Col, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Row, Spinner } from 'react-bootstrap'
import { useNavigate } from 'react-router'

const colorClasses = {
  danger: 'bg-danger-subtle text-danger',
  warning: 'bg-warning-subtle text-warning',
  success: 'bg-success-subtle text-success',
  info: 'bg-info-subtle text-info',
  secondary: 'bg-secondary-subtle text-secondary',
  primary: 'bg-primary-subtle text-primary',
}

const relativeTime = (value) => {
  const timestamp = new Date(value).getTime()
  if (!Number.isFinite(timestamp)) return ''

  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000))
  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} day${seconds < 172800 ? '' : 's'} ago`

  return new Date(value).toLocaleDateString()
}

const NotificationDropdown = () => {
  const navigate = useNavigate()
  const [notificationList, setNotificationList] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadNotifications = useCallback(async () => {
    try {
      const response = await ApiService.getNotifications()
      setNotificationList(Array.isArray(response?.notifications) ? response.notifications : [])
      setUnreadCount(Number(response?.unread_count) || 0)
      setError('')
    } catch (requestError) {
      setError(requestError?.message || 'Unable to load notifications.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadNotifications()
    const interval = window.setInterval(loadNotifications, 15000)

    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, loadNotifications)
    window.addEventListener('focus', loadNotifications)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, loadNotifications)
      window.removeEventListener('focus', loadNotifications)
    }
  }, [loadNotifications])

  const handleNotification = async (item) => {
    try {
      if (!item.read_at) {
        await ApiService.markNotificationRead(item.id)
        setNotificationList((current) =>
          current.map((notification) =>
            notification.id === item.id
              ? { ...notification, read_at: new Date().toISOString() }
              : notification
          )
        )
        setUnreadCount((current) => Math.max(0, current - 1))
      }

      if (item.action_url) navigate(item.action_url)
    } catch (requestError) {
      setError(requestError?.message || 'Unable to update the notification.')
    }
  }

  const handleDismissNotification = async (id) => {
    try {
      const dismissed = notificationList.find((item) => item.id === id)
      await ApiService.dismissNotification(id)
      setNotificationList((current) => current.filter((item) => item.id !== id))
      if (dismissed && !dismissed.read_at) {
        setUnreadCount((current) => Math.max(0, current - 1))
      }
    } catch (requestError) {
      setError(requestError?.message || 'Unable to dismiss the notification.')
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await ApiService.markAllNotificationsRead()
      const readAt = new Date().toISOString()
      setNotificationList((current) => current.map((item) => ({ ...item, read_at: item.read_at || readAt })))
      setUnreadCount(0)
    } catch (requestError) {
      setError(requestError?.message || 'Unable to mark notifications as read.')
    }
  }

  return (
    <div id="notification-dropdown-alert" className="topbar-item">
      <Dropdown align="end" onToggle={(open) => open && loadNotifications()}>
        <DropdownToggle className="topbar-link drop-arrow-none" as="button">
          <span className="topbar-link-icon">
            <Icon icon="bell" className={unreadCount ? 'animate-ring' : ''} />
          </span>
          {unreadCount > 0 && (
            <span className="badge badge-square text-bg-warning topbar-badge">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </DropdownToggle>

        <DropdownMenu className="p-0 dropdown-menu-end dropdown-menu-lg">
          <div className="px-3 py-2 border-bottom">
            <Row className="align-items-center">
              <Col>
                <h6 className="m-0 fs-md fw-semibold">Notifications</h6>
              </Col>
              <Col className="text-end">
                {unreadCount > 0 && (
                  <Button variant="link" size="sm" className="p-0 text-decoration-none" onClick={handleMarkAllRead}>
                    Mark all read
                  </Button>
                )}
              </Col>
            </Row>
          </div>

          <SimpleBar style={{ maxHeight: 320 }}>
            {loading && (
              <div className="text-center text-muted py-4">
                <Spinner animation="border" size="sm" className="me-2" />
                Loading notifications...
              </div>
            )}

            {!loading && error && <div className="text-danger text-center small p-3">{error}</div>}

            {!loading && !error && notificationList.length === 0 && (
              <div className="text-center text-muted py-4">
                <Icon icon="bell-off" className="fs-2 mb-2" />
                <div>No notifications yet.</div>
              </div>
            )}

            {!loading && !error && notificationList.map((item) => {
              const color = item.color || 'primary'
              return (
                <DropdownItem
                  as="div"
                  role="button"
                  tabIndex={0}
                  key={item.id}
                  className={`notification-item py-2 text-wrap ${item.read_at ? '' : 'bg-light bg-opacity-50'}`}
                  onClick={() => handleNotification(item)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      handleNotification(item)
                    }
                  }}
                >
                  <span className="d-flex gap-2">
                    <span className="avatar-md flex-shrink-0">
                      <span className={`avatar-title ${colorClasses[color] || colorClasses.primary} rounded`}>
                        <Icon icon={item.icon || 'bell'} />
                      </span>
                    </span>
                    <span className="flex-grow-1 text-muted">
                      <span className="fw-semibold text-body">{item.title}</span>
                      <br />
                      <span className="small">{item.message}</span>
                      <br />
                      <span className="fs-xs">{relativeTime(item.created_at)}</span>
                    </span>
                    <button
                      type="button"
                      aria-label="Dismiss notification"
                      className="flex-shrink-0 text-muted btn btn-link p-0"
                      onClick={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                        handleDismissNotification(item.id)
                      }}
                    >
                      <Icon icon="square-rounded-x" className="fs-xxl" />
                    </button>
                  </span>
                </DropdownItem>
              )
            })}
          </SimpleBar>
        </DropdownMenu>
      </Dropdown>
    </div>
  )
}

export default NotificationDropdown
