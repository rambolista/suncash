import { useEffect, useState } from 'react'
import { Button, Card, Form, Table } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'

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

const STATUS_OPTIONS = ['ALL', 'ACTIVE', 'CLAIMED', 'WON']

const statusBadgeClass = (status) => {
  switch (status) {
    case 'WON': return 'bg-success-subtle text-success'
    case 'CLAIMED': return 'bg-info-subtle text-info'
    case 'ACTIVE': return 'bg-primary-subtle text-primary'
    default: return 'bg-secondary-subtle text-secondary'
  }
}

const today = () => new Date().toISOString().slice(0, 10)

const formatDateTime = (value) => {
  if (!value) return '—'
  const parsed = new Date(String(value).replace(' ', 'T'))
  if (Number.isNaN(parsed.getTime())) return String(value)
  const date = parsed.toLocaleDateString()
  const time = parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return `${date} ${time}`
}

const TicketReportsPage = () => {
  const { showNotification } = useNotificationContext()
  const [dateFrom, setDateFrom] = useState(today())
  const [dateTo, setDateTo] = useState(today())
  const [status, setStatus] = useState('ALL')
  const [rows, setRows] = useState([])
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState('')

  const load = () => {
    setLoading(true)
    ApiService.getPromoTicketReports({
      date_from: dateFrom,
      date_to: dateTo,
      status: status === 'ALL' ? '' : status,
      page,
    })
      .then((result) => {
        setRows(Array.isArray(result?.data) ? result.data : [])
        setLastPage(result?.last_page || 1)
        setTotal(result?.total || 0)
      })
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load ticket reports.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [page])

  const applyFilters = () => {
    setPage(1)
    if (page === 1) load()
  }

  const handleExport = async (format) => {
    setExporting(format)
    try {
      const { blob, filename } = await ApiService.exportPromoTicketReports(
        { date_from: dateFrom, date_to: dateTo, status: status === 'ALL' ? '' : status },
        format,
      )
      triggerDownload(blob, filename)
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.message || `Failed to export ${format.toUpperCase()}.`, variant: 'danger' })
    } finally {
      setExporting('')
    }
  }

  return (
    <>
      <PageBreadcrumb title="Ticket Reports" subtitle="Promotions" />
      <Card>
        <Card.Header className="d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div>
            <h5 className="mb-1">Summer Cool Down Reloaded Ticket Reports</h5>
            <p className="text-muted mb-0 small">Raffle tickets earned across the active promotion, one row per ticket.</p>
          </div>
          <div className="d-flex gap-2">
            <Button variant="outline-secondary" size="sm" disabled={exporting !== ''} onClick={() => handleExport('pdf')}>
              <Icon icon="file-type-pdf" className="me-1" /> {exporting === 'pdf' ? 'Exporting...' : 'Export to PDF'}
            </Button>
            <Button variant="outline-success" size="sm" disabled={exporting !== ''} onClick={() => handleExport('csv')}>
              <Icon icon="file-type-xls" className="me-1" /> {exporting === 'csv' ? 'Exporting...' : 'Export to Excel'}
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={(e) => { e.preventDefault(); applyFilters() }}>
            <div className="d-flex flex-wrap align-items-end gap-2 mb-3">
              <Form.Group>
                <Form.Label className="small text-muted mb-1">Date From</Form.Label>
                <Form.Control type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </Form.Group>
              <Form.Group>
                <Form.Label className="small text-muted mb-1">Date To</Form.Label>
                <Form.Control type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </Form.Group>
              <Form.Group>
                <Form.Label className="small text-muted mb-1">Status</Form.Label>
                <Form.Select value={status} onChange={(e) => setStatus(e.target.value)}>
                  {STATUS_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                </Form.Select>
              </Form.Group>
              <button type="submit" className="btn btn-primary">Apply Filters</button>
            </div>
          </Form>

          {loading ? (
            <LoadingState />
          ) : (
            <>
              <div className="text-muted small mb-2">{total} ticket{total === 1 ? '' : 's'} found</div>
              <div className="table-responsive">
                <Table className="align-middle mb-0">
                  <thead className="thead-sm text-uppercase fs-xxs">
                    <tr>
                      <th>ID</th>
                      <th>Created</th>
                      <th>Customer</th>
                      <th>Mobile</th>
                      <th>Island</th>
                      <th>Ticket</th>
                      <th>Status</th>
                      <th>Type</th>
                      <th>Prize</th>
                      <th>Redeemed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id}>
                        <td>{row.id}</td>
                        <td className="text-nowrap">{formatDateTime(row.create_date)}</td>
                        <td>{row.customer_name}</td>
                        <td>{row.mobile_number}</td>
                        <td>{row.island || '—'}</td>
                        <td className="text-nowrap">{row.ticket}</td>
                        <td><span className={`badge ${statusBadgeClass(row.status)} badge-label`}>{row.status}</span></td>
                        <td>{row.type || '—'}</td>
                        <td>{row.prize || '—'}</td>
                        <td className="text-nowrap">{row.redeemed_date ? formatDateTime(row.redeemed_date) : '—'}</td>
                      </tr>
                    ))}
                    {!rows.length && (
                      <tr><td colSpan={10} className="text-center text-muted py-4">No tickets found for this range.</td></tr>
                    )}
                  </tbody>
                </Table>
              </div>

              {lastPage > 1 && (
                <ul className="pagination pagination-rounded pagination-boxed justify-content-center mt-3 mb-0">
                  <li className={`page-item${page <= 1 ? ' disabled' : ''}`}>
                    <button type="button" className="page-link" aria-label="Previous" onClick={() => setPage((prev) => Math.max(1, prev - 1))}>
                      <span aria-hidden="true">«</span>
                    </button>
                  </li>
                  {Array.from({ length: lastPage }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === lastPage || Math.abs(p - page) <= 2)
                    .reduce((acc, p, idx, arr) => {
                      if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...')
                      acc.push(p)
                      return acc
                    }, [])
                    .map((p, idx) => (
                      p === '...' ? (
                        <li key={`ellipsis-${idx}`} className="page-item disabled"><span className="page-link">…</span></li>
                      ) : (
                        <li key={p} className={`page-item${p === page ? ' active' : ''}`}>
                          <button type="button" className="page-link" onClick={() => setPage(p)}>{p}</button>
                        </li>
                      )
                    ))}
                  <li className={`page-item${page >= lastPage ? ' disabled' : ''}`}>
                    <button type="button" className="page-link" aria-label="Next" onClick={() => setPage((prev) => Math.min(lastPage, prev + 1))}>
                      <span aria-hidden="true">»</span>
                    </button>
                  </li>
                </ul>
              )}
            </>
          )}
        </Card.Body>
      </Card>
    </>
  )
}

export default TicketReportsPage
