import { useEffect, useState } from 'react'
import { Alert, Button, Card, Col, Form, Image, Row } from 'react-bootstrap'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import ConfirmActionModal from '../../../merchants/components/ConfirmActionModal'

const money = (value) => `BSD ${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

/** `scanned_id` is stored either as a full URL or as a raw base64 image blob, inconsistently across rows — render whichever it is. */
const scannedIdSrc = (value) => {
  if (!value) return null
  return /^https?:\/\//i.test(value) ? value : `data:image/jpeg;base64,${value}`
}

const AdjustBalanceTab = ({ customerId, detail, canExecute, onProcessed }) => {
  const [orientation, setOrientation] = useState('Credit')
  const [transTypes, setTransTypes] = useState([])
  const [loadingTypes, setLoadingTypes] = useState(false)
  const [transTypeId, setTransTypeId] = useState('')
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [scannedId, setScannedId] = useState(null)

  useEffect(() => {
    setLoadingTypes(true)
    setTransTypeId('')
    ApiService.getDebitCreditTransactionTypes(orientation)
      .then((data) => setTransTypes(Array.isArray(data?.data) ? data.data : []))
      .catch(() => setTransTypes([]))
      .finally(() => setLoadingTypes(false))
  }, [orientation])

  useEffect(() => {
    ApiService.getCustomerManagementScannedIds(customerId)
      .then((data) => setScannedId(data?.scanned_id || null))
      .catch(() => setScannedId(null))
  }, [customerId])

  const selectedType = transTypes.find((t) => String(t.id) === String(transTypeId))
  const numericAmount = Number(amount)
  const canSubmit = canExecute && transTypeId !== '' && numericAmount > 0

  const resetForm = () => {
    setTransTypeId('')
    setAmount('')
    setNotes('')
  }

  return (
    <Card>
      <Card.Header><h5 className="mb-0">Adjust Customer Balance</h5></Card.Header>
      <Card.Body>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Credit or Debit</Form.Label>
              <div className="d-flex gap-3">
                <Form.Check
                  type="radio"
                  id="orientation-credit"
                  label="Credit"
                  name="orientation"
                  checked={orientation === 'Credit'}
                  onChange={() => setOrientation('Credit')}
                />
                <Form.Check
                  type="radio"
                  id="orientation-debit"
                  label="Debit"
                  name="orientation"
                  checked={orientation === 'Debit'}
                  onChange={() => setOrientation('Debit')}
                />
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Transaction Type</Form.Label>
              <Form.Select value={transTypeId} onChange={(e) => setTransTypeId(e.target.value)} disabled={loadingTypes}>
                <option value="" disabled>{loadingTypes ? 'Loading...' : 'Select a transaction type'}</option>
                {transTypes.map((t) => <option key={t.id} value={t.id}>{t.transaction_type_description}</option>)}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Amount</Form.Label>
              <Form.Control type="number" min="0.01" step="0.01" placeholder="Enter amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control as="textarea" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </Form.Group>

            {!canExecute && <Alert variant="warning" className="py-2 small">You don't have permission to process transactions.</Alert>}

            <Button variant="success" disabled={!canSubmit} onClick={() => setShowConfirm(true)}>
              <Icon icon="check" className="me-1" /> Process
            </Button>
          </Col>

          <Col md={6}>
            <div className="text-muted small">Current Account Balance</div>
            <div className="fs-3 fw-semibold mb-4">{money(detail?.card_balance)}</div>

            <div className="text-muted small mb-1">Scanned ID</div>
            {scannedIdSrc(scannedId) ? (
              <a href={scannedIdSrc(scannedId)} target="_blank" rel="noreferrer">
                <Image src={scannedIdSrc(scannedId)} thumbnail style={{ maxWidth: 260 }} />
              </a>
            ) : (
              <p className="text-muted small">No scanned ID on file.</p>
            )}
          </Col>
        </Row>
      </Card.Body>

      <ConfirmActionModal
        show={showConfirm}
        onHide={() => setShowConfirm(false)}
        title={`${orientation} Customer Balance`}
        message={`Are you sure you want to ${orientation.toLowerCase()} ${money(numericAmount)} (${selectedType?.transaction_type_description || ''}) ${orientation === 'Credit' ? 'to' : 'from'} this customer's account?`}
        confirmLabel="Process"
        confirmVariant="success"
        successMessage="Successfully processed transaction."
        onConfirm={() => ApiService.processDebitCredit(customerId, { id_trans_type: Number(transTypeId), amount: numericAmount, notes })}
        onDone={() => {
          resetForm()
          onProcessed?.()
        }}
      />
    </Card>
  )
}

export default AdjustBalanceTab
