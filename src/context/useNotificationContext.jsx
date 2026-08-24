import { createContext, use, useCallback, useEffect, useRef, useState } from 'react'
import { ToastBody, ToastHeader } from 'react-bootstrap'
import Toast from 'react-bootstrap/Toast'
import ToastContainer from 'react-bootstrap/ToastContainer'
const NotificationContext = createContext(undefined)
const defaultConfig = {
  show: false,
  message: '',
  title: '',
  variant: 'light',
  delay: 3000,
}

function Toastr({ show, title, message, onClose, variant = 'light', delay }) {
  return (
    <ToastContainer className="m-3 position-fixed" position="bottom-end" style={{ zIndex: 1090 }}>
      <Toast bg={variant} delay={delay} show={show} onClose={onClose} autohide>
        {title && (
          <ToastHeader className={`text-${variant}`}>
            <strong className="me-auto">{title}</strong>
          </ToastHeader>
        )}
        <ToastBody className={['dark', 'danger', 'success', 'primary'].includes(variant) ? 'text-white' : ''}>{message}</ToastBody>
      </Toast>
    </ToastContainer>
  )
}
export function useNotificationContext() {
  const context = use(NotificationContext)
  if (!context) {
    throw new Error('useNotificationContext must be used within an NotificationProvider')
  }
  return context
}
export function NotificationProvider({ children }) {
  const [config, setConfig] = useState(defaultConfig)
  const timerRef = useRef(null)

  const hideNotification = useCallback(() => {
    window.clearTimeout(timerRef.current)
    setConfig(defaultConfig)
  }, [])

  const showNotification = useCallback(({ title, message, variant, delay = 3000 }) => {
    window.clearTimeout(timerRef.current)
    setConfig({
      show: true,
      title,
      message,
      variant: variant ?? 'light',
      onClose: hideNotification,
      delay,
    })
    timerRef.current = window.setTimeout(() => {
      setConfig(defaultConfig)
    }, delay)
  }, [hideNotification])

  useEffect(() => () => window.clearTimeout(timerRef.current), [])

  return (
    <NotificationContext
      value={{
        showNotification,
      }}
    >
      <Toastr {...config} />
      {children}
    </NotificationContext>
  )
}
