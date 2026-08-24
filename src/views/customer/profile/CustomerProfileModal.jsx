import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'
import { getStoredCurrentUser, setStoredCurrentUser } from '@/utils/currentUser'
import useCurrentUser from '@/hooks/useCurrentUser'
import { registerPlugin } from 'filepond'
import FilePondPluginImageExifOrientation from 'filepond-plugin-image-exif-orientation'
import FilePondPluginImagePreview from 'filepond-plugin-image-preview'
import { useEffect, useState } from 'react'
import { Button, Col, Form, Modal, Row, Spinner } from 'react-bootstrap'
import { FilePond } from 'react-filepond'

registerPlugin(FilePondPluginImageExifOrientation, FilePondPluginImagePreview)

const emptyProfile = {
  first_name: '',
  middle_name: '',
  last_name: '',
  email: '',
  mobile_number: '',
  address: '',
  avatar_url: '',
  clear_avatar: false,
}

const avatarIconLabel = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M5 7h1a2 2 0 0 0 2-2a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1a2 2 0 0 0 2 2h1a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2"/><path d="M9 13a3 3 0 1 0 6 0a3 3 0 0 0-6 0"/></g></svg>'

const escapeHtmlAttribute = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

const avatarIdleLabel = (avatarUrl) => {
  if (!avatarUrl) return avatarIconLabel

  return `
    <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;">
      <img
        src="${escapeHtmlAttribute(avatarUrl)}"
        alt="Current avatar"
        style="width:56px;height:56px;border-radius:999px;object-fit:cover;display:block;margin:auto;"
      />
    </div>
  `
}

const CustomerProfileModal = ({ show, onHide }) => {
  const { showNotification } = useNotificationContext()
  const currentUser = useCurrentUser()
  const [profile, setProfile] = useState(emptyProfile)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [avatarFiles, setAvatarFiles] = useState([])

  const loadProfile = async () => {
    setLoading(true)
    try {
      const response = await ApiService.customerGetProfile()
      const customer = response?.customer ?? {}
      setProfile({
        first_name: customer.first_name ?? '',
        middle_name: customer.middle_name ?? '',
        last_name: customer.last_name ?? '',
        email: customer.email ?? '',
        mobile_number: customer.mobile_number ?? '',
        address: customer.address ?? '',
        avatar_url: customer.avatar_url ?? '',
        clear_avatar: false,
      })
      setAvatarFiles([])
    } catch (error) {
      showNotification({ title: 'Failed', message: error?.message ?? 'Unable to load your profile.', variant: 'danger' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!show) return
    setErrors({})
    loadProfile()
  }, [show])

  const handleChange = (event) => {
    const { name, value } = event.target
    setProfile((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: undefined }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setErrors({})

    try {
      const payload = new FormData()
      payload.append('first_name', profile.first_name)
      payload.append('middle_name', profile.middle_name ?? '')
      payload.append('last_name', profile.last_name)
      payload.append('email', profile.email)
      payload.append('mobile_number', profile.mobile_number ?? '')
      payload.append('address', profile.address ?? '')
      payload.append('clear_avatar', profile.clear_avatar ? '1' : '0')

      if (avatarFiles.length > 0 && avatarFiles[0]?.file) {
        payload.append('avatar', avatarFiles[0].file)
      }

      const response = await ApiService.customerUpdateProfile(payload)
      const nextCustomer = response?.customer ?? response?.user ?? response
      const storedUser = getStoredCurrentUser()
      const nextUser = {
        ...storedUser,
        ...nextCustomer,
        avatar_url: nextCustomer?.avatar_url ?? storedUser?.avatar_url ?? null,
        menu_permissions: [],
        accessible_menu_ids: [],
      }

      setStoredCurrentUser(nextUser)
      setProfile((current) => ({ ...current, avatar_url: nextUser.avatar_url ?? '', clear_avatar: false }))
      setAvatarFiles([])
      showNotification({ title: 'Success', message: 'Profile updated successfully.', variant: 'success' })
    } catch (error) {
      setErrors(error?.errors ?? {})
      showNotification({ title: 'Failed', message: error?.message ?? 'Unable to update your profile.', variant: 'danger' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal show={show} onHide={onHide} size="lg" centered scrollable>
      <Modal.Header closeButton>
        <Modal.Title>Profile</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" />
          </div>
        ) : (
          <Form id="customer-profile-form" onSubmit={handleSubmit}>
            <Row className="mb-3">
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Profile photo</Form.Label>
                  <div className="avatar-xxl">
                    <FilePond
                      className="filepond filepond-input-circle rounded"
                      files={avatarFiles}
                      allowMultiple={false}
                      maxFiles={1}
                      allowReorder={false}
                      acceptedFileTypes={['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']}
                      stylePanelAspectRatio="1:1"
                      labelIdle={avatarIdleLabel(!avatarFiles.length && !profile.clear_avatar ? profile.avatar_url || currentUser?.avatar_url : null)}
                      onupdatefiles={(fileItems) => {
                        setAvatarFiles(fileItems)
                        const nextItem = fileItems[0]
                        const nextFile = nextItem?.file
                        const isUploadedFile = typeof File !== 'undefined' && nextFile instanceof File

                        if (isUploadedFile) {
                          setProfile((current) => ({ ...current, clear_avatar: false }))
                        }
                      }}
                    />
                  </div>
                  <div className="text-muted small mt-2">
                    Click the image if you want to change your photo.
                  </div>
                  {Boolean(profile.avatar_url || currentUser?.avatar_url) && !profile.clear_avatar && !avatarFiles.length && (
                    <Button
                      variant="outline-danger"
                      size="sm"
                      type="button"
                      className="mt-2"
                      onClick={() => {
                        setAvatarFiles([])
                        setProfile((current) => ({ ...current, avatar_url: '', clear_avatar: true }))
                      }}
                    >
                      Clear image
                    </Button>
                  )}
                  {errors.avatar && <div className="text-danger small mt-1">{errors.avatar[0]}</div>}
                </Form.Group>
              </Col>
              <Col md={6} className="mt-3">
                <Form.Group>
                  <Form.Label>First name</Form.Label>
                  <Form.Control name="first_name" value={profile.first_name} onChange={handleChange} isInvalid={Boolean(errors.first_name)} />
                  <Form.Control.Feedback type="invalid">{errors.first_name?.[0]}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6} className="mt-3">
                <Form.Group>
                  <Form.Label>Middle name</Form.Label>
                  <Form.Control name="middle_name" value={profile.middle_name} onChange={handleChange} isInvalid={Boolean(errors.middle_name)} />
                  <Form.Control.Feedback type="invalid">{errors.middle_name?.[0]}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6} className="mt-3">
                <Form.Group>
                  <Form.Label>Last name</Form.Label>
                  <Form.Control name="last_name" value={profile.last_name} onChange={handleChange} isInvalid={Boolean(errors.last_name)} />
                  <Form.Control.Feedback type="invalid">{errors.last_name?.[0]}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6} className="mt-3">
                <Form.Group>
                  <Form.Label>Email</Form.Label>
                  <Form.Control type="email" name="email" value={profile.email} onChange={handleChange} isInvalid={Boolean(errors.email)} />
                  <Form.Control.Feedback type="invalid">{errors.email?.[0]}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6} className="mt-3">
                <Form.Group>
                  <Form.Label>Mobile number</Form.Label>
                  <Form.Control name="mobile_number" value={profile.mobile_number} onChange={handleChange} isInvalid={Boolean(errors.mobile_number)} />
                  <Form.Control.Feedback type="invalid">{errors.mobile_number?.[0]}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6} className="mt-3">
                <Form.Group>
                  <Form.Label>Address</Form.Label>
                  <Form.Control as="textarea" rows={2} name="address" value={profile.address} onChange={handleChange} isInvalid={Boolean(errors.address)} />
                  <Form.Control.Feedback type="invalid">{errors.address?.[0]}</Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={saving}>Close</Button>
        <Button variant="primary" type="submit" form="customer-profile-form" disabled={saving || loading}>
          {saving ? 'Saving...' : 'Save profile'}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default CustomerProfileModal
