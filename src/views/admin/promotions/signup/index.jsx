import { useEffect, useMemo, useState } from 'react'
import { Button, Card, Table } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import useCurrentUser from '@/hooks/useCurrentUser'
import { getModulePermission } from '@/utils/modulePermissions'
import { useNotificationContext } from '@/context/useNotificationContext'
import GeoPromoModal from './components/GeoPromoModal'

const SignUpPromotionPage = () => {
  const currentUser = useCurrentUser()
  const { showNotification } = useNotificationContext()
  const modulePermission = useMemo(() => getModulePermission(currentUser, '/promotions/signup'), [currentUser])

  const [promos, setPromos] = useState([])
  const [countries, setCountries] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalPromo, setModalPromo] = useState(undefined)
  const [modalReadOnly, setModalReadOnly] = useState(false)
  const [showModal, setShowModal] = useState(false)

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

  const openAdd = () => { setModalPromo(null); setModalReadOnly(false); setShowModal(true) }
  const openView = (promo) => { setModalPromo(promo); setModalReadOnly(true); setShowModal(true) }
  const openEdit = (promo) => { setModalPromo(promo); setModalReadOnly(false); setShowModal(true) }

  const handleDelete = async (promo) => {
    try {
      await ApiService.deleteGeoPromo(promo.id)
      showNotification({ title: 'Success', message: 'Sign up promotion zone removed successfully.', variant: 'success' })
      load()
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.message || 'Failed to remove zone.', variant: 'danger' })
    }
  }

  const canEdit = Boolean(modulePermission.can_edit)
  const canDelete = Boolean(modulePermission.can_delete)

  return (
    <>
      <PageBreadcrumb title="Sign Up Promotion" subtitle="Promotions" />
      <Card>
        <Card.Header className="d-flex align-items-center justify-content-between">
          <div>
            <h5 className="mb-1">Sign Up Promotion Zones</h5>
            <p className="text-muted mb-0 small">New customers who sign up with a location inside one of these zones automatically receive the zone&apos;s bonus.</p>
          </div>
          {canEdit && (
            <Button onClick={openAdd}><Icon icon="plus" className="me-1" /> Add Zone</Button>
          )}
        </Card.Header>
        <Card.Body>
          {loading ? (
            <LoadingState />
          ) : (
            <div className="table-responsive">
              <Table className="align-middle mb-0">
                <thead className="thead-sm text-uppercase fs-xxs">
                  <tr>
                    <th>Created</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Country</th>
                    <th>Date From</th>
                    <th>Date To</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {promos.map((promo) => (
                    <tr key={promo.id}>
                      <td className="text-nowrap">{promo.create_date}</td>
                      <td>{promo.promo_description}</td>
                      <td>${Number(promo.promo_amount).toLocaleString()}</td>
                      <td>{promo.promo_country}</td>
                      <td className="text-nowrap">{promo.date_from}</td>
                      <td className="text-nowrap">{promo.date_to}</td>
                      <td className="text-end">
                        <div className="d-flex gap-1 justify-content-end">
                          <Button variant="light" size="sm" className="btn-icon rounded-circle" title="View" onClick={() => openView(promo)}>
                            <Icon icon="eye" className="fs-lg" />
                          </Button>
                          {canEdit && (
                            <Button variant="light" size="sm" className="btn-icon rounded-circle" title="Edit" onClick={() => openEdit(promo)}>
                              <Icon icon="edit" className="fs-lg" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button variant="light" size="sm" className="btn-icon rounded-circle" title="Remove" onClick={() => handleDelete(promo)}>
                              <Icon icon="trash" className="fs-lg text-danger" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!promos.length && (
                    <tr><td colSpan={7} className="text-center text-muted py-4">No sign up promotion zones found.</td></tr>
                  )}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      <GeoPromoModal
        show={showModal}
        onHide={() => setShowModal(false)}
        promo={modalPromo}
        readOnly={modalReadOnly}
        countries={countries}
        onSaved={load}
      />
    </>
  )
}

export default SignUpPromotionPage
