import { useEffect, useState } from 'react'
import { Alert, Button, Card, CardBody, Col, Form, Row } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'
import { money } from '@/utils/reportHelpers'
import LookupAmountTable from '../components/LookupAmountTable'

const COLUMNS = [
  { key: 'merchant_name', label: 'Merchant / Entity' },
  { key: 'share_description', label: 'Description' },
  { key: 'share_value_display', label: 'Amount / Percentage' },
]

/** LookupAmountTable's column `render` only receives the cell value, not the row, so the % vs $ formatting (which depends on `share_type`) and the `*` inherited marker are pre-computed onto each row here instead. */
const presentRows = (rows) => rows.map((row) => ({
  ...row,
  merchant_name: `${row.merchant_name || '—'}${row.is_inherited ? ' *' : ''}`,
  share_value_display: row.share_type === '1' ? `${Number(row.share_value).toFixed(2)}%` : money(row.share_value),
}))

const RevShareManagementPage = () => {
  const { showNotification } = useNotificationContext()

  const [merchants, setMerchants] = useState([])
  const [transactionTypes, setTransactionTypes] = useState([])
  const [shareTypes, setShareTypes] = useState([])

  const [merchantId, setMerchantId] = useState('')
  const [transactionTypeId, setTransactionTypeId] = useState('')
  const [shareType, setShareType] = useState('')

  const [rows, setRows] = useState([])
  const [feeInfo, setFeeInfo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    ApiService.getRevShareFilters()
      .then((data) => {
        setMerchants(Array.isArray(data?.merchants) ? data.merchants : [])
        setTransactionTypes(Array.isArray(data?.transaction_types) ? data.transaction_types : [])
        setShareTypes(Array.isArray(data?.share_types) ? data.share_types : [])
      })
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load filters.', variant: 'danger' }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleShow = (event) => {
    event.preventDefault()
    if (!merchantId || !transactionTypeId || !shareType) {
      showNotification({ title: 'Failed', message: 'Please select merchant, transaction type and share type.', variant: 'danger' })
      return
    }

    setLoading(true)
    setSearched(true)
    ApiService.getRevShareDefinitions({ merchant_id: merchantId, transaction_type_id: transactionTypeId, share_type: shareType })
      .then((data) => {
        setRows(presentRows(Array.isArray(data?.data) ? data.data : []))
        setFeeInfo(data?.fee_info || null)
      })
      .catch((err) => {
        setRows([])
        setFeeInfo(null)
        showNotification({ title: 'Failed', message: err?.message || 'Revenue share definition not found.', variant: 'danger' })
      })
      .finally(() => setLoading(false))
  }

  return (
    <>
      <PageBreadcrumb title="Revenue Share Management" subtitle="Tools" />

      <Card className="mb-3">
        <CardBody>
          <p className="text-muted small mb-3">
            Rows marked <span className="text-muted">*</span> are inherited from a broader rule (all merchants and/or all transaction
            types) rather than a definition specific to what you selected.
          </p>
          <Form onSubmit={handleShow}>
            <Row className="g-3 align-items-end">
              <Col md={3}>
                <Form.Label>Merchant</Form.Label>
                <Form.Select value={merchantId} onChange={(e) => setMerchantId(e.target.value)}>
                  <option value="">- SELECT -</option>
                  {merchants.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </Form.Select>
              </Col>
              <Col md={4}>
                <Form.Label>Transaction Type</Form.Label>
                <Form.Select value={transactionTypeId} onChange={(e) => setTransactionTypeId(e.target.value)}>
                  <option value="">- SELECT -</option>
                  {transactionTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </Form.Select>
              </Col>
              <Col md={3}>
                <Form.Label>Share Type</Form.Label>
                <Form.Select value={shareType} onChange={(e) => setShareType(e.target.value)}>
                  <option value="">- SELECT -</option>
                  {shareTypes.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </Form.Select>
              </Col>
              <Col md="auto">
                <Button type="submit" variant="primary" disabled={loading}>
                  <Icon icon="filter" className="me-1" /> {loading ? 'Loading...' : 'Show Revenue Share'}
                </Button>
              </Col>
            </Row>
          </Form>
        </CardBody>
      </Card>

      {searched && !loading && feeInfo && (
        <Card className="mb-3">
          <CardBody>
            <h6 className="mb-3">Related Settings</h6>
            <Row>
              <Col md={4}><div className="text-muted small">Transaction Fee</div><div className="fw-semibold">{feeInfo.transaction_fee != null ? money(feeInfo.transaction_fee) : '—'}</div></Col>
              <Col md={4}><div className="text-muted small">Merchant Owner Share</div><div className="fw-semibold">{feeInfo.revenue_share != null ? `${feeInfo.revenue_share}%` : '—'}</div></Col>
              <Col md={4}><div className="text-muted small">Retail Cost (POS)</div><div className="fw-semibold">{feeInfo.commission_per_transaction != null ? money(feeInfo.commission_per_transaction) : '—'}</div></Col>
            </Row>
          </CardBody>
        </Card>
      )}

      {searched && (
        <Card>
          <CardBody>
            {loading ? <LoadingState message="Loading revenue share..." /> : (
              rows.length
                ? <LookupAmountTable data={rows} columns={COLUMNS} canEdit={false} />
                : <Alert variant="warning" className="mb-0">Revenue share definition not found.</Alert>
            )}
          </CardBody>
        </Card>
      )}
    </>
  )
}

export default RevShareManagementPage
