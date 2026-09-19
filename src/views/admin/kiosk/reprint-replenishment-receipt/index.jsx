import { useEffect, useState } from 'react'
import { Button, Card, CardBody, Col, Form, Row, Table } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'
import { formatDateTime } from '@/utils/reportHelpers'
import { printReceiptHtml } from '@/utils/printReceipt'
import logo from '@/assets/images/logo-black.png'

const today = () => new Date().toISOString().slice(0, 10)

/** Renders one denomination bucket ({<currency>: {<denom>: {count,total_value}}, total_<currency>, total_cash}) as a table. */
const bucketHtml = (title, bucket) => {
  if (!bucket || Object.keys(bucket).length === 0) return ''

  const currencies = Object.keys(bucket).filter((key) => !key.startsWith('total_') && key !== 'total_cash')
  const rows = currencies.flatMap((currency) =>
    Object.entries(bucket[currency] || {}).map(([denom, { count, total_value: totalValue }]) => `
      <div style="padding:0 5px;">
        <span style="font-size:11pt;font-family:Arial;display:inline-block;width:50%;">${currency} $${denom} x ${count}</span>
        <span style="font-size:11pt;font-family:Arial;font-weight:bold;text-align:right;display:inline-block;width:46%;">${Number(totalValue).toFixed(2)}</span>
      </div>
    `)
  ).join('')

  return `
    <div style="margin-top:10px;">
      <div style="font-size:12pt;font-weight:bold;text-align:center;">${title}</div>
      ${rows}
      <div style="padding:0 5px;">
        <span style="font-size:12pt;font-family:Arial;font-weight:bold;display:inline-block;width:50%;">Total</span>
        <span style="font-size:12pt;font-family:Arial;font-weight:bold;text-align:right;display:inline-block;width:46%;">${bucket.total_cash ?? '0.00'}</span>
      </div>
    </div>
  `
}

const KioskReplenishmentReceiptPage = () => {
  const { showNotification } = useNotificationContext()
  const [meterTypes, setMeterTypes] = useState([])
  const [terminals, setTerminals] = useState([])
  const [branches, setBranches] = useState([])
  const [filters, setFilters] = useState({ meter_type: '', date_from: today(), date_to: today(), terminal_id: '', branch_id: '' })
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [printingKey, setPrintingKey] = useState('')
  const [hasSearched, setHasSearched] = useState(false)

  useEffect(() => {
    ApiService.getKioskReplenishmentReceiptFilters()
      .then((data) => {
        const types = Array.isArray(data?.meter_types) ? data.meter_types : []
        setMeterTypes(types)
        setTerminals(Array.isArray(data?.terminals) ? data.terminals : [])
        setBranches(Array.isArray(data?.branches) ? data.branches : [])
        if (types.length) setFilters((current) => ({ ...current, meter_type: types[0].value }))
      })
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load filters.', variant: 'danger' }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }))

  const handleSearch = (event) => {
    event.preventDefault()
    if (!filters.meter_type || !filters.date_from || !filters.date_to) {
      showNotification({ title: 'Invalid parameters', message: 'Please check your field(s).', variant: 'danger' })
      return
    }

    setLoading(true)
    setHasSearched(true)
    ApiService.searchKioskReplenishmentReceipt({
      meter_type: filters.meter_type,
      date_from: filters.date_from,
      date_to: filters.date_to,
      terminal_id: filters.terminal_id || null,
      branch_id: filters.branch_id || null,
    })
      .then((data) => setRows(Array.isArray(data?.rows) ? data.rows : []))
      .catch((err) => {
        setRows([])
        showNotification({ title: 'Unable to retrieve replenishment data', message: err?.message || 'Unable to retrieve replenishment data.', variant: 'danger' })
      })
      .finally(() => setLoading(false))
  }

  const buildReceiptHtml = (detail) => {
    const header = `
      <img src="${logo}" alt="SunCash" style="margin-top:20px;max-width:160px;" />
      <div style="font-size:12pt;font-weight:bold;margin:8px 0;">${detail.transaction_type} — ${detail.name || ''}</div>
      <div style="font-size:10pt;">${detail.location || ''}</div>
      <div style="border-top:1px dashed #000;margin:6px 0;"></div>
      <div style="padding:0 5px;text-align:left;">
        <div>Settlement Date: <strong>${formatDateTime(detail.settlement_date)}</strong></div>
        <div>Settlement No: <strong>${detail.settlement_no}</strong></div>
        <div>Report User: <strong>${detail.report_user || ''}</strong></div>
        ${detail.previous_settlement_no ? `<div>Previous Settlement: <strong>${detail.previous_settlement_no} (${formatDateTime(detail.previous_settlement_date)})</strong></div>` : ''}
      </div>
    `

    let body = ''
    if ('USD_1' in detail) {
      const denomKeys = [1, 2, 5, 10, 20, 50, 100]
      const rows = denomKeys.map((d) => `
        <div style="padding:0 5px;">
          <span style="font-size:11pt;font-family:Arial;display:inline-block;width:50%;">USD $${d}</span>
          <span style="font-size:11pt;font-family:Arial;font-weight:bold;text-align:right;display:inline-block;width:46%;">${detail[`USD_${d}`] ?? 0}</span>
        </div>
      `).join('')
      body = `<div style="margin-top:10px;">${rows}<div style="padding:0 5px;"><span style="font-size:12pt;font-weight:bold;display:inline-block;width:50%;">Total</span><span style="font-size:12pt;font-weight:bold;text-align:right;display:inline-block;width:46%;">${detail.total_cash}</span></div></div>`
    } else if (detail.Cashbox) {
      body = bucketHtml('Cashbox', detail.Cashbox)
    } else if (detail.Recycler) {
      body = bucketHtml('Recycler', detail.Recycler)
    } else if (detail.LoadReserve && !detail.ClearCashbox) {
      body = bucketHtml('Reserve', detail.LoadReserve) + (detail.PreviousReserve ? bucketHtml('Previous Reserve', detail.PreviousReserve) : '')
    } else {
      body = bucketHtml('Clear Recycler', detail.ClearRecycler)
        + bucketHtml('Clear Cashbox', detail.ClearCashbox)
        + bucketHtml('Clear Reserve', detail.ClearReserve)
        + bucketHtml('Load Reserve', detail.LoadReserve)
    }

    return `<div style="text-align:center;font-family:Arial;">${header}${body}</div>`
  }

  const handlePrint = (row) => {
    const key = `${row.settlement_no}-${row.ref_id ?? ''}`
    setPrintingKey(key)
    ApiService.getKioskReplenishmentReceiptDetail({
      meter_type: filters.meter_type,
      settlement_no: row.settlement_no,
      ref_id: row.ref_id ?? null,
    })
      .then((detail) => printReceiptHtml(buildReceiptHtml(detail), 'Replenishment Receipt'))
      .catch((err) => showNotification({ title: 'Unable to retrieve replenishment data', message: err?.message || 'Unable to retrieve replenishment data.', variant: 'danger' }))
      .finally(() => setPrintingKey(''))
  }

  return (
    <>
      <PageBreadcrumb title="Reprint Replenishment Receipt" subtitle="Kiosk" />

      <Card>
        <CardBody>
          <p className="text-muted small mb-3">
            Search a kiosk cash-management settlement (meter clears, replenishments, cashbox/reserve activity) and
            reprint its receipt for the operator's records. This opens your browser's print dialog.
          </p>

          <Form onSubmit={handleSearch}>
            <Row className="g-3 align-items-end">
              <Col md={3}>
                <Form.Label>Replenishment Type</Form.Label>
                <Form.Select value={filters.meter_type} onChange={(e) => updateFilter('meter_type', e.target.value)}>
                  {meterTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                </Form.Select>
              </Col>
              <Col md={2}>
                <Form.Label>From</Form.Label>
                <Form.Control type="date" value={filters.date_from} onChange={(e) => updateFilter('date_from', e.target.value)} />
              </Col>
              <Col md={2}>
                <Form.Label>To</Form.Label>
                <Form.Control type="date" value={filters.date_to} onChange={(e) => updateFilter('date_to', e.target.value)} />
              </Col>
              <Col md={2}>
                <Form.Label>Terminal</Form.Label>
                <Form.Select value={filters.terminal_id} onChange={(e) => updateFilter('terminal_id', e.target.value)}>
                  <option value="">ALL</option>
                  {terminals.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </Form.Select>
              </Col>
              <Col md={2}>
                <Form.Label>Branch</Form.Label>
                <Form.Select value={filters.branch_id} onChange={(e) => updateFilter('branch_id', e.target.value)}>
                  <option value="">ALL</option>
                  {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </Form.Select>
              </Col>
              <Col md={1}>
                <Button type="submit" variant="success" className="w-100" disabled={loading}>Search</Button>
              </Col>
            </Row>
          </Form>

          {loading ? <div className="mt-4"><LoadingState message="Loading settlements..." /></div> : hasSearched && (
            <div className="table-responsive mt-4">
              <Table bordered hover size="sm" className="align-middle mb-0">
                <thead>
                  <tr>
                    <th>Kiosk</th>
                    <th>Island</th>
                    <th>Branch</th>
                    <th>Location</th>
                    <th>Type</th>
                    <th>Settlement Date</th>
                    <th>Settlement No</th>
                    <th>Report User</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const key = `${row.settlement_no}-${row.ref_id ?? ''}`
                    return (
                      <tr key={key}>
                        <td>{row.name}</td>
                        <td>{row.island}</td>
                        <td>{row.branch}</td>
                        <td>{row.location}</td>
                        <td>{row.transaction_type}</td>
                        <td className="text-nowrap">{formatDateTime(row.settlement_date)}</td>
                        <td>{row.settlement_no}</td>
                        <td>{row.report_user}</td>
                        <td>
                          <Button size="sm" variant="primary" onClick={() => handlePrint(row)} disabled={printingKey === key}>
                            {printingKey === key ? 'Preparing...' : 'Print'}
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                  {!rows.length && (
                    <tr><td colSpan={9} className="text-center text-muted py-4">No settlements found for this range.</td></tr>
                  )}
                </tbody>
              </Table>
            </div>
          )}
        </CardBody>
      </Card>
    </>
  )
}

export default KioskReplenishmentReceiptPage
