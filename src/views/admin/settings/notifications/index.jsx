import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Card, Form, Nav, Table } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import useCurrentUser from '@/hooks/useCurrentUser'
import { getModulePermission } from '@/utils/modulePermissions'
import { useNotificationContext } from '@/context/useNotificationContext'

const NotificationSettingEdit = ({ id, editable, onCancel, onSaved }) => {
  const { showNotification } = useNotificationContext()
  const [setting, setSetting] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [formError, setFormError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    ApiService.getNotificationSetting(id)
      .then((data) => {
        if (!active) return
        setSetting(data)
        setSubject(data?.subject || '')
        setBody(data?.set_value || '')
      })
      .catch((err) => active && showNotification({ title: 'Failed', message: err?.message || 'Failed to load setting.', variant: 'danger' }))
      .finally(() => active && setLoading(false))
    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleSave = async () => {
    if (setting?.setting_type === 'email' && !subject.trim()) {
      setFormError('Subject is required for e-mail notifications.')
      return
    }
    if (!body.trim()) {
      setFormError('The message body is required.')
      return
    }
    setFormError('')
    setSubmitting(true)
    try {
      await ApiService.updateNotificationSetting(id, { subject, set_value: body })
      showNotification({ title: 'Success', message: 'Notification setting updated successfully.', variant: 'success' })
      onSaved?.()
    } catch (err) {
      setFormError(err?.message || 'Failed to update notification setting.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Card><Card.Body><LoadingState /></Card.Body></Card>

  return (
    <Card>
      <Card.Header className="border-0 pb-0">
        <div>
          <h5 className="mb-1">{setting?.name}</h5>
          <p className="text-muted small mb-3">{setting?.description}</p>
        </div>
      </Card.Header>
      <Card.Body>
        {formError && <Alert variant="danger">{formError}</Alert>}
        <fieldset disabled={!editable} className="border-0 p-0 m-0">
          {setting?.setting_type === 'email' && (
            <Form.Group className="mb-3">
              <Form.Label>Subject</Form.Label>
              <Form.Control value={subject} onChange={(e) => setSubject(e.target.value)} />
            </Form.Group>
          )}
          <Form.Group className="mb-3">
            <Form.Label>Message</Form.Label>
            <Form.Control as="textarea" rows={8} value={body} onChange={(e) => setBody(e.target.value)} />
            {setting?.setting_type === 'sms' && (
              <div className="form-text">Be aware that many phones are unable to display special characters such as _ # {'{'} {'}'} etc.</div>
            )}
          </Form.Group>
          {setting?.tags && (
            <Form.Group>
              <Form.Label>Available tags</Form.Label>
              <Form.Control as="textarea" rows={2} value={setting.tags} readOnly plaintext className="bg-light-subtle border rounded px-2" />
            </Form.Group>
          )}
        </fieldset>
      </Card.Body>
      <Card.Footer className="d-flex justify-content-between align-items-center">
        <Button variant="light" onClick={onCancel} disabled={submitting}>Cancel</Button>
        {editable && (
          <Button variant="primary" onClick={handleSave} disabled={submitting}>
            <Icon icon="check" className="me-1" /> {submitting ? 'Saving…' : 'Save Changes'}
          </Button>
        )}
      </Card.Footer>
    </Card>
  )
}

const NotificationSettingsList = ({ editable, onEdit }) => {
  const { showNotification } = useNotificationContext()
  const [type, setType] = useState('email')
  const [settings, setSettings] = useState([])
  const [loading, setLoading] = useState(true)
  const [togglingId, setTogglingId] = useState(null)

  const load = (activeType) => {
    setLoading(true)
    ApiService.getNotificationSettings(activeType)
      .then((data) => setSettings(Array.isArray(data) ? data : []))
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load notification settings.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(type) }, [type])

  const handleToggle = async (setting) => {
    if (!editable) return
    setTogglingId(setting.id)
    try {
      await ApiService.toggleNotificationSetting(setting.id, !setting.is_enabled)
      setSettings((prev) => prev.map((item) => (item.id === setting.id ? { ...item, is_enabled: !item.is_enabled } : item)))
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.message || 'Failed to update setting.', variant: 'danger' })
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <Card>
      <Card.Header className="border-top-0 pt-0">
        <Nav variant="tabs" activeKey={type} onSelect={(key) => key && setType(key)} className="nav-bordered nav-bordered-primary">
          <Nav.Item><Nav.Link eventKey="email">Email Settings</Nav.Link></Nav.Item>
          <Nav.Item><Nav.Link eventKey="sms">SMS Settings</Nav.Link></Nav.Item>
        </Nav>
      </Card.Header>
      <Card.Body>
        {loading ? (
          <LoadingState />
        ) : (
          <div className="table-responsive">
            <Table className="align-middle mb-0">
              <thead className="thead-sm text-uppercase fs-xxs">
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th className="text-end">Enabled</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {settings.map((setting) => (
                  <tr key={setting.id}>
                    <td className="fw-medium">{setting.name}</td>
                    <td className="text-muted">{setting.description || '—'}</td>
                    <td className="text-end">
                      <Form.Check
                        type="switch"
                        id={`notification-${setting.id}`}
                        checked={Boolean(setting.is_enabled)}
                        disabled={!editable || togglingId === setting.id}
                        onChange={() => handleToggle(setting)}
                        className="d-inline-block"
                      />
                    </td>
                    <td className="text-end">
                      <Button variant="light" size="sm" className="btn-icon rounded-circle" title="Edit" aria-label="Edit" onClick={() => onEdit(setting.id)}>
                        <Icon icon="edit" className="fs-lg" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {!settings.length && (
                  <tr><td colSpan={4} className="text-center text-muted py-4">No settings found.</td></tr>
                )}
              </tbody>
            </Table>
          </div>
        )}
      </Card.Body>
    </Card>
  )
}

const NotificationSettingsPage = () => {
  const currentUser = useCurrentUser()
  const modulePermission = useMemo(() => getModulePermission(currentUser, '/settings/notifications'), [currentUser])
  const [editingId, setEditingId] = useState(null)

  return (
    <>
      <PageBreadcrumb title="Notifications" subtitle="Settings" />
      {editingId ? (
        <NotificationSettingEdit
          id={editingId}
          editable={modulePermission.can_edit}
          onCancel={() => setEditingId(null)}
          onSaved={() => setEditingId(null)}
        />
      ) : (
        <NotificationSettingsList editable={modulePermission.can_edit} onEdit={setEditingId} />
      )}
    </>
  )
}

export default NotificationSettingsPage
