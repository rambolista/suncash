import { useEffect, useState } from 'react'
import { Alert, Button, Col, Form, Modal, Row } from 'react-bootstrap'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import Select from '@/components/wrappers/Select'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'

const emptyValues = { merchant_id: null, code: '', name: '', address: '', city: '', state: '', zip: '' }

const schema = Yup.object({
  merchant_id: Yup.number().required('Please select a merchant.'),
  code: Yup.string().trim().required('Please enter a branch code.'),
  name: Yup.string().trim().required('Please enter a branch name.'),
})

const AddBranchModal = ({ show, onHide, onSaved }) => {
  const { showNotification } = useNotificationContext()
  const [merchants, setMerchants] = useState([])
  const [formError, setFormError] = useState('')

  const formik = useFormik({
    initialValues: emptyValues,
    validationSchema: schema,
    onSubmit: async (values, { setSubmitting, setErrors }) => {
      setFormError('')
      try {
        await ApiService.addKioskBranch(values)
        showNotification({ title: 'Success', message: 'Kiosk branch has been registered.', variant: 'success' })
        onSaved?.()
        onHide()
      } catch (err) {
        if (err?.errors) {
          setErrors(Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])))
        } else {
          setFormError(err?.message || 'Failed to register kiosk branch.')
        }
      } finally {
        setSubmitting(false)
      }
    },
  })

  useEffect(() => {
    if (!show) return
    setFormError('')
    ApiService.getKioskBranchMerchants().then((data) => setMerchants(Array.isArray(data?.data) ? data.data : []))
    formik.resetForm({ values: emptyValues })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show])

  const { values: v, errors: e, touched: t } = formik
  const merchantOptions = merchants.map((m) => ({ value: m.id, label: `${m.name || 'Merchant'} (${m.client_id})` }))

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Add Kiosk Branch</Modal.Title>
      </Modal.Header>
      <Form onSubmit={formik.handleSubmit} noValidate>
        <Modal.Body>
          {formError && <Alert variant="danger" className="py-2 small mb-3">{formError}</Alert>}
          <Row className="g-3">
            <Col md={12}>
              <Form.Group>
                <Form.Label>Merchant Name *</Form.Label>
                <Select
                  className="react-select"
                  classNamePrefix="react-select"
                  options={merchantOptions}
                  value={merchantOptions.find((o) => o.value === v.merchant_id) || null}
                  onChange={(option) => formik.setFieldValue('merchant_id', option?.value ?? null)}
                  onBlur={() => formik.setFieldTouched('merchant_id', true)}
                  placeholder="Search merchant by name..."
                  isSearchable
                  isClearable
                />
                {t.merchant_id && e.merchant_id && <div className="text-danger small mt-1">{e.merchant_id}</div>}
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Kiosk Branch Code *</Form.Label>
                <Form.Control name="code" value={v.code} onChange={formik.handleChange} onBlur={formik.handleBlur} isInvalid={t.code && !!e.code} />
                <Form.Control.Feedback type="invalid">{e.code}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Kiosk Branch Name *</Form.Label>
                <Form.Control name="name" value={v.name} onChange={formik.handleChange} onBlur={formik.handleBlur} isInvalid={t.name && !!e.name} />
                <Form.Control.Feedback type="invalid">{e.name}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={12}>
              <Form.Group>
                <Form.Label>Address</Form.Label>
                <Form.Control name="address" value={v.address} onChange={formik.handleChange} />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>City</Form.Label>
                <Form.Control name="city" value={v.city} onChange={formik.handleChange} />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>State</Form.Label>
                <Form.Control name="state" value={v.state} onChange={formik.handleChange} />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Zip</Form.Label>
                <Form.Control name="zip" value={v.zip} onChange={formik.handleChange} />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={formik.isSubmitting}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={formik.isSubmitting}>
            {formik.isSubmitting ? 'Saving...' : 'Register Branch'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}

export default AddBranchModal
