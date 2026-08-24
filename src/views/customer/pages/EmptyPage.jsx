import PageBreadcrumb from '@/components/PageBreadcrumb'
import { useLocation } from 'react-router'

const titles = {
  '/customer/dashboard': 'Overview',
  '/customer/view-customer-details': 'View Customer Details',
  '/customer/my-bills': 'My Bills',
  '/customer/payments': 'Payments',
  '/customer/my-portal-account': 'My Portal Account',
  '/customer/enroll-account': 'Enroll Account',
  '/customer/manage-enrolled-accounts': 'Manage Enrolled Accounts',
}

const EmptyPage = () => {
  const { pathname } = useLocation()
  const title = titles[pathname] ?? 'Customer Page'

  return <PageBreadcrumb title={title} subtitle="Customer" />
}

export default EmptyPage
