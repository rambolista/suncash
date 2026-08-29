import { useEffect, useState } from 'react'
import { Button, Card, Col, Form, Row } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import LoadingState from '@/components/LoadingState'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'
import StatementTransactionsTable from './StatementTransactionsTable'
import AdjustmentModal from './AdjustmentModal'

const money = (value) => `BSD ${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const today = () => new Date().toISOString().slice(0, 10)

const StatementDetailPage = ({ merchantId, canEdit, onBack }) => {
  const { showNotification } = useNotificationContext()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [dateFrom, setDateFrom] = useState(today())
  const [dateTo, setDateTo] = useState(today())
  const [exporting, setExporting] = useState('')
  const [showAdjustment, setShowAdjustment] = useState(false)

  const load = (from = dateFrom, to = dateTo) => {
    setLoading(true)
    ApiService.getMerchantStatement(merchantId, from, to)
      .then(setData)
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load statement.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [merchantId])

  const handleFilter = () => load(dateFrom, dateTo)

  const handleExport = async (format) => {
    setExporting(format)
    try {
      const { blob, filename } = await ApiService.exportMerchantStatement(merchantId, dateFrom, dateTo, format)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.message || `Failed to export ${format.toUpperCase()}.`, variant: 'danger' })
    } finally {
      setExporting('')
    }
  }

  if (loading && !data) {
    return (
      <>
        <PageBreadcrumb title="Merchant Statement" subtitle="Merchants" />
        <LoadingState />
      </>
    )
  }

  const merchant = data?.merchant

  return (
    <>
      <PageBreadcrumb title="Merchant Statement" subtitle="Merchants" />
      <Button variant="light" size="sm" className="mb-3" onClick={onBack}>
        <Icon icon="arrow-left" className="me-1" /> Back to list
      </Button>

      <Card className="mb-3">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
            <div>
              <h5 className="mb-0">{merchant?.dba_name}</h5>
              <span className="text-muted small">{merchant?.suntag_shortcode}</span>
            </div>
            <div className="text-end">
              <div className="text-muted small">Current Balance</div>
              <div className="fs-4 fw-semibold">{money(merchant?.client_prefund)}</div>
            </div>
          </div>

          <Row className="align-items-end g-2">
            <Col md={3}>
              <Form.Label className="small text-muted">Date From</Form.Label>
              <Form.Control type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </Col>
            <Col md={3}>
              <Form.Label className="small text-muted">Date To</Form.Label>
              <Form.Control type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </Col>
            <Col md="auto">
              <Button variant="primary" onClick={handleFilter} disabled={loading}>
                <Icon icon="filter" className="me-1" /> Apply
              </Button>
            </Col>
            <Col />
            {canEdit && (
              <Col md="auto">
                <Button variant="outline-primary" onClick={() => setShowAdjustment(true)}>
                  <Icon icon="adjustments" className="me-1" /> Adjustment
                </Button>
              </Col>
            )}
            <Col md="auto">
              <Button variant="outline-secondary" disabled={exporting !== ''} onClick={() => handleExport('pdf')}>
                <Icon icon="file-type-pdf" className="me-1" /> {exporting === 'pdf' ? 'Exporting...' : 'Export to PDF'}
              </Button>
            </Col>
            <Col md="auto">
              <Button variant="outline-success" disabled={exporting !== ''} onClick={() => handleExport('csv')}>
                <Icon icon="file-type-xls" className="me-1" /> {exporting === 'csv' ? 'Exporting...' : 'Export to Excel'}
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          {loading ? <LoadingState /> : <StatementTransactionsTable data={data?.rows || []} />}
        </Card.Body>
      </Card>

      <AdjustmentModal
        show={showAdjustment}
        onHide={() => setShowAdjustment(false)}
        merchant={merchant}
        onDone={() => load()}
      />
    </>
  )
}

export default StatementDetailPage
