import { useEffect, useState } from 'react'
import { Alert, Button, Col, Form, Modal, Row } from 'react-bootstrap'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'

const NOTES_REQUIRED = ['in_transit', 'is_bank', 'is_recycled']
const RECEIPT_REQUIRED = ['is_bank', 'is_recycled']

const emptyForm = {
  notes: '',
  storeId: '',
  storeName: '',
  terminalId: '',
  bankId: '',
  bankName: '',
  bankBranch: '',
  accountName: '',
  accountNo: '',
}

const ConfirmActionModal = ({ show, onHide, deposit, action, context, onSaved }) => {
  const { showNotification } = useNotificationContext()
  const [form, setForm] = useState(emptyForm)
  const [banks, setBanks] = useState([])
  const [receiptFile, setReceiptFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const actionValue = action?.value || ''
  const actionLabel = action?.label || ''
  const isDelete = actionValue === 'delete_data'
  const isStore = actionValue === 'in_store'
  const isBank = actionValue === 'is_bank'
  const isRecycled = actionValue === 'is_recycled'

  useEffect(() => {
    if (!show) return
    setForm(emptyForm)
    setReceiptFile(null)
    setBanks([])
    if (isBank && deposit?.terminal_branch_id) {
      ApiService.getKioskCashManagementBanks(deposit.terminal_branch_id)
        .then((data) => setBanks(Array.isArray(data?.banks) ? data.banks : []))
        .catch(() => setBanks([]))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, actionValue])

  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }))

  const handleBankChange = (bankId) => {
    const bank = banks.find((b) => String(b.id) === String(bankId))
    set({
      bankId,
      bankName: bank?.bank_name || '',
      bankBranch: bank?.branch_name || '',
      accountName: bank?.customer_name || '',
      accountNo: bank?.account_number || '',
    })
  }

  const handleStoreChange = (storeId) => {
    const store = (context?.stores || []).find((s) => String(s.id) === String(storeId))
    set({ storeId, storeName: store?.name || '' })
  }

  const validate = () => {
    if (isDelete) return null
    if (NOTES_REQUIRED.includes(actionValue) && !form.notes.trim()) return 'Please enter a note.'
    if (RECEIPT_REQUIRED.includes(actionValue) && !receiptFile) return 'Please upload a receipt.'
    if (isStore && !form.storeId) return 'Please select a store.'
    if (isRecycled && !form.terminalId) return 'Please select a kiosk.'
    if (isBank && (!form.bankId || !form.bankBranch || !form.accountNo || !form.accountName)) {
      return 'Please enter valid bank details.'
    }
    return null
  }

  const buildDescription = () => {
    const target = form.storeName || deposit?.kiosk_location || ''
    if (actionValue === 'in_transit') return `In Transit to ${target}`
    if (actionValue === 'is_bank') return `Bank - ${form.bankBranch} #${form.accountNo}`
    if (actionValue === 'in_store') return `Delivered to ${form.storeName || target} Store`
    return undefined
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (isDelete) {
      setSubmitting(true)
      try {
        await ApiService.deleteKioskCashManagement(deposit.id, { note: form.notes || undefined })
        showNotification({ title: 'Success', message: 'Transaction has been deleted.', variant: 'success' })
        onSaved?.()
        onHide()
      } catch (err) {
        showNotification({ title: 'Failed', message: err?.message || 'Unable to delete transaction.', variant: 'danger' })
      } finally {
        setSubmitting(false)
      }
      return
    }

    const error = validate()
    if (error) {
      showNotification({ title: 'Failed', message: error, variant: 'danger' })
      return
    }

    setSubmitting(true)
    try {
      let receiptPath
      if (receiptFile) {
        const uploaded = await ApiService.uploadKioskCashManagementReceipt(receiptFile)
        receiptPath = uploaded?.path
      }

      await ApiService.confirmKioskCashManagement(deposit.id, {
        action: actionValue,
        notes: form.notes || undefined,
        description: buildDescription(),
        receipt_path: receiptPath,
        store_id: isStore ? form.storeId : undefined,
        deposit_terminal_id: isRecycled ? form.terminalId : undefined,
        bank_name: isBank ? form.bankName : undefined,
        bank_branch: isBank ? form.bankBranch : undefined,
        account_name: isBank ? form.accountName : undefined,
        account_no: isBank ? form.accountNo : undefined,
      })
      showNotification({ title: 'Success', message: 'Transaction has been confirmed.', variant: 'success' })
      onSaved?.()
      onHide()
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.message || 'Unable to process transaction.', variant: 'danger' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal show={show} onHide={submitting ? undefined : onHide} centered backdrop={submitting ? 'static' : true}>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton={!submitting}>
          <Modal.Title>{isDelete ? 'Delete Transaction' : actionLabel} for {deposit?.deposit_status_label}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            {isStore && (
              <Col md={12}>
                <Form.Label>Store <span className="text-danger">*</span></Form.Label>
                <Form.Select value={form.storeId} onChange={(e) => handleStoreChange(e.target.value)}>
                  <option value="">-- Select a Store --</option>
                  {(context?.stores || []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </Form.Select>
              </Col>
            )}

            {isRecycled && (
              <Col md={12}>
                <Form.Label>Kiosk <span className="text-danger">*</span></Form.Label>
                <Form.Select value={form.terminalId} onChange={(e) => set({ terminalId: e.target.value })}>
                  <option value="">-- Select a terminal --</option>
                  {(context?.terminals || []).filter((t) => t.id !== deposit?.terminal_id).map((t) => (
                    <option key={t.id} value={t.id}>{t.name} {t.location || ''}</option>
                  ))}
                </Form.Select>
              </Col>
            )}

            {isBank && (
              <>
                <Col md={12}>
                  <Form.Label>Bank Account <span className="text-danger">*</span></Form.Label>
                  <Form.Select value={form.bankId} onChange={(e) => handleBankChange(e.target.value)}>
                    <option value="">Select Bank</option>
                    {banks.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
                  </Form.Select>
                  {!banks.length && <Form.Text>No bank accounts registered for this branch.</Form.Text>}
                </Col>
                <Col md={6}>
                  <Form.Label>Bank</Form.Label>
                  <Form.Control value={form.bankName} readOnly placeholder="Bank" />
                </Col>
                <Col md={6}>
                  <Form.Label>Branch</Form.Label>
                  <Form.Control value={form.bankBranch} readOnly placeholder="Branch" />
                </Col>
                <Col md={6}>
                  <Form.Label>Account Name</Form.Label>
                  <Form.Control value={form.accountName} onChange={(e) => set({ accountName: e.target.value })} placeholder="Account Name" />
                </Col>
                <Col md={6}>
                  <Form.Label>Account Last Four Digits</Form.Label>
                  <Form.Control value={form.accountNo} onChange={(e) => set({ accountNo: e.target.value.replace(/\D/g, '') })} placeholder="Account No." />
                </Col>
              </>
            )}

            {!isDelete && (
              <Col md={12}>
                <Form.Label>Receipt {RECEIPT_REQUIRED.includes(actionValue) && <span className="text-danger">*</span>}</Form.Label>
                <Form.Control type="file" accept="image/*" onChange={(e) => setReceiptFile(e.target.files?.[0] || null)} />
              </Col>
            )}

            <Col md={12}>
              <Form.Label>
                {isDelete ? 'Reason' : 'Notes'} {NOTES_REQUIRED.includes(actionValue) && <span className="text-danger">*</span>}
              </Form.Label>
              <Form.Control as="textarea" rows={2} value={form.notes} onChange={(e) => set({ notes: e.target.value })} />
            </Col>

            {isDelete && (
              <Col md={12}>
                <Alert variant="danger" className="mb-0 py-2 small">This permanently removes the transaction from Cash Management.</Alert>
              </Col>
            )}
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={submitting}>Close</Button>
          <Button variant={isDelete ? 'danger' : 'primary'} type="submit" disabled={submitting}>
            {submitting ? 'Processing...' : isDelete ? 'Delete' : 'Confirm'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}

export default ConfirmActionModal
