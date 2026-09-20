import { useEffect, useRef, useState } from 'react'
import { Alert, Button, Form, Modal } from 'react-bootstrap'

/** Legacy's `{placeholder}` variables — a fixed list hardcoded in `tools::sms_responses()`, not DB-driven, so hardcoded here too. */
const VARIABLES = [
  '{chp_website}', '{gateway_number}', '{helpdesk_number}', '{card_brand}', '{card_brand_desc}',
  '{send_amount}', '{shortname}', '{base_currency}', '{card_balance}', '{card_brand_tagline}',
  '{trans_id}', '{charity_name}', '{biller}', '{account_num}', '{current_date}', '{current_time}',
  '{src_amount}', '{src_currency}', '{dest_amount}', '{dest_currency}', '{merchant_name}',
  '{paycode_reference}', '{cashout_reference}',
]

const EditTemplateModal = ({ show, onHide, row, merchantId, onSubmit, onSaved }) => {
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const textareaRef = useRef(null)

  useEffect(() => {
    if (show && row) {
      setContent(row.message_template || '')
      setError('')
    }
  }, [show, row])

  const insertVariable = (variable) => {
    const textarea = textareaRef.current
    if (!textarea) return
    const start = textarea.selectionStart ?? content.length
    const end = textarea.selectionEnd ?? content.length
    const next = content.slice(0, start) + variable + content.slice(end)
    setContent(next)
    requestAnimationFrame(() => {
      textarea.focus()
      textarea.selectionStart = textarea.selectionEnd = start + variable.length
    })
  }

  const handleSubmit = async () => {
    if (content === row.message_template) {
      setError('No changes to the template were made.')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      const updated = await onSubmit(merchantId, row.response_title, content)
      onSaved?.(updated)
      onHide()
    } catch (err) {
      setError(err?.errors ? Object.values(err.errors)[0]?.[0] : (err?.message || 'Unable to save template.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Edit SMS Response</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger" className="py-2 small mb-3">{error}</Alert>}
        <Form.Group className="mb-3">
          <Form.Label>Template</Form.Label>
          <Form.Control value={row?.response_title || ''} disabled readOnly />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Message</Form.Label>
          <Form.Control
            ref={textareaRef}
            as="textarea"
            rows={5}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </Form.Group>
        <Form.Group>
          <Form.Label>Insert Variable</Form.Label>
          <Form.Select value="" onChange={(e) => { if (e.target.value) insertVariable(e.target.value) }}>
            <option value="">— Select a variable to insert —</option>
            {VARIABLES.map((v) => <option key={v} value={v}>{v}</option>)}
          </Form.Select>
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={submitting}>Cancel</Button>
        <Button variant="primary" onClick={handleSubmit} disabled={submitting}>{submitting ? 'Saving...' : 'Save Template'}</Button>
      </Modal.Footer>
    </Modal>
  )
}

export default EditTemplateModal
