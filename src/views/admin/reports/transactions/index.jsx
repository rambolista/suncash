import { useEffect, useMemo, useState } from 'react'
import { Button, Card, CardBody, Col, Form, Nav, Row, Spinner } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import useCurrentUser from '@/hooks/useCurrentUser'
import { getModulePermission } from '@/utils/modulePermissions'
import { useNotificationContext } from '@/context/useNotificationContext'
import { downloadBlob } from '@/utils/reportHelpers'
import ReportTotalSummary from '../components/ReportTotalSummary'
import { DURATIONS, fmt, periodLabel as label, stepAnchor, windowFor } from '../components/reportPeriod'
import TransactionsSummaryTable from './components/TransactionsSummaryTable'
import TransactionsDetailTable from './components/TransactionsDetailTable'

const TransactionsReportPage = () => {
  const currentUser = useCurrentUser()
  const { showNotification } = useNotificationContext()
  const permission = getModulePermission(currentUser, '/reports/transactions')
  const canExport = Boolean(permission.can_export)
  const canPrint = Boolean(permission.can_print)

  const [options, setOptions] = useState({ merchants: [], types: [] })
  const [users, setUsers] = useState([])
  const [branches, setBranches] = useState([])
  const [form, setForm] = useState({ merchantId: '', typeKey: '', userId: '', branchId: '' })
  const [applied, setApplied] = useState(null)

  const [duration, setDuration] = useState('daily')
  const [anchor, setAnchor] = useState(fmt(new Date()))
  const [custom, setCustom] = useState({ from: '', to: '' })
  const [customRange, setCustomRange] = useState(null)

  const [summary, setSummary] = useState(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [detail, setDetail] = useState(null) // { key, label }
  const [detailData, setDetailData] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [exporting, setExporting] = useState('')

  const period = useMemo(() => (duration === 'custom' ? customRange : windowFor(duration, anchor)), [duration, anchor, customRange])
  const fail = (err, fallback) => showNotification({ title: 'Failed', message: err?.message || fallback, variant: 'danger' })

  useEffect(() => {
    ApiService.getTransactionsReportOptions()
      .then((data) => setOptions({ merchants: data?.merchants || [], types: data?.types || [] }))
      .catch((err) => fail(err, 'Failed to load filters.'))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const onMerchantChange = (merchantId) => {
    setForm((f) => ({ ...f, merchantId, userId: '', branchId: '' }))
    setUsers([])
    setBranches([])
    if (!merchantId) return
    ApiService.getTransactionsReportScope({ merchant_id: merchantId })
      .then((data) => { setUsers(data?.users || []); setBranches(data?.branches || []) })
      .catch((err) => fail(err, 'Failed to load users and branches.'))
  }

  // Picking a branch narrows the user list to that branch's users (legacy `getTerminalUserListByBranch`).
  const onBranchChange = (branchId) => {
    setForm((f) => ({ ...f, branchId, userId: '' }))
    ApiService.getTransactionsReportScope({ merchant_id: form.merchantId, ...(branchId ? { branch_id: branchId } : {}), only: 'users' })
      .then((data) => setUsers(data?.users || []))
      .catch((err) => fail(err, 'Failed to load users.'))
  }

  const queryParams = (extra = {}) => ({
    merchant_id: applied.merchantId,
    trans_type: applied.typeKey,
    user_id: applied.userId,
    branch_id: applied.branchId,
    from: period.from,
    to: period.to,
    ...extra,
  })

  // Apply Filters: legacy always restarts on today's Daily view.
  const applyFilters = () => {
    if (!form.merchantId) return showNotification({ title: 'Select a merchant', message: 'Choose a merchant before applying filters.', variant: 'warning' })
    setDetail(null)
    setDuration('daily')
    setAnchor(fmt(new Date()))
    setApplied({ ...form })
  }

  const changeDuration = (next) => {
    if (next === duration) return
    setDetail(null)
    // Legacy opens Custom on the current month until a range is entered.
    if (next === 'custom' && !customRange) {
      const month = windowFor('monthly', anchor)
      setCustom(month)
      setCustomRange(month)
    }
    setDuration(next)
  }

  const step = (dir) => { setDetail(null); setAnchor((a) => stepAnchor(duration, a, dir)) }

  const displayCustom = () => {
    if (!custom.from || !custom.to) return showNotification({ title: 'Missing dates', message: 'Please enter start and end dates.', variant: 'warning' })
    setDetail(null)
    setCustomRange({ from: custom.from, to: custom.to })
  }

  useEffect(() => {
    if (!applied || !period) { setSummary(null); return }
    setSummaryLoading(true)
    ApiService.getTransactionsReportSummary(queryParams())
      .then((data) => setSummary(data))
      .catch((err) => { setSummary(null); fail(err, 'Failed to load the report.') })
      .finally(() => setSummaryLoading(false))
  }, [applied, period]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!detail || !applied || !period) { setDetailData(null); return }
    setDetailLoading(true)
    ApiService.getTransactionsReportDetails(queryParams({ trans_type: detail.key }))
      .then((data) => setDetailData(data))
      .catch((err) => { setDetailData(null); fail(err, 'Failed to load the transaction details.') })
      .finally(() => setDetailLoading(false))
  }, [detail, applied, period]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleExport = async (format) => {
    setExporting(format)
    try {
      const { blob, filename } = await ApiService.exportTransactionsReport(detail ? queryParams({ trans_type: detail.key, detail: 1 }) : queryParams(), format)
      downloadBlob(blob, filename)
    } catch (err) {
      fail(err, `Failed to export ${format.toUpperCase()}.`)
    } finally {
      setExporting('')
    }
  }

  const openReceipt = async (row) => {
    try {
      const { blob } = await ApiService.getTransactionsReportReceipt({ transaction_id: row.transaction_id, trans_type: row.receipt_type, merchant_id: applied.merchantId })
      window.open(window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' })), '_blank')
    } catch (err) {
      fail(err, 'Failed to open the receipt.')
    }
  }

  const loading = detail ? detailLoading : summaryLoading
  const hasData = detail ? Boolean(detailData) : Boolean(summary)

  return (
    <>
      <PageBreadcrumb title="Transactions" subtitle="Reports" />

      <Card className="mb-3">
        <CardBody>
          <Row className="g-2 align-items-end">
            <Col md={4}>
              <Form.Label className="small text-muted mb-1">Merchant ID</Form.Label>
              <Form.Select size="sm" value={form.merchantId} onChange={(e) => onMerchantChange(e.target.value)}>
                <option value="">List of Clients</option>
                {options.merchants.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Label className="small text-muted mb-1">Transaction Type</Form.Label>
              <Form.Select size="sm" value={form.typeKey} onChange={(e) => setField('typeKey', e.target.value)}>
                {options.types.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Label className="small text-muted mb-1">User</Form.Label>
              <Form.Select size="sm" value={form.userId} onChange={(e) => setField('userId', e.target.value)}>
                <option value="">--SELECT USER--</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Label className="small text-muted mb-1">Branch</Form.Label>
              <Form.Select size="sm" value={form.branchId} onChange={(e) => onBranchChange(e.target.value)} disabled={!form.merchantId}>
                <option value="">--SELECT BRANCH--</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
              </Form.Select>
            </Col>
            <Col md="auto">
              <Button size="sm" variant="primary" onClick={applyFilters} disabled={!form.merchantId}>
                <Icon icon="filter" className="me-1" /> Apply Filters
              </Button>
            </Col>
          </Row>
        </CardBody>
      </Card>

      {!applied ? (
        <Card><CardBody className="text-center text-muted py-5">Select a merchant and apply filters to view its transactions.</CardBody></Card>
      ) : (
        <Card>
          <CardBody>
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
              <Nav variant="tabs" activeKey={duration} onSelect={changeDuration}>
                {DURATIONS.map(([key, text]) => (
                  <Nav.Item key={key}><Nav.Link eventKey={key}>{text}</Nav.Link></Nav.Item>
                ))}
              </Nav>
              {canExport && hasData && (
                <div className="d-flex gap-2">
                  <Button size="sm" variant="outline-secondary" disabled={exporting !== ''} onClick={() => handleExport('pdf')}>
                    {exporting === 'pdf' ? 'Exporting...' : 'Export to PDF'}
                  </Button>
                  <Button size="sm" variant="outline-success" disabled={exporting !== ''} onClick={() => handleExport('csv')}>
                    {exporting === 'csv' ? 'Exporting...' : 'Export to Excel'}
                  </Button>
                </div>
              )}
            </div>

            {duration === 'custom' ? (
              <Row className="g-2 align-items-end mb-3">
                <Col md={3}>
                  <Form.Label className="small text-muted mb-1">Start</Form.Label>
                  <Form.Control size="sm" type="date" value={custom.from} onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))} />
                </Col>
                <Col md={3}>
                  <Form.Label className="small text-muted mb-1">End</Form.Label>
                  <Form.Control size="sm" type="date" value={custom.to} onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))} />
                </Col>
                <Col md="auto"><Button size="sm" variant="primary" onClick={displayCustom}>Display</Button></Col>
              </Row>
            ) : (
              <div className="d-flex justify-content-between align-items-center mb-3">
                <Button variant="link" size="sm" className="text-muted p-0" onClick={() => step(-1)}>
                  <Icon icon="chevrons-left" className="me-1" />{label(windowFor(duration, stepAnchor(duration, anchor, -1)), duration)}
                </Button>
                <strong>{label(period, duration)}</strong>
                <Button variant="link" size="sm" className="text-muted p-0" onClick={() => step(1)}>
                  {label(windowFor(duration, stepAnchor(duration, anchor, 1)), duration)}<Icon icon="chevrons-right" className="ms-1" />
                </Button>
              </div>
            )}

            {!period ? (
              <p className="text-muted mb-0">Please enter start and end dates.</p>
            ) : (
              <>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="mb-0">
                    {detail ? `Transaction Details - ${detail.label}` : 'Transaction Summary'} — {label(period, 'custom')}
                  </h6>
                  {detail && <Button variant="link" size="sm" className="fst-italic fw-bold p-0" onClick={() => setDetail(null)}>Back To List</Button>}
                </div>

                <div className="position-relative">
                  {!hasData && loading ? (
                    <LoadingState message="Loading report..." />
                  ) : (
                    <div style={{ opacity: loading ? 0.4 : 1 }}>
                      {detail ? (
                        detailData && (
                          <TransactionsDetailTable
                            key={detail.key}
                            columns={detailData.columns}
                            data={detailData.data}
                            canReceipt={canPrint && detailData.has_receipt}
                            onReceipt={openReceipt}
                          />
                        )
                      ) : (
                        summary && <TransactionsSummaryTable data={summary.data} onView={(row) => setDetail({ key: row.key, label: row.type })} />
                      )}
                    </div>
                  )}
                  {loading && hasData && (
                    <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center">
                      <Spinner animation="border" variant="primary" role="status"><span className="visually-hidden">Loading...</span></Spinner>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardBody>
        </Card>
      )}

      {applied && !detail && summary && (
        <ReportTotalSummary
          lines={[
            { label: 'Total Count', value: summary.total.count.toLocaleString() },
            { label: 'Total Amount', value: summary.total.amount },
            { label: 'Total Fee', value: summary.total.fee },
            { label: 'Grand Total', value: summary.total.total },
          ]}
        />
      )}
    </>
  )
}

export default TransactionsReportPage
