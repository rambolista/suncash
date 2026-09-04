import { useEffect, useState } from 'react'
import { Button, Card, CardBody, Col, Form, Row } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import useCurrentUser from '@/hooks/useCurrentUser'
import { getModulePermission } from '@/utils/modulePermissions'
import { useNotificationContext } from '@/context/useNotificationContext'
import ConfirmActionModal from '@/views/admin/merchants/components/ConfirmActionModal'
import CommissionProfileTable from './components/CommissionProfileTable'
import AddProfileModal from './components/AddProfileModal'
import CopyProfileModal from './components/CopyProfileModal'
import EditRowModal from './components/EditRowModal'

const CommissionProfilesPage = () => {
  const currentUser = useCurrentUser()
  const { showNotification } = useNotificationContext()
  const modulePermission = getModulePermission(currentUser, '/kiosk/commission-profiles')
  const canAdd = Boolean(modulePermission.can_add)
  const canEdit = Boolean(modulePermission.can_edit)
  const canDelete = Boolean(modulePermission.can_delete)

  const [profiles, setProfiles] = useState([])
  const [selectedProfile, setSelectedProfile] = useState('')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [rowsLoading, setRowsLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showCopyModal, setShowCopyModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingRow, setEditingRow] = useState(null)

  const loadProfiles = (preferredSelection) => {
    setLoading(true)
    ApiService.getKioskCommissionProfiles()
      .then((data) => {
        const names = Array.isArray(data?.profiles) ? data.profiles : []
        setProfiles(names)
        setSelectedProfile(preferredSelection && names.includes(preferredSelection) ? preferredSelection : (names[0] || ''))
      })
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load commission profiles.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  const loadRows = (profileName) => {
    if (!profileName) {
      setRows([])
      return
    }
    setRowsLoading(true)
    ApiService.getKioskCommissionProfile(profileName)
      .then((data) => setRows(Array.isArray(data?.data) ? data.data : []))
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load commission profile.', variant: 'danger' }))
      .finally(() => setRowsLoading(false))
  }

  useEffect(() => { loadProfiles() }, [])
  useEffect(() => { loadRows(selectedProfile) }, [selectedProfile])

  return (
    <>
      <PageBreadcrumb title="Commission Profiles" subtitle="Kiosk" />

      <Card>
        <CardBody>
          <Row className="g-3 align-items-end mb-3">
            <Col md={4}>
              <Form.Label>Profile</Form.Label>
              <Form.Select value={selectedProfile} onChange={(e) => setSelectedProfile(e.target.value)}>
                <option value="">Select a profile...</option>
                {profiles.map((name) => <option key={name} value={name}>{name}</option>)}
              </Form.Select>
            </Col>
            <Col />
            {canAdd && (
              <Col md="auto">
                <Button variant="outline-primary" onClick={() => setShowCopyModal(true)} disabled={!selectedProfile}>
                  <Icon icon="copy" className="me-1" /> Copy Profile
                </Button>
              </Col>
            )}
            {canDelete && (
              <Col md="auto">
                <Button variant="outline-danger" onClick={() => setShowDeleteModal(true)} disabled={!selectedProfile}>
                  <Icon icon="trash" className="me-1" /> Delete Profile
                </Button>
              </Col>
            )}
            {canAdd && (
              <Col md="auto">
                <Button variant="primary" onClick={() => setShowAddModal(true)}>
                  <Icon icon="plus" className="me-1" /> Add Profile
                </Button>
              </Col>
            )}
          </Row>

          {loading ? <LoadingState message="Loading commission profiles..." /> : (
            !selectedProfile ? (
              <div className="text-center text-muted py-4">Select a profile to view its commission rows.</div>
            ) : rowsLoading ? <LoadingState message="Loading profile..." /> : (
              <CommissionProfileTable rows={rows} canEdit={canEdit} onEdit={setEditingRow} />
            )
          )}
        </CardBody>
      </Card>

      <AddProfileModal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        onSaved={(name) => loadProfiles(name)}
      />

      <CopyProfileModal
        show={showCopyModal}
        onHide={() => setShowCopyModal(false)}
        sourceProfileName={selectedProfile}
        onSaved={(name) => loadProfiles(name)}
      />

      <ConfirmActionModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        title="Delete Commission Profile"
        message={selectedProfile ? `Are you sure you want to delete the "${selectedProfile}" commission profile? This cannot be undone.` : ''}
        confirmLabel="Delete"
        confirmVariant="danger"
        successMessage="Commission profile has been deleted."
        onConfirm={async () => {
          try {
            return await ApiService.deleteKioskCommissionProfile(selectedProfile)
          } catch (err) {
            throw { message: err?.errors?.profile_name?.[0] || err?.message || 'Failed to delete commission profile.' }
          }
        }}
        onDone={() => loadProfiles()}
      />

      <EditRowModal
        show={Boolean(editingRow)}
        onHide={() => setEditingRow(null)}
        row={editingRow}
        onSaved={() => loadRows(selectedProfile)}
      />
    </>
  )
}

export default CommissionProfilesPage
