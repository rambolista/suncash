import { useEffect, useMemo, useState } from 'react'
import { Card, Form, Table } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import ApiService from '@/services/ApiService'
import useCurrentUser from '@/hooks/useCurrentUser'
import { getModulePermission } from '@/utils/modulePermissions'
import { useNotificationContext } from '@/context/useNotificationContext'

const WuSettingsPage = () => {
  const currentUser = useCurrentUser()
  const { showNotification } = useNotificationContext()
  const modulePermission = useMemo(() => getModulePermission(currentUser, '/settings/wu'), [currentUser])

  const [settings, setSettings] = useState([])
  const [loading, setLoading] = useState(true)
  const [togglingId, setTogglingId] = useState(null)

  const load = () => {
    setLoading(true)
    ApiService.getWuSettings()
      .then((data) => setSettings(Array.isArray(data) ? data : []))
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load settings.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleToggle = async (setting) => {
    if (!modulePermission.can_edit) return
    setTogglingId(setting.id)
    const nextEnabled = !setting.is_enabled
    try {
      await ApiService.toggleWuSetting(setting.id, nextEnabled)
      setSettings((prev) => prev.map((item) => (item.id === setting.id ? { ...item, is_enabled: nextEnabled } : item)))
      showNotification({ title: 'Success', message: `${setting.label || 'Setting'} ${nextEnabled ? 'enabled' : 'disabled'}.`, variant: 'success' })
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.message || 'Failed to update setting.', variant: 'danger' })
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <>
      <PageBreadcrumb title="SunCash WU" subtitle="Settings" />
      <Card>
        <Card.Header>
          <div>
            <h5 className="mb-1">Western Union Settings</h5>
            <p className="text-muted mb-0 small">Control the SunCash Western Union integration — online services, receivers, transaction limits, and country-specific rules.</p>
          </div>
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
                    <th>Value</th>
                    <th className="text-end">Enabled</th>
                  </tr>
                </thead>
                <tbody>
                  {settings.map((setting) => (
                    <tr key={setting.id}>
                      <td className="fw-medium">{setting.label}</td>
                      <td className="text-muted">{setting.description || '—'}</td>
                      <td className="text-muted">{setting.value ?? '—'}</td>
                      <td className="text-end">
                        <Form.Check
                          type="switch"
                          id={`wu-setting-${setting.id}`}
                          checked={Boolean(setting.is_enabled)}
                          disabled={!modulePermission.can_edit || togglingId === setting.id}
                          onChange={() => handleToggle(setting)}
                          className="d-inline-block"
                        />
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
    </>
  )
}

export default WuSettingsPage
