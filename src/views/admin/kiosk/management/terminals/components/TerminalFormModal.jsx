import { useEffect } from 'react'
import { Button, Col, Form, Modal, Row } from 'react-bootstrap'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import Select from '@/components/wrappers/Select'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'

const emptyValues = {
  code: '', name: '', device_id: '', username: '', password: '',
  location: '', island: null, terminal_type: '', acceptor_high_alert: '', dispenser_low_alert: '', manager_id: null,
}

const buildSchema = (isEdit) => Yup.object({
  code: Yup.string().trim().required('Please enter a terminal code.'),
  name: Yup.string().trim().required('Please enter a terminal name.'),
  device_id: isEdit ? Yup.mixed() : Yup.string().trim().required('Please enter a device id.'),
  username: Yup.string().trim().required('Please enter a username.'),
  password: isEdit ? Yup.string() : Yup.string().required('Please enter a password.'),
  location: Yup.string().trim().required('Please enter kiosk location.'),
  island: Yup.mixed().required('Please select your island.'),
  terminal_type: Yup.string().required('Please select a terminal type.'),
  acceptor_high_alert: Yup.number().typeError('Please enter a valid acceptor value.').moreThan(0, 'Please enter a valid acceptor value.').required('Please enter a valid acceptor value.'),
  dispenser_low_alert: Yup.number().when('terminal_type', {
    is: 'atm',
    then: (s) => s.typeError('Please enter a valid dispenser value.').moreThan(0, 'Please enter a valid dispenser value.').required('Please enter a valid dispenser value.'),
    otherwise: (s) => s.notRequired(),
  }),
})

const TerminalFormModal = ({ show, onHide, branchId, terminal, islands, managers, onSaved }) => {
  const { showNotification } = useNotificationContext()
  const isEdit = Boolean(terminal)

  const formik = useFormik({
    initialValues: emptyValues,
    validationSchema: buildSchema(isEdit),
    onSubmit: async (values, { setSubmitting, setErrors }) => {
      const payload = {
        kiosk_branch_id: branchId,
        code: values.code.trim(),
        name: values.name.trim(),
        device_id: values.device_id?.trim(),
        username: values.username.trim(),
        password: values.password || undefined,
        location: values.location.trim(),
        island: values.island,
        terminal_type: values.terminal_type,
        acceptor_high_alert: values.acceptor_high_alert,
        dispenser_low_alert: values.terminal_type === 'atm' ? values.dispenser_low_alert : 0,
        manager_id: values.manager_id,
      }
      try {
        if (isEdit) {
          await ApiService.updateKioskTerminal(terminal.id, payload)
        } else {
          await ApiService.addKioskTerminal(payload)
        }
        showNotification({ title: 'Success', message: `Kiosk Terminal has been ${isEdit ? 'updated' : 'registered'}.`, variant: 'success' })
        onSaved?.()
        onHide()
      } catch (err) {
        if (err?.errors) {
          setErrors(Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])))
        } else {
          showNotification({ title: 'Failed', message: err?.message || 'Failed to save terminal.', variant: 'danger' })
        }
      } finally {
        setSubmitting(false)
      }
    },
  })

  useEffect(() => {
    if (!show) return
    formik.resetForm({
      values: isEdit
        ? {
          code: terminal.code || '',
          name: terminal.name || '',
          device_id: terminal.device_id || '',
          username: terminal.username || '',
          password: '',
          location: terminal.location || '',
          island: terminal.island_id ? Number(terminal.island_id) : null,
          terminal_type: terminal.terminal_type || '',
          acceptor_high_alert: terminal.acceptor_high_alert || '',
          dispenser_low_alert: terminal.dispenser_low_alert || '',
          manager_id: terminal.manager_id ? Number(terminal.manager_id) : null,
        }
        : emptyValues,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, terminal])

  const { values: v, errors: e, touched: t } = formik
  const islandOptions = islands.map((i) => ({ value: i.id, label: i.name }))
  const managerOptions = managers.map((m) => ({ value: m.id, label: m.name }))

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{isEdit ? 'Edit Kiosk Terminal' : 'Add Kiosk Terminal'}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={formik.handleSubmit} noValidate>
        <Modal.Body>
          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Terminal Code *</Form.Label>
                <Form.Control name="code" value={v.code} onChange={formik.handleChange} onBlur={formik.handleBlur} isInvalid={t.code && !!e.code} />
                <Form.Control.Feedback type="invalid">{e.code}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Terminal Name *</Form.Label>
                <Form.Control name="name" value={v.name} onChange={formik.handleChange} onBlur={formik.handleBlur} isInvalid={t.name && !!e.name} />
                <Form.Control.Feedback type="invalid">{e.name}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            {!isEdit && (
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Device Id *</Form.Label>
                  <Form.Control name="device_id" value={v.device_id} onChange={formik.handleChange} onBlur={formik.handleBlur} isInvalid={t.device_id && !!e.device_id} />
                  <Form.Control.Feedback type="invalid">{e.device_id}</Form.Control.Feedback>
                </Form.Group>
              </Col>
            )}
            <Col md={6}>
              <Form.Group>
                <Form.Label>Username *</Form.Label>
                <Form.Control name="username" value={v.username} onChange={formik.handleChange} onBlur={formik.handleBlur} isInvalid={t.username && !!e.username} />
                <Form.Control.Feedback type="invalid">{e.username}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Password {isEdit ? '' : '*'}</Form.Label>
                <Form.Control type="password" name="password" value={v.password} onChange={formik.handleChange} onBlur={formik.handleBlur} isInvalid={t.password && !!e.password} placeholder={isEdit ? 'Leave blank to keep current password' : ''} />
                <Form.Control.Feedback type="invalid">{e.password}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Kiosk Location *</Form.Label>
                <Form.Control name="location" value={v.location} onChange={formik.handleChange} onBlur={formik.handleBlur} isInvalid={t.location && !!e.location} />
                <Form.Control.Feedback type="invalid">{e.location}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Island *</Form.Label>
                <Select
                  className="react-select"
                  classNamePrefix="react-select"
                  options={islandOptions}
                  value={islandOptions.find((o) => o.value === v.island) || null}
                  onChange={(option) => formik.setFieldValue('island', option?.value ?? null)}
                  onBlur={() => formik.setFieldTouched('island', true)}
                  isSearchable
                  isClearable
                />
                {t.island && e.island && <div className="text-danger small mt-1">{e.island}</div>}
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Terminal Type *</Form.Label>
                <Form.Select name="terminal_type" value={v.terminal_type} onChange={formik.handleChange} onBlur={formik.handleBlur} isInvalid={t.terminal_type && !!e.terminal_type}>
                  <option value="">Select...</option>
                  <option value="kiosk">Kiosk</option>
                  <option value="atm">ATM</option>
                </Form.Select>
                <Form.Control.Feedback type="invalid">{e.terminal_type}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Manager</Form.Label>
                <Select
                  className="react-select"
                  classNamePrefix="react-select"
                  options={managerOptions}
                  value={managerOptions.find((o) => o.value === v.manager_id) || null}
                  onChange={(option) => formik.setFieldValue('manager_id', option?.value ?? null)}
                  isSearchable
                  isClearable
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Acceptor High Alert *</Form.Label>
                <Form.Control type="number" step="0.01" name="acceptor_high_alert" value={v.acceptor_high_alert} onChange={formik.handleChange} onBlur={formik.handleBlur} isInvalid={t.acceptor_high_alert && !!e.acceptor_high_alert} />
                <Form.Control.Feedback type="invalid">{e.acceptor_high_alert}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            {v.terminal_type === 'atm' && (
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Dispenser Low Alert *</Form.Label>
                  <Form.Control type="number" step="0.01" name="dispenser_low_alert" value={v.dispenser_low_alert} onChange={formik.handleChange} onBlur={formik.handleBlur} isInvalid={t.dispenser_low_alert && !!e.dispenser_low_alert} />
                  <Form.Control.Feedback type="invalid">{e.dispenser_low_alert}</Form.Control.Feedback>
                </Form.Group>
              </Col>
            )}
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
