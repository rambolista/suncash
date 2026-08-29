import { useEffect, useState } from 'react'
import { Alert, Button, Col, Form, Modal, Row } from 'react-bootstrap'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import Select from '@/components/wrappers/Select'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'

const emptyValues = { merchant_id: null, device_id: '', device_type_id: '', brand_name: '', model: '', connection_type_id: '' }

const buildSchema = (isEdit) => Yup.object({
  merchant_id: isEdit ? Yup.mixed() : Yup.number().required('Select a merchant.'),
  device_id: Yup.string().trim().required('Device ID is required.'),
  device_type_id: Yup.number().required('Select a device type.'),
  brand_name: Yup.string().trim().required('Brand name is required.'),
  model: Yup.string().trim().required('Model is required.'),
  connection_type_id: Yup.number().required('Select a connection type.'),
})

const TerminalFormModal = ({ show, onHide, terminal, deviceTypes, connectionTypes, onSaved }) => {
  const { showNotification } = useNotificationContext()
  const [merchants, setMerchants] = useState([])
  const [formError, setFormError] = useState('')
  const isEdit = Boolean(terminal)

  const formik = useFormik({
    initialValues: emptyValues,
    validationSchema: buildSchema(isEdit),
    onSubmit: async (values, { setSubmitting, setErrors }) => {
      setFormError('')
      const payload = {
        device_id: values.device_id.trim(),
        device_type_id: values.device_type_id,
        brand_name: values.brand_name.trim(),
        model: values.model.trim(),
        connection_type_id: values.connection_type_id,
        merchant_id: values.merchant_id,
      }
      try {
        if (isEdit) {
          await ApiService.updateTerminalManagement(terminal.id, payload)
        } else {
          await ApiService.addTerminalManagement(payload)
        }
        showNotification({ title: 'Success', message: `Terminal ${isEdit ? 'updated' : 'registered'} successfully.`, variant: 'success' })
        onSaved?.()
        onHide()
      } catch (err) {
        if (err?.errors) {
          setErrors(Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])))
        } else {
          setFormError(err?.message || 'Failed to save terminal.')
        }
      } finally {
        setSubmitting(false)
      }
    },
  })

  useEffect(() => {
    if (!show) return
    setFormError('')
    if (!isEdit) {
      ApiService.getTerminalManagementMerchants().then((data) => setMerchants(Array.isArray(data) ? data : []))
    }
    formik.resetForm({
      values: isEdit
        ? {
          merchant_id: terminal.merchant_id,
          device_id: terminal.device_id || '',
          device_type_id: terminal.device_type_id || '',
          brand_name: terminal.brand_name || '',
          model: terminal.model || '',
          connection_type_id: terminal.connection_type_id || '',
        }
        : emptyValues,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, terminal])

  const { values: v, errors: e, touched: t } = formik

  const merchantOptions = merchants.map((m) => ({ value: m.id, label: `${m.name || 'Merchant'} (${m.suntag_shortcode})` }))

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{isEdit ? 'Edit Terminal' : 'Add Terminal'}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={formik.handleSubmit} noValidate>
        <Modal.Body>
          {formError && <Alert variant="danger" className="py-2 small mb-3">{formError}</Alert>}
          <Row className="g-3">
            {!isEdit && (
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Merchant *</Form.Label>
                  <Select
                    className="react-select"
                    classNamePrefix="react-select"
                    options={merchantOptions}
                    value={merchantOptions.find((o) => o.value === v.merchant_id) || null}
                    onChange={(option) => formik.setFieldValue('merchant_id', option?.value ?? null)}
                    onBlur={() => formik.setFieldTouched('merchant_id', true)}
                    placeholder="Search merchant by name or ID..."
                    isSearchable
                    isClearable
                  />
                  {t.merchant_id && e.merchant_id && <div className="text-danger small mt-1">{e.merchant_id}</div>}
                </Form.Group>
              </Col>
            )}
            <Col md={6}>
              <Form.Group>
                <Form.Label>Device ID *</Form.Label>
                <Form.Control name="device_id" value={v.device_id} onChange={formik.handleChange} onBlur={formik.handleBlur} isInvalid={t.device_id && !!e.device_id} />
                <Form.Control.Feedback type="invalid">{e.device_id}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Device Type *</Form.Label>
                <Form.Select name="device_type_id" value={v.device_type_id} onChange={formik.handleChange} onBlur={formik.handleBlur} isInvalid={t.device_type_id && !!e.device_type_id}>
                  <option value="">Select...</option>
                  {Object.entries(deviceTypes).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
                </Form.Select>
                <Form.Control.Feedback type="invalid">{e.device_type_id}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Brand Name *</Form.Label>
                <Form.Control name="brand_name" value={v.brand_name} onChange={formik.handleChange} onBlur={formik.handleBlur} isInvalid={t.brand_name && !!e.brand_name} />
                <Form.Control.Feedback type="invalid">{e.brand_name}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Model *</Form.Label>
                <Form.Control name="model" value={v.model} onChange={formik.handleChange} onBlur={formik.handleBlur} isInvalid={t.model && !!e.model} />
                <Form.Control.Feedback type="invalid">{e.model}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Connection Type *</Form.Label>
                <Form.Select name="connection_type_id" value={v.connection_type_id} onChange={formik.handleChange} onBlur={formik.handleBlur} isInvalid={t.connection_type_id && !!e.connection_type_id}>
                  <option value="">Select...</option>
                  {Object.entries(connectionTypes).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
                </Form.Select>
                <Form.Control.Feedback type="invalid">{e.connection_type_id}</Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={formik.isSubmitting}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={formik.isSubmitting}>
            {formik.isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Register Terminal'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}

export default TerminalFormModal
