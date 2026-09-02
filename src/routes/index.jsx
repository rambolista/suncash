import MainLayout from '@/layouts/MainLayout'
import { lazy } from 'react'
import { Navigate } from 'react-router'
import {
  DynamicDeleteAccount,
  DynamicLockScreen,
  DynamicLoginPin,
  DynamicNewPassword,
  DynamicResetPassword,
  DynamicSignIn,
  DynamicSuccessMail,
  DynamicTwoFactor,
} from '@/views/auth/DynamicAuthPage'
import {
  DynamicCustomerNewPassword,
  DynamicCustomerResetPassword,
  DynamicCustomerSuccessMail,
  DynamicCustomerTwoFactor,
} from '@/views/customer/auth/DynamicCustomerAuthPage'
export const routes = [
  {
    path: '',
    element: <Navigate to="/landing" replace />,
  },
  {
    path: '/landing',
    Component: lazy(() => import('@/views/landing')),
  },
  {
    element: <MainLayout />,
    children: [
      {
        path: '/project-setup',
        Component: lazy(() => import('@/views/admin/project-settings')),
      },
      {
        path: '/apps/access-management',
        Component: lazy(() => import('@/views/admin/apps/access-management/menus')),
      },
      {
        path: '/apps/access-management/menus/new',
        Component: lazy(() => import('@/views/admin/apps/access-management/menus/form')),
      },
      {
        path: '/apps/access-management/menus/:menuId/edit',
        Component: lazy(() => import('@/views/admin/apps/access-management/menus/form')),
      },
      {
        path: '/apps/access-management/customer-menus',
        Component: lazy(() => import('@/views/admin/apps/access-management/customer-menus')),
      },
      {
        path: '/apps/access-management/roles',
        Component: lazy(() => import('@/views/admin/apps/access-management/roles')),
      },
      {
        path: '/apps/access-management/users',
        Component: lazy(() => import('@/views/admin/apps/access-management/users')),
      },
      {
        path: '/apps/customers',
        Component: lazy(() => import('@/views/admin/apps/customers')),
      },
      {
        path: '/apps/customers/new',
        Component: lazy(() => import('@/views/admin/apps/customers/form')),
      },
      {
        path: '/apps/customers/:customerId/edit',
        Component: lazy(() => import('@/views/admin/apps/customers/form')),
      },
      {
        path: '/apps/customers/:customerId',
        Component: lazy(() => import('@/views/admin/apps/customers/details')),
      },
      {
        path: '/customer/dashboard',
        Component: lazy(() => import('@/views/customer/pages/EmptyPage')),
      },
      {
        path: '/customer/overview',
        Component: lazy(() => import('@/views/customer/pages/EmptyPage')),
      },
      {
        path: '/customer/view-customer-details',
        Component: lazy(() => import('@/views/customer/pages/EmptyPage')),
      },
      {
        path: '/customer/my-bills',
        Component: lazy(() => import('@/views/customer/pages/EmptyPage')),
      },
      {
        path: '/customer/payments',
        Component: lazy(() => import('@/views/customer/pages/EmptyPage')),
      },
      {
        path: '/customer/my-portal-account',
        Component: lazy(() => import('@/views/customer/pages/EmptyPage')),
      },
      {
        path: '/customer/enroll-account',
        Component: lazy(() => import('@/views/customer/pages/EmptyPage')),
      },
      {
        path: '/customer/manage-enrolled-accounts',
        Component: lazy(() => import('@/views/customer/pages/EmptyPage')),
      },
      {
        path: '/customer/error/404',
        Component: lazy(() => import('@/views/customer/error/404')),
      },
      {
        path: '/customer/error/menu-unavailable',
        Component: lazy(() => import('@/views/customer/error/menu-unavailable')),
      },
      {
        path: '/dashboard/merchants',
        Component: lazy(() => import('@/views/admin/dashboard')),
      },
      {
        path: '/pages/empty',
        Component: lazy(() => import('@/views/admin/pages/empty')),
      },
      {
        path: '/merchants/registration',
        Component: lazy(() => import('@/views/admin/merchants/registration')),
      },
      {
        path: '/merchants/business-management',
        Component: lazy(() => import('@/views/admin/merchants/business-management')),
      },
      {
        path: '/merchants/charity-management',
        Component: lazy(() => import('@/views/admin/merchants/charity-management')),
      },
      {
        path: '/merchants/settlements',
        Component: lazy(() => import('@/views/admin/merchants/settlements')),
      },
      {
        path: '/merchants/business-billpay',
        Component: lazy(() => import('@/views/admin/merchants/business-billpay')),
      },
      {
        path: '/merchants/statement',
        Component: lazy(() => import('@/views/admin/merchants/statement')),
      },
      {
        path: '/terminals/management',
        Component: lazy(() => import('@/views/admin/terminals/management')),
      },
      {
        path: '/transactions/void-transaction',
        Component: lazy(() => import('@/views/admin/transactions/void-transaction')),
      },
      {
        path: '/transactions/resend-receipt',
        Component: lazy(() => import('@/views/admin/transactions/resend-receipt')),
      },
      {
        path: '/kiosk/monitoring-dashboard',
        Component: lazy(() => import('@/views/admin/kiosk/monitoring-dashboard')),
      },
      {
        path: '/kiosk/management',
        Component: lazy(() => import('@/views/admin/kiosk/management')),
      },
      {
        path: '/kiosk/management/:branchId/terminals',
        Component: lazy(() => import('@/views/admin/kiosk/management/terminals')),
      },
      {
        path: '/kiosk/management/:branchId/partners',
        Component: lazy(() => import('@/views/admin/kiosk/management/partners')),
      },
      {
        path: '/kiosk/management/bank-accounts',
        Component: lazy(() => import('@/views/admin/kiosk/management/bank-accounts')),
      },
      {
        path: '/kiosk/statement',
        Component: lazy(() => import('@/views/admin/kiosk/statement')),
      },
      {
        path: '/kiosk/statement/:terminalId/ledger',
        Component: lazy(() => import('@/views/admin/kiosk/statement/ledger')),
      },
      {
        path: '/kiosk/users',
        Component: lazy(() => import('@/views/admin/kiosk/users')),
      },
      {
        path: '/giftcards/products',
        Component: lazy(() => import('@/views/admin/giftcards/products')),
      },
      {
        path: '/customers/kyc-upgrade',
        Component: lazy(() => import('@/views/admin/customers/kyc-upgrade')),
      },
      {
        path: '/customers/documents',
        Component: lazy(() => import('@/views/admin/customers/documents')),
      },
      {
        path: '/customers/card-verification',
        Component: lazy(() => import('@/views/admin/customers/card-verification')),
      },
      {
        path: '/customers/settlements',
        Component: lazy(() => import('@/views/admin/customers/settlements')),
      },
      {
        path: '/customers/bank-loads',
        Component: lazy(() => import('@/views/admin/customers/bank-loads')),
      },
      {
        path: '/customers/archive',
        Component: lazy(() => import('@/views/admin/customers/archive')),
      },
      {
        path: '/customers/logs',
        Component: lazy(() => import('@/views/admin/customers/logs')),
      },
      {
        path: '/customers/failed-logs',
        Component: lazy(() => import('@/views/admin/customers/failed-logs')),
      },
      {
        path: '/administration/user-activity',
        Component: lazy(() => import('@/views/admin/administration/user-activity')),
      },
      {
        path: '/settings/notifications',
        Component: lazy(() => import('@/views/admin/settings/notifications')),
      },
      {
        path: '/settings/customer-app',
        Component: lazy(() => import('@/views/admin/settings/customer-app')),
      },
      {
        path: '/settings/wu',
        Component: lazy(() => import('@/views/admin/settings/wu')),
      },
      {
        path: '/promotions/ticket-reports',
        Component: lazy(() => import('@/views/admin/promotions/ticket-reports')),
      },
      {
        path: '/promotions/settings',
        Component: lazy(() => import('@/views/admin/promotions/settings')),
      },
      {
        path: '/promotions/signup',
        Component: lazy(() => import('@/views/admin/promotions/signup')),
      },
      {
        path: '/float-management/main-reserve-account',
        Component: lazy(() => import('@/views/admin/float-management/main-reserve-account')),
      },
      {
        path: '/float-management/store-float-replenishments',
        Component: lazy(() => import('@/views/admin/float-management/store-float-replenishments')),
      },
      {
        path: '/float-management/current-store-float-amounts',
        Component: lazy(() => import('@/views/admin/float-management/current-store-float-amounts')),
      },
      {
        path: '/float-management/set-main-reserve-account',
        Component: lazy(() => import('@/views/admin/float-management/set-main-reserve-account')),
      },
    ],
  },
  {
    path: '/auth/card/delete-account',
    Component: lazy(() => import('@/views/auth/card/delete-account')),
  },
  {
    path: '/auth/card/lock-screen',
    Component: lazy(() => import('@/views/auth/card/lock-screen')),
  },
  {
    path: '/auth/card/login-pin',
    Component: lazy(() => import('@/views/auth/card/login-pin')),
  },
  {
    path: '/auth/card/new-pass',
    Component: lazy(() => import('@/views/auth/card/new-pass')),
  },
  {
    path: '/auth/card/reset-pass',
    Component: lazy(() => import('@/views/auth/card/reset-pass')),
  },
  {
    path: '/auth/card/sign-in',
    Component: lazy(() => import('@/views/auth/card/sign-in')),
  },
  {
    path: '/auth/card/success-mail',
    Component: lazy(() => import('@/views/auth/card/success-mail')),
  },
  {
    path: '/auth/card/two-factor',
    Component: lazy(() => import('@/views/auth/card/two-factor')),
  },
  {
    path: '/auth/delete-account',
    Component: DynamicDeleteAccount,
  },
  {
    path: '/auth/lock-screen',
    Component: DynamicLockScreen,
  },
  {
    path: '/auth/login-pin',
    Component: DynamicLoginPin,
  },
  {
    path: '/auth/new-pass',
    Component: DynamicNewPassword,
  },
  {
    path: '/auth/reset-pass',
    Component: DynamicResetPassword,
  },
  {
    path: '/auth/sign-in',
    Component: DynamicSignIn,
  },
  {
    path: '/auth/split/delete-account',
    Component: lazy(() => import('@/views/auth/split/delete-account')),
  },
  {
    path: '/auth/split/lock-screen',
    Component: lazy(() => import('@/views/auth/split/lock-screen')),
  },
  {
    path: '/auth/split/login-pin',
    Component: lazy(() => import('@/views/auth/split/login-pin')),
  },
  {
    path: '/auth/split/new-pass',
    Component: lazy(() => import('@/views/auth/split/new-pass')),
  },
  {
    path: '/auth/split/reset-pass',
    Component: lazy(() => import('@/views/auth/split/reset-pass')),
  },
  {
    path: '/auth/split/sign-in',
    Component: lazy(() => import('@/views/auth/split/sign-in')),
  },
  {
    path: '/auth/split/success-mail',
    Component: lazy(() => import('@/views/auth/split/success-mail')),
  },
  {
    path: '/auth/split/two-factor',
    Component: lazy(() => import('@/views/auth/split/two-factor')),
  },
  {
    path: '/auth/success-mail',
    Component: DynamicSuccessMail,
  },
  {
    path: '/auth/two-factor',
    Component: DynamicTwoFactor,
  },
  {
    path: '/customer',
    Component: () => <Navigate to="/customer/dashboard" replace />,
  },
  {
    path: '/customer/login',
    Component: () => <Navigate to="/error/404" replace />,
  },
  {
    path: '/customer/sign-up',
    Component: () => <Navigate to="/error/404" replace />,
  },
  {
    path: '/customer/register',
    Component: () => <Navigate to="/error/404" replace />,
  },
  {
    path: '/customer/reset-pass',
    Component: DynamicCustomerResetPassword,
  },
  {
    path: '/customer/forgot-password',
    Component: DynamicCustomerResetPassword,
  },
  {
    path: '/customer/new-pass',
    Component: DynamicCustomerNewPassword,
  },
  {
    path: '/customer/success-mail',
    Component: DynamicCustomerSuccessMail,
  },
  {
    path: '/customer/two-factor',
    Component: DynamicCustomerTwoFactor,
  },
  {
    path: '/error/400',
    Component: lazy(() => import('@/views/error/400')),
  },
  {
    path: '/error/401',
    Component: lazy(() => import('@/views/error/401')),
  },
  {
    path: '/error/403',
    Component: lazy(() => import('@/views/error/403')),
  },
  {
    path: '/error/404',
    Component: lazy(() => import('@/views/error/404')),
  },
  {
    path: '/error/408',
    Component: lazy(() => import('@/views/error/408')),
  },
  {
    path: '/error/500',
    Component: lazy(() => import('@/views/error/500')),
  },
  {
    path: '/error/maintenance',
    Component: lazy(() => import('@/views/error/maintenance')),
  },
]
