import { useEffect, useMemo, useState } from 'react'
import { Card } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import ApiService from '@/services/ApiService'
import useCurrentUser from '@/hooks/useCurrentUser'
import { getModulePermission } from '@/utils/modulePermissions'
import { useNotificationContext } from '@/context/useNotificationContext'
import MerchantSearchTable from './components/MerchantSearchTable'
import StatementDetailPage from './components/StatementDetailPage'

const MerchantStatementPage = () => {
  const currentUser = useCurrentUser()
  const { showNotification } = useNotificationContext()
  const modulePermission = useMemo(() => getModulePermission(currentUser, '/merchants/statement'), [currentUser])

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState(null)

  const canEdit = Boolean(modulePermission.can_edit)

  const load = () => {
    setLoading(true)
    ApiService.getMerchantStatementList()
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load merchants.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  if (selectedId) {
    return (
      <StatementDetailPage
        merchantId={selectedId}
        canEdit={canEdit}
        onBack={() => setSelectedId(null)}
      />
    )
  }

  return (
    <>
      <PageBreadcrumb title="Merchant Statement" subtitle="Merchants" />
      <Card>
        <Card.Body>
          {loading ? (
            <LoadingState />
          ) : (
            <MerchantSearchTable
              data={rows}
              onView={(row) => setSelectedId(row.id)}
            />
          )}
        </Card.Body>
      </Card>
    </>
  )
}

export default MerchantStatementPage
