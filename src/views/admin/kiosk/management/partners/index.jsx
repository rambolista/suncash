import { useEffect, useState } from 'react'
import { Button, Card, CardBody } from 'react-bootstrap'
import { useLocation, useNavigate, useParams } from 'react-router'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import useCurrentUser from '@/hooks/useCurrentUser'
import { getModulePermission } from '@/utils/modulePermissions'
import { useNotificationContext } from '@/context/useNotificationContext'
import ConfirmActionModal from '@/views/admin/merchants/components/ConfirmActionModal'
import PartnersTable from './components/PartnersTable'
import PartnerFormModal from './components/PartnerFormModal'

const KioskPartnersPage = () => {
  const { branchId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const currentUser = useCurrentUser()
  const { showNotification } = useNotificationContext()
  const modulePermission = getModulePermission(currentUser, '/kiosk/management')
  const canAdd = Boolean(modulePermission.can_add)
  const canEdit = Boolean(modulePermission.can_edit)
  const canDelete = Boolean(modulePermission.can_delete)

  const branch = location.state?.branch
  const [partners, setPartners] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingPartner, setEditingPartner] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const load = () => {
    setLoading(true)
    ApiService.getKioskPartners(branchId)
      .then((data) => setPartners(Array.isArray(data?.data) ? data.data : []))
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load partners.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [branchId])

  return (
    <>
      <PageBreadcrumb title="Add Partner / Settlement / Commission" subtitle={branch ? `${branch.name} (${branch.code})` : 'Kiosk Management'} />

      <Card>
        <CardBody>
          <div className="d-flex justify-content-between mb-3">
            <Button variant="outline-secondary" onClick={() => navigate('/kiosk/management')}>
              <Icon icon="arrow-left" className="me-1" /> Back
            </Button>
            {canAdd && (
              <Button variant="primary" onClick={() => { setEditingPartner(null); setShowForm(true) }}>
                <Icon icon="plus" className="me-1" /> Add Partner
              </Button>
            )}
          </div>

          {loading ? <LoadingState message="Loading partners..." /> : (
            <PartnersTable
              data={partners}
              canEdit={canEdit}
              canDelete={canDelete}
              onEdit={(partner) => { setEditingPartner(partner); setShowForm(true) }}
              onDelete={(partner) => setDeleteTarget(partner)}
            />
          )}
        </CardBody>
      </Card>

      <PartnerFormModal
        show={showForm}
        onHide={() => setShowForm(false)}
        branchId={Number(branchId)}
        partner={editingPartner}
        onSaved={load}
      />

      <ConfirmActionModal
        show={Boolean(deleteTarget)}
        onHide={() => setDeleteTarget(null)}
        title="Delete Partner"
        message={deleteTarget ? `Are you sure you want to delete partner "${deleteTarget.first_name} ${deleteTarget.last_name}"? This cannot be undone.` : ''}
        confirmLabel="Delete"
        confirmVariant="danger"
        successMessage="Partner has been deleted."
        onConfirm={() => ApiService.deleteKioskPartner(deleteTarget.id)}
        onDone={load}
      />
    </>
  )
}

export default KioskPartnersPage
