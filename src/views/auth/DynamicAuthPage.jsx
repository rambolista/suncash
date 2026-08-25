import { useProjectSettingsContext } from '@/context/useProjectSettingsContext'
import { lazy, Suspense } from 'react'
import { Spinner } from 'react-bootstrap'

const pageLoaders = {
  'delete-account': {
    basic: lazy(() => import('@/views/auth/basic/delete-account')),
    card: lazy(() => import('@/views/auth/card/delete-account')),
    split: lazy(() => import('@/views/auth/split/delete-account')),
  },
  'lock-screen': {
    basic: lazy(() => import('@/views/auth/basic/lock-screen')),
    card: lazy(() => import('@/views/auth/card/lock-screen')),
    split: lazy(() => import('@/views/auth/split/lock-screen')),
  },
  'login-pin': {
    basic: lazy(() => import('@/views/auth/basic/login-pin')),
    card: lazy(() => import('@/views/auth/card/login-pin')),
    split: lazy(() => import('@/views/auth/split/login-pin')),
  },
  'new-pass': {
    basic: lazy(() => import('@/views/auth/basic/new-pass')),
    card: lazy(() => import('@/views/auth/card/new-pass')),
    split: lazy(() => import('@/views/auth/split/new-pass')),
  },
  'reset-pass': {
    basic: lazy(() => import('@/views/auth/basic/reset-pass')),
    card: lazy(() => import('@/views/auth/card/reset-pass')),
    split: lazy(() => import('@/views/auth/split/reset-pass')),
  },
  'sign-in': {
    basic: lazy(() => import('@/views/auth/basic/sign-in')),
    card: lazy(() => import('@/views/auth/card/sign-in')),
    split: lazy(() => import('@/views/auth/split/sign-in')),
  },
  'success-mail': {
    basic: lazy(() => import('@/views/auth/basic/success-mail')),
    card: lazy(() => import('@/views/auth/card/success-mail')),
    split: lazy(() => import('@/views/auth/split/success-mail')),
  },
  'two-factor': {
    basic: lazy(() => import('@/views/auth/basic/two-factor')),
    card: lazy(() => import('@/views/auth/card/two-factor')),
    split: lazy(() => import('@/views/auth/split/two-factor')),
  },
}

const DynamicAuthPage = ({ page }) => {
  const { settings, loading } = useProjectSettingsContext()

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <Spinner animation="border" />
      </div>
    )
  }

  const pages = pageLoaders[page]
  const Page = pages?.[settings.authentication_type] ?? pages?.basic

  if (!Page) {
    return null
  }

  return (
    <Suspense fallback={null}>
      <Page />
    </Suspense>
  )
}

export const DynamicDeleteAccount = () => <DynamicAuthPage page="delete-account" />
export const DynamicLockScreen = () => <DynamicAuthPage page="lock-screen" />
export const DynamicLoginPin = () => <DynamicAuthPage page="login-pin" />
export const DynamicNewPassword = () => <DynamicAuthPage page="new-pass" />
export const DynamicResetPassword = () => <DynamicAuthPage page="reset-pass" />
export const DynamicSignIn = () => <DynamicAuthPage page="sign-in" />
export const DynamicSuccessMail = () => <DynamicAuthPage page="success-mail" />
export const DynamicTwoFactor = () => <DynamicAuthPage page="two-factor" />

export default DynamicAuthPage
