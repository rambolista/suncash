import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Card, Col, Nav, Row } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import useCurrentUser from '@/hooks/useCurrentUser'
import { getModulePermission } from '@/utils/modulePermissions'

import PrincipalInfoPanel from './PrincipalInfoPanel'
import PrefundPanel from './PrefundPanel'
import AutoReplenishPanel from './AutoReplenishPanel'
import BranchPanel from './BranchPanel'
import TerminalPanel from './TerminalPanel'
import UserManagementPanel from './UserManagementPanel'
import EzpayAccessPanel from './EzpayAccessPanel'
import ServicesPermissionPanel from './ServicesPermissionPanel'
import PosUsersPanel from './PosUsersPanel'
import AgentCommissionPanel from './AgentCommissionPanel'
import FloatAccountPanel from './FloatAccountPanel'

const PANEL_COMPONENTS = {
  'principal-info': PrincipalInfoPanel,
  prefund: PrefundPanel,
  'auto-replenish': AutoReplenishPanel,
  branch: BranchPanel,
  terminals: TerminalPanel,
  'user-management': UserManagementPanel,
  'ezpay-access': EzpayAccessPanel,
  'services-permission': ServicesPermissionPanel,
  'pos-users': PosUsersPanel,
  'agent-commission': AgentCommissionPanel,
  'float-account': FloatAccountPanel,
}

const MerchantManagePanel = ({ merchantId, forceReadOnly = false, onBack }) => {
  const currentUser = useCurrentUser()
  const modulePermission = useMemo(() => getModulePermission(currentUser, '/merchants/registration'), [currentUser])
  const visibleTabs = useMemo(() => modulePermission.tabs.filter((tab) => tab.can_view), [modulePermission.tabs])
  const tabLayout = modulePermission.raw?.tab_layout === 'vertical' ? 'vertical' : 'horizontal'

  const [merchant, setMerchant] = useState(null)
  const [activeTab, setActiveTab] = useState(null)

  const loadMerchant = () => {
    ApiService.getMerchant(merchantId).then((data) => setMerchant(data))
  }

  useEffect(() => {
    loadMerchant()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merchantId])

  useEffect(() => {
    if (!activeTab && visibleTabs.length) setActiveTab(visibleTabs[0].key)
  }, [activeTab, visibleTabs])

  const currentTab = visibleTabs.find((tab) => tab.key === activeTab)
  const PanelComponent = currentTab ? PANEL_COMPONENTS[currentTab.key] : null
  const editable = !forceReadOnly && Boolean(currentTab?.can_edit)

  const tabNavigation = (
    <Nav
      variant="tabs"
      activeKey={activeTab}
      className={`nav-bordered nav-bordered-primary customer-profile-tabs${tabLayout === 'vertical' ? ' nav-tabs-vertical flex-column' : ' flex-nowrap'}`}
    >
      {visibleTabs.map((tab) => (
        <Nav.Item key={tab.tab_id || tab.key}>
          <Nav.Link eventKey={tab.key} onClick={() => setActiveTab(tab.key)}>
            {tab.icon && <Icon icon={tab.icon} className="me-2" />}
            {tab.label}
          </Nav.Link>
        </Nav.Item>
      ))}
    </Nav>
  )

  const tabContent = !merchant ? null : PanelComponent ? (
    <PanelComponent merchant={merchant} editable={editable} onMerchantChanged={loadMerchant} />
  ) : null

  return (
    <>
      <PageBreadcrumb title="Manage Merchant" subtitle={merchant?.dba_name || merchant?.legal_name || merchant?.client_id} />
      <div className="d-flex justify-content-between align-items-center mb-3">
        <Button variant="light" size="sm" onClick={onBack}>
          <Icon icon="arrow-left" className="me-1" /> Back to merchant list
        </Button>
        {forceReadOnly && (
          <span className="badge bg-secondary-subtle text-secondary">
            <Icon icon="eye" className="me-1" />View only
          </span>
        )}
      </div>

      {!visibleTabs.length ? (
        <Alert variant="warning">Your role does not have access to any tabs for Merchant Management.</Alert>
      ) : (
        <Card>
          <Card.Header>
            <h5 className="mb-0">{merchant?.dba_name || merchant?.legal_name || merchant?.client_id}</h5>
            <p className="text-muted mb-0 small">{merchant?.client_id}</p>
          </Card.Header>
          {tabLayout === 'vertical' ? (
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
          ) : (
            <>
              <Card.Header className="border-top-0 pt-0">
                <div className="customer-profile-tabs-scroll">{tabNavigation}</div>
              </Card.Header>
              <Card.Body>{tabContent}</Card.Body>
            </>
          )}
        </Card>
      )}
    </>
  )
}

export default MerchantManagePanel
