import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Card, CardBody, Col, Form, Row } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import useCurrentUser from '@/hooks/useCurrentUser'
import { getModulePermission } from '@/utils/modulePermissions'
import { useNotificationContext } from '@/context/useNotificationContext'
import { downloadBlob } from '@/utils/reportHelpers'
import { fmt } from '../components/reportPeriod'
import UserClientTable from '../user-client-management/components/UserClientTable'

const today = () => fmt(new Date())
const monthAgo = () => { const d = new Date(); d.setMonth(d.getMonth() - 1); return fmt(d) }

/**
 * Legacy: pick a Report Type, then Search builds the workbook and Export downloads it. The filters follow the type — an
 * "as of" list asks only for End Date, a balance snapshot for no dates, Merchant Transactions for a merchant — and the
 * rows are shown here (first 1,000) as well, with the full report in the Excel export.
 */
const AuditorsReportPage = () => {
  const { showNotification } = useNotificationContext()
  const currentUser = useCurrentUser()
  const canExport = Boolean(getModulePermission(currentUser, '/reports/auditors-report').can_export)
  const [options, setOptions] = useState(null)
  const [form, setForm] = useState({ type: '', merchant: '', from: monthAgo(), to: today() })
  const [report, setReport] = useState(null) // { type, label, params, columns, data, total }
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState('')

  useEffect(() => {
    ApiService.getAuditorReportOptions().then(setOptions).catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load the report types.', variant: 'danger' }))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const selected = useMemo(() => options?.types.find((t) => t.value === form.type), [options, form.type])
  const dates = selected?.dates
  const showStart = dates === 'range' || dates === 'merchant'
  const showEnd = dates && dates !== 'none'

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }))
  const pickType = (type) => { setForm((f) => ({ ...f, type, merchant: '' })); setReport(null) }

  const params = () => ({ type: form.type, from: showStart ? form.from : '', to: showEnd ? form.to : '', merchant: dates === 'merchant' ? form.merchant : '' })

  const search = () => {
    if (!form.type) return showNotification({ title: 'Report type', message: 'Select a report type.', variant: 'warning' })
    if (dates === 'merchant' && !form.merchant) return showNotification({ title: 'Merchant', message: 'Select a merchant.', variant: 'warning' })
    if ((showStart && !form.from) || (showEnd && !form.to)) return showNotification({ title: 'Missing dates', message: 'Please fill up date from and date to.', variant: 'warning' })
    if (showStart && form.from > form.to) return showNotification({ title: 'Invalid dates', message: 'End date should be greater than Start date.', variant: 'warning' })

    const p = params()
    setLoading(true)
    ApiService.getAuditorReport(p)
      .then((res) => setReport({ ...res, type: form.type, label: selected.label, params: p }))
      .catch((err) => { setReport(null); showNotification({ title: 'Failed', message: err?.message || 'Failed to load the report.', variant: 'danger' }) })
      .finally(() => setLoading(false))
  }

  const exportReport = async (format) => {
    setExporting(format)
    try {
      const { blob, filename } = await ApiService.exportAuditorReport(report.params, format)
      downloadBlob(blob, filename)
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.message || 'Failed to export the report.', variant: 'danger' })
    } finally {
      setExporting('')
    }
  }

  return (
    <>
      <PageBreadcrumb title="Auditor's Report" subtitle="Reports" />
      <Card>
        <CardBody>
          {!options ? <LoadingState message="Loading..." /> : (
            <>
              <Row className="g-2 align-items-end mb-3">
                <Col md={4}>
                  <Form.Label className="small text-muted mb-1">Report Type</Form.Label>
                  <Form.Select size="sm" value={form.type} onChange={(e) => pickType(e.target.value)}>
                    <option value="" disabled>--Transaction Type--</option>
                    {options.types.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </Form.Select>
                </Col>
                {dates === 'merchant' && (
                  <Col md={3}>
                    <Form.Label className="small text-muted mb-1">Merchant</Form.Label>
                    <Form.Select size="sm" value={form.merchant} onChange={(e) => set('merchant', e.target.value)}>
                      <option value="">--Select merchant--</option>
                      {options.merchants.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </Form.Select>
                  </Col>
                )}
                {showStart && (
                  <Col md={2}>
                    <Form.Label className="small text-muted mb-1">Start Date</Form.Label>
                    <Form.Control size="sm" type="date" value={form.from} onChange={(e) => set('from', e.target.value)} />
                  </Col>
                )}
                {showEnd && (
                  <Col md={2}>
                    <Form.Label className="small text-muted mb-1">End Date</Form.Label>
                    <Form.Control size="sm" type="date" value={form.to} onChange={(e) => set('to', e.target.value)} />
                  </Col>
                )}
                <Col md="auto">
                  <Button size="sm" variant="primary" onClick={search} disabled={loading}><Icon icon="search" className="me-1" /> Search</Button>
                </Col>
              </Row>

              {selected?.note && <Alert variant="info" className="py-2 small">{selected.note}</Alert>}

              {loading ? <LoadingState message="Searching..." /> : report && (report.total === 0 ? (
                <Alert variant="secondary" className="mb-0">No records found.</Alert>
              ) : (
                <>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div>
                      <h6 className="mb-0">{report.label}</h6>
                      <small className="text-muted">
                        {report.total.toLocaleString()} row{report.total === 1 ? '' : 's'}
                        {report.total > report.data.length && ` — showing the first ${report.data.length.toLocaleString()}; the Excel export has them all`}
                      </small>
                    </div>
                    {canExport && (
                      <div className="d-flex gap-2">
                        <Button size="sm" variant="outline-secondary" disabled={exporting !== ''} onClick={() => exportReport('pdf')} title="The first 1,000 rows">
                          {exporting === 'pdf' ? 'Exporting...' : 'Export to PDF'}
                        </Button>
                        <Button size="sm" variant="outline-success" disabled={exporting !== ''} onClick={() => exportReport('xlsx')}>
                          {exporting === 'xlsx' ? 'Exporting...' : 'Export to Excel'}
                        </Button>
                      </div>
                    )}
                  </div>
                  <UserClientTable key={`${report.type}-${report.total}`} columns={report.columns} data={report.data} />
                </>
              ))}
            </>
          )}
        </CardBody>
      </Card>
    </>
  )
}

export default AuditorsReportPage
