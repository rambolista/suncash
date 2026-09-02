import { useEffect, useState } from 'react'
import { Alert, Button, Col, Form, Modal, Row } from 'react-bootstrap'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import Select from '@/components/wrappers/Select'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'

const FREQUENCIES = ['Daily', 'Weekly', 'Monthly']

const emptyValues = {
  first_name: '', middle_name: '', last_name: '', email: '', mobile: '', address: '',
  is_settlement: false, stl_frequency: '', stl_type: '', stl_business_id: null, stl_suncash: '',
  stl_bank_type: '', stl_bank_id: null, stl_bank_branch_id: null, stl_bank_acct_name: '', stl_bank_acct_no: '',
  is_commission: false, comm_frequency: '', comm_type: '', comm_business_id: null, comm_suncash: '',
  comm_bank_type: '', comm_bank_id: null, comm_bank_branch_id: null, comm_bank_acct_name: '', comm_bank_acct_no: '',
}

const payoutSchema = (prefix, label) => ({
  [`${prefix}_frequency`]: Yup.string().when('is_'.concat(prefix === 'stl' ? 'settlement' : 'commission'), {
    is: true,
    then: (s) => s.required(`Please select a ${label} report frequency.`),
  }),
  [`${prefix}_type`]: Yup.string().when('is_'.concat(prefix === 'stl' ? 'settlement' : 'commission'), {
    is: true,
    then: (s) => s.required(`Please select a ${label} option.`),
  }),
})

const schema = Yup.object({
  first_name: Yup.string().trim().required('Please enter a first name.'),
  last_name: Yup.string().trim().required('Please enter a last name.'),
  email: Yup.string().trim().email('Please enter a valid email address.').required('Please enter an email address.'),
  mobile: Yup.string().trim().required('Please enter a mobile number.'),
  address: Yup.string().trim().required('Please enter an address.'),
  ...payoutSchema('stl', 'settlement'),
  ...payoutSchema('comm', 'commission'),
})

const PayoutSection = ({ prefix, label, formik, merchants, banks, bankBranches, onBankChange }) => {
  const { values: v, errors: e, touched: t } = formik
  const enabled = v[`is_${prefix === 'stl' ? 'settlement' : 'commission'}`]
  const type = v[`${prefix}_type`]

  if (!enabled) return null

  return (
    <div className="border rounded p-3 mb-3 bg-body-tertiary">
      <h6 className="mb-3">{label} Details</h6>
      <Row className="g-3">
        <Col md={6}>
          <Form.Group>
            <Form.Label>Report Frequency *</Form.Label>
            <Form.Select name={`${prefix}_frequency`} value={v[`${prefix}_frequency`]} onChange={formik.handleChange}>
              <option value="">Select...</option>
              {FREQUENCIES.map((f) => <option key={f} value={f}>{f}</option>)}
            </Form.Select>
            {t[`${prefix}_frequency`] && e[`${prefix}_frequency`] && <div className="text-danger small mt-1">{e[`${prefix}_frequency`]}</div>}
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group>
            <Form.Label>{label} Option *</Form.Label>
            <Form.Select name={`${prefix}_type`} value={type} onChange={formik.handleChange}>
              <option value="">Select...</option>
              <option value="business_account">Business Account</option>
              <option value="suncash_wallet">Suncash Wallet</option>
              <option value="bank_deposit">Bank Deposit</option>
            </Form.Select>
            {t[`${prefix}_type`] && e[`${prefix}_type`] && <div className="text-danger small mt-1">{e[`${prefix}_type`]}</div>}
          </Form.Group>
        </Col>

        {type === 'business_account' && (
          <Col md={12}>
            <Form.Group>
              <Form.Label>Merchant *</Form.Label>
              <Select
                className="react-select"
                classNamePrefix="react-select"
                options={merchants.map((m) => ({ value: m.id, label: `${m.name} (${m.client_id})` }))}
                value={merchants.map((m) => ({ value: m.id, label: `${m.name} (${m.client_id})` })).find((o) => o.value === v[`${prefix}_business_id`]) || null}
                onChange={(option) => formik.setFieldValue(`${prefix}_business_id`, option?.value ?? null)}
                isSearchable
                isClearable
              />
            </Form.Group>
          </Col>
        )}

        {type === 'suncash_wallet' && (
          <Col md={12}>
            <Form.Group>
              <Form.Label>Suncash Account *</Form.Label>
              <Form.Control name={`${prefix}_suncash`} value={v[`${prefix}_suncash`]} onChange={formik.handleChange} placeholder="1242XXXXXXX" />
            </Form.Group>
          </Col>
        )}

        {type === 'bank_deposit' && (
          <>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Bank Account Type *</Form.Label>
                <Form.Select name={`${prefix}_bank_type`} value={v[`${prefix}_bank_type`]} onChange={formik.handleChange}>
                  <option value="">Select...</option>
                  <option value="savings">Savings</option>
                  <option value="checking">Checking</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Bank *</Form.Label>
                <Form.Select
                  value={v[`${prefix}_bank_id`] || ''}
                  onChange={(e2) => { formik.setFieldValue(`${prefix}_bank_id`, e2.target.value); formik.setFieldValue(`${prefix}_bank_branch_id`, null); onBankChange(prefix, e2.target.value) }}
                >
                  <option value="">Select...</option>
                  {banks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Bank Branch *</Form.Label>
                <Form.Select name={`${prefix}_bank_branch_id`} value={v[`${prefix}_bank_branch_id`] || ''} onChange={formik.handleChange}>
                  <option value="">Select...</option>
                  {(bankBranches[prefix] || []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Bank Account Name *</Form.Label>
                <Form.Control name={`${prefix}_bank_acct_name`} value={v[`${prefix}_bank_acct_name`]} onChange={formik.handleChange} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Bank Account No *</Form.Label>
                <Form.Control name={`${prefix}_bank_acct_no`} value={v[`${prefix}_bank_acct_no`]} onChange={formik.handleChange} />
              </Form.Group>
            </Col>
          </>
        )}
      </Row>
    </div>
  )
}

const PartnerFormModal = ({ show, onHide, branchId, partner, onSaved }) => {
  const { showNotification } = useNotificationContext()
  const [merchants, setMerchants] = useState([])
  const [banks, setBanks] = useState([])
  const [bankBranches, setBankBranches] = useState({ stl: [], comm: [] })
  const [formError, setFormError] = useState('')
  const isEdit = Boolean(partner)

  const loadBankBranches = (prefix, bankId) => {
    if (!bankId) return
    ApiService.getKioskBankAccountBranches(bankId).then((data) => {
      setBankBranches((prev) => ({ ...prev, [prefix]: Array.isArray(data?.data) ? data.data : [] }))
    })
  }

  const formik = useFormik({
    initialValues: emptyValues,
    validationSchema: schema,
    onSubmit: async (values, { setSubmitting, setErrors }) => {
      setFormError('')
      try {
        if (isEdit) {
          await ApiService.updateKioskPartner(partner.id, values)
        } else {
          await ApiService.addKioskPartner(branchId, values)
        }
        showNotification({ title: 'Success', message: `Partner has been ${isEdit ? 'updated' : 'added'}.`, variant: 'success' })
        onSaved?.()
        onHide()
      } catch (err) {
        if (err?.errors) {
          setErrors(Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])))
        } else {
          setFormError(err?.message || 'Failed to save partner.')
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
    ApiService.getKioskBankAccounts().then((data) => setBanks(Array.isArray(data?.banks) ? data.banks : []))

    if (isEdit) {
      if (partner.stl_bank_id) loadBankBranches('stl', partner.stl_bank_id)
      if (partner.comm_bank_id) loadBankBranches('comm', partner.comm_bank_id)
    } else {
      setBankBranches({ stl: [], comm: [] })
    }

    formik.resetForm({
      values: isEdit
        ? {
          first_name: partner.first_name || '',
          middle_name: partner.middle_name || '',
          last_name: partner.last_name || '',
          email: partner.email || '',
          mobile: partner.mobile || '',
          address: partner.address || '',
          is_settlement: Boolean(partner.is_settlement),
          stl_frequency: partner.stl_frequency || '',
          stl_type: partner.stl_type || '',
          stl_business_id: partner.stl_business_id > 0 ? partner.stl_business_id : null,
          stl_suncash: partner.stl_suncash || '',
          stl_bank_type: partner.stl_bank_type || '',
          stl_bank_id: partner.stl_bank_id > 0 ? partner.stl_bank_id : null,
          stl_bank_branch_id: partner.stl_bank_branch_id > 0 ? partner.stl_bank_branch_id : null,
          stl_bank_acct_name: partner.stl_bank_acct_name || '',
          stl_bank_acct_no: partner.stl_bank_acct_no_masked || '',
          is_commission: Boolean(partner.is_commission),
          comm_frequency: partner.comm_frequency || '',
          comm_type: partner.comm_type || '',
          comm_business_id: partner.comm_business_id > 0 ? partner.comm_business_id : null,
          comm_suncash: partner.comm_suncash || '',
          comm_bank_type: partner.comm_bank_type || '',
          comm_bank_id: partner.comm_bank_id > 0 ? partner.comm_bank_id : null,
          comm_bank_branch_id: partner.comm_bank_branch_id > 0 ? partner.comm_bank_branch_id : null,
          comm_bank_acct_name: partner.comm_bank_acct_name || '',
          comm_bank_acct_no: partner.comm_bank_acct_no_masked || '',
        }
        : emptyValues,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, partner])

  const { values: v, errors: e, touched: t } = formik

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{isEdit ? 'Edit Partner' : 'Add Partner'}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={formik.handleSubmit} noValidate>
        <Modal.Body>
          {formError && <Alert variant="danger" className="py-2 small mb-3">{formError}</Alert>}
          <Row className="g-3 mb-2">
            <Col md={4}>
              <Form.Group>
                <Form.Label>First Name *</Form.Label>
                <Form.Control name="first_name" value={v.first_name} onChange={formik.handleChange} onBlur={formik.handleBlur} isInvalid={t.first_name && !!e.first_name} />
                <Form.Control.Feedback type="invalid">{e.first_name}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Middle Name</Form.Label>
                <Form.Control name="middle_name" value={v.middle_name} onChange={formik.handleChange} />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Last Name *</Form.Label>
                <Form.Control name="last_name" value={v.last_name} onChange={formik.handleChange} onBlur={formik.handleBlur} isInvalid={t.last_name && !!e.last_name} />
                <Form.Control.Feedback type="invalid">{e.last_name}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Email *</Form.Label>
                <Form.Control name="email" value={v.email} onChange={formik.handleChange} onBlur={formik.handleBlur} isInvalid={t.email && !!e.email} />
                <Form.Control.Feedback type="invalid">{e.email}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Mobile *</Form.Label>
                <Form.Control name="mobile" value={v.mobile} onChange={formik.handleChange} onBlur={formik.handleBlur} isInvalid={t.mobile && !!e.mobile} placeholder="1242XXXXXXX" />
                <Form.Control.Feedback type="invalid">{e.mobile}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Address *</Form.Label>
                <Form.Control name="address" value={v.address} onChange={formik.handleChange} onBlur={formik.handleBlur} isInvalid={t.address && !!e.address} />
                <Form.Control.Feedback type="invalid">{e.address}</Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Form.Check
            type="checkbox"
            id="is_settlement"
            label="Settlement"
            checked={v.is_settlement}
            onChange={(e2) => formik.setFieldValue('is_settlement', e2.target.checked)}
            className="mb-2 fw-semibold"
          />
          <PayoutSection prefix="stl" label="Settlement" formik={formik} merchants={merchants} banks={banks} bankBranches={bankBranches} onBankChange={loadBankBranches} />

          <Form.Check
            type="checkbox"
            id="is_commission"
            label="Commission"
            checked={v.is_commission}
            onChange={(e2) => formik.setFieldValue('is_commission', e2.target.checked)}
            className="mb-2 fw-semibold"
          />
          <PayoutSection prefix="comm" label="Commission" formik={formik} merchants={merchants} banks={banks} bankBranches={bankBranches} onBankChange={loadBankBranches} />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={formik.isSubmitting}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={formik.isSubmitting}>
            {formik.isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Partner'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}

export default PartnerFormModal
