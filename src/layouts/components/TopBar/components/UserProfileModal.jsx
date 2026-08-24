import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'
import { getStoredCurrentUser, setStoredCurrentUser } from '@/utils/currentUser'
import useCurrentUser from '@/hooks/useCurrentUser'
import { registerPlugin } from 'filepond'
import FilePondPluginImageExifOrientation from 'filepond-plugin-image-exif-orientation'
import FilePondPluginImagePreview from 'filepond-plugin-image-preview'
import { useEffect, useState } from 'react'
import { Button, Col, Form, Modal, Row, Spinner, Table } from 'react-bootstrap'
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

const fieldLabels = {
  first_name: 'First name',
  middle_name: 'Middle name',
  last_name: 'Last name',
  email: 'Email',
  mobile_number: 'Mobile number',
  address: 'Address',
}

const displayValue = (value) => value === null || value === '' ? 'Empty' : value

const avatarIconLabel = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M5 7h1a2 2 0 0 0 2-2a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1a2 2 0 0 0 2 2h1a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2"/><path d="M9 13a3 3 0 1 0 6 0a3 3 0 0 0-6 0"/></g></svg>'

const escapeHtmlAttribute = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

const avatarIdleLabel = (avatarUrl) => {
  if (!avatarUrl) {
    return avatarIconLabel
  }

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

const UserProfileModal = ({ show, onHide }) => {
  const { showNotification } = useNotificationContext()
  const currentUser = useCurrentUser()
  const [profile, setProfile] = useState(emptyProfile)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [loadFailed, setLoadFailed] = useState(false)
  const [avatarFiles, setAvatarFiles] = useState([])

  const loadProfile = async () => {
    setLoading(true)
    setLoadFailed(false)

    try {
      const [profileResponse, historyResponse] = await Promise.all([
        ApiService.getProfile(),
        ApiService.getProfileHistory(),
      ])
      const user = profileResponse?.user ?? {}
      setProfile({
        first_name: user.first_name ?? '',
        middle_name: user.middle_name ?? '',
        last_name: user.last_name ?? '',
        email: user.email ?? '',
        mobile_number: user.mobile_number ?? '',
        address: user.address ?? '',
        avatar_url: user.avatar_url ?? '',
        clear_avatar: false,
      })
      setAvatarFiles([])
      setHistory(historyResponse?.history ?? [])
    } catch (error) {
      setLoadFailed(true)
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
      let uploadedAvatarUrl = null

      if (avatarFiles.length > 0 && avatarFiles[0]?.file) {
        const avatarFormData = new FormData()
        avatarFormData.append('avatar', avatarFiles[0].file)
        const avatarResponse = await ApiService.updateAvatar(avatarFormData)
        uploadedAvatarUrl = avatarResponse?.avatar_url ?? avatarResponse?.user?.avatar_url ?? null
      }

      const response = await ApiService.updateProfile({
        first_name: profile.first_name,
        middle_name: profile.middle_name,
        last_name: profile.last_name,
        email: profile.email,
        mobile_number: profile.mobile_number,
        address: profile.address,
        clear_avatar: profile.clear_avatar ? 1 : 0,
      })

      const storedUser = getStoredCurrentUser()
      const nextAvatarUrl = profile.clear_avatar
        ? null
        : uploadedAvatarUrl ?? response.user?.avatar_url ?? profile.avatar_url ?? storedUser?.avatar_url
      const nextUser = {
        ...storedUser,
        ...response.user,
        avatar_url: nextAvatarUrl,
        menu_permissions: storedUser?.menu_permissions ?? response.user?.menu_permissions,
        accessible_menu_ids: storedUser?.accessible_menu_ids ?? response.user?.accessible_menu_ids,
      }

      setStoredCurrentUser(nextUser)
      setProfile((current) => ({ ...current, avatar_url: nextUser.avatar_url ?? '', clear_avatar: false }))
      setAvatarFiles([])
      showNotification({ title: 'Success', message: 'Profile updated successfully.', variant: 'success' })

      try {
        const historyResponse = await ApiService.getProfileHistory()
        setHistory(historyResponse?.history ?? [])
      } catch (historyError) {
        showNotification({ title: 'Failed', message: historyError?.message ?? 'Profile saved, but history could not be refreshed.', variant: 'danger' })
      }
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
          <>
            <Form id="user-profile-form" onSubmit={handleSubmit}>
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
                          setProfile((current) => ({ ...current, clear_avatar: true }))
                        }}
                      >
                        Clear image
                      </Button>
                    )}
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3" controlId="profile-first-name">
                    <Form.Label>First name</Form.Label>
                    <Form.Control name="first_name" value={profile.first_name} onChange={handleChange} isInvalid={Boolean(errors.first_name)} required />
                    <Form.Control.Feedback type="invalid">{errors.first_name?.[0]}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3" controlId="profile-middle-name">
                    <Form.Label>Middle name</Form.Label>
                    <Form.Control name="middle_name" value={profile.middle_name} onChange={handleChange} isInvalid={Boolean(errors.middle_name)} />
                    <Form.Control.Feedback type="invalid">{errors.middle_name?.[0]}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3" controlId="profile-last-name">
                    <Form.Label>Last name</Form.Label>
                    <Form.Control name="last_name" value={profile.last_name} onChange={handleChange} isInvalid={Boolean(errors.last_name)} required />
                    <Form.Control.Feedback type="invalid">{errors.last_name?.[0]}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3" controlId="profile-email">
                    <Form.Label>Email</Form.Label>
                    <Form.Control type="email" name="email" value={profile.email} onChange={handleChange} isInvalid={Boolean(errors.email)} required />
                    <Form.Control.Feedback type="invalid">{errors.email?.[0]}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3" controlId="profile-mobile-number">
                    <Form.Label>Mobile number</Form.Label>
                    <Form.Control name="mobile_number" value={profile.mobile_number} onChange={handleChange} isInvalid={Boolean(errors.mobile_number)} />
                    <Form.Control.Feedback type="invalid">{errors.mobile_number?.[0]}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group className="mb-3" controlId="profile-address">
                    <Form.Label>Address</Form.Label>
                    <Form.Control as="textarea" rows={2} name="address" value={profile.address} onChange={handleChange} isInvalid={Boolean(errors.address)} />
                    <Form.Control.Feedback type="invalid">{errors.address?.[0]}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>
            </Form>

            <h5 className="mt-3">Change history</h5>
            <div className="table-responsive border rounded">
              <Table className="mb-0" size="sm">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Field</th>
                    <th>Previous</th>
                    <th>New</th>
                  </tr>
                </thead>
                <tbody>
                  {history.flatMap((entry) =>
                    Object.entries(entry.changes ?? {}).map(([field, change]) => (
                      <tr key={`${entry.id}-${field}`}>
                        <td className="text-nowrap">{new Date(entry.created_at).toLocaleString()}</td>
                        <td>{fieldLabels[field] ?? field}</td>
                        <td className="text-break">{displayValue(change.from)}</td>
                        <td className="text-break">{displayValue(change.to)}</td>
                      </tr>
                    ))
                  )}
                  {history.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center text-muted py-3">No profile changes yet.</td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="light" onClick={onHide}>Close</Button>
        <Button type="submit" form="user-profile-form" disabled={loading || saving || loadFailed}>
          {saving ? 'Saving...' : 'Save changes'}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default UserProfileModal
