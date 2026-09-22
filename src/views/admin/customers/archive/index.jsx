import { useEffect, useMemo, useState } from 'react'
import { Button, Card, Spinner } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import Icon from '@/components/wrappers/Icon'
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

  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [columnFilterInputs, setColumnFilterInputs] = useState({})
  const [columnFilters, setColumnFilters] = useState({})
  const [rows, setRows] = useState([])
  const [pageInfo, setPageInfo] = useState({ current_page: 1, last_page: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const [everLoaded, setEverLoaded] = useState(false)
  const [selectedId, setSelectedId] = useState(null)

  // Debounce the search box and column filters — the actual request only fires once typing pauses.
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 400)
    return () => clearTimeout(timeout)
  }, [searchInput])

  useEffect(() => {
    const timeout = setTimeout(() => {
      setColumnFilters(columnFilterInputs)
      setPage(1)
    }, 400)
    return () => clearTimeout(timeout)
  }, [columnFilterInputs])

  const load = () => {
    setLoading(true)
    ApiService.getCustomerArchiveList(page, search, columnFilters)
      .then((data) => {
        setRows(data?.data || [])
        setPageInfo({ current_page: data?.current_page || 1, last_page: data?.last_page || 1, total: data?.total || 0 })
      })
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load customers.', variant: 'danger' }))
      .finally(() => { setLoading(false); setEverLoaded(true) })
  }

  useEffect(() => { load() }, [page, search, columnFilters]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleColumnFilterChange = (key, value) => setColumnFilterInputs((prev) => ({ ...prev, [key]: value }))

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
          {!everLoaded ? (
            <LoadingState />
          ) : (
            <>
              <div className="position-relative">
                <div style={{ opacity: loading ? 0.4 : 1 }}>
                  <ArchiveResultsTable
                    data={rows}
                    onView={(row) => setSelectedId(row.id)}
                    onColumnFilterChange={handleColumnFilterChange}
                    searchValue={searchInput}
                    onSearchChange={setSearchInput}
                  />
                </div>
                {loading && (
                  <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center">
                    <Spinner animation="border" variant="primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </Spinner>
                  </div>
                )}
              </div>
              {pageInfo.last_page > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <span className="text-muted small">
                    Page {pageInfo.current_page} of {pageInfo.last_page} — {pageInfo.total} total
                  </span>
                  <div className="d-flex gap-2">
                    <Button size="sm" variant="outline-secondary" disabled={loading || pageInfo.current_page <= 1} onClick={() => setPage((p) => p - 1)}>
                      <Icon icon="chevron-left" className="me-1" /> Previous
                    </Button>
                    <Button size="sm" variant="outline-secondary" disabled={loading || pageInfo.current_page >= pageInfo.last_page} onClick={() => setPage((p) => p + 1)}>
                      Next <Icon icon="chevron-right" className="ms-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>
    </>
  )
}

export default CustomerArchivePage
