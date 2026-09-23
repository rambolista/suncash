import { useEffect, useMemo, useState } from 'react'
import { Badge, Button, Card, Nav, Spinner } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import useCurrentUser from '@/hooks/useCurrentUser'
import { getModulePermission } from '@/utils/modulePermissions'
import { useNotificationContext } from '@/context/useNotificationContext'
import SettlementsTable from './components/SettlementsTable'
import SettlementDetailPage from './components/SettlementDetailPage'

const TABS = [
  { key: 'pending', label: 'Pending', icon: 'clock' },
  { key: 'approved', label: 'Processed', icon: 'circle-check' },
  { key: 'rejected', label: 'Rejected', icon: 'circle-x' },
]

const STATUS_BY_TAB = { pending: 'P', approved: 'A', rejected: 'R' }

const triggerDownload = (blob, filename) => {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

const MerchantSettlementsPage = () => {
  const currentUser = useCurrentUser()
  const { showNotification } = useNotificationContext()
  const modulePermission = useMemo(() => getModulePermission(currentUser, '/merchants/settlements'), [currentUser])

  const [tab, setTab] = useState('pending')
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [columnFilterInputs, setColumnFilterInputs] = useState({})
  const [columnFilters, setColumnFilters] = useState({})
  const [rows, setRows] = useState([])
  const [pageInfo, setPageInfo] = useState({ current_page: 1, last_page: 1, total: 0 })
  const [totals, setTotals] = useState({ pending: 0, approved: 0, rejected: 0 })
  const [loading, setLoading] = useState(true)
  const [everLoaded, setEverLoaded] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [exporting, setExporting] = useState('')

  const canApprove = Boolean(modulePermission.can_approve)
  const canEdit = Boolean(modulePermission.can_edit)

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

  const handleExport = async (format) => {
    setExporting(format)
    try {
      const { blob, filename } = await ApiService.exportMerchantSettlements(STATUS_BY_TAB[tab], format)
      triggerDownload(blob, filename)
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.message || `Failed to export ${format.toUpperCase()}.`, variant: 'danger' })
    } finally {
      setExporting('')
    }
  }

  const load = () => {
    setLoading(true)
    ApiService.getMerchantSettlements(tab, page, search, columnFilters)
      .then((data) => {
        setRows(data?.data || [])
        setPageInfo({ current_page: data?.current_page || 1, last_page: data?.last_page || 1, total: data?.total || 0 })
        setTotals({ pending: data?.counts?.pending || 0, approved: data?.counts?.approved || 0, rejected: data?.counts?.rejected || 0 })
      })
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load settlements.', variant: 'danger' }))
      .finally(() => { setLoading(false); setEverLoaded(true) })
  }

  useEffect(() => { load() }, [tab, page, search, columnFilters]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleColumnFilterChange = (key, value) => setColumnFilterInputs((prev) => ({ ...prev, [key]: value }))

  const changeTab = (key) => {
    if (key === tab) return
    setTab(key)
    setPage(1)
    setColumnFilterInputs({})
    setColumnFilters({})
  }

  if (selectedId) {
    return (
      <SettlementDetailPage
        settlementId={selectedId}
        canApprove={canApprove}
        canEdit={canEdit}
        onBack={() => { setSelectedId(null); load() }}
      />
    )
  }

  return (
    <>
      <PageBreadcrumb title="Merchant Settlements" subtitle="Merchants" />
      <Card>
        <Card.Header className="px-3 pt-3 pb-0 bg-body">
          <div className="customer-profile-tabs-scroll">
            <Nav variant="tabs" activeKey={tab} onSelect={(key) => key && changeTab(key)} className="nav-bordered nav-bordered-primary customer-profile-tabs flex-nowrap">
              {TABS.map((t) => {
                const isActive = t.key === tab
                return (
                  <Nav.Item key={t.key}>
                    <Nav.Link eventKey={t.key} className="d-flex align-items-center gap-2">
                      <span className="rounded-circle d-inline-flex align-items-center justify-content-center flex-shrink-0 bg-primary-subtle" style={{ width: 32, height: 32 }}>
                        <Icon icon={t.icon} className="text-primary" style={{ fontSize: '1rem' }} />
                      </span>
                      <span className="fw-semibold text-nowrap">{t.label}</span>
                      <Badge bg={isActive ? 'primary' : 'light'} text={isActive ? undefined : 'dark'} className="rounded-pill">
                        {totals[t.key]}
                      </Badge>
                    </Nav.Link>
                  </Nav.Item>
                )
              })}
            </Nav>
          </div>
        </Card.Header>
        <Card.Body>
          <div className="d-flex justify-content-end gap-2 mb-3">
            <Button variant="outline-secondary" size="sm" disabled={exporting !== ''} onClick={() => handleExport('pdf')}>
              <Icon icon="file-type-pdf" className="me-1" /> {exporting === 'pdf' ? 'Exporting...' : 'Export to PDF'}
            </Button>
            <Button variant="outline-success" size="sm" disabled={exporting !== ''} onClick={() => handleExport('csv')}>
              <Icon icon="file-type-xls" className="me-1" /> {exporting === 'csv' ? 'Exporting...' : 'Export to Excel'}
            </Button>
          </div>
          {!everLoaded ? (
            <LoadingState />
          ) : (
            <>
              <div className="position-relative">
                <div style={{ opacity: loading ? 0.4 : 1 }}>
                  <SettlementsTable
                    key={tab}
                    data={rows}
                    tab={tab}
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

export default MerchantSettlementsPage
