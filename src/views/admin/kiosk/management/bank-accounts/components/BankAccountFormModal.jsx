import { useEffect, useState } from 'react'
import { Alert, Button, Col, Form, Modal, Row } from 'react-bootstrap'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'

const emptyValues = { branch_id: '', bank_id: '', bank_branch_id: '', account_name: '', account_number: '', account_type: '' }

const schema = Yup.object({
  branch_id: Yup.number().required('Please select a kiosk branch.'),
  bank_id: Yup.number().required('Please select a bank.'),
  bank_branch_id: Yup.number().required('Please select a bank branch.'),
  account_name: Yup.string().trim().required('Please enter the bank account name.'),
  account_number: Yup.string().trim().required('Please enter the bank account number.'),
  account_type: Yup.string().required('Please select an account type.'),
})

const BankAccountFormModal = ({ show, onHide, account, branches, banks, onSaved }) => {
  const { showNotification } = useNotificationContext()
  const [bankBranches, setBankBranches] = useState([])
  const [formError, setFormError] = useState('')
  const [loadingAccount, setLoadingAccount] = useState(false)
  const isEdit = Boolean(account)

  const formik = useFormik({
    initialValues: emptyValues,
    validationSchema: schema,
    onSubmit: async (values, { setSubmitting, setErrors }) => {
      setFormError('')
      try {
        if (isEdit) {
          await ApiService.updateKioskBankAccount(account.id, values)
        } else {
          await ApiService.addKioskBankAccount(values)
        }
        showNotification({ title: 'Success', message: `Bank Details has been successfully ${isEdit ? 'updated' : 'added'}.`, variant: 'success' })
        onSaved?.()
        onHide()
      } catch (err) {
        if (err?.errors) {
          setErrors(Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])))
        } else {
          setFormError(err?.message || 'Failed to save bank account.')
        }
      } finally {
        setSubmitting(false)
      }
    },
  })

  const loadBankBranches = (bankId) => {
    if (!bankId) {
      setBankBranches([])
      return
    }
    ApiService.getKioskBankAccountBranches(bankId).then((data) => setBankBranches(Array.isArray(data?.data) ? data.data : []))
  }

  useEffect(() => {
    if (!show) return
    setFormError('')

    if (isEdit) {
      setLoadingAccount(true)
      ApiService.getKioskBankAccount(account.id)
        .then((data) => {
          const detail = data?.data || {}
          loadBankBranches(detail.bank_id)
          formik.resetForm({
            values: {
              branch_id: detail.branch_id || '',
              bank_id: detail.bank_id || '',
              bank_branch_id: detail.bank_branch_id || '',
              account_name: detail.account_name || '',
              account_number: detail.account_number || '',
              account_type: detail.account_type || '',
            },
          })
        })
        .finally(() => setLoadingAccount(false))
    } else {
      setBankBranches([])
      formik.resetForm({ values: emptyValues })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, account])

  const { values: v, errors: e, touched: t } = formik

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{isEdit ? 'Edit Bank Account' : 'Add Bank Account'}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={formik.handleSubmit} noValidate>
        <Modal.Body>
          {formError && <Alert variant="danger" className="py-2 small mb-3">{formError}</Alert>}
          {loadingAccount ? <p className="text-muted mb-0">Loading...</p> : (
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Kiosk Branch *</Form.Label>
                  <Form.Select name="branch_id" value={v.branch_id} onChange={formik.handleChange} onBlur={formik.handleBlur} isInvalid={t.branch_id && !!e.branch_id}>
                    <option value="">Select...</option>
                    {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">{e.branch_id}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Account Type *</Form.Label>
                  <Form.Select name="account_type" value={v.account_type} onChange={formik.handleChange} onBlur={formik.handleBlur} isInvalid={t.account_type && !!e.account_type}>
                    <option value="">Select...</option>
                    <option value="savings">Savings</option>
                    <option value="checking">Checking</option>
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">{e.account_type}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Bank *</Form.Label>
                  <Form.Select
                    name="bank_id"
                    value={v.bank_id}
                    onChange={(ev) => { formik.setFieldValue('bank_id', ev.target.value); formik.setFieldValue('bank_branch_id', ''); loadBankBranches(ev.target.value) }}
                    onBlur={formik.handleBlur}
                    isInvalid={t.bank_id && !!e.bank_id}
                  >
                    <option value="">Select...</option>
                    {banks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">{e.bank_id}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Bank Branch *</Form.Label>
                  <Form.Select name="bank_branch_id" value={v.bank_branch_id} onChange={formik.handleChange} onBlur={formik.handleBlur} isInvalid={t.bank_branch_id && !!e.bank_branch_id}>
                    <option value="">Select...</option>
                    {bankBranches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">{e.bank_branch_id}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Bank Account Name *</Form.Label>
                  <Form.Control name="account_name" value={v.account_name} onChange={formik.handleChange} onBlur={formik.handleBlur} isInvalid={t.account_name && !!e.account_name} />
                  <Form.Control.Feedback type="invalid">{e.account_name}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Bank Account No *</Form.Label>
                  <Form.Control name="account_number" value={v.account_number} onChange={formik.handleChange} onBlur={formik.handleBlur} isInvalid={t.account_number && !!e.account_number} />
                  <Form.Control.Feedback type="invalid">{e.account_number}</Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={formik.isSubmitting}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={formik.isSubmitting || loadingAccount}>
            {formik.isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Bank'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}

export default BankAccountFormModal
