import { useState } from 'react'
import { Alert, Button, Card, Nav } from 'react-bootstrap'
import Icon from '@/components/wrappers/Icon'
import { BusinessFields } from './BusinessInfoStep'
import { FeesFields } from './FeesStep'
import { SettlementFields } from './SettlementStep'
import { DeliveryFields } from './DeliveryStep'
import { AlertsFields } from './AlertsStep'
import { OtherFields } from './OtherInfoStep'
import { EDIT_TABS } from './wizardConstants'

// Free-navigation tab nav for edit mode.
const EditTabsHeader = ({ activeTab, onSelect }) => (
  <div className="customer-profile-tabs-scroll">
    <Nav variant="tabs" activeKey={activeTab} onSelect={(key) => key && onSelect(key)} className="nav-bordered nav-bordered-primary customer-profile-tabs flex-nowrap">
      {EDIT_TABS.map((tab) => (
        <Nav.Item key={tab.key}>
          <Nav.Link eventKey={tab.key} className="d-flex align-items-center gap-2">
            <span
              className="rounded-circle d-inline-flex align-items-center justify-content-center flex-shrink-0 bg-primary-subtle"
              style={{ width: 32, height: 32 }}
            >
              <Icon icon={tab.icon} className="text-primary" style={{ fontSize: '1rem' }} />
            </span>
            <span className="fw-semibold text-nowrap">{tab.label}</span>
          </Nav.Link>
        </Nav.Item>
      ))}
    </Nav>
  </div>
)

// Editing is free-navigation, not a linear wizard: only the fields on the
// tab you're currently looking at gate Save. Other tabs may still carry
// stale/incomplete legacy data, but that's not this edit's concern.
export const EditMerchantTabs = (props) => {
  const { formError, submitting, onCancel, onSubmit, validateStep } = props
  const [activeTab, setActiveTab] = useState('business')

  const handleSave = () => {
    if (!validateStep(activeTab)) return
    onSubmit()
  }

  return (
    <Card>
      <Card.Header className="border-0 pb-0">
        <div>
          <h5 className="mb-1">Edit Merchant</h5>
          <p className="text-muted small mb-3">Jump to any tab and update the fields you need — changes save together.</p>
        </div>
      </Card.Header>
      <Card.Header className="px-3 pt-0 pb-0 bg-body">
        <EditTabsHeader activeTab={activeTab} onSelect={setActiveTab} />
      </Card.Header>
      <Card.Body>
        {formError && <Alert variant="danger">{formError}</Alert>}
        <div className="pt-2">
          {activeTab === 'business' && <BusinessFields {...props} />}
          {activeTab === 'fees' && <FeesFields {...props} />}
          {activeTab === 'settlement' && <SettlementFields {...props} />}
          {activeTab === 'delivery' && <DeliveryFields {...props} />}
          {activeTab === 'alerts' && <AlertsFields {...props} />}
          {activeTab === 'other' && <OtherFields {...props} />}
        </div>
      </Card.Body>
      <Card.Footer className="d-flex justify-content-between align-items-center">
        <Button variant="light" onClick={onCancel} disabled={submitting}>Cancel</Button>
        <Button variant="primary" onClick={handleSave} disabled={submitting}>
          <Icon icon="check" className="me-1" /> {submitting ? 'Saving…' : 'Save Changes'}
        </Button>
      </Card.Footer>
    </Card>
  )
}
