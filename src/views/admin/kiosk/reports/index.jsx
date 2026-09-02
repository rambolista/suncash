import { useState } from 'react'
import { Nav } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import ZoutReportsPage from '../zout-reports'
import ReplenishReportsPage from '../replenish-reports'
import TransactionReportTab from './transaction-report'

const TABS = [
  { key: 'zout', label: 'Zout', icon: 'report' },
  { key: 'replenish', label: 'Replenish', icon: 'cash-banknote' },
  { key: 'transaction', label: 'Transaction', icon: 'report-money' },
]

const KioskReportsPage = () => {
  const [tab, setTab] = useState('zout')

  return (
    <>
      <PageBreadcrumb title="Reports" subtitle="Kiosk" />

      <Nav variant="tabs" activeKey={tab} onSelect={(key) => key && setTab(key)} className="nav-bordered nav-bordered-primary mb-3 flex-nowrap">
        {TABS.map((t) => (
          <Nav.Item key={t.key}>
            <Nav.Link eventKey={t.key} className="d-flex align-items-center gap-2">
              <Icon icon={t.icon} className="fs-lg" />
              <span className="fw-semibold">{t.label}</span>
            </Nav.Link>
          </Nav.Item>
        ))}
      </Nav>

      {tab === 'zout' && <ZoutReportsPage />}
      {tab === 'replenish' && <ReplenishReportsPage />}
      {tab === 'transaction' && <TransactionReportTab />}
    </>
  )
}

export default KioskReportsPage
