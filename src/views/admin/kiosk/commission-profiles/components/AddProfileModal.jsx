import { useEffect } from 'react'
import { Button, Col, Form, Modal, Row } from 'react-bootstrap'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'

const schema = Yup.object({
  profile_name: Yup.string().trim().required('Please enter a profile name.').max(100, 'Profile name is too long.'),
})

const AddProfileModal = ({ show, onHide, onSaved }) => {
  const { showNotification } = useNotificationContext()

  const formik = useFormik({
    initialValues: { profile_name: '' },
    validationSchema: schema,
    onSubmit: async (values, { setSubmitting, setErrors }) => {
      const name = values.profile_name.trim()
      try {
        await ApiService.addKioskCommissionProfile(name)
        showNotification({ title: 'Success', message: 'Commission profile has been created.', variant: 'success' })
        onSaved?.(name)
        onHide()
      } catch (err) {
        if (err?.errors) {
          setErrors(Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])))
        } else {
          showNotification({ title: 'Failed', message: err?.message || 'Failed to create commission profile.', variant: 'danger' })
        }
      } finally {
        setSubmitting(false)
      }
    },
  })

  useEffect(() => {
    if (show) formik.resetForm({ values: { profile_name: '' } })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show])

  const { values: v, errors: e, touched: t } = formik

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Add Commission Profile</Modal.Title>
      </Modal.Header>
      <Form onSubmit={formik.handleSubmit} noValidate>
        <Modal.Body>
          <Row className="g-3">
            <Col md={12}>
              <Form.Group>
                <Form.Label>Profile Name *</Form.Label>
                <Form.Control
                  name="profile_name"
                  value={v.profile_name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  isInvalid={t.profile_name && !!e.profile_name}
                  autoFocus
                />
                <Form.Control.Feedback type="invalid">{e.profile_name}</Form.Control.Feedback>
                <Form.Text className="text-muted">
                  A new row will be seeded for every kiosk product with default commission percentages.
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={formik.isSubmitting}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={formik.isSubmitting}>
            {formik.isSubmitting ? 'Saving...' : 'Add Profile'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}

export default AddProfileModal
