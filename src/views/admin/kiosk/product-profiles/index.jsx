import { useEffect, useState } from 'react'
import { Button, Card, CardBody, Col, Row } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import useCurrentUser from '@/hooks/useCurrentUser'
import { getModulePermission } from '@/utils/modulePermissions'
import { useNotificationContext } from '@/context/useNotificationContext'
import ConfirmActionModal from '@/views/admin/merchants/components/ConfirmActionModal'
import TerminalsTable from './components/TerminalsTable'
import ServicesModal from './components/ServicesModal'
import ProductProfileModal from './components/ProductProfileModal'
import ModuleSettingsModal from './components/ModuleSettingsModal'
import FeatureSettingsModal from './components/FeatureSettingsModal'

const ProductProfilesPage = () => {
  const currentUser = useCurrentUser()
  const { showNotification } = useNotificationContext()
  const modulePermission = getModulePermission(currentUser, '/kiosk/product-profiles')
  const canView = Boolean(modulePermission.can_view)
  const canAdd = Boolean(modulePermission.can_add)
  const canEdit = Boolean(modulePermission.can_edit)
  const canExecute = Boolean(modulePermission.can_execute)

  const [terminals, setTerminals] = useState([])
  const [loading, setLoading] = useState(true)
  const [servicesTarget, setServicesTarget] = useState(null)
  const [productProfileTarget, setProductProfileTarget] = useState(null)
  const [statusTarget, setStatusTarget] = useState(null)
  const [showModuleSettings, setShowModuleSettings] = useState(false)
  const [showFeatureSettings, setShowFeatureSettings] = useState(false)

  const load = () => {
    setLoading(true)
    ApiService.getKioskProductProfiles()
      .then((data) => setTerminals(Array.isArray(data?.terminals) ? data.terminals : []))
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load kiosk terminals.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  return (
    <>
      <PageBreadcrumb title="Product Profiles" subtitle="Kiosk" />

      <Card>
        <CardBody>
          <Row className="g-3 align-items-end mb-3">
            <Col />
            {canView && (
              <Col md="auto">
                <Button variant="outline-primary" onClick={() => setShowModuleSettings(true)}>
                  <Icon icon="settings" className="me-1" /> Product Profile Setting
                </Button>
              </Col>
            )}
            {canView && (
              <Col md="auto">
                <Button variant="outline-primary" onClick={() => setShowFeatureSettings(true)}>
                  <Icon icon="adjustments" className="me-1" /> Kiosk Features Setting
                </Button>
              </Col>
            )}
          </Row>

          {loading ? <LoadingState message="Loading kiosk terminals..." /> : (
            <TerminalsTable
              terminals={terminals}
              canAdd={canAdd}
              canEdit={canEdit}
              canExecute={canExecute}
              onServices={setServicesTarget}
              onProductProfile={setProductProfileTarget}
              onToggleStatus={setStatusTarget}
            />
          )}
        </CardBody>
      </Card>

      <ServicesModal
        show={Boolean(servicesTarget)}
        onHide={() => setServicesTarget(null)}
        terminal={servicesTarget}
        onSaved={load}
      />

      <ProductProfileModal
        show={Boolean(productProfileTarget)}
        onHide={() => setProductProfileTarget(null)}
        terminal={productProfileTarget}
        onSaved={load}
      />

      <ModuleSettingsModal
        show={showModuleSettings}
        onHide={() => setShowModuleSettings(false)}
        canEdit={canEdit}
        onSaved={load}
      />

      <FeatureSettingsModal
        show={showFeatureSettings}
        onHide={() => setShowFeatureSettings(false)}
        canEdit={canEdit}
      />

      <ConfirmActionModal
        show={Boolean(statusTarget)}
        onHide={() => setStatusTarget(null)}
        title={statusTarget && statusTarget.status !== 'D' ? 'Disable Kiosk Terminal' : 'Enable Kiosk Terminal'}
        message={statusTarget
          ? (statusTarget.status !== 'D'
            ? `Are you sure you want to disable "${statusTarget.name}"? Its Services and Product Profile actions will be locked while disabled.`
            : `Are you sure you want to enable "${statusTarget.name}"?`)
          : ''}
        confirmLabel={statusTarget && statusTarget.status !== 'D' ? 'Disable' : 'Enable'}
        confirmVariant={statusTarget && statusTarget.status !== 'D' ? 'warning' : 'success'}
        successMessage="Kiosk terminal status has been updated."
        onConfirm={() => (statusTarget.status !== 'D'
          ? ApiService.disableKioskProductProfileTerminal(statusTarget.id)
          : ApiService.enableKioskProductProfileTerminal(statusTarget.id))}
        onDone={load}
      />
    </>
  )
}

export default ProductProfilesPage
