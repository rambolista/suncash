import { useEffect, useMemo, useState } from 'react'
import { Button, Card, CardBody, Col, Form, Nav, Row } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'
import ReportTotalSummary from '../components/ReportTotalSummary'
import { DURATIONS, fmt, periodLabel as label, stepAnchor, windowFor } from '../components/reportPeriod'
import VatTable from './components/VatTable'

const VatReportPage = () => {
  const { showNotification } = useNotificationContext()
  // Legacy opens on the Custom tab showing the current month.
  const [duration, setDuration] = useState('custom')
  const [anchor, setAnchor] = useState(fmt(new Date()))
  const [custom, setCustom] = useState(windowFor('monthly', fmt(new Date())))
  const [customRange, setCustomRange] = useState(windowFor('monthly', fmt(new Date())))
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)

  const period = useMemo(() => (duration === 'custom' ? customRange : windowFor(duration, anchor)), [duration, anchor, customRange])

  useEffect(() => {
    setLoading(true)
    ApiService.getVatReport(period)
      .then(setReport)
      .catch((err) => { setReport(null); showNotification({ title: 'Failed', message: err?.message || 'Failed to load the VAT report.', variant: 'danger' }) })
      .finally(() => setLoading(false))
  }, [period]) // eslint-disable-line react-hooks/exhaustive-deps

  const displayCustom = () => {
    if (!custom.from || !custom.to) return showNotification({ title: 'Missing dates', message: 'Please enter start and end dates.', variant: 'warning' })
    setCustomRange({ ...custom })
  }

  return (
    <>
      <PageBreadcrumb title="VAT" subtitle="Reports" />

      <Card>
        <CardBody>
          <Nav variant="tabs" activeKey={duration} onSelect={setDuration} className="mb-3">
            {DURATIONS.map(([key, text]) => <Nav.Item key={key}><Nav.Link eventKey={key}>{text}</Nav.Link></Nav.Item>)}
          </Nav>

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
              <Button variant="link" size="sm" className="text-muted p-0" onClick={() => setAnchor((a) => stepAnchor(duration, a, -1))}>
                <Icon icon="chevrons-left" className="me-1" />{label(windowFor(duration, stepAnchor(duration, anchor, -1)), duration)}
              </Button>
              <strong>{label(period, duration)}</strong>
              <Button variant="link" size="sm" className="text-muted p-0" onClick={() => setAnchor((a) => stepAnchor(duration, a, 1))}>
                {label(windowFor(duration, stepAnchor(duration, anchor, 1)), duration)}<Icon icon="chevrons-right" className="ms-1" />
              </Button>
            </div>
          )}

          <h6 className="mb-3">VAT Summary — {label(period, 'custom')}</h6>
          {loading ? <LoadingState message="Loading VAT report..." /> : report && <VatTable key={`${period.from}-${period.to}`} data={report.data} />}
        </CardBody>
      </Card>

      {!loading && report && (
        <ReportTotalSummary lines={[
          { label: 'Total Count', value: report.count.toLocaleString() },
          { label: 'Total Amount', value: report.total.amount },
          { label: 'Total Fees', value: report.total.fees },
          { label: 'Total Vat', value: report.total.vat },
          { label: 'Total Tax Stamp', value: report.total.stamp },
        ]}
        />
      )}
    </>
  )
}

export default VatReportPage
