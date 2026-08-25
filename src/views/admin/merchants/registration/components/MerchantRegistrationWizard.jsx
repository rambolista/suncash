import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Button, Card, Col, Form, Nav, ProgressBar, Row, Table } from 'react-bootstrap'
import { Wizard, useWizard } from 'react-use-wizard'
import clsx from 'clsx'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import LoadingState from '@/components/LoadingState'
import {
  ACCOUNT_TYPES,
  BAHAMAS_ISLANDS,
  BANKS,
  CHARGE_TO_OPTIONS,
  ENTITY_TYPES,
  MAIN_TRANSACTION_TYPES,
  PAYMENT_MODES,
  entityTypeLabel,
} from '../data/merchantReferenceData'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const BAHAMAS_PHONE_PATTERN = /^(\+?1[-.\s]?)?\(?242\)?[-.\s]?\d{3}[-.\s]?\d{4}$/
const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/

const Required = () => <span className="text-danger">*</span>

const STEPS = [
  { key: 'business', label: 'Business Information', hint: 'Identity & contact', icon: 'building' },
  { key: 'fees', label: 'Fees & Revenue Share', hint: 'Commission schedule', icon: 'wallet' },
  { key: 'settlement', label: 'Settlement', hint: 'Bank account', icon: 'building-bank' },
  { key: 'delivery', label: 'Report Delivery', hint: 'How reports are sent', icon: 'report' },
  { key: 'alerts', label: 'Alert Settings', hint: 'Balance notifications', icon: 'bell' },
  { key: 'other', label: 'Other Info', hint: 'Store locations', icon: 'notes' },
  { key: 'review', label: 'Review & Save', hint: 'Confirm & submit', icon: 'clipboard-check' },
]

const EDIT_TABS = STEPS.filter((step) => step.key !== 'review')

const initialFees = MAIN_TRANSACTION_TYPES.reduce((acc, type) => {
  acc[type.id] = { trans_fee: '', comms_per_trans: '', charge_to: '' }
  return acc
}, {})

const empty = {
  merchant_id: '',
  exact_legal_name: '',
  doing_business_as: '',
  dba_name: '',
  tax_id: '',
  entity_type: '',
  ezpay_merchant: false,
  logo: '',
  clear_logo: false,
  address1: '',
  address2: '',
  city: '',
  postalcode: '',
  country: 'Bahamas',
  short_code: '',
  billing_address: '',
  billing_city: '',
  billing_postalcode: '',
  business_license_number: '',
  contactphone: '',
  contactmobile: '',
  contactfax: '',
  contactemail: '',
  contactname: '',
  username: '',
  password: '',
  revenue_value: '',
  fees: initialFees,
  payment_mode: 'credittoaccount',
  bank_name: '',
  bank_branch: '',
  account_name: '',
  account_number: '',
  account_type: 'savingsaccount',
  routing_number: '',
  via_sms: false,
  sms_daily: false,
  sms_weekly: false,
  sms_monthly: false,
  sms_primary: '',
  sms_secondary: '',
  via_email: false,
  email_daily: false,
  email_weekly: false,
  email_monthly: false,
  email_primary: '',
  email_secondary: '',
  via_hardcopy: false,
  hardcopy_daily: false,
  hardcopy_weekly: false,
  hardcopy_monthly: false,
  hardcopy_address: '',
  alert_amount: '',
  alert_sms: false,
  alert_sms_hour: '',
  alert_sms_recipients: '',
  alert_email: false,
  alert_email_hour: '',
  alert_email_recipients: '',
  locations: '',
}

const stepFieldMap = {
  business: ['merchant_id', 'exact_legal_name', 'entity_type', 'address1', 'city', 'contactmobile', 'contactphone', 'contactemail', 'contactname', 'username', 'password'],
  settlement: ['payment_mode', 'bank_name', 'bank_branch', 'account_name', 'account_number'],
  delivery: ['via_sms', 'via_email', 'via_hardcopy', 'sms_daily', 'sms_weekly', 'sms_monthly', 'sms_primary', 'email_daily', 'email_weekly', 'email_monthly', 'email_primary', 'hardcopy_daily', 'hardcopy_weekly', 'hardcopy_monthly', 'hardcopy_address'],
  alerts: ['alert_amount', 'alert_sms_hour', 'alert_sms_recipients', 'alert_email_hour', 'alert_email_recipients'],
}

// Fee-row errors use dynamic keys (fee_trans_fee_<id> / fee_comms_per_trans_<id>),
// so step membership can't be a plain list lookup for the 'fees' step.
const fieldBelongsToStep = (field, stepKey) => {
  if (stepKey === 'fees') return field === 'revenue_value' || field.startsWith('fee_')
  return (stepFieldMap[stepKey] || []).includes(field)
}

const findStepIndexForErrors = (validationErrors, steps) => {
  const fields = Object.keys(validationErrors)
  const index = steps.findIndex((step) => fields.some((field) => fieldBelongsToStep(field, step.key)))
  return index >= 0 ? index : 0
}

// ── Wizard header: progress bar + step nav (mirrors iBIMSKP's NewBlotterWizard) ──

const WizardHeader = () => {
  const { activeStep, stepCount, goToStep } = useWizard()
  const progress = ((activeStep + 1) / stepCount) * 100

  return (
    <>
      <ProgressBar now={progress} className="mb-3" style={{ height: 6 }} />
      <ul className="nav nav-tabs wizard-tabs wizard-bordered flex-nowrap overflow-auto mb-0" data-wizard-nav role="tablist">
        {STEPS.map((item, index) => (
          <li className="nav-item flex-fill text-nowrap" key={item.key}>
            <button
              type="button"
              className={clsx('nav-link w-100 text-start', activeStep === index && 'active', activeStep > index && 'wizard-item-done')}
              onClick={() => { if (index <= activeStep) goToStep(index) }}
            >
              <span className="d-flex align-items-center">
                <span className="d-inline-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={{ width: 34, height: 34, background: 'var(--theme-tertiary-bg)' }}>
                  {activeStep > index ? <Icon icon="check" className="fs-5" /> : <Icon icon={item.icon} className="fs-5" />}
                </span>
                <span className="flex-grow-1 ms-2 text-truncate">
                  <span className="mb-0 lh-base d-block fw-semibold text-body fs-sm">{item.label}</span>
                  <span className="fs-xxs text-muted">{item.hint}</span>
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </>
  )
}

// ── Free-navigation tab nav for edit mode ──

const EditTabsHeader = ({ activeTab, onSelect }) => (
  <div className="customer-profile-tabs-scroll">
    <Nav variant="tabs" activeKey={activeTab} onSelect={(key) => key && onSelect(key)} className="nav-bordered nav-bordered-primary customer-profile-tabs flex-nowrap">
      {EDIT_TABS.map((tab) => (
        <Nav.Item key={tab.key}>
          <Nav.Link eventKey={tab.key} className="d-flex align-items-center gap-2">
            <span
              className="rounded-circle d-inline-flex align-items-center justify-content-center flex-shrink-0 bg-primary-subtle"
              style={{ width: 32, height: 32 }}
            >
              <Icon icon={tab.icon} className="text-primary" style={{ fontSize: '1rem' }} />
            </span>
            <span className="fw-semibold text-nowrap">{tab.label}</span>
          </Nav.Link>
        </Nav.Item>
      ))}
    </Nav>
  </div>
)

// ── Field group: Business Information ──

const BusinessFields = ({
  values, errors, setField, isEdit, idStatus, usernameStatus, onIdChange, onUsernameChange,
  logoUploading, logoError, onLogoSelect, onLogoClear,
}) => (
  <Row className="g-3">
    <Col md={12}>
      <Form.Check type="checkbox" id="ezpay_merchant" name="ezpay_merchant" label="Mark as Ezpay Merchant" checked={values.ezpay_merchant} onChange={setField} />
    </Col>
    <Col md={6}>
      <Form.Group>
        <Form.Label>Merchant Logo</Form.Label>
        <div className="d-flex align-items-center gap-3">
          <div className="rounded border d-flex align-items-center justify-content-center bg-light flex-shrink-0" style={{ width: 64, height: 64, overflow: 'hidden' }}>
            {values.logo ? (
              <img src={values.logo} alt="Merchant logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <Icon icon="photo" className="text-muted fs-4" />
            )}
          </div>
          <div>
            <Form.Control type="file" accept="image/*" size="sm" onChange={onLogoSelect} disabled={logoUploading} />
            {logoUploading && <div className="small text-muted mt-1">Uploading…</div>}
            {logoError && <div className="small text-danger mt-1">{logoError}</div>}
            {values.logo && !logoUploading && (
              <Button variant="link" size="sm" className="p-0 mt-1 text-danger" onClick={onLogoClear}>Remove logo</Button>
            )}
          </div>
        </div>
      </Form.Group>
    </Col>
    <Col md={6}>
      <Form.Group>
        <Form.Label>Merchant ID {!isEdit && <Required />}</Form.Label>
        <Form.Control
          name="merchant_id"
          value={values.merchant_id}
          onChange={(e) => { setField(e); onIdChange(e.target.value) }}
          isInvalid={!!errors.merchant_id}
          readOnly={isEdit}
          plaintext={isEdit}
        />
        <Form.Control.Feedback type="invalid">{errors.merchant_id}</Form.Control.Feedback>
        {!isEdit && idStatus === 'checking' && <div className="small text-muted">Checking availability…</div>}
        {!isEdit && idStatus === 'available' && <div className="small text-success">Available</div>}
        {!isEdit && idStatus === 'taken' && !errors.merchant_id && <div className="small text-danger">Merchant ID already exists.</div>}
      </Form.Group>
    </Col>
    <Col md={6}>
      <Form.Group>
        <Form.Label>Entity Type <Required /></Form.Label>
        <Form.Select name="entity_type" value={values.entity_type} onChange={setField} isInvalid={!!errors.entity_type}>
          <option value="">--SELECT--</option>
          {ENTITY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </Form.Select>
        <Form.Control.Feedback type="invalid">{errors.entity_type}</Form.Control.Feedback>
      </Form.Group>
    </Col>
    <Col md={6}>
      <Form.Group>
        <Form.Label>Exact Legal Name <Required /></Form.Label>
        <Form.Control name="exact_legal_name" value={values.exact_legal_name} onChange={setField} isInvalid={!!errors.exact_legal_name} />
        <Form.Control.Feedback type="invalid">{errors.exact_legal_name}</Form.Control.Feedback>
      </Form.Group>
    </Col>
    <Col md={6}>
      <Form.Group>
        <Form.Label>Doing Business As</Form.Label>
        <Form.Control name="doing_business_as" value={values.doing_business_as} onChange={setField} />
      </Form.Group>
    </Col>
    <Col md={6}>
      <Form.Group>
        <Form.Label>DBA Name</Form.Label>
        <Form.Control name="dba_name" value={values.dba_name} onChange={setField} />
      </Form.Group>
    </Col>
    <Col md={6}>
      <Form.Group>
        <Form.Label>Tax ID</Form.Label>
        <Form.Control name="tax_id" value={values.tax_id} onChange={setField} />
      </Form.Group>
    </Col>
    <Col md={6}>
      <Form.Group>
        <Form.Label>Street Address 1 <Required /></Form.Label>
        <Form.Control name="address1" value={values.address1} onChange={setField} isInvalid={!!errors.address1} />
        <Form.Control.Feedback type="invalid">{errors.address1}</Form.Control.Feedback>
      </Form.Group>
    </Col>
    <Col md={6}>
      <Form.Group>
        <Form.Label>Street Address 2</Form.Label>
        <Form.Control name="address2" value={values.address2} onChange={setField} />
      </Form.Group>
    </Col>
    <Col md={4}>
      <Form.Group>
        <Form.Label>City/Island/State <Required /></Form.Label>
        <Form.Select name="city" value={values.city} onChange={setField} isInvalid={!!errors.city}>
          <option value="">--SELECT--</option>
          {BAHAMAS_ISLANDS.map((island) => <option key={island} value={island}>{island}</option>)}
        </Form.Select>
        <Form.Control.Feedback type="invalid">{errors.city}</Form.Control.Feedback>
      </Form.Group>
    </Col>
    <Col md={4}>
      <Form.Group>
        <Form.Label>PO Box</Form.Label>
        <Form.Control name="postalcode" value={values.postalcode} onChange={setField} />
      </Form.Group>
    </Col>
    <Col md={4}>
      <Form.Group>
        <Form.Label>Country</Form.Label>
        <Form.Control name="country" value={values.country} onChange={setField} />
      </Form.Group>
    </Col>
    <Col md={6}>
      <Form.Group>
        <Form.Label>Merchant Short Code</Form.Label>
        <Form.Control name="short_code" value={values.short_code} onChange={setField} placeholder="Only applicable for Biller and Charitable Institution merchants" />
      </Form.Group>
    </Col>
    <Col md={6}>
      <Form.Group>
        <Form.Label>Business License Number</Form.Label>
        <Form.Control name="business_license_number" value={values.business_license_number} onChange={setField} />
      </Form.Group>
    </Col>
    <Col md={4}>
      <Form.Group>
        <Form.Label>Billing Street Address</Form.Label>
        <Form.Control name="billing_address" value={values.billing_address} onChange={setField} />
      </Form.Group>
    </Col>
    <Col md={4}>
      <Form.Group>
        <Form.Label>Billing City/Island</Form.Label>
        <Form.Select name="billing_city" value={values.billing_city} onChange={setField}>
          <option value="">--SELECT--</option>
          {BAHAMAS_ISLANDS.map((island) => <option key={island} value={island}>{island}</option>)}
        </Form.Select>
      </Form.Group>
    </Col>
    <Col md={4}>
      <Form.Group>
        <Form.Label>Billing PO Box</Form.Label>
        <Form.Control name="billing_postalcode" value={values.billing_postalcode} onChange={setField} />
      </Form.Group>
    </Col>
    <Col md={4}>
      <Form.Group>
        <Form.Label>Phone Number</Form.Label>
        <Form.Control name="contactphone" value={values.contactphone} onChange={setField} isInvalid={!!errors.contactphone} placeholder="242-123-4567" />
        <Form.Control.Feedback type="invalid">{errors.contactphone}</Form.Control.Feedback>
      </Form.Group>
    </Col>
    <Col md={4}>
      <Form.Group>
        <Form.Label>Mobile Number <Required /></Form.Label>
        <Form.Control name="contactmobile" value={values.contactmobile} onChange={setField} isInvalid={!!errors.contactmobile} placeholder="242-123-4567" />
        <Form.Control.Feedback type="invalid">{errors.contactmobile}</Form.Control.Feedback>
      </Form.Group>
    </Col>
    <Col md={4}>
      <Form.Group>
        <Form.Label>FAX Number</Form.Label>
        <Form.Control name="contactfax" value={values.contactfax} onChange={setField} placeholder="242-123-4567" />
      </Form.Group>
    </Col>
    <Col md={6}>
      <Form.Group>
        <Form.Label>e-mail Address <Required /></Form.Label>
        <Form.Control type="email" name="contactemail" value={values.contactemail} onChange={setField} isInvalid={!!errors.contactemail} placeholder="name@example.com" />
        <Form.Control.Feedback type="invalid">{errors.contactemail}</Form.Control.Feedback>
      </Form.Group>
    </Col>
    <Col md={6}>
      <Form.Group>
        <Form.Label>Primary Contact <Required /></Form.Label>
        <Form.Control name="contactname" value={values.contactname} onChange={setField} isInvalid={!!errors.contactname} />
        <Form.Control.Feedback type="invalid">{errors.contactname}</Form.Control.Feedback>
      </Form.Group>
    </Col>
    <Col md={6}>
      <Form.Group>
        <Form.Label>Default Merchant Username {!isEdit && <Required />}</Form.Label>
        <Form.Control
          name="username"
          value={values.username}
          onChange={(e) => { setField(e); onUsernameChange(e.target.value) }}
          isInvalid={!!errors.username}
          readOnly={isEdit}
          plaintext={isEdit}
        />
        <Form.Control.Feedback type="invalid">{errors.username}</Form.Control.Feedback>
        {!isEdit && usernameStatus === 'checking' && <div className="small text-muted">Checking availability…</div>}
        {!isEdit && usernameStatus === 'available' && <div className="small text-success">Available</div>}
        {!isEdit && usernameStatus === 'taken' && !errors.username && <div className="small text-danger">Username is already taken.</div>}
      </Form.Group>
    </Col>
    <Col md={6}>
      <Form.Group>
        <Form.Label>
          Password{' '}
          {!isEdit && <Required />}
          {isEdit && <span className="text-muted small">(leave blank to keep current)</span>}
        </Form.Label>
        <Form.Control type="password" name="password" value={values.password} onChange={setField} isInvalid={!!errors.password} />
        <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
        <div className="small text-muted">At least 1 letter, 1 number, 6-20 characters.</div>
      </Form.Group>
    </Col>
  </Row>
)

// ── Field group: Fees, Commission & Revenue Share ──

const FeesFields = ({ values, errors, setField, setFee }) => {
  const feeErrorCount = Object.keys(errors).filter((key) => key.startsWith('fee_')).length

  const feeInput = (id, field, placeholder) => (
    <Form.Control
      size="sm"
      type="text"
      value={values.fees[id][field]}
      onChange={(e) => setFee(id, field, e.target.value)}
      placeholder={placeholder}
      isInvalid={!!errors[`fee_${field}_${id}`]}
    />
  )

  return (
    <>
      <Row className="g-3 mb-3">
        <Col md={4}>
          <Form.Group>
            <Form.Label>Revenue Share</Form.Label>
            <div className="input-group has-validation">
              <Form.Control name="revenue_value" value={values.revenue_value} onChange={setField} isInvalid={!!errors.revenue_value} placeholder="0.00" />
              <span className="input-group-text">%</span>
              <Form.Control.Feedback type="invalid">{errors.revenue_value}</Form.Control.Feedback>
            </div>
          </Form.Group>
        </Col>
      </Row>
      {feeErrorCount > 0 && (
        <Alert variant="danger" className="py-2">Some fee amounts aren&apos;t valid numbers — check the highlighted fields below.</Alert>
      )}
      <div className="fw-semibold text-uppercase fs-xs text-muted mb-2">Fees and Commissions</div>
      <div className="table-responsive">
        <Table size="sm" bordered className="align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th>Transaction Type</th>
              <th style={{ width: 130 }}>Transaction Fee</th>
              <th style={{ width: 130 }}>Commission/Trans</th>
              <th style={{ width: 140 }}>Charge To</th>
            </tr>
          </thead>
          <tbody>
            {MAIN_TRANSACTION_TYPES.map((type) => (
              <tr key={type.id}>
                <td>{type.label}</td>
                <td>{feeInput(type.id, 'trans_fee', '0.00')}</td>
                <td>{feeInput(type.id, 'comms_per_trans', '0.00')}</td>
                <td>
                  {type.allowChargeTo ? (
                    <Form.Select size="sm" value={values.fees[type.id].charge_to} onChange={(e) => setFee(type.id, 'charge_to', e.target.value)}>
                      {CHARGE_TO_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </Form.Select>
                  ) : <span className="text-muted">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </>
  )
}

// ── Field group: Settlement Information ──

const SettlementFields = ({ values, errors, setField, branchOptions, onBankChange, onBranchChange }) => (
  <Row className="g-3">
    <Col md={6}>
      <Form.Group>
        <Form.Label>Payment Mode <Required /></Form.Label>
        <Form.Select name="payment_mode" value={values.payment_mode} onChange={setField} isInvalid={!!errors.payment_mode}>
          {PAYMENT_MODES.map((mode) => <option key={mode.value} value={mode.value}>{mode.label}</option>)}
        </Form.Select>
      </Form.Group>
    </Col>
    <Col md={6}>
      <Form.Group>
        <Form.Label>Account Type <Required /></Form.Label>
        <Form.Select name="account_type" value={values.account_type} onChange={setField}>
          {ACCOUNT_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
        </Form.Select>
      </Form.Group>
    </Col>
    <Col md={6}>
      <Form.Group>
        <Form.Label>Bank Name <Required /></Form.Label>
        <Form.Select value={values.bank_name} onChange={(e) => onBankChange(e.target.value)} isInvalid={!!errors.bank_name}>
          <option value="">--SELECT--</option>
          {Object.keys(BANKS).map((bank) => <option key={bank} value={bank}>{bank}</option>)}
        </Form.Select>
        <Form.Control.Feedback type="invalid">{errors.bank_name}</Form.Control.Feedback>
      </Form.Group>
    </Col>
    <Col md={6}>
      <Form.Group>
        <Form.Label>Bank Branch <Required /></Form.Label>
        <Form.Select value={values.bank_branch} onChange={(e) => onBranchChange(e.target.value)} isInvalid={!!errors.bank_branch} disabled={!values.bank_name}>
          <option value="">--SELECT--</option>
          {branchOptions.map((branch) => <option key={branch} value={branch}>{branch}</option>)}
        </Form.Select>
        <Form.Control.Feedback type="invalid">{errors.bank_branch}</Form.Control.Feedback>
      </Form.Group>
    </Col>
    <Col md={4}>
      <Form.Group>
        <Form.Label>Account Name <Required /></Form.Label>
        <Form.Control name="account_name" value={values.account_name} onChange={setField} isInvalid={!!errors.account_name} />
        <Form.Control.Feedback type="invalid">{errors.account_name}</Form.Control.Feedback>
      </Form.Group>
    </Col>
    <Col md={4}>
      <Form.Group>
        <Form.Label>Account Number <Required /></Form.Label>
        <Form.Control name="account_number" value={values.account_number} onChange={setField} isInvalid={!!errors.account_number} />
        <Form.Control.Feedback type="invalid">{errors.account_number}</Form.Control.Feedback>
      </Form.Group>
    </Col>
    <Col md={4}>
      <Form.Group>
        <Form.Label>Routing Number</Form.Label>
        <Form.Control name="routing_number" value={values.routing_number} onChange={setField} readOnly />
      </Form.Group>
    </Col>
  </Row>
)

// ── Field group: Transaction Report Delivery ──

const DeliveryFields = ({ values, errors, setField }) => (
  <div className="table-responsive">
    <Table borderless className="align-middle mb-0">
      <thead>
        <tr className="text-uppercase fs-xs text-muted">
          <th>Deliver</th>
          <th>Frequency</th>
          <th>Recipients</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="align-top" style={{ width: 160 }}>
            <Form.Check type="checkbox" id="via_sms" name="via_sms" label="Via SMS" checked={values.via_sms} onChange={setField} />
          </td>
          <td className="align-top" style={{ width: 200 }}>
            <Form.Check type="checkbox" id="sms_daily" name="sms_daily" label="Daily" checked={values.sms_daily} onChange={setField} />
            <Form.Check type="checkbox" id="sms_weekly" name="sms_weekly" label="Weekly" checked={values.sms_weekly} onChange={setField} />
            <Form.Check type="checkbox" id="sms_monthly" name="sms_monthly" label="Monthly" checked={values.sms_monthly} onChange={setField} />
            {errors.sms_daily && <div className="small text-danger">{errors.sms_daily}</div>}
          </td>
          <td className="align-top">
            <Form.Control size="sm" className="mb-2" name="sms_primary" placeholder="Primary mobile number" value={values.sms_primary} onChange={setField} isInvalid={!!errors.sms_primary} />
            <Form.Control size="sm" name="sms_secondary" placeholder="Secondary mobile number" value={values.sms_secondary} onChange={setField} />
            {errors.sms_primary && <div className="small text-danger">{errors.sms_primary}</div>}
          </td>
        </tr>
        <tr>
          <td className="align-top">
            <Form.Check type="checkbox" id="via_email" name="via_email" label="Via e-mail" checked={values.via_email} onChange={setField} />
          </td>
          <td className="align-top">
            <Form.Check type="checkbox" id="email_daily" name="email_daily" label="Daily" checked={values.email_daily} onChange={setField} />
            <Form.Check type="checkbox" id="email_weekly" name="email_weekly" label="Weekly" checked={values.email_weekly} onChange={setField} />
            <Form.Check type="checkbox" id="email_monthly" name="email_monthly" label="Monthly" checked={values.email_monthly} onChange={setField} />
            {errors.email_daily && <div className="small text-danger">{errors.email_daily}</div>}
          </td>
          <td className="align-top">
            <Form.Control size="sm" className="mb-2" name="email_primary" placeholder="Primary e-mail" value={values.email_primary} onChange={setField} isInvalid={!!errors.email_primary} />
            <Form.Control size="sm" name="email_secondary" placeholder="Secondary e-mail" value={values.email_secondary} onChange={setField} />
            {errors.email_primary && <div className="small text-danger">{errors.email_primary}</div>}
          </td>
        </tr>
        <tr>
          <td className="align-top">
            <Form.Check type="checkbox" id="via_hardcopy" name="via_hardcopy" label="Via Hardcopy" checked={values.via_hardcopy} onChange={setField} />
          </td>
          <td className="align-top">
            <Form.Check type="checkbox" id="hardcopy_daily" name="hardcopy_daily" label="Daily" checked={values.hardcopy_daily} onChange={setField} />
            <Form.Check type="checkbox" id="hardcopy_weekly" name="hardcopy_weekly" label="Weekly" checked={values.hardcopy_weekly} onChange={setField} />
            <Form.Check type="checkbox" id="hardcopy_monthly" name="hardcopy_monthly" label="Monthly" checked={values.hardcopy_monthly} onChange={setField} />
            {errors.hardcopy_daily && <div className="small text-danger">{errors.hardcopy_daily}</div>}
          </td>
          <td className="align-top">
            <Form.Control as="textarea" rows={2} size="sm" name="hardcopy_address" placeholder="Complete delivery address" value={values.hardcopy_address} onChange={setField} isInvalid={!!errors.hardcopy_address} />
            {errors.hardcopy_address && <div className="small text-danger">{errors.hardcopy_address}</div>}
          </td>
        </tr>
      </tbody>
    </Table>
    {errors.via_sms && <Alert variant="danger" className="mt-2 py-2">{errors.via_sms}</Alert>}
  </div>
)

// ── Field group: Alert Settings ──

const AlertsFields = ({ values, errors, setField }) => (
  <>
    <p className="text-muted">You can set up an alert when the merchant balance hits a critical level.</p>
    <Row className="g-3 mb-3">
      <Col md={4}>
        <Form.Group>
          <Form.Label>Amount</Form.Label>
          <Form.Control name="alert_amount" value={values.alert_amount} onChange={setField} isInvalid={!!errors.alert_amount} />
          <Form.Control.Feedback type="invalid">{errors.alert_amount}</Form.Control.Feedback>
        </Form.Group>
      </Col>
    </Row>
    <div className="table-responsive">
      <Table borderless className="align-middle mb-0">
        <thead>
          <tr className="text-uppercase fs-xs text-muted">
            <th>Remind Me</th>
            <th>Every</th>
            <th>Recipients (comma separated)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="align-top" style={{ width: 160 }}>
              <Form.Check type="checkbox" id="alert_sms" name="alert_sms" label="SMS" checked={values.alert_sms} onChange={setField} />
            </td>
            <td className="align-top" style={{ width: 160 }}>
              <div className="input-group input-group-sm">
                <Form.Control name="alert_sms_hour" value={values.alert_sms_hour} onChange={setField} isInvalid={!!errors.alert_sms_hour} />
                <span className="input-group-text">hours</span>
              </div>
              {errors.alert_sms_hour && <div className="small text-danger">{errors.alert_sms_hour}</div>}
            </td>
            <td className="align-top">
              <Form.Control size="sm" name="alert_sms_recipients" value={values.alert_sms_recipients} onChange={setField} isInvalid={!!errors.alert_sms_recipients} />
              {errors.alert_sms_recipients && <div className="small text-danger">{errors.alert_sms_recipients}</div>}
            </td>
          </tr>
          <tr>
            <td className="align-top">
              <Form.Check type="checkbox" id="alert_email" name="alert_email" label="e-mail" checked={values.alert_email} onChange={setField} />
            </td>
            <td className="align-top">
              <div className="input-group input-group-sm">
                <Form.Control name="alert_email_hour" value={values.alert_email_hour} onChange={setField} isInvalid={!!errors.alert_email_hour} />
                <span className="input-group-text">hours</span>
              </div>
              {errors.alert_email_hour && <div className="small text-danger">{errors.alert_email_hour}</div>}
            </td>
            <td className="align-top">
              <Form.Control size="sm" name="alert_email_recipients" value={values.alert_email_recipients} onChange={setField} isInvalid={!!errors.alert_email_recipients} />
              {errors.alert_email_recipients && <div className="small text-danger">{errors.alert_email_recipients}</div>}
            </td>
          </tr>
        </tbody>
      </Table>
    </div>
  </>
)

// ── Field group: Other Info ──

const OtherFields = ({ values, setField }) => (
  <Row className="g-3">
    <Col md={8}>
      <Form.Group>
        <Form.Label>Store Locations (one location per line)</Form.Label>
        <Form.Control as="textarea" rows={5} name="locations" value={values.locations} onChange={setField} />
      </Form.Group>
    </Col>
  </Row>
)

// ── Wizard step wrappers (create mode only) ──

const StepBusiness = (props) => {
  const { nextStep } = useWizard()
  return (
    <div className="pt-4">
      <BusinessFields {...props} />
      <div className="d-flex justify-content-end mt-4">
        <Button variant="primary" onClick={() => { if (props.validateStep('business')) nextStep() }}>
          Next: Fees & Revenue Share <Icon icon="arrow-right" className="ms-1" />
        </Button>
      </div>
    </div>
  )
}

const StepFees = (props) => {
  const { nextStep, previousStep } = useWizard()
  return (
    <div className="pt-4">
      <FeesFields {...props} />
      <div className="d-flex justify-content-between mt-4">
        <Button variant="light" onClick={previousStep}><Icon icon="arrow-left" className="me-1" /> Back</Button>
        <Button variant="primary" onClick={() => { if (props.validateStep('fees')) nextStep() }}>
          Next: Settlement <Icon icon="arrow-right" className="ms-1" />
        </Button>
      </div>
    </div>
  )
}

const StepSettlement = (props) => {
  const { nextStep, previousStep } = useWizard()
  return (
    <div className="pt-4">
      <SettlementFields {...props} />
      <div className="d-flex justify-content-between mt-4">
        <Button variant="light" onClick={previousStep}><Icon icon="arrow-left" className="me-1" /> Back</Button>
        <Button variant="primary" onClick={() => { if (props.validateStep('settlement')) nextStep() }}>
          Next: Report Delivery <Icon icon="arrow-right" className="ms-1" />
        </Button>
      </div>
    </div>
  )
}

const StepDelivery = (props) => {
  const { nextStep, previousStep } = useWizard()
  return (
    <div className="pt-4">
      <DeliveryFields {...props} />
      <div className="d-flex justify-content-between mt-4">
        <Button variant="light" onClick={previousStep}><Icon icon="arrow-left" className="me-1" /> Back</Button>
        <Button variant="primary" onClick={() => { if (props.validateStep('delivery')) nextStep() }}>
          Next: Alert Settings <Icon icon="arrow-right" className="ms-1" />
        </Button>
      </div>
    </div>
  )
}

const StepAlerts = (props) => {
  const { nextStep, previousStep } = useWizard()
  return (
    <div className="pt-4">
      <AlertsFields {...props} />
      <div className="d-flex justify-content-between mt-4">
        <Button variant="light" onClick={previousStep}><Icon icon="arrow-left" className="me-1" /> Back</Button>
        <Button variant="primary" onClick={() => { if (props.validateStep('alerts')) nextStep() }}>
          Next: Other Info <Icon icon="arrow-right" className="ms-1" />
        </Button>
      </div>
    </div>
  )
}

const StepOther = (props) => {
  const { nextStep, previousStep } = useWizard()
  return (
    <div className="pt-4">
      <OtherFields {...props} />
      <div className="d-flex justify-content-between mt-4">
        <Button variant="light" onClick={previousStep}><Icon icon="arrow-left" className="me-1" /> Back</Button>
        <Button variant="primary" onClick={nextStep}>Next: Review &amp; Save <Icon icon="arrow-right" className="ms-1" /></Button>
      </div>
    </div>
  )
}

// ── Step 7: Review & Save (create mode only) ──

const ReviewRow = ({ icon, label, value }) => (
  <div className="d-flex gap-3 py-3 border-bottom">
    <span className="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary-subtle text-primary flex-shrink-0" style={{ width: 36, height: 36 }}>
      <Icon icon={icon} />
    </span>
    <div>
      <div className="text-uppercase text-muted small" style={{ fontSize: '0.7rem', letterSpacing: '0.04em' }}>{label}</div>
      <div className="fw-medium">{value}</div>
    </div>
  </div>
)

const StepReview = ({ values, onValidate, onSubmit, submitting, formError }) => {
  const { previousStep, goToStep } = useWizard()

  const feeCount = Object.values(values.fees).filter((fee) => String(fee.trans_fee ?? '').trim() !== '').length
  const deliveryMethods = [values.via_sms && 'SMS', values.via_email && 'e-mail', values.via_hardcopy && 'Hardcopy'].filter(Boolean)
  const alertMethods = [values.alert_sms && 'SMS', values.alert_email && 'e-mail'].filter(Boolean)
  const willAutoApprove = [5, 6].includes(Number(values.entity_type))

  const handleFileClick = () => {
    const validationErrors = onValidate()
    if (Object.keys(validationErrors).length > 0) {
      goToStep(findStepIndexForErrors(validationErrors, STEPS))
      return
    }
    onSubmit()
  }

  return (
    <div className="pt-4">
      {formError && <Alert variant="danger">{formError}</Alert>}
      <Card className="border">
        <Card.Body className="py-1 last-child-no-border">
          <ReviewRow icon="building-store" label="Merchant" value={`${values.merchant_id || '—'} — ${values.exact_legal_name || 'No legal name entered'} (${entityTypeLabel(values.entity_type)})${values.ezpay_merchant ? ' · Ezpay' : ''}`} />
          <ReviewRow icon="address-book" label="Contact" value={`${values.contactname || '—'} · ${values.contactmobile || '—'} · ${values.contactemail || '—'}`} />
          <ReviewRow icon="building-bank" label="Settlement" value={values.bank_name ? `${values.bank_name} — ${values.bank_branch || '—'} · Acct ${values.account_number || '—'}` : 'Not specified'} />
          <ReviewRow icon="report" label="Report delivery" value={deliveryMethods.length ? deliveryMethods.join(', ') : 'None selected'} />
          <ReviewRow icon="bell" label="Alerts" value={alertMethods.length ? alertMethods.join(', ') : 'None configured'} />
          <ReviewRow icon="wallet" label="Fee schedule" value={feeCount ? `${feeCount} transaction ${feeCount === 1 ? 'type' : 'types'} priced` : 'No fees configured yet'} />
        </Card.Body>
      </Card>
      <p className="small text-muted mt-3 mb-0">
        Registering will create this merchant with registration status <strong>{willAutoApprove ? 'Approved' : 'Pending'}</strong> and a portal login using the username above.
      </p>
      <div className="d-flex justify-content-between mt-4">
        <Button variant="light" onClick={previousStep} disabled={submitting}><Icon icon="arrow-left" className="me-1" /> Back</Button>
        <Button variant="success" onClick={handleFileClick} disabled={submitting}>
          <Icon icon="check" className="me-1" /> {submitting ? 'Saving…' : 'Save Registration'}
        </Button>
      </div>
    </div>
  )
}

// ── Edit mode: free-navigation tabs, no forced order ──

const EditMerchantTabs = (props) => {
  const {
    formError, submitting, onCancel, onSubmit, validateStep, editable = true, embedded = false,
  } = props
  const [activeTab, setActiveTab] = useState('business')

  // Editing is free-navigation, not a linear wizard: only the fields on the
  // tab you're currently looking at gate Save. Other tabs may still carry
  // stale/incomplete legacy data, but that's not this edit's concern.
  const handleSave = () => {
    if (!validateStep(activeTab)) return
    onSubmit()
  }

  return (
    <Card className={embedded ? 'border-0 shadow-none mb-0' : undefined}>
      {!embedded && (
        <Card.Header className="border-0 pb-0">
          <h5 className="mb-1">Edit Merchant</h5>
          <p className="text-muted small mb-3">Jump to any tab and update the fields you need — changes save together.</p>
        </Card.Header>
      )}
      <Card.Header className={embedded ? 'border-0 px-0 pt-0 pb-0 bg-body' : 'px-3 pt-0 pb-0 bg-body'}>
        <EditTabsHeader activeTab={activeTab} onSelect={setActiveTab} />
      </Card.Header>
      <Card.Body className={embedded ? 'px-0' : undefined}>
        {formError && <Alert variant="danger">{formError}</Alert>}
        <fieldset disabled={!editable} className="border-0 p-0 m-0">
          <div className="pt-2">
            {activeTab === 'business' && <BusinessFields {...props} />}
            {activeTab === 'fees' && <FeesFields {...props} />}
            {activeTab === 'settlement' && <SettlementFields {...props} />}
            {activeTab === 'delivery' && <DeliveryFields {...props} />}
            {activeTab === 'alerts' && <AlertsFields {...props} />}
            {activeTab === 'other' && <OtherFields {...props} />}
          </div>
        </fieldset>
      </Card.Body>
      {editable && (
        <Card.Footer className={embedded ? 'border-0 px-0 d-flex justify-content-between align-items-center' : 'd-flex justify-content-between align-items-center'}>
          {!embedded && <Button variant="light" onClick={onCancel} disabled={submitting}>Cancel</Button>}
          <Button variant="primary" onClick={handleSave} disabled={submitting} className={embedded ? 'ms-auto' : undefined}>
            <Icon icon="check" className="me-1" /> {submitting ? 'Saving…' : 'Save Changes'}
          </Button>
        </Card.Footer>
      )}
    </Card>
  )
}

// ── Root component ──

const MerchantRegistrationWizard = ({ onCancel, onSaved, merchantId, editable = true, embedded = false }) => {
  const isEdit = Boolean(merchantId)
  const [values, setValues] = useState(empty)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [idStatus, setIdStatus] = useState(null) // 'checking' | 'available' | 'taken'
  const [usernameStatus, setUsernameStatus] = useState(null)
  const [loadingInitial, setLoadingInitial] = useState(isEdit)
  const [loadError, setLoadError] = useState('')
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoError, setLogoError] = useState('')
  const idCheckTimer = useRef(null)
  const usernameCheckTimer = useRef(null)

  useEffect(() => {
    if (!merchantId) return
    let active = true
    setLoadingInitial(true)
    ApiService.getMerchant(merchantId)
      .then((data) => {
        if (!active) return
        setValues((prev) => ({
          ...prev,
          ...data,
          password: '',
          fees: { ...prev.fees, ...(data.fees || {}) },
        }))
      })
      .catch((err) => {
        if (active) setLoadError(err?.message || 'Failed to load merchant.')
      })
      .finally(() => {
        if (active) setLoadingInitial(false)
      })
    return () => { active = false }
  }, [merchantId])

  const set = (name, value) => setValues((prev) => ({ ...prev, [name]: value }))
  const setField = (e) => {
    const { name, type, value, checked } = e.target
    set(name, type === 'checkbox' ? checked : value)
  }
  const setFee = (id, field, value) => {
    setValues((prev) => ({
      ...prev,
      fees: { ...prev.fees, [id]: { ...prev.fees[id], [field]: value } },
    }))
  }

  const handleLogoSelect = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setLogoError('')
    setLogoUploading(true)
    try {
      const result = await ApiService.uploadMerchantLogo(file)
      setValues((prev) => ({ ...prev, logo: result?.url || '', clear_logo: false }))
    } catch (err) {
      setLogoError(err?.message || 'Failed to upload logo.')
    } finally {
      setLogoUploading(false)
    }
  }

  const handleLogoClear = () => {
    setValues((prev) => ({ ...prev, logo: '', clear_logo: true }))
    setLogoError('')
  }

  const branchOptions = useMemo(() => (values.bank_name ? Object.keys(BANKS[values.bank_name] || {}) : []), [values.bank_name])

  const handleBankChange = (bankName) => {
    setValues((prev) => ({
      ...prev,
      bank_name: bankName,
      bank_branch: '',
      routing_number: '',
      account_name: bankName === 'INTERNAL SETTLEMENT' ? 'INTERNAL SETTLEMENT' : '',
      account_number: bankName === 'INTERNAL SETTLEMENT' ? '0000000000' : '',
    }))
  }

  const handleBranchChange = (branchName) => {
    const routing = BANKS[values.bank_name]?.[branchName] || ''
    setValues((prev) => ({ ...prev, bank_branch: branchName, routing_number: routing }))
  }

  const checkMerchantId = useCallback((clientId) => {
    clearTimeout(idCheckTimer.current)
    if (!clientId.trim()) { setIdStatus(null); return }
    setIdStatus('checking')
    idCheckTimer.current = setTimeout(async () => {
      try {
        const res = await ApiService.checkMerchantId(clientId.trim())
        setIdStatus(res?.available ? 'available' : 'taken')
      } catch {
        setIdStatus(null)
      }
    }, 400)
  }, [])

  const checkUsername = useCallback((username) => {
    clearTimeout(usernameCheckTimer.current)
    if (!username.trim()) { setUsernameStatus(null); return }
    setUsernameStatus('checking')
    usernameCheckTimer.current = setTimeout(async () => {
      try {
        const res = await ApiService.checkMerchantUsername(username.trim())
        setUsernameStatus(res?.available ? 'available' : 'taken')
      } catch {
        setUsernameStatus(null)
      }
    }, 400)
  }, [])

  const validate = () => {
    const nextErrors = {}
    const required = {
      ...(isEdit ? {} : { merchant_id: 'Merchant ID is required.', username: 'Default merchant username is required.', password: 'Password is required.' }),
      exact_legal_name: 'Exact legal name is required.',
      entity_type: 'Entity type is required.',
      address1: 'Street address 1 is required.',
      city: 'City/Island/State is required.',
      contactmobile: 'Mobile number is required.',
      contactemail: 'e-mail address is required.',
      contactname: 'Primary contact is required.',
      payment_mode: 'Payment mode is required.',
      bank_name: 'Bank name is required.',
      bank_branch: 'Bank branch is required.',
      account_name: 'Account name is required.',
      account_number: 'Account number is required.',
    }

    Object.entries(required).forEach(([field, message]) => {
      if (!String(values[field] ?? '').trim()) nextErrors[field] = message
    })

    if (values.password && !/((?=.*\d)(?=.*[a-zA-Z]).{6,20})/.test(values.password)) {
      nextErrors.password = 'Password must contain at least 1 letter, 1 number, and be 6-20 characters long.'
    }

    if (values.contactemail && !EMAIL_PATTERN.test(values.contactemail.trim())) {
      nextErrors.contactemail = 'Enter a valid e-mail address.'
    }
    if (values.contactmobile && !BAHAMAS_PHONE_PATTERN.test(values.contactmobile.trim())) {
      nextErrors.contactmobile = 'Enter a valid Bahamas mobile number, e.g. 242-123-4567.'
    }
    if (values.contactphone && !BAHAMAS_PHONE_PATTERN.test(values.contactphone.trim())) {
      nextErrors.contactphone = 'Enter a valid Bahamas phone number, e.g. 242-123-4567.'
    }

    if (!isEdit) {
      if (idStatus === 'taken') nextErrors.merchant_id = 'Merchant ID already exists.'
      if (usernameStatus === 'taken') nextErrors.username = 'Username is already taken.'
    }

    if (values.revenue_value && !AMOUNT_PATTERN.test(String(values.revenue_value).trim())) {
      nextErrors.revenue_value = 'Enter a valid amount (e.g. 2.5), up to 2 decimal places.'
    }
    Object.entries(values.fees).forEach(([id, fee]) => {
      if (fee.trans_fee && !AMOUNT_PATTERN.test(String(fee.trans_fee).trim())) {
        nextErrors[`fee_trans_fee_${id}`] = 'Enter a valid amount.'
      }
      if (fee.comms_per_trans && !AMOUNT_PATTERN.test(String(fee.comms_per_trans).trim())) {
        nextErrors[`fee_comms_per_trans_${id}`] = 'Enter a valid amount.'
      }
    })

    if (!values.via_sms && !values.via_email && !values.via_hardcopy) {
      nextErrors.via_sms = 'Select at least one report delivery method.'
    }
    if (values.via_sms) {
      if (!values.sms_daily && !values.sms_weekly && !values.sms_monthly) nextErrors.sms_daily = 'Select the SMS delivery frequency.'
      if (!values.sms_primary.trim()) nextErrors.sms_primary = 'Primary SMS recipient is required.'
    }
    if (values.via_email) {
      if (!values.email_daily && !values.email_weekly && !values.email_monthly) nextErrors.email_daily = 'Select the e-mail delivery frequency.'
      if (!values.email_primary.trim()) nextErrors.email_primary = 'Primary e-mail recipient is required.'
    }
    if (values.via_hardcopy) {
      if (!values.hardcopy_daily && !values.hardcopy_weekly && !values.hardcopy_monthly) nextErrors.hardcopy_daily = 'Select the hardcopy delivery frequency.'
      if (!values.hardcopy_address.trim()) nextErrors.hardcopy_address = 'Hardcopy delivery address is required.'
    }

    if ((values.alert_sms || values.alert_email) && !String(values.alert_amount).trim()) {
      nextErrors.alert_amount = 'Specify the lowest amount to reach before sending alerts.'
    }
    if (values.alert_sms) {
      if (!String(values.alert_sms_hour).trim()) nextErrors.alert_sms_hour = 'Specify the SMS alert frequency (hours).'
      if (!values.alert_sms_recipients.trim()) nextErrors.alert_sms_recipients = 'Specify mobile number(s) for SMS alerts.'
    }
    if (values.alert_email) {
      if (!String(values.alert_email_hour).trim()) nextErrors.alert_email_hour = 'Specify number of hours for e-mail alert frequency.'
      if (!values.alert_email_recipients.trim()) nextErrors.alert_email_recipients = 'Specify e-mail address(es) for e-mail alerts.'
    }

    return nextErrors
  }

  const validateStep = (stepKey) => {
    const validationErrors = validate()
    setErrors(validationErrors)
    const hasStepError = Object.keys(validationErrors).some((field) => fieldBelongsToStep(field, stepKey))
    setFormError(hasStepError ? 'Please fix the highlighted fields before continuing.' : '')
    return !hasStepError
  }

  const runFullValidation = () => {
    const validationErrors = validate()
    setErrors(validationErrors)
    setFormError(Object.keys(validationErrors).length ? 'Please fix the highlighted fields before saving.' : '')
    return validationErrors
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const payload = {
        ...values,
        fees: Object.fromEntries(
          Object.entries(values.fees).filter(([, fee]) => String(fee.trans_fee ?? '').trim() !== '')
        ),
      }
      if (isEdit && !payload.password) delete payload.password

      const result = isEdit
        ? await ApiService.updateMerchant(merchantId, payload)
        : await ApiService.registerMerchant(payload)
      onSaved?.(result)
    } catch (err) {
      if (err?.errors) {
        const apiErrors = Object.fromEntries(Object.entries(err.errors).map(([key, msgs]) => [key, Array.isArray(msgs) ? msgs[0] : msgs]))
        setErrors(apiErrors)
      }
      setFormError(err?.message || `Failed to ${isEdit ? 'update' : 'register'} merchant.`)
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingInitial) {
    return <Card><Card.Body><LoadingState /></Card.Body></Card>
  }

  if (loadError) {
    return (
      <Card>
        <Card.Body>
          <Alert variant="danger">{loadError}</Alert>
          <Button variant="light" onClick={onCancel}>Back</Button>
        </Card.Body>
      </Card>
    )
  }

  const sharedFieldProps = {
    values,
    errors,
    setField,
    setFee,
    isEdit,
    idStatus,
    usernameStatus,
    onIdChange: checkMerchantId,
    onUsernameChange: checkUsername,
    logoUploading,
    logoError,
    onLogoSelect: handleLogoSelect,
    onLogoClear: handleLogoClear,
    branchOptions,
    onBankChange: handleBankChange,
    onBranchChange: handleBranchChange,
    validateStep,
  }

  if (isEdit) {
    return (
      <EditMerchantTabs
        {...sharedFieldProps}
        formError={formError}
        submitting={submitting}
        onCancel={onCancel}
        onSubmit={handleSubmit}
        editable={editable}
        embedded={embedded}
      />
    )
  }

  return (
    <Card>
      <Card.Header className="border-0 pb-0">
        <h5 className="mb-1">Register a New Merchant</h5>
        <p className="text-muted small mb-3">Walk through business info, fees, settlement, and delivery preferences before saving.</p>
      </Card.Header>
      <Card.Body>
        <div className="ins-wizard" data-wizard>
          <Wizard header={<WizardHeader />}>
            <StepBusiness {...sharedFieldProps} />
            <StepFees {...sharedFieldProps} />
            <StepSettlement {...sharedFieldProps} />
            <StepDelivery {...sharedFieldProps} />
            <StepAlerts {...sharedFieldProps} />
            <StepOther {...sharedFieldProps} />
            <StepReview
              values={values}
              onValidate={runFullValidation}
              onSubmit={handleSubmit}
              submitting={submitting}
              formError={formError}
            />
          </Wizard>
        </div>
      </Card.Body>
    </Card>
  )
}

export default MerchantRegistrationWizard
