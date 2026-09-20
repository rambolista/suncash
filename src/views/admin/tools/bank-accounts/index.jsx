import { useEffect, useState } from 'react'
import { Button, Card, CardBody } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import useCurrentUser from '@/hooks/useCurrentUser'
import { getModulePermission } from '@/utils/modulePermissions'
import { useNotificationContext } from '@/context/useNotificationContext'
import BankAccountsTable from './components/BankAccountsTable'
import BankAccountFormModal from './components/BankAccountFormModal'

const BankAccountsPage = () => {
  const currentUser = useCurrentUser()
  const { showNotification } = useNotificationContext()
  const modulePermission = getModulePermission(currentUser, '/tools/bank-accounts')
  const canAdd = Boolean(modulePermission.can_add)
  const canEdit = Boolean(modulePermission.can_edit)

  const [banks, setBanks] = useState([])
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState(null)

  useEffect(() => {
    ApiService.getBankAccountBanks()
      .then((data) => setBanks(Array.isArray(data?.data) ? data.data : []))
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load banks.', variant: 'danger' }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const load = () => {
    setLoading(true)
    ApiService.getBankAccounts()
      .then((data) => setRows(Array.isArray(data?.data) ? data.data : []))
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load bank accounts.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openAdd = () => { setEditTarget(null); setShowModal(true) }
  const openEdit = (row) => { setEditTarget(row); setShowModal(true) }

  return (
    <>
      <PageBreadcrumb title="Bank Accounts" subtitle="Tools" />

      <Card>
        <CardBody>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <p className="text-muted small mb-0">SunCash&apos;s own house bank accounts, selectable when processing a Cheque settlement.</p>
            {canAdd && (
              <Button variant="primary" size="sm" onClick={openAdd}>
                <Icon icon="plus" className="me-1" /> Add New
              </Button>
            )}
          </div>

          {loading ? <LoadingState message="Loading bank accounts..." /> : (
            <BankAccountsTable data={rows} canEdit={canEdit} onEdit={openEdit} />
          )}
        </CardBody>
      </Card>

      <BankAccountFormModal
        show={showModal}
        onHide={() => setShowModal(false)}
        banks={banks}
        initial={editTarget}
        onSubmit={(data) => (editTarget ? ApiService.updateBankAccount(editTarget.id, data) : ApiService.createBankAccount(data))}
        onSaved={() => {
          showNotification({ title: 'Success', message: 'Bank account has been saved.', variant: 'success' })
          load()
        }}
      />
    </>
  )
}

export default BankAccountsPage
