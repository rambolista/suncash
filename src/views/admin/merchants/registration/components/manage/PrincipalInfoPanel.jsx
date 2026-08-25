import { useEffect, useState } from 'react'
import { Button, Col, Form, Row, Spinner } from 'react-bootstrap'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'

const empty = { fname: '', lname: '', position: '', equity: '', email: '', mobile: '', address1: '', address2: '', city: '', state: '', zip: '' }

const schema = Yup.object({
  fname: Yup.string().trim().required('First name is required'),
  lname: Yup.string().trim().required('Last name is required'),
  position: Yup.string().trim().required('Position is required'),
  equity: Yup.string().trim().required('Equity is required'),
  email: Yup.string().trim().email('Enter a valid e-mail address').required('E-mail is required'),
  mobile: Yup.string().trim().required('Mobile number is required'),
  address1: Yup.string().trim().required('Address is required'),
  address2: Yup.string().trim().nullable(),
  city: Yup.string().trim().required('City is required'),
  state: Yup.string().trim().required('State is required'),
  zip: Yup.string().trim().required('Zip is required'),
})

const PrincipalInfoPanel = ({ merchant, editable }) => {
  const { showNotification } = useNotificationContext()
  const [loading, setLoading] = useState(false)

  const formik = useFormik({
    initialValues: empty,
    validationSchema: schema,
    onSubmit: async (values, { setErrors, setSubmitting }) => {
      try {
        await ApiService.saveMerchantPrincipalInfo(merchant.id, values)
        showNotification({ title: 'Success', message: 'Principal info saved successfully.', variant: 'success' })
      } catch (err) {
        setErrors(err?.errors ?? {})
        showNotification({ title: 'Failed', message: err?.message || 'Failed to save principal info.', variant: 'danger' })
      } finally {
        setSubmitting(false)
      }
    },
  })

  useEffect(() => {
    if (!merchant) return

    let active = true
    setLoading(true)
    formik.resetForm({ values: empty })

    ApiService.getMerchantPrincipalInfo(merchant.id)
      .then((data) => {
        if (active && data) formik.resetForm({ values: { ...empty, ...data } })
      })
      .catch((err) => {
        if (active) showNotification({ title: 'Failed', message: err?.message || 'Failed to load principal info.', variant: 'danger' })
      })
      .finally(() => { if (active) setLoading(false) })

    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merchant])

  const { values: f, errors: e, touched: t } = formik

  const field = (name, label, colProps = { md: 6 }) => (
    <Col {...colProps}>
      <Form.Group>
        <Form.Label>{label} {editable && <span className="text-danger">*</span>}</Form.Label>
        <Form.Control
          name={name}
          value={f[name]}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          isInvalid={t[name] && !!e[name]}
          disabled={!editable}
          plaintext={!editable}
          readOnly={!editable}
        />
        <Form.Control.Feedback type="invalid">{e[name]}</Form.Control.Feedback>
      </Form.Group>
    </Col>
  )

  if (loading) return <div className="text-center py-4"><Spinner size="sm" /></div>

  return (
    <Form onSubmit={formik.handleSubmit} noValidate>
      <Row className="g-3">
        {field('fname', 'First Name')}
        {field('lname', 'Last Name')}
        {field('position', 'Position')}
        {field('equity', 'Equity (%)')}
        {field('email', 'E-mail')}
        {field('mobile', 'Mobile Number')}
        {field('address1', 'Address Line 1')}
        <Col md={6}>
          <Form.Group>
            <Form.Label>Address Line 2</Form.Label>
            <Form.Control name="address2" value={f.address2} onChange={formik.handleChange} disabled={!editable} plaintext={!editable} readOnly={!editable} />
          </Form.Group>
        </Col>
        {field('city', 'City')}
        {field('state', 'State')}
        {field('zip', 'Zip')}
      </Row>
      {editable && (
        <div className="d-flex justify-content-end mt-3">
          <Button variant="primary" size="sm" type="submit" disabled={formik.isSubmitting}>
            {formik.isSubmitting ? 'Saving...' : 'Save changes'}
          </Button>
        </div>
      )}
    </Form>
  )
}

export default PrincipalInfoPanel
