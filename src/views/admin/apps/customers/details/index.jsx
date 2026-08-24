import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Alert, Button, Card, Col, Nav, Row } from 'react-bootstrap'
import { useNavigate, useParams } from 'react-router'
import Icon from '@/components/wrappers/Icon'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import useCurrentUser from '@/hooks/useCurrentUser'
import ApiService from '@/services/ApiService'
import { getModulePermission } from '@/utils/modulePermissions'
import LoadingState from '@/components/LoadingState'

const AccountsTab = lazy(() => import('./tabs/AccountsTab'))
const AuditHistoryTab = lazy(() => import('./tabs/AuditHistoryTab'))
const BillsTab = lazy(() => import('./tabs/BillsTab'))
const ComplaintsTab = lazy(() => import('./tabs/ComplaintsTab'))
const ConsumptionTab = lazy(() => import('./tabs/ConsumptionTab'))
const DocumentsTab = lazy(() => import('./tabs/DocumentsTab'))
const GenericCustomerTab = lazy(() => import('./tabs/GenericCustomerTab'))
const InformationTab = lazy(() => import('./tabs/InformationTab'))
const MetersTab = lazy(() => import('./tabs/MetersTab'))
const NotificationsTab = lazy(() => import('./tabs/NotificationsTab'))
const OverviewTab = lazy(() => import('./tabs/OverviewTab'))
const PaymentsTab = lazy(() => import('./tabs/PaymentsTab'))
const ServiceConnectionsTab = lazy(() => import('./tabs/ServiceConnectionsTab'))
const ServiceRequestsTab = lazy(() => import('./tabs/ServiceRequestsTab'))

const tabComponents = {
  overview: OverviewTab,
  information: InformationTab,
  accounts: AccountsTab,
  'service-connections': ServiceConnectionsTab,
  meters: MetersTab,
  bills: BillsTab,
  payments: PaymentsTab,
  consumption: ConsumptionTab,
  complaints: ComplaintsTab,
  'service-requests': ServiceRequestsTab,
  documents: DocumentsTab,
  notifications: NotificationsTab,
  'audit-history': AuditHistoryTab,
}

const CustomerDetailsPage = () => {
  const { customerId } = useParams()
  const navigate = useNavigate()
  const currentUser = useCurrentUser()
  const permission = useMemo(() => getModulePermission(currentUser, '/apps/customers'), [currentUser])
  const [configuredMenu, setConfiguredMenu] = useState(undefined)
  const tabs = useMemo(() => {
    const permittedTabs = permission.tabs.filter((tab) => tab.can_view)
    if (configuredMenu === undefined) return []
    if (configuredMenu === null) return permittedTabs

    const permissionsByKey = new Map(permittedTabs.map((tab) => [tab.key, tab]))
    return (configuredMenu.tabs || [])
      .filter((tab) => tab.is_active && permissionsByKey.has(tab.key))
      .map((tab) => ({
        ...permissionsByKey.get(tab.key),
        ...tab,
      }))
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  }, [configuredMenu, permission.tabs])
  const [customer, setCustomer] = useState(null)
  const [activeTab, setActiveTab] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!tabs.some((tab) => tab.key === activeTab)) {
      setActiveTab(tabs[0]?.key || '')
    }
  }, [activeTab, tabs])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    ApiService.getCustomer(customerId)
      .then((data) => {
        if (active) setCustomer(data?.data || data)
      })
      .catch((requestError) => {
        if (active) setError(requestError?.message || 'Unable to load customer details.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [customerId])

  useEffect(() => {
    let active = true
    ApiService.getMenus()
      .then((menus) => {
        if (!active || !Array.isArray(menus)) return
        const customerMenu = menus.find((menu) => menu.url === '/apps/customers')
        setConfiguredMenu(customerMenu || null)
      })
      .catch(() => {
        if (active) setConfiguredMenu(null)
      })

    return () => {
      active = false
    }
  }, [])

  const selectedTab = tabs.find((tab) => tab.key === activeTab)
  const ActiveComponent = selectedTab ? (tabComponents[selectedTab.key] || GenericCustomerTab) : null
  const tabLayout = (configuredMenu?.tab_layout || permission.raw?.tab_layout) === 'vertical' ? 'vertical' : 'horizontal'

  const tabNavigation = (
    <Nav
      variant="tabs"
      activeKey={activeTab}
      className={`nav-bordered nav-bordered-primary customer-profile-tabs${tabLayout === 'vertical' ? ' nav-tabs-vertical flex-column' : ' flex-nowrap'}`}
    >
      {tabs.map((tab) => (
        <Nav.Item key={tab.tab_id || tab.key}>
          <Nav.Link eventKey={tab.key} onClick={() => setActiveTab(tab.key)}>
            {tab.icon && <Icon icon={tab.icon} className="me-2" />}
            {tab.label}
          </Nav.Link>
        </Nav.Item>
      ))}
    </Nav>
  )
  const tabContent = ActiveComponent ? (
    <Suspense
      fallback={(
        <LoadingState minHeight={180} />
      )}
    >
      <ActiveComponent customer={customer} tab={selectedTab} />
    </Suspense>
  ) : null

  return (
    <>
      <PageBreadcrumb
        title={customer ? `${customer.name} - ${customer.account_number}` : 'Customer Profile'}
        subtitle="Customers"
      />
      <div className="d-flex justify-content-between align-items-center mb-3">
        <Button variant="light" size="sm" onClick={() => navigate('/apps/customers')}>
          <Icon icon="arrow-left" className="me-1" /> Back to customers
        </Button>
        {customer && (
          <div className="border rounded bg-body px-3 py-2 shadow-sm">
            <span className="text-muted small me-2">Account #</span>
            <code className="fs-6 fw-bold text-primary">{customer.account_number}</code>
          </div>
        )}
      </div>

      {loading || configuredMenu === undefined ? (
        <Card><Card.Body><LoadingState /></Card.Body></Card>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : tabs.length === 0 ? (
        <Alert variant="warning">Your role does not have access to any tabs in this customer profile.</Alert>
      ) : (
        tabLayout === 'vertical' ? (
          <Card>
            <Card.Body className="p-0">
              <Row className="g-0">
                <Col xs={12} className="customer-profile-tab-sidebar bg-body-tertiary p-3">
                  {tabNavigation}
                </Col>
                <Col xs={12} className="customer-profile-tab-content p-4">
                  {tabContent}
                </Col>
              </Row>
            </Card.Body>
          </Card>
        ) : (
          <Card>
            <Card.Header className="px-3 pt-3 pb-0 bg-body">
              <div className="customer-profile-tabs-scroll">
                {tabNavigation}
              </div>
            </Card.Header>
            <Card.Body className="p-4">
              {tabContent}
            </Card.Body>
          </Card>
        )
      )}
    </>
  )
}

export default CustomerDetailsPage
