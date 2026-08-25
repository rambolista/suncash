import { useEffect, useState } from 'react'
import { Button, Col, Form, Modal, Row, Spinner, Table } from 'react-bootstrap'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'

const emptySettings = { commi_type_id: 1, commi_fixed: 0, commi_percentage: 0, wu_commi_percentage: 0 }

const MerchantAgentCommissionModal = ({ show, onHide, merchant }) => {
  const { showNotification } = useNotificationContext()
  const [settings, setSettings] = useState(emptySettings)
  const [commissionTypes, setCommissionTypes] = useState({})
  const [emails, setEmails] = useState([])
  const [newEmail, setNewEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})

  const load = () => {
    if (!merchant) return
    setLoading(true)
    ApiService.getMerchantAgentCommission(merchant.id)
      .then((data) => {
        setSettings(data?.settings || emptySettings)
        setCommissionTypes(data?.commission_types || {})
        setEmails(Array.isArray(data?.emails) ? data.emails : [])
      })
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load commission settings.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (show) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, merchant])

  const handleSaveSettings = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setErrors({})
    try {
      await ApiService.updateMerchantAgentCommission(merchant.id, settings)
      showNotification({ title: 'Success', message: 'Agent commission settings saved successfully.', variant: 'success' })
    } catch (err) {
      setErrors(err?.errors ?? {})
      showNotification({ title: 'Failed', message: err?.message || 'Failed to save commission settings.', variant: 'danger' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddEmail = async () => {
    if (!newEmail.trim()) return
    try {
      await ApiService.addMerchantAgentCommissionEmail(merchant.id, newEmail.trim())
      setNewEmail('')
      load()
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.message || 'Failed to add e-mail.', variant: 'danger' })
    }
  }

  const handleToggleEmailStatus = async (email) => {
    const nextStatus = email.status === 'enabled' ? 'disabled' : 'enabled'
    try {
      await ApiService.updateMerchantAgentCommissionEmail(merchant.id, email.id, { status: nextStatus })
      load()
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.message || 'Failed to update e-mail.', variant: 'danger' })
    }
  }

  const handleDeleteEmail = async (email) => {
    try {
      await ApiService.deleteMerchantAgentCommissionEmail(merchant.id, email.id)
      load()
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.message || 'Failed to remove e-mail.', variant: 'danger' })
    }
  }

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Agent Commission Settings — {merchant?.dba_name || merchant?.legal_name}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading ? (
          <div className="text-center py-4"><Spinner size="sm" /></div>
        ) : (
          <>
            <Form onSubmit={handleSaveSettings} noValidate>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Commission Type</Form.Label>
                    <Form.Select value={settings.commi_type_id} onChange={(e) => setSettings((prev) => ({ ...prev, commi_type_id: Number(e.target.value) }))}>
                      {Object.entries(commissionTypes).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Fixed Commission</Form.Label>
                    <Form.Control type="number" min="0" step="0.01" value={settings.commi_fixed} onChange={(e) => setSettings((prev) => ({ ...prev, commi_fixed: e.target.value }))} isInvalid={!!errors.commi_fixed} />
                    <Form.Control.Feedback type="invalid">{errors.commi_fixed?.[0]}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Percentage Commission</Form.Label>
                    <Form.Control type="number" min="0" step="0.01" value={settings.commi_percentage} onChange={(e) => setSettings((prev) => ({ ...prev, commi_percentage: e.target.value }))} isInvalid={!!errors.commi_percentage} />
                    <Form.Control.Feedback type="invalid">{errors.commi_percentage?.[0]}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Western Union % Commission</Form.Label>
                    <Form.Control type="number" min="0" step="0.01" value={settings.wu_commi_percentage} onChange={(e) => setSettings((prev) => ({ ...prev, wu_commi_percentage: e.target.value }))} isInvalid={!!errors.wu_commi_percentage} />
                    <Form.Control.Feedback type="invalid">{errors.wu_commi_percentage?.[0]}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>
              <div className="d-flex justify-content-end mt-3">
                <Button variant="primary" size="sm" type="submit" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save rates'}
                </Button>
              </div>
            </Form>

            <hr />

            <h6 className="mb-2">Notification E-mails</h6>
            <Table size="sm" className="align-middle mb-2">
              <tbody>
                {emails.map((email) => (
                  <tr key={email.id}>
                    <td>{email.email}</td>
                    <td className="text-nowrap">
                      <span className={`badge ${email.status === 'enabled' ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'}`}>
                        {email.status}
                      </span>
                    </td>
                    <td className="text-end text-nowrap">
                      <Button variant="light" size="sm" className="me-1" onClick={() => handleToggleEmailStatus(email)}>
                        {email.status === 'enabled' ? 'Disable' : 'Enable'}
                      </Button>
                      <Button variant="light" size="sm" onClick={() => handleDeleteEmail(email)}>
                        <Icon icon="trash" className="text-danger" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {!emails.length && <tr><td colSpan={3} className="text-center text-muted">No notification e-mails yet.</td></tr>}
              </tbody>
            </Table>
            <div className="d-flex gap-2">
              <Form.Control size="sm" type="email" placeholder="new-email@example.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
              <Button variant="light" size="sm" onClick={handleAddEmail}><Icon icon="plus" /></Button>
            </div>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Close</Button>
      </Modal.Footer>
    </Modal>
  )
}

export default MerchantAgentCommissionModal
