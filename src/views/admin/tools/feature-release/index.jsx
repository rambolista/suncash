import { useEffect, useState } from 'react'
import { Button, Card, CardBody } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import useCurrentUser from '@/hooks/useCurrentUser'
import { getModulePermission } from '@/utils/modulePermissions'
import { useNotificationContext } from '@/context/useNotificationContext'
import FeatureReleaseTable from './components/FeatureReleaseTable'
import FeatureReleaseFormModal from './components/FeatureReleaseFormModal'

const FeatureReleasePage = () => {
  const currentUser = useCurrentUser()
  const { showNotification } = useNotificationContext()
  const modulePermission = getModulePermission(currentUser, '/tools/feature-release')
  const canAdd = Boolean(modulePermission.can_add)
  const canEdit = Boolean(modulePermission.can_edit)

  const [islands, setIslands] = useState([])
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState(null)

  useEffect(() => {
    ApiService.getFeatureReleaseIslands()
      .then((data) => setIslands(Array.isArray(data?.data) ? data.data : []))
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load islands.', variant: 'danger' }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const load = () => {
    setLoading(true)
    ApiService.getFeatureReleases()
      .then((data) => setRows(Array.isArray(data?.data) ? data.data : []))
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load feature releases.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openAdd = () => { setEditTarget(null); setShowModal(true) }
  const openEdit = (row) => { setEditTarget(row); setShowModal(true) }

  return (
    <>
      <PageBreadcrumb title="Feature Release Management" subtitle="Tools" />

      <Card>
        <CardBody>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <p className="text-muted small mb-0">Gate a feature by release date, for everyone or specific islands.</p>
            {canAdd && (
              <Button variant="primary" size="sm" onClick={openAdd}>
                <Icon icon="plus" className="me-1" /> Add Feature
              </Button>
            )}
          </div>

          {loading ? <LoadingState message="Loading feature releases..." /> : (
            <FeatureReleaseTable data={rows} canEdit={canEdit} onEdit={openEdit} />
          )}
        </CardBody>
      </Card>

      <FeatureReleaseFormModal
        show={showModal}
        onHide={() => setShowModal(false)}
        islands={islands}
        initial={editTarget}
        onSubmit={(data) => (editTarget ? ApiService.updateFeatureRelease(editTarget.id, data) : ApiService.createFeatureRelease(data))}
        onSaved={() => {
          showNotification({ title: 'Success', message: 'Feature release has been saved.', variant: 'success' })
          load()
        }}
      />
    </>
  )
}

export default FeatureReleasePage
