import { useEffect, useState } from 'react'
import { Alert, Card, CardBody, Form } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import ApiService from '@/services/ApiService'
import useCurrentUser from '@/hooks/useCurrentUser'
import { getModulePermission } from '@/utils/modulePermissions'
import { useNotificationContext } from '@/context/useNotificationContext'

const GeneralSettingsPage = () => {
  const currentUser = useCurrentUser()
  const { showNotification } = useNotificationContext()
  const canEdit = Boolean(getModulePermission(currentUser, '/apps/access-management/general-settings').can_edit)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mandatory2fa, setMandatory2fa] = useState(false)

  useEffect(() => {
    ApiService.getGeneralSettings()
      .then((data) => setMandatory2fa(Boolean(data?.mandatory_2fa)))
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load general settings.', variant: 'danger' }))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleToggle = async (checked) => {
    setMandatory2fa(checked)
    setSaving(true)
    try {
      await ApiService.updateGeneralSettings(checked)
      showNotification({ title: 'Success', message: `Mandatory two-factor authentication is now ${checked ? 'ON' : 'OFF'}.`, variant: 'success' })
    } catch (err) {
      setMandatory2fa(!checked)
      showNotification({ title: 'Failed', message: err?.message || 'Unable to update setting.', variant: 'danger' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageBreadcrumb title="General Settings" subtitle="Access Management" />

      <Card>
        <CardBody>
          {loading ? <LoadingState message="Loading general settings..." /> : (
            <>
              <h5 className="mb-1">Mandatory Two-Factor Authentication</h5>
              <p className="text-muted mb-3">
                When on, every admin without two-factor authentication is required to set it up immediately after login before they can use the app.
              </p>
              <Form.Check
                type="switch"
                id="mandatory-2fa-switch"
                checked={mandatory2fa}
                disabled={!canEdit || saving}
                onChange={(e) => handleToggle(e.target.checked)}
                label={mandatory2fa ? 'Enabled' : 'Disabled'}
              />
              {mandatory2fa && (
                <Alert variant="warning" className="mt-3 py-2 small mb-0">
                  Admins who haven&apos;t set up 2FA yet will be sent straight to the setup screen on their next login and cannot skip it.
                </Alert>
              )}
            </>
          )}
        </CardBody>
      </Card>
    </>
  )
}

export default GeneralSettingsPage
