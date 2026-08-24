import { useProjectSettingsContext } from '@/context/useProjectSettingsContext'
import { lazy, Suspense } from 'react'
import { Spinner } from 'react-bootstrap'

const pageLoaders = {
  'new-pass': {
    basic: lazy(() => import('@/views/customer/auth/basic/new-pass')),
    card: lazy(() => import('@/views/customer/auth/card/new-pass')),
    split: lazy(() => import('@/views/customer/auth/split/new-pass')),
  },
  'reset-pass': {
    basic: lazy(() => import('@/views/customer/auth/basic/reset-pass')),
    card: lazy(() => import('@/views/customer/auth/card/reset-pass')),
    split: lazy(() => import('@/views/customer/auth/split/reset-pass')),
  },
  'sign-in': {
    basic: lazy(() => import('@/views/customer/auth/basic/sign-in')),
    card: lazy(() => import('@/views/customer/auth/card/sign-in')),
    split: lazy(() => import('@/views/customer/auth/split/sign-in')),
  },
  'sign-up': {
    basic: lazy(() => import('@/views/customer/auth/basic/sign-up')),
    card: lazy(() => import('@/views/customer/auth/card/sign-up')),
    split: lazy(() => import('@/views/customer/auth/split/sign-up')),
  },
  'success-mail': {
    basic: lazy(() => import('@/views/customer/auth/basic/success-mail')),
    card: lazy(() => import('@/views/customer/auth/card/success-mail')),
    split: lazy(() => import('@/views/customer/auth/split/success-mail')),
  },
  'two-factor': {
    basic: lazy(() => import('@/views/customer/auth/basic/two-factor')),
    card: lazy(() => import('@/views/customer/auth/card/two-factor')),
    split: lazy(() => import('@/views/customer/auth/split/two-factor')),
  },
}

const DynamicCustomerAuthPage = ({ page }) => {
  const { settings, loading } = useProjectSettingsContext()

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <Spinner animation="border" />
      </div>
    )
  }

  const pages = pageLoaders[page]
  const Page = pages?.[settings.customer_authentication_type] ?? pages?.basic

  if (!Page) {
    return null
  }

  return (
    <Suspense fallback={null}>
      <Page />
    </Suspense>
  )
}

export const DynamicCustomerNewPassword = () => <DynamicCustomerAuthPage page="new-pass" />
export const DynamicCustomerResetPassword = () => <DynamicCustomerAuthPage page="reset-pass" />
export const DynamicCustomerSignIn = () => <DynamicCustomerAuthPage page="sign-in" />
export const DynamicCustomerSignUp = () => <DynamicCustomerAuthPage page="sign-up" />
export const DynamicCustomerSuccessMail = () => <DynamicCustomerAuthPage page="success-mail" />
export const DynamicCustomerTwoFactor = () => <DynamicCustomerAuthPage page="two-factor" />

export default DynamicCustomerAuthPage
