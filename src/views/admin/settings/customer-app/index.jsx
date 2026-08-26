import { useEffect, useMemo, useState } from 'react'
import { Card, Form, Table } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import ApiService from '@/services/ApiService'
import useCurrentUser from '@/hooks/useCurrentUser'
import { getModulePermission } from '@/utils/modulePermissions'
import { useNotificationContext } from '@/context/useNotificationContext'

const CustomerAppSettingsPage = () => {
  const currentUser = useCurrentUser()
  const { showNotification } = useNotificationContext()
  const modulePermission = useMemo(() => getModulePermission(currentUser, '/settings/customer-app'), [currentUser])

  const [settings, setSettings] = useState([])
  const [loading, setLoading] = useState(true)
  const [togglingId, setTogglingId] = useState(null)

  const load = () => {
    setLoading(true)
    ApiService.getCustomerAppSettings()
      .then((data) => setSettings(Array.isArray(data) ? data : []))
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load settings.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleToggle = async (setting) => {
    if (!modulePermission.can_edit || !setting.id) return
    setTogglingId(setting.id)
    const nextEnabled = !setting.is_enabled
    try {
      await ApiService.toggleCustomerAppSetting(setting.id, nextEnabled)
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
      <PageBreadcrumb title="SunCash Customer App" subtitle="Settings" />
      <Card>
        <Card.Header>
          <div>
            <h5 className="mb-1">Customer App Feature Flags</h5>
            <p className="text-muted mb-0 small">Toggle anti-fraud and compliance restrictions enforced by the customer-facing mobile app.</p>
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
                    <th className="text-end">Enabled</th>
                  </tr>
                </thead>
                <tbody>
                  {settings.map((setting) => (
                    <tr key={setting.channel}>
                      <td className="fw-medium">{setting.label}</td>
                      <td className="text-muted">{setting.description || '—'}</td>
                      <td className="text-end">
                        <Form.Check
                          type="switch"
                          id={`flag-${setting.channel}`}
                          checked={Boolean(setting.is_enabled)}
                          disabled={!modulePermission.can_edit || !setting.id || togglingId === setting.id}
                          onChange={() => handleToggle(setting)}
                          className="d-inline-block"
                        />
                      </td>
                    </tr>
                  ))}
                  {!settings.length && (
                    <tr><td colSpan={3} className="text-center text-muted py-4">No settings found.</td></tr>
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

export default CustomerAppSettingsPage
