import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Card, Nav } from 'react-bootstrap'
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
import PasswordPanel from './PasswordPanel'
import UserManagementPanel from './UserManagementPanel'
import EzpayAccessPanel from './EzpayAccessPanel'
import ServicesPermissionPanel from './ServicesPermissionPanel'
import PosUsersPanel from './PosUsersPanel'
import AgentCommissionPanel from './AgentCommissionPanel'
import FloatAccountPanel from './FloatAccountPanel'
import DeactivatePanel from './DeactivatePanel'

const PANEL_COMPONENTS = {
  'principal-info': PrincipalInfoPanel,
  prefund: PrefundPanel,
  'auto-replenish': AutoReplenishPanel,
  branch: BranchPanel,
  terminals: TerminalPanel,
  password: PasswordPanel,
  'user-management': UserManagementPanel,
  'ezpay-access': EzpayAccessPanel,
  'services-permission': ServicesPermissionPanel,
  'pos-users': PosUsersPanel,
  'agent-commission': AgentCommissionPanel,
  'float-account': FloatAccountPanel,
  deactivate: DeactivatePanel,
}

const MerchantManagePanel = ({ merchantId, forceReadOnly = false, onBack }) => {
  const currentUser = useCurrentUser()
  const modulePermission = useMemo(() => getModulePermission(currentUser, '/merchants/registration'), [currentUser])
  const visibleTabs = useMemo(() => modulePermission.tabs.filter((tab) => tab.can_view), [modulePermission.tabs])

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

  return (
    <>
      <PageBreadcrumb title="Manage Merchant" subtitle={merchant?.dba_name || merchant?.legal_name || merchant?.client_id} />
      <Button variant="light" size="sm" className="mb-3" onClick={onBack}>
        <Icon icon="arrow-left" className="me-1" /> Back to merchant list
      </Button>

      {!visibleTabs.length ? (
        <Alert variant="warning">Your role does not have access to any tabs for Merchant Management.</Alert>
      ) : (
        <Card>
          <Card.Header className="d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div>
              <h5 className="mb-0">{merchant?.dba_name || merchant?.legal_name || merchant?.client_id}</h5>
              <p className="text-muted mb-0 small">{merchant?.client_id}</p>
            </div>
            {forceReadOnly && (
              <span className="badge bg-secondary-subtle text-secondary">
                <Icon icon="eye" className="me-1" />View only
              </span>
            )}
          </Card.Header>
          <Card.Header className="border-top-0 pt-0">
            <Nav variant="tabs" activeKey={activeTab} className="nav-bordered flex-nowrap overflow-auto">
              {visibleTabs.map((tab) => (
                <Nav.Item key={tab.tab_id || tab.key}>
                  <Nav.Link eventKey={tab.key} onClick={() => setActiveTab(tab.key)} className="text-nowrap">
                    {tab.icon && <Icon icon={tab.icon} className="me-2" />}
                    {tab.label}
                  </Nav.Link>
                </Nav.Item>
              ))}
            </Nav>
          </Card.Header>
          <Card.Body>
            {!merchant ? null : PanelComponent ? (
              <PanelComponent merchant={merchant} editable={editable} onMerchantChanged={loadMerchant} />
            ) : null}
          </Card.Body>
        </Card>
      )}
    </>
  )
}

export default MerchantManagePanel
