import { useEffect, useState } from 'react'
import { Card } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'
import DocumentsTable from './components/DocumentsTable'
import DocumentDetailPage from './components/DocumentDetailPage'

const DocumentsPage = () => {
  const { showNotification } = useNotificationContext()

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState(null)

  const load = () => {
    setLoading(true)
    ApiService.getCustomerDocuments()
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load document submissions.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  if (selectedId) {
    return (
      <DocumentDetailPage
        requestId={selectedId}
        onBack={() => setSelectedId(null)}
      />
    )
  }

  return (
    <>
      <PageBreadcrumb title="Documents" subtitle="Customers" />
      <Card>
        <Card.Body>
          {loading ? (
            <LoadingState />
          ) : (
            <DocumentsTable
              data={rows}
              onView={(row) => setSelectedId(row.id)}
            />
          )}
        </Card.Body>
      </Card>
    </>
  )
}

export default DocumentsPage
