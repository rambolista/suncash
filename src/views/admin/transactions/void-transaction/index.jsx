import { useMemo, useState } from 'react'
import { Alert, Badge, Button, Card, CardBody, Col, Form, Row, Table } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import ApiService from '@/services/ApiService'
import useCurrentUser from '@/hooks/useCurrentUser'
import { getModulePermission } from '@/utils/modulePermissions'
import ConfirmActionModal from '@/views/admin/merchants/components/ConfirmActionModal'

const TRANSACTION_TYPES = [
  { value: 'RELOAD', label: 'Load' },
  { value: 'SALE', label: 'Purchase' },
  { value: 'MONEY_TRANSFER', label: 'Money Transfer' },
  { value: 'PHONE2PHONE', label: 'Phone to Phone' },
  { value: 'PHONE2STORE', label: 'Phone to Store' },
  { value: 'CASHOUT_CODE', label: 'Cashout by Code' },
  { value: 'CASHOUT_MOBILE', label: 'Cashout by Mobile' },
  { value: 'LOAD_CASHOUTCODE', label: 'Load via Cashout Code' },
  { value: 'BUSINESS_BILLPAY', label: 'Business Billpay' },
  { value: 'BUSINESS_BILLPAY_STORE', label: 'Business Billpay (Store)' },
  { value: 'CUSTOMERSPAYMENT', label: "Customer's Payment" },
  { value: 'DONATION', label: 'Donation' },
  { value: 'CHECKCASHING', label: 'Check Cashing' },
  { value: 'SUNCASH_VOUCHER', label: 'SunCash Voucher' },
  { value: 'UNIBUCKS_VOUCHER', label: 'UniBucks Voucher' },
]

const formatDateTime = (value) => {
  if (!value) return '—'
  const date = new Date(String(value).replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('en-US', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const formatAmount = (value) => `BSD ${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const VoidTransactionPage = () => {
  const currentUser = useCurrentUser()
  const canReverse = useMemo(() => Boolean(getModulePermission(currentUser, '/transactions/void-transaction').can_reverse), [currentUser])

  const [transactionType, setTransactionType] = useState('RELOAD')
  const [transactionId, setTransactionId] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [voidTarget, setVoidTarget] = useState(null)
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
    ApiService.searchVoidTransaction({ transaction_id: trimmedId, transaction_type: transactionType })
      .then((data) => {
        setResults(Array.isArray(data?.data) ? data.data : [])
        setHasSearched(true)
      })
      .catch((err) => setError(err?.message || 'Failed to search for the transaction.'))
      .finally(() => setLoading(false))
  }

  return (
    <>
      <PageBreadcrumb title="Void Transaction" subtitle="Transactions" />
      <Card className="mb-3">
        <CardBody>
          <h5 className="mb-1">Search Transaction</h5>
          <p className="text-muted small mb-3">
            Select a transaction type and look up its exact Transaction ID to void it.
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
                    <tr key={`${row.transaction_type}-${row.transaction_id}`}>
                      <td>{row.transaction_id}</td>
                      <td>{row.customer_name || '—'}</td>
                      <td>{formatDateTime(row.timestamp)}</td>
                      <td>{row.transaction_type_label}</td>
                      <td>{row.mobile || '—'}</td>
                      <td>{formatAmount(row.amount)}</td>
                      <td>
                        {row.status === 'voided' ? (
                          <Badge bg="secondary">{row.status_label || 'Voided'}</Badge>
                        ) : canReverse ? (
                          <div className="d-flex align-items-center gap-2">
                            <Button size="sm" variant="danger" onClick={() => setVoidTarget(row)}>Void Me</Button>
                            {row.status_label && row.status_label !== 'Active' && (
                              <Badge bg="info" className="fw-normal">{row.status_label}</Badge>
                            )}
                          </div>
                        ) : (
                          <Badge bg="success">{row.status_label || 'Active'}</Badge>
                        )}
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
        show={Boolean(voidTarget)}
        onHide={() => setVoidTarget(null)}
        title="Void Transaction"
        message={voidTarget ? `Are you sure you want to void transaction ${voidTarget.transaction_id} (${formatAmount(voidTarget.amount)})? This cannot be undone.` : ''}
        confirmLabel="Void Transaction"
        confirmVariant="danger"
        successMessage="Transaction has been voided successfully."
        onConfirm={() => ApiService.voidTransaction({ transaction_id: voidTarget.transaction_id, transaction_type: voidTarget.transaction_type })}
        onDone={() => search()}
      />
    </>
  )
}

export default VoidTransactionPage
