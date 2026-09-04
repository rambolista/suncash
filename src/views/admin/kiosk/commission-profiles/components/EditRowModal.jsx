import { useEffect } from 'react'
import { Button, Col, Form, Modal, Row } from 'react-bootstrap'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'

const emptyValues = {
  provider_percentage: '0', cap_amount: '0', minimum_amount: '0', frequency_in_limit_days: '0',
  agent_percentage: '0', suncash_percentage: '0', owner_percentage: '0',
}

const schema = Yup.object({
  provider_percentage: Yup.number().min(0, 'Must be 0 or more.').required('Required.'),
  cap_amount: Yup.number().min(0, 'Must be 0 or more.').required('Required.'),
  minimum_amount: Yup.number().min(0, 'Must be 0 or more.').required('Required.'),
  frequency_in_limit_days: Yup.number().integer('Must be a whole number.').min(0, 'Must be 0 or more.').required('Required.'),
  agent_percentage: Yup.number().min(0, 'Must be 0 or more.').required('Required.'),
  suncash_percentage: Yup.number().min(0, 'Must be 0 or more.').required('Required.'),
  owner_percentage: Yup.number().min(0, 'Must be 0 or more.').required('Required.'),
})

const FIELDS = [
  { name: 'provider_percentage', label: 'Provider %' },
  { name: 'cap_amount', label: 'Cap Amount' },
  { name: 'minimum_amount', label: 'Minimum Amount' },
  { name: 'frequency_in_limit_days', label: 'Frequency Limit (Days)' },
  { name: 'agent_percentage', label: 'Agent %' },
  { name: 'suncash_percentage', label: 'Suncash %' },
  { name: 'owner_percentage', label: 'Owner %' },
]

const EditRowModal = ({ show, onHide, row, onSaved }) => {
  const { showNotification } = useNotificationContext()

  const formik = useFormik({
    initialValues: emptyValues,
    validationSchema: schema,
    onSubmit: async (values, { setSubmitting, setErrors }) => {
      try {
        await ApiService.updateKioskCommissionProfileRow(row.id, values)
        showNotification({ title: 'Success', message: 'Commission has been updated.', variant: 'success' })
        onSaved?.()
        onHide()
      } catch (err) {
        if (err?.errors) {
          setErrors(Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])))
        } else {
          showNotification({ title: 'Failed', message: err?.message || 'Failed to update commission.', variant: 'danger' })
        }
      } finally {
        setSubmitting(false)
      }
    },
  })

  useEffect(() => {
    if (!show || !row) return
    formik.resetForm({
      values: {
        provider_percentage: row.provider_percentage ?? '0',
        cap_amount: row.cap_amount ?? '0',
        minimum_amount: row.minimum_amount ?? '0',
        frequency_in_limit_days: row.frequency_in_limit_days ?? '0',
        agent_percentage: row.agent_percentage ?? '0',
        suncash_percentage: row.suncash_percentage ?? '0',
        owner_percentage: row.owner_percentage ?? '0',
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, row])

  const { values: v, errors: e, touched: t } = formik

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Edit Commission{row ? ` — ${row.product_name}` : ''}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={formik.handleSubmit} noValidate>
        <Modal.Body>
          <Row className="g-3">
            {FIELDS.map(({ name, label }) => (
              <Col md={6} key={name}>
                <Form.Group>
                  <Form.Label>{label} *</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name={name}
                    value={v[name]}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    isInvalid={t[name] && !!e[name]}
                  />
                  <Form.Control.Feedback type="invalid">{e[name]}</Form.Control.Feedback>
                </Form.Group>
              </Col>
            ))}
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={formik.isSubmitting}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={formik.isSubmitting}>
            {formik.isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}

export default EditRowModal
