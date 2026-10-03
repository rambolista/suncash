import { useEffect, useState } from 'react'
import { Button, Card, CardBody, Col, Form, Row } from 'react-bootstrap'
import LoadingState from '@/components/LoadingState'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'
import { downloadBlob } from '@/utils/reportHelpers'
import { fmt } from '../../components/reportPeriod'
import ReportTotalSummary from '../../components/ReportTotalSummary'
import CustomerTransactions from './CustomerTransactions'
import UserClientTable from './UserClientTable'

/**
 * Shared by the tabbed Reports pages (Users / Client Management, Cash Management): pass `config` + `api` for another menu.
 * Per-tab filters, as in legacy: a From/To date range (`date`), an amount threshold (`amount`), or both.
 * `today`: legacy pre-loaded those reports with today's range. Expired KYC has its own From/To (no today preset,
 * To can't be in the future).
 */
const USER_CLIENT_API = { load: ApiService.getUserClientReport, export: ApiService.exportUserClientReport }

export const USER_CLIENT_TABS = {
  user_profile: { date: true, today: true, history: true },
  user_balance: { amount: true },
  change_pin: { date: true },
  deposits: { date: true, amount: true, today: true },
  withdrawals: { date: true, amount: true, today: true },
  money_transfer: { date: true, today: true },
  expired_kyc: { date: true, kyc: true },
}

// `options`: dropdown contents by name — `amounts` ({value,label}) and any list a tab's `selects` entry points at (plain strings ok).
const toOption = (o) => (typeof o === 'string' ? { value: o, label: o } : o)

const UserClientReportTab = ({ tabKey, label, canExport, options = {}, config = USER_CLIENT_TABS, api = USER_CLIENT_API }) => {
  const { showNotification } = useNotificationContext()
  const cfg = config[tabKey]
  const selects = cfg.selects || []
  const amounts = options.amounts || []
  const todayStr = fmt(new Date())
  const initial = { from: cfg.today ? todayStr : '', to: cfg.today ? todayStr : '', amount: '', ...Object.fromEntries(selects.map((s) => [s.key, s.initial ?? ''])) }

  const [form, setForm] = useState(initial)
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState('')
  const [customer, setCustomer] = useState(null)
  const [applied, setApplied] = useState(false)
  const [shown, setShown] = useState(initial) // the filters behind the table on screen — what an export should use

  const params = (f = form, isApplied = applied) => ({ ...f, ...(isApplied ? { applied: 1 } : {}) })

  const load = (f = form, isApplied = applied) => {
    setLoading(true)
    setShown(f)
    api.load(tabKey, params(f, isApplied))
      .then(setReport)
      .catch((err) => { setReport(null); showNotification({ title: 'Failed', message: err?.message || `Failed to load ${label}.`, variant: 'danger' }) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(initial, false) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  // A select can narrow another one (`dependent: { key, load(value) -> options }`, e.g. Merchant -> its Branches);
  // clearing it leaves the other list as it is, as legacy did.
  const [narrowed, setNarrowed] = useState({})
  const change = (s, value) => {
    set(s.key, value)
    if (!s.dependent || value === '') return
    s.dependent.load(value)
      .then((list) => { setNarrowed((n) => ({ ...n, [s.dependent.key]: list })); set(s.dependent.key, '') })
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load the list.', variant: 'danger' }))
  }
  const apply = () => {
    if (cfg.requireDates && (!form.from || !form.to)) return showNotification({ title: 'Missing dates', message: 'Please fill up date from and date to.', variant: 'warning' })
    if (cfg.requireDates && form.from > form.to) return showNotification({ title: 'Invalid dates', message: 'End date should be greater than Start date.', variant: 'warning' })
    setApplied(true)
    load(form, true)
  }

  const handleExport = async (format) => {
    setExporting(format)
    try {
      const { blob, filename } = await api.export(tabKey, params(shown), format)
      downloadBlob(blob, filename)
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.message || `Failed to export ${format.toUpperCase()}.`, variant: 'danger' })
    } finally {
      setExporting('')
    }
  }

  if (customer) return <CustomerTransactions customer={customer} onBack={() => setCustomer(null)} />

  const summaryLines = report?.summary ? Object.entries(report.summary).map(([name, value]) => ({ label: name, value })) : []

  return (
    <>
    <Card>
      <CardBody>
        <Row className="g-2 align-items-end mb-3">
          {cfg.date && (
            <>
              <Col md={2}>
                <Form.Label className="small text-muted mb-1">{cfg.kyc ? 'From' : 'Date From'}</Form.Label>
                <Form.Control size="sm" type="date" max={cfg.kyc ? todayStr : undefined} value={form.from} onChange={(e) => set('from', e.target.value)} />
              </Col>
              <Col md={2}>
                <Form.Label className="small text-muted mb-1">{cfg.kyc ? 'To' : 'Date To'}</Form.Label>
                <Form.Control size="sm" type="date" max={cfg.kyc ? todayStr : undefined} value={form.to} onChange={(e) => set('to', e.target.value)} />
              </Col>
            </>
          )}
          {cfg.amount && (
            <Col md={2}>
              <Form.Label className="small text-muted mb-1">Amount greater than</Form.Label>
              <Form.Select size="sm" value={form.amount} onChange={(e) => set('amount', e.target.value)}>
                <option value="">--Select Amount--</option>
                {amounts.map((a) => <option key={`${a.value}-${a.label}`} value={a.value}>{a.label}</option>)}
              </Form.Select>
            </Col>
          )}
          {selects.map((s) => (
            <Col md={2} key={s.key}>
              <Form.Label className="small text-muted mb-1">{s.label}</Form.Label>
              <Form.Select size="sm" value={form[s.key]} onChange={(e) => change(s, e.target.value)}>
                {!s.noEmpty && <option value="">{s.placeholder}</option>}
                {(narrowed[s.key] || options[s.options] || []).filter((o) => o !== null && o !== '').map(toOption).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Form.Select>
            </Col>
          ))}
          <Col md="auto">
            <Button size="sm" variant="primary" onClick={apply}><Icon icon="filter" className="me-1" /> Apply Filters</Button>
          </Col>
          {canExport && (
            <Col className="d-flex justify-content-end gap-2">
              <Button size="sm" variant="outline-secondary" disabled={exporting !== '' || loading} onClick={() => handleExport('pdf')}>
                {exporting === 'pdf' ? 'Exporting...' : 'Export to PDF'}
              </Button>
              <Button size="sm" variant="outline-success" disabled={exporting !== '' || loading} onClick={() => handleExport('csv')}>
                {exporting === 'csv' ? 'Exporting...' : 'Export to Excel'}
              </Button>
            </Col>
          )}
        </Row>

        {loading ? (
          <LoadingState message={`Loading ${label}...`} />
        ) : report && (
          <UserClientTable key={tabKey} columns={report.columns} data={report.data} onTransactions={cfg.history ? setCustomer : undefined} />
        )}
      </CardBody>
    </Card>
    {!loading && summaryLines.length > 0 && <ReportTotalSummary lines={summaryLines} />}
    </>
  )
}

export default UserClientReportTab
