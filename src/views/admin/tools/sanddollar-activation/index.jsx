import { useEffect, useState } from 'react'
import { Button, Card, CardBody } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import useCurrentUser from '@/hooks/useCurrentUser'
import { getModulePermission } from '@/utils/modulePermissions'
import { useNotificationContext } from '@/context/useNotificationContext'
import SanddollarTable from './components/SanddollarTable'
import SanddollarActivationModal from './components/SanddollarActivationModal'

const SanddollarActivationPage = () => {
  const currentUser = useCurrentUser()
  const { showNotification } = useNotificationContext()
  const modulePermission = getModulePermission(currentUser, '/tools/sanddollar-activation')
  const canAdd = Boolean(modulePermission.can_add)

  const [merchants, setMerchants] = useState([])
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    ApiService.getSanddollarMerchants()
      .then((data) => setMerchants(Array.isArray(data?.data) ? data.data : []))
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load merchants.', variant: 'danger' }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const load = () => {
    setLoading(true)
    ApiService.getSanddollarAccounts()
      .then((data) => setRows(Array.isArray(data?.data) ? data.data : []))
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load sanddollar accounts.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  return (
    <>
      <PageBreadcrumb title="Sanddollar Activation" subtitle="Tools" />

      <Card>
        <CardBody>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <p className="text-muted small mb-0">Sanddollar pooled wallet list — pair a merchant&apos;s Sand Dollar mobile wallet device.</p>
            {canAdd && (
              <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
                <Icon icon="plus" className="me-1" /> Add Account
              </Button>
            )}
          </div>

          {loading ? <LoadingState message="Loading sanddollar accounts..." /> : <SanddollarTable data={rows} />}
        </CardBody>
      </Card>

      <SanddollarActivationModal
        show={showModal}
        onHide={() => setShowModal(false)}
        merchants={merchants}
        onSaved={() => {
          showNotification({ title: 'Success', message: 'Successfully activated sanddollar account.', variant: 'success' })
          load()
        }}
      />
    </>
  )
}

export default SanddollarActivationPage
