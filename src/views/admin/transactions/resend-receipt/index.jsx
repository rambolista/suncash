import { useMemo, useState } from 'react'
import { Alert, Badge, Button, Card, CardBody, Col, Form, Row, Table } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import ApiService from '@/services/ApiService'
import useCurrentUser from '@/hooks/useCurrentUser'
import { getModulePermission } from '@/utils/modulePermissions'
import ConfirmActionModal from '@/views/admin/merchants/components/ConfirmActionModal'
import { formatAmount, formatDateTime, triggerDownload } from '../components/format'

const TRANSACTION_TYPES = [
  { value: 'RELOAD', label: 'Load' },
  { value: 'SALE', label: 'Purchase' },
  { value: 'ACTIVATION', label: 'Activation' },
  { value: 'MONEY_TRANSFER', label: 'Money Transfer' },
  { value: 'PHONE2PHONE', label: 'Phone to Phone' },
  { value: 'PHONE2STORE', label: 'Phone to Store' },
  { value: 'CASHOUT_CODE', label: 'Cashout by Code' },
  { value: 'CASHOUT_MOBILE', label: 'Cashout by Mobile' },
  { value: 'BILLPAY', label: 'Billpay' },
  { value: 'BUSINESS_BILLPAY', label: 'Business Billpay' },
  { value: 'BUSINESS_BILLPAY_STORE', label: 'Business Billpay (Store)' },
  { value: 'CUSTOMERSPAYMENT', label: "Customer's Payment" },
  { value: 'DONATION', label: 'Donation' },
  { value: 'CHECKCASHING', label: 'Check Cashing' },
  { value: 'TICKETS', label: 'Events Ticket' },
  { value: 'TICKETS_MOVIE', label: 'Movie Ticket' },
]

const rowKey = (row) => `${row.transaction_type}-${row.transaction_id}`

const ResendReceiptPage = () => {
  const currentUser = useCurrentUser()
  const canGenerate = useMemo(() => Boolean(getModulePermission(currentUser, '/transactions/resend-receipt').can_execute), [currentUser])

  const [transactionType, setTransactionType] = useState('RELOAD')
  const [transactionId, setTransactionId] = useState('')
  const [results, setResults] = useState(null)
  const [mobiles, setMobiles] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [receiptTarget, setReceiptTarget] = useState(null)
  const [hasSearched, setHasSearched] = useState(false)

  const search = (event) => {
    event?.preventDefault()
    const trimmedId = transactionId.trim()
    if (!trimmedId) {
      setError('Enter a transaction ID to search.')
      return
    }

    setLoading(true)
    setError('')
    ApiService.searchTransactionReceipt({ transaction_id: trimmedId, transaction_type: transactionType })
      .then((data) => {
        const rows = Array.isArray(data?.data) ? data.data : []
        setResults(rows)
        setMobiles(Object.fromEntries(rows.map((row) => [rowKey(row), row.mobile || ''])))
        setHasSearched(true)
      })
      .catch((err) => setError(err?.message || 'Failed to search for the transaction.'))
      .finally(() => setLoading(false))
  }

  const sendReceipt = () => {
    const mobile = mobiles[rowKey(receiptTarget)] || ''
    return ApiService.sendTransactionReceipt({
      transaction_id: receiptTarget.transaction_id,
      transaction_type: receiptTarget.transaction_type,
      mobile,
    })
  }

  const downloadReceipt = (row) => {
    ApiService.generateTransactionReceipt(row.transaction_id, row.transaction_type)
      .then(({ blob, filename }) => triggerDownload(blob, filename))
      .catch((err) => setError(err?.message || 'Failed to generate the receipt.'))
  }

  return (
    <>
      <PageBreadcrumb title="Resend Transaction Receipt" subtitle="Transactions" />
      <Card className="mb-3">
        <CardBody>
          <h5 className="mb-1">Search Transaction</h5>
          <p className="text-muted small mb-3">
            Select a transaction type and look up its exact Transaction ID to resend its receipt.
          </p>

          {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}

          <Form onSubmit={search}>
            <Row className="g-3 align-items-end">
              <Col md={3}>
                <Form.Label>Transaction Type</Form.Label>
                <Form.Select value={transactionType} onChange={(e) => setTransactionType(e.target.value)}>
                  {TRANSACTION_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </Form.Select>
              </Col>
              <Col md={5}>
                <Form.Label>Transaction ID</Form.Label>
                <Form.Control
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="Enter transaction ID"
                />
              </Col>
              <Col md={2}>
                <Button type="submit" variant="primary" className="w-100" disabled={loading}>
                  {loading ? 'Searching...' : 'Search'}
                </Button>
              </Col>
            </Row>
          </Form>
        </CardBody>
      </Card>

      {loading ? <LoadingState message="Searching for transaction..." /> : hasSearched ? (
        <Card>
          <CardBody>
            <div className="table-responsive">
              <Table hover className="align-middle mb-0">
                <thead className="thead-sm text-uppercase fs-xxs">
                  <tr>
                    <th>Transaction ID</th>
                    <th>Transaction Info</th>
                    <th>Transaction Date</th>
                    <th>Transaction Type</th>
                    <th>Mobile Number</th>
                    <th>Amount</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {results.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center text-muted py-4">No matching transaction found.</td>
                    </tr>
                  ) : results.map((row) => (
                    <tr key={rowKey(row)}>
                      <td>{row.transaction_id}</td>
                      <td>{row.customer_name || '—'}</td>
                      <td>{formatDateTime(row.timestamp)}</td>
                      <td>{row.transaction_type_label}</td>
                      <td style={{ minWidth: 160 }}>
                        <Form.Control
                          size="sm"
                          type="text"
                          value={mobiles[rowKey(row)] ?? ''}
                          onChange={(e) => setMobiles((prev) => ({ ...prev, [rowKey(row)]: e.target.value }))}
                          placeholder="Mobile number"
                        />
                      </td>
                      <td>{formatAmount(row.amount)}</td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          {canGenerate && (
                            <>
                              <Button size="sm" variant="primary" onClick={() => setReceiptTarget(row)}>Send Receipt</Button>
                              <Button size="sm" variant="outline-secondary" onClick={() => downloadReceipt(row)}>PDF</Button>
                            </>
                          )}
                          {row.status === 'voided' && <Badge bg="secondary">{row.status_label || 'Voided'}</Badge>}
                          {row.status !== 'voided' && row.status_label && row.status_label !== 'Active' && (
                            <Badge bg="info" className="fw-normal">{row.status_label}</Badge>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </CardBody>
        </Card>
      ) : null}

      <ConfirmActionModal
        show={Boolean(receiptTarget)}
        onHide={() => setReceiptTarget(null)}
        title="Send Receipt"
        message={receiptTarget ? `Send the receipt for transaction ${receiptTarget.transaction_id} to ${mobiles[rowKey(receiptTarget)] || '(no mobile number)'}?` : ''}
        confirmLabel="Send Receipt"
        confirmVariant="primary"
        successMessage="Receipt has been sent via text."
        onConfirm={sendReceipt}
      />
    </>
  )
}

export default ResendReceiptPage
