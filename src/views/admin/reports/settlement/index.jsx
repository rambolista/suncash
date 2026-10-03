import { useEffect, useState } from 'react'
import { Button, Card, CardBody, Col, Form, Nav, Row } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'
import ReportTotalSummary from '../components/ReportTotalSummary'
import { SettlementRowsTable, SettlementSummaryTable } from './components/SettlementTables'

const TABS = [['merchants', 'Merchants', 'Merchant'], ['suppliers', 'Suppliers', 'Supplier'], ['revenues', 'Revenues', 'Revenue']]

// Local calendar day — toISOString() converts to UTC first and can shift the date.
const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const SettlementReportPage = () => {
  const { showNotification } = useNotificationContext()
  const [tab, setTab] = useState('merchants')
  const [dateInput, setDateInput] = useState(today())
  const [date, setDate] = useState(today())
  const [client, setClient] = useState(null) // { id } while a client's details are open
  const [summary, setSummary] = useState(null)
  const [details, setDetails] = useState(null)
  const [loading, setLoading] = useState(true)

  const title = TABS.find(([key]) => key === tab)[2]
  const fail = (err, fallback) => showNotification({ title: 'Failed', message: err?.message || fallback, variant: 'danger' })

  useEffect(() => {
    if (client) return
    setLoading(true)
    ApiService.getSettlementSummary({ tab, date })
      .then(setSummary)
      .catch((err) => { setSummary(null); fail(err, 'Failed to load the settlement summary.') })
      .finally(() => setLoading(false))
  }, [tab, date, client]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!client) { setDetails(null); return }
    setLoading(true)
    ApiService.getSettlementDetails({ tab, date, client_record_id: client.id })
      .then(setDetails)
      .catch((err) => { setDetails(null); fail(err, 'Failed to load the settlement details.') })
      .finally(() => setLoading(false))
  }, [client]) // eslint-disable-line react-hooks/exhaustive-deps

  // Legacy tabs always return to that tab's summary for the current date.
  const changeTab = (next) => { setClient(null); setTab(next) }
  const changeDate = () => { if (dateInput) setDate(dateInput) }

  return (
    <>
      <PageBreadcrumb title="Settlement" subtitle="Reports" />

      <Card>
        <CardBody>
          <Nav variant="tabs" activeKey={tab} onSelect={changeTab} className="mb-3">
            {TABS.map(([key, label]) => <Nav.Item key={key}><Nav.Link eventKey={key}>{label}</Nav.Link></Nav.Item>)}
          </Nav>

          {!client && (
            <Row className="g-2 align-items-end mb-3">
              <Col md={3}>
                <Form.Label className="small text-muted mb-1">Select Date</Form.Label>
                <Form.Control size="sm" type="date" value={dateInput} onChange={(e) => setDateInput(e.target.value)} />
              </Col>
              <Col md="auto"><Button size="sm" variant="primary" onClick={changeDate} disabled={!dateInput}>Change Date</Button></Col>
            </Row>
          )}

          {loading ? (
            <LoadingState message="Loading settlement..." />
          ) : client ? (
            details && (
              <>
                <h6 className="mb-3">{title} Settlement Details [Date: {date} / Merchant: {details.merchant}]</h6>
                {details.sections.map((section, i) => (
                  <div key={section.title || i} className="mb-4">
                    {section.title && <div className="fw-bold mb-2">{section.title}</div>}
                    <SettlementRowsTable rows={section.rows} />
                    <div className="d-flex justify-content-between small fw-bold border-top pt-2 mt-2">
                      <span>Total ({section.count.toLocaleString()} transactions)</span>
                      <span>{section.total}</span>
                    </div>
                  </div>
                ))}
                {details.grand_total && (
                  <div className="d-flex justify-content-between fw-bold border-top border-2 pt-2 mb-3">
                    <span>Grand Total ({details.grand_total.count.toLocaleString()} transactions)</span>
                    <span>{details.grand_total.amount}</span>
                  </div>
                )}
                <Button variant="secondary" size="sm" onClick={() => setClient(null)}>Back</Button>
              </>
            )
          ) : (
            summary && (
              <>
                <h6 className="mb-3">{title} Settlement Summary [{date}]</h6>
                <SettlementSummaryTable key={`${tab}-${date}`} data={summary.data} onView={(row) => setClient({ id: row.client_record_id })} />
              </>
            )
          )}
        </CardBody>
      </Card>

      {!client && !loading && summary && (
        <ReportTotalSummary lines={[
          { label: 'Total Transactions', value: summary.total.count.toLocaleString() },
          { label: 'Total Amount', value: summary.total.amount },
        ]}
        />
      )}
    </>
  )
}

export default SettlementReportPage
