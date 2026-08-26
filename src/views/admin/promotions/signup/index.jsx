import { useEffect, useMemo, useState } from 'react'
import { Button, Card } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import useCurrentUser from '@/hooks/useCurrentUser'
import { getModulePermission } from '@/utils/modulePermissions'
import { useNotificationContext } from '@/context/useNotificationContext'
import GeoPromoTable from './components/GeoPromoTable'
import GeoPromoForm from './components/GeoPromoForm'
import GeoPromoDeleteConfirmModal from './components/GeoPromoDeleteConfirmModal'

const SignUpPromotionPage = () => {
  const currentUser = useCurrentUser()
  const { showNotification } = useNotificationContext()
  const modulePermission = useMemo(() => getModulePermission(currentUser, '/promotions/signup'), [currentUser])

  const [promos, setPromos] = useState([])
  const [countries, setCountries] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('list') // 'list' | 'create' | 'edit' | 'view'
  const [selectedPromo, setSelectedPromo] = useState(null)
  const [deletePromo, setDeletePromo] = useState(null)

  const load = () => {
    setLoading(true)
    ApiService.getGeoPromos()
      .then((data) => setPromos(Array.isArray(data) ? data : []))
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load sign up promotion zones.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    ApiService.getPromoCountries().then((data) => setCountries(Array.isArray(data) ? data : []))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const canAdd = Boolean(modulePermission.can_add)
  const canEdit = Boolean(modulePermission.can_edit)
  const canDelete = Boolean(modulePermission.can_delete)

  const openAdd = () => { setSelectedPromo(null); setView('create') }
  const openView = (promo) => { setSelectedPromo(promo); setView('view') }
  const openEdit = (promo) => { setSelectedPromo(promo); setView('edit') }

  const backToList = () => {
    setSelectedPromo(null)
    setView('list')
    load()
  }

  if (view === 'create' || view === 'edit' || view === 'view') {
    return (
      <>
        <PageBreadcrumb title={view === 'view' ? 'View Zone' : view === 'edit' ? 'Edit Zone' : 'Add Zone'} subtitle="Sign Up Promotion" />
        <GeoPromoForm
          promo={view === 'create' ? null : selectedPromo}
          readOnly={view === 'view'}
          countries={countries}
          onBack={backToList}
          onSaved={backToList}
        />
      </>
    )
  }

  return (
    <>
      <PageBreadcrumb title="Sign Up Promotion" subtitle="Promotions" />
      <Card>
        <Card.Header className="d-flex align-items-center justify-content-between">
          <div>
            <h5 className="mb-1">Sign Up Promotion Zones</h5>
            <p className="text-muted mb-0 small">New customers who sign up with a location inside one of these zones automatically receive the zone&apos;s bonus.</p>
          </div>
          {canAdd && (
            <Button onClick={openAdd}><Icon icon="plus" className="me-1" /> Add Zone</Button>
          )}
        </Card.Header>
        <Card.Body>
          {loading ? (
            <LoadingState />
          ) : (
            <GeoPromoTable
              data={promos}
              canEdit={canEdit}
              canDelete={canDelete}
              onView={openView}
              onEdit={openEdit}
              onDelete={setDeletePromo}
            />
          )}
        </Card.Body>
      </Card>

      <GeoPromoDeleteConfirmModal
        show={!!deletePromo}
        onHide={() => setDeletePromo(null)}
        promo={deletePromo}
        onDone={load}
      />
    </>
  )
}

export default SignUpPromotionPage
