import { useEffect, useState } from 'react'
import { Button, Card, CardBody } from 'react-bootstrap'
import { useNavigate } from 'react-router'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import useCurrentUser from '@/hooks/useCurrentUser'
import { getModulePermission } from '@/utils/modulePermissions'
import { useNotificationContext } from '@/context/useNotificationContext'
import ConfirmActionModal from '@/views/admin/merchants/components/ConfirmActionModal'
import BankAccountsTable from './components/BankAccountsTable'
import BankAccountFormModal from './components/BankAccountFormModal'

const KioskBankAccountsPage = () => {
  const navigate = useNavigate()
  const currentUser = useCurrentUser()
  const { showNotification } = useNotificationContext()
  const modulePermission = getModulePermission(currentUser, '/kiosk/management')
  const canAdd = Boolean(modulePermission.can_add)
  const canEdit = Boolean(modulePermission.can_edit)
  const canDelete = Boolean(modulePermission.can_delete)

  const [accounts, setAccounts] = useState([])
  const [branches, setBranches] = useState([])
  const [banks, setBanks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingAccount, setEditingAccount] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const load = () => {
    setLoading(true)
    ApiService.getKioskBankAccounts()
      .then((data) => {
        setAccounts(Array.isArray(data?.data) ? data.data : [])
        setBranches(Array.isArray(data?.branches) ? data.branches : [])
        setBanks(Array.isArray(data?.banks) ? data.banks : [])
      })
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load bank accounts.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  return (
    <>
      <PageBreadcrumb title="Manage Bank Account" subtitle="Kiosk Management" />

      <Card>
        <CardBody>
          <div className="d-flex justify-content-between mb-3">
            <Button variant="outline-secondary" onClick={() => navigate('/kiosk/management')}>
              <Icon icon="arrow-left" className="me-1" /> Back
            </Button>
            {canAdd && (
              <Button variant="primary" onClick={() => { setEditingAccount(null); setShowForm(true) }}>
                <Icon icon="plus" className="me-1" /> Add Bank
              </Button>
            )}
          </div>

          {loading ? <LoadingState message="Loading bank accounts..." /> : (
            <BankAccountsTable
              data={accounts}
              canEdit={canEdit}
              canDelete={canDelete}
              onEdit={(account) => { setEditingAccount(account); setShowForm(true) }}
              onDelete={(account) => setDeleteTarget(account)}
            />
          )}
        </CardBody>
      </Card>

      <BankAccountFormModal
        show={showForm}
        onHide={() => setShowForm(false)}
        account={editingAccount}
        branches={branches}
        banks={banks}
        onSaved={load}
      />

      <ConfirmActionModal
        show={Boolean(deleteTarget)}
        onHide={() => setDeleteTarget(null)}
        title="Delete Bank Record"
        message="Are you sure you want to delete this bank record?"
        confirmLabel="Delete"
        confirmVariant="danger"
        successMessage="Deleted successfully."
        onConfirm={() => ApiService.deleteKioskBankAccount(deleteTarget.id)}
        onDone={load}
      />
    </>
  )
}

export default KioskBankAccountsPage
