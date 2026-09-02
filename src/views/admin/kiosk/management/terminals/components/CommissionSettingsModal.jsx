import { useEffect, useState } from 'react'
import { Alert, Button, Form, Modal } from 'react-bootstrap'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'

const CommissionSettingsModal = ({ show, onHide, terminal, commissionTypes, commissionProfiles, onSaved }) => {
  const { showNotification } = useNotificationContext()
  const [commissionType, setCommissionType] = useState('')
  const [profileId, setProfileId] = useState('')
  const [fixedValue, setFixedValue] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!show || !terminal) return
    setError('')
    setCommissionType(String(terminal.commission_type || ''))
    setProfileId(terminal.profile_id || '')
    setFixedValue(terminal.commission_fixed_value || '')
  }, [show, terminal])

  const showProfile = ['2', '3', '4'].includes(commissionType)
  const showFixed = ['1', '3', '4'].includes(commissionType)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await ApiService.updateKioskTerminalCommission(terminal.id, {
        commission_type: commissionType,
        profile_id: showProfile ? profileId : undefined,
        commission_fixed_value: showFixed ? fixedValue : undefined,
      })
      showNotification({ title: 'Success', message: 'Commission has been updated successfully.', variant: 'success' })
      onSaved?.()
      onHide()
    } catch (err) {
      setError(err?.message || (err?.errors ? Object.values(err.errors).flat()[0] : 'Unable to update commission.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Commission Settings {terminal ? `— ${terminal.code}` : ''}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger" className="py-2 small mb-3">{error}</Alert>}
          <Form.Group className="mb-3">
            <Form.Label>Commission Type</Form.Label>
            <Form.Select value={commissionType} onChange={(e) => setCommissionType(e.target.value)}>
              <option value="">No Commission</option>
              {Object.entries(commissionTypes).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </Form.Select>
          </Form.Group>
          {showProfile && (
            <Form.Group className="mb-3">
              <Form.Label>Commission Profile</Form.Label>
              <Form.Select value={profileId} onChange={(e) => setProfileId(e.target.value)}>
                <option value="">Select...</option>
                {commissionProfiles.map((name) => <option key={name} value={name}>{name}</option>)}
              </Form.Select>
            </Form.Group>
          )}
          {showFixed && (
            <Form.Group className="mb-3">
              <Form.Label>Fixed Value</Form.Label>
              <Form.Control type="number" step="0.01" value={fixedValue} onChange={(e) => setFixedValue(e.target.value)} />
            </Form.Group>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={submitting}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={submitting || !commissionType}>
            {submitting ? 'Saving...' : 'Save Commission'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}

export default CommissionSettingsModal
