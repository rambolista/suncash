import { useState } from 'react'
import { Nav } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import useCurrentUser from '@/hooks/useCurrentUser'
import CustomerOverviewPanel from './customers/CustomerOverviewPanel'
import MerchantOverviewPanel from './merchants/MerchantOverviewPanel'

const TABS = [
  { key: 'customers', label: 'Customers', icon: 'users' },
  { key: 'merchants', label: 'Merchants', icon: 'building-store' },
]

const DashboardPage = () => {
  const currentUser = useCurrentUser()
  const [tab, setTab] = useState('customers')

  return (
    <>
      <PageBreadcrumb title="Dashboard" subtitle="Overview" />

      <Nav
        variant="tabs"
        activeKey={tab}
        onSelect={(key) => key && setTab(key)}
        className="nav-bordered nav-bordered-primary mb-3"
      >
        {TABS.map((t) => (
          <Nav.Item key={t.key}>
            <Nav.Link eventKey={t.key} className="d-flex align-items-center gap-2">
              <Icon icon={t.icon} style={{ fontSize: '1rem' }} />
              <span className="fw-semibold">{t.label}</span>
            </Nav.Link>
          </Nav.Item>
        ))}
      </Nav>

      {tab === 'customers' ? (
        <CustomerOverviewPanel currentUser={currentUser} />
      ) : (
        <MerchantOverviewPanel currentUser={currentUser} />
      )}
    </>
  )
}

export default DashboardPage
