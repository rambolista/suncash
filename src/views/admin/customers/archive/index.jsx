import { useEffect, useMemo, useState } from 'react'
import { Card } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import ApiService from '@/services/ApiService'
import useCurrentUser from '@/hooks/useCurrentUser'
import { getModulePermission } from '@/utils/modulePermissions'
import { useNotificationContext } from '@/context/useNotificationContext'
import ArchiveResultsTable from './components/ArchiveResultsTable'
import ArchiveDetailPage from './components/ArchiveDetailPage'

const CustomerArchivePage = () => {
  const currentUser = useCurrentUser()
  const { showNotification } = useNotificationContext()
  const modulePermission = useMemo(() => getModulePermission(currentUser, '/customers/archive'), [currentUser])
  const canArchive = Boolean(modulePermission.can_delete)

  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState(null)

  const load = () => {
    setLoading(true)
    ApiService.getCustomerArchiveList()
      .then((data) => setCustomers(Array.isArray(data?.data) ? data.data : []))
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load customers.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  if (selectedId) {
    return (
      <ArchiveDetailPage
        customerId={selectedId}
        canArchive={canArchive}
        onBack={() => { setSelectedId(null); load() }}
      />
    )
  }

  return (
    <>
      <PageBreadcrumb title="Archive" subtitle="Customers" />
      <Card>
        <Card.Header>
          <h5 className="mb-0">Customers</h5>
          <p className="text-muted mb-0 small">Search any column below to find a customer.</p>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <LoadingState />
          ) : (
            <ArchiveResultsTable data={customers} onView={(row) => setSelectedId(row.id)} />
          )}
        </Card.Body>
      </Card>
    </>
  )
}

export default CustomerArchivePage
