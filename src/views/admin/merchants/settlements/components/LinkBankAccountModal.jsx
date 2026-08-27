import { useEffect, useState } from 'react'
import { Alert, Button, Form, Modal } from 'react-bootstrap'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'

const LinkBankAccountModal = ({ show, onHide, banks, onLinked }) => {
  const { showNotification } = useNotificationContext()
  const [bankId, setBankId] = useState('')
  const [accountName, setAccountName] = useState('')
  const [accountNo, setAccountNo] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (show) {
      setBankId('')
      setAccountName('')
      setAccountNo('')
      setError('')
    }
  }, [show])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const result = await ApiService.linkSettlementBankAccount({ bank_id: bankId, account_name: accountName, account_no: accountNo })
      showNotification({ title: 'Success', message: result?.message || 'Bank account has been linked.', variant: 'success' })
      onLinked?.(result?.data || [])
      onHide()
    } catch (err) {
      setError(err?.errors?.bank_id?.[0] || err?.errors?.account_name?.[0] || err?.errors?.account_no?.[0] || err?.message || 'Failed to link bank account.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Link Bank Account</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit} noValidate>
        <Modal.Body>
          {error && <Alert variant="danger" className="py-2 small mb-3">{error}</Alert>}
          <Form.Group className="mb-3">
            <Form.Label>Bank and Branch *</Form.Label>
            <Form.Select value={bankId} onChange={(e) => setBankId(e.target.value)} required>
              <option value="">--Select Bank--</option>
              {banks.map((bank) => <option key={bank.id} value={bank.id}>{bank.banks} - {bank.branch_info}</option>)}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Bank Account Name *</Form.Label>
            <Form.Control value={accountName} onChange={(e) => setAccountName(e.target.value)} required />
          </Form.Group>
          <Form.Group>
            <Form.Label>Bank Account Number *</Form.Label>
            <Form.Control value={accountNo} onChange={(e) => setAccountNo(e.target.value)} required />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={submitting}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={submitting}>
            {submitting ? 'Linking...' : 'Link'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}

export default LinkBankAccountModal
