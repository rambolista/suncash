import { useEffect, useState } from 'react'
import { Alert, Col, Nav, Row } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import useCurrentUser from '@/hooks/useCurrentUser'
import useModuleTabs from '@/hooks/useModuleTabs'
import ZoutReportsPage from '../zout-reports'
import ReplenishReportsPage from '../replenish-reports'
import TransactionReportTab from './transaction-report'
import CommissionReportTab from './commission-report'
import AgentCommissionReportTab from './agent-commission-report'
import ReconciliationReportTab from './reconciliation-report'
import CashExposureReportTab from './cash-exposure-report'

const TAB_COMPONENTS = {
  zout: ZoutReportsPage,
  replenish: ReplenishReportsPage,
  transaction: TransactionReportTab,
  commission: CommissionReportTab,
  agent_commission: AgentCommissionReportTab,
  reconciliation: ReconciliationReportTab,
  cash_exposure: CashExposureReportTab,
}

const KioskReportsPage = () => {
  const currentUser = useCurrentUser()
  const { tabs: visibleTabs, tabLayout } = useModuleTabs(currentUser, '/kiosk/reports')

  const [activeTab, setActiveTab] = useState(null)

  useEffect(() => {
    if (!activeTab && visibleTabs.length) setActiveTab(visibleTabs[0].key)
  }, [activeTab, visibleTabs])

  const currentTab = visibleTabs.find((t) => t.key === activeTab)
  const TabComponent = currentTab ? TAB_COMPONENTS[currentTab.key] : null

  const tabNavigation = (
    <Nav
      variant="tabs"
      activeKey={activeTab}
      onSelect={(key) => key && setActiveTab(key)}
      className={`nav-bordered nav-bordered-primary${tabLayout === 'vertical' ? ' nav-tabs-vertical flex-column' : ' module-tabs-horizontal mb-3 flex-nowrap'}`}
    >
      {visibleTabs.map((t) => (
        <Nav.Item key={t.tab_id || t.key}>
          <Nav.Link eventKey={t.key} className="d-flex align-items-center gap-2">
            <Icon icon={t.icon} className="fs-lg" />
            <span className="fw-semibold">{t.label}</span>
          </Nav.Link>
        </Nav.Item>
      ))}
    </Nav>
  )

  const tabContent = TabComponent && <TabComponent canExport={Boolean(currentTab?.can_export)} />

  return (
    <>
      <PageBreadcrumb title="Reports" subtitle="Kiosk" />

      {!visibleTabs.length ? (
        <Alert variant="warning">Your role does not have access to any tabs under Kiosk Reports.</Alert>
      ) : tabLayout === 'vertical' ? (
        <Row className="g-3">
          <Col xs={12} md={3} lg={2}>
            {tabNavigation}
          </Col>
          <Col xs={12} md={9} lg={10}>
            {tabContent}
          </Col>
        </Row>
      ) : (
        <>
          {tabNavigation}
          {tabContent}
        </>
      )}
    </>
  )
}

export default KioskReportsPage
