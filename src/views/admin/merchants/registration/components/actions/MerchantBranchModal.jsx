import { useEffect, useMemo, useState } from 'react'
import { Badge, Button, Col, Form, Modal, Row, Spinner, Table } from 'react-bootstrap'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'

const emptyBranch = { branch_code: '', description: '', island: '', island_location: '', address1: '', address2: '', city: '', state: '' }

const MerchantBranchModal = ({ show, onHide, merchant }) => {
  const { showNotification } = useNotificationContext()
  const [branches, setBranches] = useState([])
  const [islands, setIslands] = useState([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [values, setValues] = useState(emptyBranch)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const load = () => {
    if (!merchant) return
    setLoading(true)
    Promise.all([ApiService.getMerchantBranches(merchant.id), ApiService.getBranchIslands()])
      .then(([branchList, islandList]) => {
        setBranches(Array.isArray(branchList) ? branchList : [])
        setIslands(Array.isArray(islandList) ? islandList : [])
      })
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load branches.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (show) {
      setShowForm(false)
      load()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, merchant])

  const cityOptions = useMemo(
    () => islands.find((island) => island.name === values.island)?.cities || [],
    [islands, values.island]
  )

  const openAdd = () => {
    setEditingId(null)
    setValues(emptyBranch)
    setErrors({})
    setShowForm(true)
  }

  const openEdit = (branch) => {
    setEditingId(branch.id)
    setValues({
      branch_code: branch.branch_code || '',
      description: branch.description || '',
      island: branch.island || '',
      island_location: branch.island_location || '',
      address1: branch.address1 || '',
      address2: branch.address2 || '',
      city: branch.city || '',
      state: branch.state || '',
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
        await ApiService.updateMerchantBranch(merchant.id, editingId, values)
      } else {
        await ApiService.addMerchantBranch(merchant.id, values)
      }
      showNotification({ title: 'Success', message: `Branch ${editingId ? 'updated' : 'created'} successfully.`, variant: 'success' })
      setShowForm(false)
      load()
    } catch (err) {
      setErrors(err?.errors ?? {})
      showNotification({ title: 'Failed', message: err?.message || 'Failed to save branch.', variant: 'danger' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleStatus = async (branch) => {
    const nextStatus = branch.status === 'active' ? 'I' : 'A'
    try {
      await ApiService.changeMerchantBranchStatus(merchant.id, branch.id, nextStatus)
      load()
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.message || 'Failed to update branch status.', variant: 'danger' })
    }
  }

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Branches — {merchant?.dba_name || merchant?.legal_name}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading ? (
          <div className="text-center py-4"><Spinner size="sm" /></div>
        ) : showForm ? (
          <Form onSubmit={handleSubmit} noValidate>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Branch Code <span className="text-danger">*</span></Form.Label>
                  <Form.Control value={values.branch_code} onChange={(e) => setValues((prev) => ({ ...prev, branch_code: e.target.value }))} isInvalid={!!errors.branch_code} />
                  <Form.Control.Feedback type="invalid">{errors.branch_code?.[0]}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Description <span className="text-danger">*</span></Form.Label>
                  <Form.Control value={values.description} onChange={(e) => setValues((prev) => ({ ...prev, description: e.target.value }))} isInvalid={!!errors.description} />
                  <Form.Control.Feedback type="invalid">{errors.description?.[0]}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Island <span className="text-danger">*</span></Form.Label>
                  <Form.Select value={values.island} onChange={(e) => setValues((prev) => ({ ...prev, island: e.target.value, island_location: '' }))} isInvalid={!!errors.island}>
                    <option value="">Select island...</option>
                    {islands.map((island) => <option key={island.id} value={island.name}>{island.name}</option>)}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">{errors.island?.[0]}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Island Location <span className="text-danger">*</span></Form.Label>
                  <Form.Select value={values.island_location} onChange={(e) => setValues((prev) => ({ ...prev, island_location: e.target.value }))} isInvalid={!!errors.island_location} disabled={!values.island}>
                    <option value="">Select location...</option>
                    {cityOptions.map((city) => <option key={city} value={city}>{city}</option>)}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">{errors.island_location?.[0]}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Address Line 1 <span className="text-danger">*</span></Form.Label>
                  <Form.Control value={values.address1} onChange={(e) => setValues((prev) => ({ ...prev, address1: e.target.value }))} isInvalid={!!errors.address1} />
                  <Form.Control.Feedback type="invalid">{errors.address1?.[0]}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Address Line 2</Form.Label>
                  <Form.Control value={values.address2} onChange={(e) => setValues((prev) => ({ ...prev, address2: e.target.value }))} />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>City</Form.Label>
                  <Form.Control value={values.city} onChange={(e) => setValues((prev) => ({ ...prev, city: e.target.value }))} />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>State</Form.Label>
                  <Form.Control value={values.state} onChange={(e) => setValues((prev) => ({ ...prev, state: e.target.value }))} />
                </Form.Group>
              </Col>
            </Row>
            <div className="d-flex justify-content-end gap-2 mt-3">
              <Button variant="secondary" size="sm" onClick={() => setShowForm(false)} disabled={submitting}>Cancel</Button>
              <Button variant="primary" size="sm" type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : editingId ? 'Save changes' : 'Create branch'}
              </Button>
            </div>
          </Form>
        ) : (
          <>
            <div className="table-responsive">
              <Table size="sm" className="align-middle mb-2">
                <thead className="thead-sm text-uppercase fs-xxs">
                  <tr><th>Code</th><th>Description</th><th>Location</th><th>Status</th><th /></tr>
                </thead>
                <tbody>
                  {branches.map((branch) => (
                    <tr key={branch.id}>
                      <td>{branch.branch_code}</td>
                      <td>{branch.description}</td>
                      <td>{branch.island_location}, {branch.island}</td>
                      <td>
                        <Badge bg={branch.status === 'active' ? 'success-subtle' : 'secondary-subtle'} className={branch.status === 'active' ? 'text-success' : 'text-secondary'}>
                          {branch.status === 'active' ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="text-end text-nowrap">
                        <Button variant="light" size="sm" className="me-1" onClick={() => openEdit(branch)}><Icon icon="edit" /></Button>
                        <Button variant="light" size="sm" onClick={() => handleToggleStatus(branch)}>
                          {branch.status === 'active' ? <Icon icon="ban" className="text-danger" /> : <Icon icon="circle-check" className="text-success" />}
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {!branches.length && <tr><td colSpan={5} className="text-center text-muted py-3">No branches yet.</td></tr>}
                </tbody>
              </Table>
            </div>
            <Button variant="light" size="sm" onClick={openAdd}><Icon icon="plus" className="me-1" /> Add branch</Button>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Close</Button>
      </Modal.Footer>
    </Modal>
  )
}

export default MerchantBranchModal
