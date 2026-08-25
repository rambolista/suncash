import { useEffect, useState } from 'react'
import { Badge, Button, Col, Form, Row, Spinner, Table } from 'react-bootstrap'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'

const emptyTerminal = { device_id: '', device_alias: '', device_type_id: '', connection_type_id: '', brand_name: '', model: '', lane_counter: '', counter_no: '', branch_id: '' }

const TerminalPanel = ({ merchant, editable }) => {
  const { showNotification } = useNotificationContext()
  const [terminals, setTerminals] = useState([])
  const [deviceTypes, setDeviceTypes] = useState({})
  const [connectionTypes, setConnectionTypes] = useState({})
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [values, setValues] = useState(emptyTerminal)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const load = () => {
    if (!merchant) return
    setLoading(true)
    ApiService.getMerchantTerminals(merchant.id)
      .then((data) => {
        setTerminals(Array.isArray(data?.terminals) ? data.terminals : [])
        setDeviceTypes(data?.device_types || {})
        setConnectionTypes(data?.connection_types || {})
      })
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load terminals.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    setShowForm(false)
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merchant])

  const openAdd = () => {
    setEditingId(null)
    setValues(emptyTerminal)
    setErrors({})
    setShowForm(true)
  }

  const openEdit = (terminal) => {
    setEditingId(terminal.id)
    setValues({
      device_id: terminal.device_id || '',
      device_alias: terminal.device_alias || '',
      device_type_id: terminal.device_type_id || '',
      connection_type_id: terminal.connection_type_id || '',
      brand_name: terminal.brand_name || '',
      model: terminal.model || '',
      lane_counter: terminal.lane_counter || '',
      counter_no: terminal.counter_no || '',
      branch_id: terminal.branch_id || '',
    })
    setErrors({})
    setShowForm(true)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setErrors({})
    try {
      if (editingId) {
        await ApiService.updateMerchantTerminal(merchant.id, editingId, values)
      } else {
        await ApiService.addMerchantTerminal(merchant.id, values)
      }
      showNotification({ title: 'Success', message: `Terminal ${editingId ? 'updated' : 'registered'} successfully.`, variant: 'success' })
      setShowForm(false)
      load()
    } catch (err) {
      setErrors(err?.errors ?? {})
      showNotification({ title: 'Failed', message: err?.message || 'Failed to save terminal.', variant: 'danger' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleStatusChange = async (terminal, statusId) => {
    try {
      await ApiService.changeMerchantTerminalStatus(merchant.id, terminal.id, statusId)
      load()
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.message || 'Failed to update terminal status.', variant: 'danger' })
    }
  }

  if (loading) return <div className="text-center py-4"><Spinner size="sm" /></div>

  if (editable && showForm) {
    return (
      <Form onSubmit={handleSubmit} noValidate>
        <Row className="g-3">
          <Col md={6}>
            <Form.Group>
              <Form.Label>Device ID <span className="text-danger">*</span></Form.Label>
              <Form.Control value={values.device_id} disabled={!!editingId} onChange={(e) => setValues((prev) => ({ ...prev, device_id: e.target.value }))} isInvalid={!!errors.device_id} />
              <Form.Control.Feedback type="invalid">{errors.device_id?.[0]}</Form.Control.Feedback>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
              <Form.Label>Device Alias</Form.Label>
              <Form.Control value={values.device_alias} onChange={(e) => setValues((prev) => ({ ...prev, device_alias: e.target.value }))} />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
              <Form.Label>Device Type <span className="text-danger">*</span></Form.Label>
              <Form.Select value={values.device_type_id} onChange={(e) => setValues((prev) => ({ ...prev, device_type_id: e.target.value }))} isInvalid={!!errors.device_type_id}>
                <option value="">Select...</option>
                {Object.entries(deviceTypes).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
              </Form.Select>
              <Form.Control.Feedback type="invalid">{errors.device_type_id?.[0]}</Form.Control.Feedback>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
              <Form.Label>Connection Type <span className="text-danger">*</span></Form.Label>
              <Form.Select value={values.connection_type_id} onChange={(e) => setValues((prev) => ({ ...prev, connection_type_id: e.target.value }))} isInvalid={!!errors.connection_type_id}>
                <option value="">Select...</option>
                {Object.entries(connectionTypes).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
              </Form.Select>
              <Form.Control.Feedback type="invalid">{errors.connection_type_id?.[0]}</Form.Control.Feedback>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
              <Form.Label>Brand</Form.Label>
              <Form.Control value={values.brand_name} onChange={(e) => setValues((prev) => ({ ...prev, brand_name: e.target.value }))} />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
              <Form.Label>Model</Form.Label>
              <Form.Control value={values.model} onChange={(e) => setValues((prev) => ({ ...prev, model: e.target.value }))} />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
              <Form.Label>Lane Counter</Form.Label>
              <Form.Control value={values.lane_counter} onChange={(e) => setValues((prev) => ({ ...prev, lane_counter: e.target.value }))} />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
              <Form.Label>Counter No.</Form.Label>
              <Form.Control value={values.counter_no} onChange={(e) => setValues((prev) => ({ ...prev, counter_no: e.target.value }))} />
            </Form.Group>
          </Col>
        </Row>
        <div className="d-flex justify-content-end gap-2 mt-3">
          <Button variant="secondary" size="sm" onClick={() => setShowForm(false)} disabled={submitting}>Cancel</Button>
          <Button variant="primary" size="sm" type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : editingId ? 'Save changes' : 'Register terminal'}
          </Button>
        </div>
      </Form>
    )
  }

  return (
    <>
      <div className="table-responsive">
        <Table size="sm" className="align-middle mb-2">
          <thead className="thead-sm text-uppercase fs-xxs">
            <tr><th>Device ID</th><th>Type</th><th>Brand/Model</th><th>Status</th>{editable && <th />}</tr>
          </thead>
          <tbody>
            {terminals.map((terminal) => (
              <tr key={terminal.id}>
                <td>{terminal.device_id}</td>
                <td>{terminal.device_type}</td>
                <td>{terminal.brand_name} {terminal.model}</td>
                <td>
                  <Badge bg={terminal.status === 'active' ? 'success-subtle' : 'secondary-subtle'} className={terminal.status === 'active' ? 'text-success' : 'text-secondary'}>
                    {terminal.status}
                  </Badge>
                </td>
                {editable && (
                  <td className="text-end text-nowrap">
                    <Button variant="light" size="sm" className="me-1" onClick={() => openEdit(terminal)}><Icon icon="edit" /></Button>
                    {terminal.status === 'active' ? (
                      <Button variant="light" size="sm" className="me-1" onClick={() => handleStatusChange(terminal, 1)}><Icon icon="ban" className="text-danger" /></Button>
                    ) : (
                      <Button variant="light" size="sm" className="me-1" onClick={() => handleStatusChange(terminal, 0)}><Icon icon="circle-check" className="text-success" /></Button>
                    )}
                    <Button variant="light" size="sm" onClick={() => handleStatusChange(terminal, 2)}><Icon icon="trash" className="text-danger" /></Button>
                  </td>
                )}
              </tr>
            ))}
            {!terminals.length && <tr><td colSpan={5} className="text-center text-muted py-3">No terminals yet.</td></tr>}
          </tbody>
        </Table>
      </div>
      {editable && (
        <Button variant="light" size="sm" onClick={openAdd}><Icon icon="plus" className="me-1" /> Register terminal</Button>
      )}
    </>
  )
}

export default TerminalPanel
