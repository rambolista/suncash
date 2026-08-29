import { useEffect } from 'react'
import { Alert, Button, Form, Modal } from 'react-bootstrap'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'

const schema = Yup.object({
  type: Yup.string().oneOf(['credit', 'debit']).required(),
  amount: Yup.number().typeError('Enter a valid amount.').moreThan(0, 'Amount must be greater than zero.').required('Amount is required.'),
  description: Yup.string().trim().required('Description is required.'),
})

const AdjustmentModal = ({ show, onHide, merchant, onDone }) => {
  const { showNotification } = useNotificationContext()

  const formik = useFormik({
    initialValues: { type: 'credit', amount: '', description: '' },
    validationSchema: schema,
    onSubmit: async (values, { setSubmitting, setErrors }) => {
      try {
        const result = await ApiService.adjustMerchantStatementBalance(merchant.id, values)
        showNotification({ title: 'Success', message: result?.message || 'Adjustment applied successfully.', variant: 'success' })
        onDone?.()
        onHide()
      } catch (err) {
        setErrors(err?.errors ? Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])) : {})
        if (!err?.errors) showNotification({ title: 'Failed', message: err?.message || 'Failed to apply adjustment.', variant: 'danger' })
      } finally {
        setSubmitting(false)
      }
    },
  })

  useEffect(() => {
    if (show) formik.resetForm({ values: { type: 'credit', amount: '', description: '' } })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show])

  const { values: v, errors: e, touched: t } = formik

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Adjustment — {merchant?.dba_name}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={formik.handleSubmit} noValidate>
        <Modal.Body>
          {merchant && <Alert variant="info" className="py-2 small">Current balance: BSD {Number(merchant.client_prefund || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Alert>}
          <Form.Group className="mb-3">
            <Form.Label>Type *</Form.Label>
            <Form.Select name="type" value={v.type} onChange={formik.handleChange}>
              <option value="credit">Credit</option>
              <option value="debit">Debit</option>
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Amount *</Form.Label>
            <Form.Control
              type="number" step="0.01" min="0" name="amount" value={v.amount}
              onChange={formik.handleChange} onBlur={formik.handleBlur}
              isInvalid={t.amount && !!e.amount}
            />
            <Form.Control.Feedback type="invalid">{e.amount}</Form.Control.Feedback>
          </Form.Group>
          <Form.Group>
            <Form.Label>Description *</Form.Label>
            <Form.Control
              as="textarea" rows={2} name="description" value={v.description}
              onChange={formik.handleChange} onBlur={formik.handleBlur}
              isInvalid={t.description && !!e.description}
            />
            <Form.Control.Feedback type="invalid">{e.description}</Form.Control.Feedback>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={formik.isSubmitting}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={formik.isSubmitting}>
            {formik.isSubmitting ? 'Saving...' : 'Apply Adjustment'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}

export default AdjustmentModal
