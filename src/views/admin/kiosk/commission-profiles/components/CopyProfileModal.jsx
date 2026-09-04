import { useEffect } from 'react'
import { Button, Col, Form, Modal, Row } from 'react-bootstrap'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'

const schema = Yup.object({
  new_profile_name: Yup.string().trim().required('Please enter a name for the new profile.').max(100, 'Profile name is too long.'),
})

const CopyProfileModal = ({ show, onHide, sourceProfileName, onSaved }) => {
  const { showNotification } = useNotificationContext()

  const formik = useFormik({
    initialValues: { new_profile_name: '' },
    validationSchema: schema,
    onSubmit: async (values, { setSubmitting, setErrors }) => {
      const name = values.new_profile_name.trim()
      try {
        await ApiService.copyKioskCommissionProfile(sourceProfileName, name)
        showNotification({ title: 'Success', message: `Commission profile has been copied to "${name}".`, variant: 'success' })
        onSaved?.(name)
        onHide()
      } catch (err) {
        if (err?.errors) {
          setErrors(Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k === 'profile_name' ? 'new_profile_name' : k, Array.isArray(v) ? v[0] : v])))
        } else {
          showNotification({ title: 'Failed', message: err?.message || 'Failed to copy commission profile.', variant: 'danger' })
        }
      } finally {
        setSubmitting(false)
      }
    },
  })

  useEffect(() => {
    if (show) formik.resetForm({ values: { new_profile_name: '' } })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show])

  const { values: v, errors: e, touched: t } = formik

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Copy Commission Profile</Modal.Title>
      </Modal.Header>
      <Form onSubmit={formik.handleSubmit} noValidate>
        <Modal.Body>
          <Row className="g-3">
            <Col md={12}>
              <Form.Label>Source Profile</Form.Label>
              <Form.Control value={sourceProfileName || ''} disabled readOnly />
            </Col>
            <Col md={12}>
              <Form.Group>
                <Form.Label>New Profile Name *</Form.Label>
                <Form.Control
                  name="new_profile_name"
                  value={v.new_profile_name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  isInvalid={t.new_profile_name && !!e.new_profile_name}
                  autoFocus
                />
                <Form.Control.Feedback type="invalid">{e.new_profile_name}</Form.Control.Feedback>
                <Form.Text className="text-muted">
                  Every commission row from "{sourceProfileName}" will be duplicated under the new name.
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={formik.isSubmitting}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={formik.isSubmitting || !sourceProfileName}>
            {formik.isSubmitting ? 'Saving...' : 'Copy Profile'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}

export default CopyProfileModal
