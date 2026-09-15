import { useEffect, useState } from 'react'
import { Alert, Button, Col, Form, Modal, Row } from 'react-bootstrap'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'

const emptyForm = {
  trans_type: '',
  reason: '',
  deposit_location_id: '',
  deposit_location: '',
  amount: '0.00',
  recyclable_amount: '0.00',
  non_recyclable_amount: '0.00',
  recyclable_deposit_dest: '',
  recycle_location: '',
  deposit_terminal_id: '',
  deposit_terminal_name: '',
  deposit_store_id: '',
  deposit_store_name: '',
  location_at: '',
  recycled_held_at: '',
  notes: '',
}

// Legacy's cent-shifting amount mask: digits type in from the right, e.g. "1" -> "0.01", "123" -> "1.23".
const maskAmount = (rawValue) => {
  let digits = String(rawValue ?? '').replace(/\D/g, '')
  if (digits.length === 0) digits = '0'
  digits = digits.padStart(3, '0')
  const integerPart = digits.slice(0, -2).replace(/^0+(?=\d)/, '') || '0'
  const decimalPart = digits.slice(-2)
  return `${integerPart}.${decimalPart}`
}

const isWordMatch = (word, search) => new RegExp(search, 'i').test(word || '')

const AdjustmentModal = ({ show, onHide, terminal, context, onSaved }) => {
  const { showNotification } = useNotificationContext()
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (show) setForm(emptyForm)
  }, [show])

  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }))

  const transactionTypes = context?.transaction_types || {}
  const debitReasons = transactionTypes.debit || []
  const creditReasons = transactionTypes.credit || []
  const depositLocations = transactionTypes.deposit_location || []
  const recycledDestinations = transactionTypes.recycled_destination || []
  const terminals = (context?.terminals || []).filter((t) => t.id !== terminal?.id)
  const stores = context?.stores || []

  const isDebit = form.trans_type === 'debit'
  const isCredit = form.trans_type === 'credit'
  const isDeposit = form.trans_type === 'deposit'
  const isRecycled = isWordMatch(form.deposit_location, 'Recycled')
  const isAnotherKiosk = isWordMatch(form.deposit_location, 'Another Kiosk')
  const isTopLevelStore = isDeposit && !isRecycled && isWordMatch(form.deposit_location, 'SunCash Store')
  const isHeldTemporary = isDeposit && !isRecycled && isWordMatch(form.deposit_location, 'Held Temporary')
  const showPlainAmount = isDebit || isCredit || isTopLevelStore || isHeldTemporary || (isDeposit && !isRecycled && !isTopLevelStore && !isHeldTemporary)
  const showNonRecycledDest = isRecycled && Number(form.non_recyclable_amount) > 0
  const isNestedStore = showNonRecycledDest && isWordMatch(form.recycle_location, 'SunCash Store')
  const isNestedHeldTemporary = showNonRecycledDest && isWordMatch(form.recycle_location, 'Location Temporary')

  const handleTransTypeChange = (value) => {
    set({
      trans_type: value,
      reason: '',
      deposit_location_id: '',
      deposit_location: '',
      amount: '0.00',
      recyclable_amount: '0.00',
      non_recyclable_amount: '0.00',
      recyclable_deposit_dest: '',
      recycle_location: '',
      deposit_terminal_id: '',
      deposit_store_id: '',
      location_at: '',
      recycled_held_at: '',
    })
  }

  const handleDepositLocationChange = (option) => {
    const name = option?.name || ''
    set({
      deposit_location_id: option?.id ?? '',
      deposit_location: name,
      amount: '0.00',
      recyclable_amount: '0.00',
      non_recyclable_amount: '0.00',
      recyclable_deposit_dest: '',
      recycle_location: '',
      deposit_terminal_id: '',
      deposit_store_id: '',
      location_at: '',
      recycled_held_at: isWordMatch(name, 'Same Kiosk') ? (terminal?.location || `${terminal?.name} Unassigned`) : '',
    })
  }

  const handleRecycledDestChange = (option) => {
    const name = option?.name || ''
    set({
      recyclable_deposit_dest: option?.id ?? '',
      recycle_location: name,
      deposit_store_id: '',
      location_at: '',
    })
  }

  const handleTerminalDestChange = (id) => {
    const picked = terminals.find((t) => String(t.id) === String(id))
    set({
      deposit_terminal_id: id,
      deposit_terminal_name: picked?.name || '',
      recycled_held_at: picked ? (picked.location || `${picked.name} Unassigned`) : '',
    })
  }

  const handleStoreChange = (id) => {
    const picked = stores.find((s) => String(s.id) === String(id))
    set({ deposit_store_id: id, deposit_store_name: picked?.name || '' })
  }

  const validate = () => {
    if (!form.trans_type) return 'Please select an adjustment type.'

    if (isDebit || isCredit) {
      if (!form.reason) return 'Please select a reason.'
      if (Number(form.amount) <= 0) return 'Please enter a valid amount.'
      return null
    }

    if (isDeposit) {
      if (!form.deposit_location) return 'Deposit Location is required.'

      if (isRecycled) {
        if (Number(form.recyclable_amount) <= 0 && Number(form.non_recyclable_amount) <= 0) {
          return 'Please enter any recyclable bills.'
        }
        if (isAnotherKiosk && !form.deposit_terminal_id) return 'Please select another kiosk.'
        if (showNonRecycledDest) {
          if (!form.recyclable_deposit_dest) return 'Non Recyclabled Bills Destination is required.'
          if (isNestedStore && !form.deposit_store_id) return 'Please select a store.'
          if (isNestedHeldTemporary && !form.location_at) return 'Please add a Temporary Location.'
        }
        return null
      }

      if (isTopLevelStore && !form.deposit_store_id) return 'Please select a store.'
      if (isHeldTemporary && !form.location_at) return 'Please add a Temporary Location.'
      if (showPlainAmount && Number(form.amount) <= 0) return 'Please enter a valid amount.'
      return null
    }

    return 'Please enter a valid adjustment type.'
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const error = validate()
    if (error) {
      showNotification({ title: 'Failed', message: error, variant: 'danger' })
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        trans_type: form.trans_type,
        notes: form.notes,
        reason: form.reason,
        amount: showPlainAmount ? form.amount : undefined,
        deposit_location: form.deposit_location || undefined,
        recyclable_amount: isRecycled ? form.recyclable_amount : undefined,
        non_recyclable_amount: isRecycled ? form.non_recyclable_amount : undefined,
        recyclable_deposit_dest: showNonRecycledDest ? form.recyclable_deposit_dest : undefined,
        recycle_location: showNonRecycledDest ? form.recycle_location : undefined,
        deposit_terminal_id: isAnotherKiosk ? form.deposit_terminal_id : undefined,
        deposit_terminal_name: isAnotherKiosk ? form.deposit_terminal_name : undefined,
        deposit_store_id: (isTopLevelStore || isNestedStore) ? form.deposit_store_id : undefined,
        deposit_store_name: (isTopLevelStore || isNestedStore) ? form.deposit_store_name : undefined,
        location_at: (isHeldTemporary || isNestedHeldTemporary) ? form.location_at : undefined,
      }

      await ApiService.adjustKioskDeposit(terminal.id, payload)
      showNotification({ title: 'Success', message: 'Transaction has been processed.', variant: 'success' })
      onSaved?.()
      onHide()
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.message || 'Unable to process transaction.', variant: 'danger' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal show={show} onHide={submitting ? undefined : onHide} centered size="lg" backdrop={submitting ? 'static' : true}>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton={!submitting}>
          <Modal.Title>Adjustment{terminal ? ` — ${terminal.name} ${terminal.location || ''}` : ''}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col md={12}>
              <Form.Label>Adjustment Type <span className="text-danger">*</span></Form.Label>
              <Form.Select value={form.trans_type} onChange={(e) => handleTransTypeChange(e.target.value)}>
                <option value="">-- Select a Type --</option>
                <option value="debit">Debit</option>
                <option value="credit">Credit</option>
                <option value="deposit">Deposit</option>
              </Form.Select>
            </Col>

            {(isDebit || isCredit) && (
              <Col md={12}>
                <Form.Label>Reason <span className="text-danger">*</span></Form.Label>
                <Form.Select value={form.reason} onChange={(e) => set({ reason: e.target.value })}>
                  <option value="">-- Select a Reason --</option>
                  {(isDebit ? debitReasons : creditReasons).map((r) => <option key={r.id} value={r.name}>{r.name}</option>)}
                </Form.Select>
              </Col>
            )}

            {isDeposit && (
              <Col md={12}>
                <Form.Label>Deposit Location <span className="text-danger">*</span></Form.Label>
                <Form.Select
                  value={form.deposit_location}
                  onChange={(e) => handleDepositLocationChange(depositLocations.find((o) => o.name === e.target.value))}
                >
                  <option value="">-- Select a Location --</option>
                  {depositLocations.map((o) => <option key={o.id} value={o.name}>{o.name}</option>)}
                </Form.Select>
              </Col>
            )}

            {isAnotherKiosk && (
              <Col md={12}>
                <Form.Label>Kiosk <span className="text-danger">*</span></Form.Label>
                <Form.Select value={form.deposit_terminal_id} onChange={(e) => handleTerminalDestChange(e.target.value)}>
                  <option value="">-- Select a Terminal --</option>
                  {terminals.map((t) => <option key={t.id} value={t.id}>{t.name} {t.location || 'Unassigned'}</option>)}
                </Form.Select>
              </Col>
            )}

            {isRecycled && (
              <>
                <Col md={6}>
                  <Form.Label>Recyclable Total</Form.Label>
                  <Form.Control value={form.recyclable_amount} onChange={(e) => set({ recyclable_amount: maskAmount(e.target.value) })} inputMode="numeric" />
                </Col>
                <Col md={6}>
                  <Form.Label>Non Recyclable Total</Form.Label>
                  <Form.Control value={form.non_recyclable_amount} onChange={(e) => set({ non_recyclable_amount: maskAmount(e.target.value) })} inputMode="numeric" />
                </Col>
              </>
            )}

            {showNonRecycledDest && (
              <Col md={12}>
                <Form.Label>For Non Recycled Bills <span className="text-danger">*</span></Form.Label>
                <Form.Select
                  value={form.recycle_location}
                  onChange={(e) => handleRecycledDestChange(recycledDestinations.find((o) => o.name === e.target.value))}
                >
                  <option value="">-- Select a Destination --</option>
                  {recycledDestinations.map((o) => <option key={o.id} value={o.name}>{o.name}</option>)}
                </Form.Select>
              </Col>
            )}

            {isNestedHeldTemporary && (
              <Col md={12}>
                <Form.Label>Location <span className="text-danger">*</span></Form.Label>
                <Form.Select value={form.recycled_held_at} onChange={(e) => set({ recycled_held_at: e.target.value, location_at: e.target.value })}>
                  <option value="">-- Select --</option>
                  {(context?.terminals || []).map((t) => (
                    <option key={t.id} value={t.location || `${t.name} Unassigned`}>{t.location || `${t.name} Unassigned`}</option>
                  ))}
                </Form.Select>
              </Col>
            )}

            {(isTopLevelStore || isNestedStore) && (
              <Col md={12}>
                <Form.Label>Store <span className="text-danger">*</span></Form.Label>
                <Form.Select value={form.deposit_store_id} onChange={(e) => handleStoreChange(e.target.value)}>
                  <option value="">-- Select a Store --</option>
                  {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </Form.Select>
              </Col>
            )}

            {isHeldTemporary && (
              <Col md={12}>
                <Form.Label>Location <span className="text-danger">*</span></Form.Label>
                <Form.Control value={form.location_at} onChange={(e) => set({ location_at: e.target.value })} placeholder="Enter a location" />
              </Col>
            )}

            {showPlainAmount && (
              <Col md={12}>
                <Form.Label>Amount <span className="text-danger">*</span></Form.Label>
                <Form.Control value={form.amount} onChange={(e) => set({ amount: maskAmount(e.target.value) })} inputMode="numeric" />
              </Col>
            )}

            <Col md={12}>
              <Form.Label>Notes</Form.Label>
              <Form.Control as="textarea" rows={2} value={form.notes} onChange={(e) => set({ notes: e.target.value })} />
            </Col>

            {!form.trans_type && (
              <Col md={12}>
                <Alert variant="secondary" className="mb-0 py-2 small">Select an adjustment type to continue.</Alert>
              </Col>
            )}
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={submitting}>Back</Button>
          <Button variant="primary" type="submit" disabled={submitting}>
            {submitting ? 'Processing...' : 'Process'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}

export default AdjustmentModal
