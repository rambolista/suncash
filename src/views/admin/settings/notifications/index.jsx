import DT from 'datatables.net-bs5'
import DataTable from 'datatables.net-react'
import 'datatables.net-responsive'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Alert, Button, Card, Form, Nav } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import useCurrentUser from '@/hooks/useCurrentUser'
import { getModulePermission } from '@/utils/modulePermissions'
import { useNotificationContext } from '@/context/useNotificationContext'
import { paginationIcons } from '@/views/admin/apps/access-management/utils/paginationIcons'

DataTable.use(DT)

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

const TYPE_TABS = [
  { key: 'email', label: 'Email Settings', icon: 'mail' },
  { key: 'sms', label: 'SMS Settings', icon: 'message' },
]

const columns = [
  { data: 'name', render: (value) => escapeHtml(value || '—') },
  { data: 'description', className: 'text-muted', render: (value) => escapeHtml(value || '—') },
  { data: 'id', orderable: false, searchable: false, width: '90px', className: 'text-end', render: (id) => `<div class="enabled-slot" data-id="${id}"></div>` },
  { data: 'id', orderable: false, searchable: false, width: '70px', className: 'text-end', render: (id) => `<div class="action-slot" data-id="${id}"></div>` },
]

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

  const handlers = useRef({ editable, onEdit, onToggle: null })
  const rowMapRef = useRef({})
  const dtApiRef = useRef(null)

  const load = (activeType) => {
    setLoading(true)
    ApiService.getNotificationSettings(activeType)
      .then((data) => setSettings(Array.isArray(data) ? data : []))
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load notification settings.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(type) }, [type])

  const handleToggle = async (id) => {
    if (!handlers.current.editable) return
    const current = rowMapRef.current[id]
    if (!current) return
    const nextEnabled = !current.is_enabled
    try {
      await ApiService.toggleNotificationSetting(id, nextEnabled)
      setSettings((prev) => prev.map((item) => (item.id === id ? { ...item, is_enabled: nextEnabled } : item)))
      // `options`/its closures are only read by the underlying DataTables
      // instance at creation time, so a redraw is forced explicitly here
      // rather than relying on the data prop change alone.
      dtApiRef.current?.draw(false)
      showNotification({ title: 'Success', message: `${current.name || 'Setting'} ${nextEnabled ? 'enabled' : 'disabled'}.`, variant: 'success' })
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.message || 'Failed to update setting.', variant: 'danger' })
    }
  }

  handlers.current = { editable, onEdit, onToggle: handleToggle }

  const rowMap = useMemo(() => {
    const map = {}
    settings.forEach((item) => { map[item.id] = item })
    return map
  }, [settings])
  rowMapRef.current = rowMap

  // `options` is created once and never recreated — the underlying
  // DataTables instance only reads it at construction time, so anything
  // the callbacks need must come from refs (read fresh on every call)
  // rather than values closed over here.
  const options = useMemo(() => ({
    responsive: true,
    language: { paginate: paginationIcons },
    drawCallback: function () {
      dtApiRef.current = this.api()
      const container = this.api().table().container()

      container.querySelectorAll('.enabled-slot').forEach((slot) => {
        const item = rowMapRef.current[Number(slot.dataset.id)]
        if (!item) return
        const root = slot.__enabledRoot || createRoot(slot)
        slot.__enabledRoot = root
        root.render(
          <Form.Check
            type="switch"
            id={`notification-${item.id}`}
            checked={Boolean(item.is_enabled)}
            disabled={!handlers.current.editable}
            onChange={() => handlers.current.onToggle?.(item.id)}
            className="d-inline-block"
          />
        )
      })

      container.querySelectorAll('.action-slot').forEach((slot) => {
        const item = rowMapRef.current[Number(slot.dataset.id)]
        if (!item) return
        const root = slot.__actionRoot || createRoot(slot)
        slot.__actionRoot = root
        root.render(
          <Button variant="light" size="sm" className="btn-icon rounded-circle" title="Edit" aria-label="Edit" onClick={() => handlers.current.onEdit?.(item.id)}>
            <Icon icon="edit" className="fs-lg" />
          </Button>
        )
      })
    },
  }), [])

  return (
    <Card>
      <Card.Header className="border-top-0 pt-0">
        <div className="customer-profile-tabs-scroll">
          <Nav variant="tabs" activeKey={type} onSelect={(key) => key && setType(key)} className="nav-bordered nav-bordered-primary customer-profile-tabs flex-nowrap">
            {TYPE_TABS.map((tab) => (
              <Nav.Item key={tab.key}>
                <Nav.Link eventKey={tab.key} className="d-flex align-items-center gap-2">
                  <span
                    className="rounded-circle d-inline-flex align-items-center justify-content-center flex-shrink-0 bg-primary-subtle"
                    style={{ width: 32, height: 32 }}
                  >
                    <Icon icon={tab.icon} className="text-primary" style={{ fontSize: '1rem' }} />
                  </span>
                  <span className="fw-semibold text-nowrap">{tab.label}</span>
                </Nav.Link>
              </Nav.Item>
            ))}
          </Nav>
        </div>
      </Card.Header>
      <Card.Body>
        {loading ? (
          <LoadingState />
        ) : (
          <DataTable data={settings} columns={columns} options={options} className="table dt-responsive align-middle mb-0 w-100">
            <thead className="thead-sm text-uppercase fs-xxs">
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th className="text-end">Enabled</th>
                <th className="text-end">Action</th>
              </tr>
            </thead>
          </DataTable>
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
