import { MAIN_TRANSACTION_TYPES } from '../../data/merchantReferenceData'

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const BAHAMAS_PHONE_PATTERN = /^(\+?1[-.\s]?)?\(?242\)?[-.\s]?\d{3}[-.\s]?\d{4}$/
export const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/

// Phone/mobile/fax were stored as whatever raw string the user happened to type
// (with or without dashes, spaces, a leading +1, parentheses…), so editing an
// existing merchant could show any of those shapes back. This normalizes any
// recognizable Bahamas number (a leading 1 country code is optional and
// stripped) to one consistent "242-123-4567" display/storage format; anything
// that isn't a clean 10-digit Bahamas number is left untouched so the format
// validation below can flag it instead of silently mangling it.
export const formatBahamasPhone = (value) => {
  const trimmed = String(value ?? '').trim()
  if (!trimmed) return trimmed

  const digits = trimmed.replace(/\D/g, '')
  const local = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits
  if (local.length !== 10) return trimmed

  return `${local.slice(0, 3)}-${local.slice(3, 6)}-${local.slice(6)}`
}

// Live ###-###-#### mask applied as the admin types, rather than waiting
// until they leave the field — always rebuilt from the raw digits so
// backspacing/pasting anywhere in the value self-heals to the right dash
// positions instead of leaving stray/missing dashes.
export const maskPhoneInput = (value) => {
  let digits = String(value ?? '').replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('1')) digits = digits.slice(1)
  digits = digits.slice(0, 10)

  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
}

export const Required = () => <span className="text-danger">*</span>

export const STEPS = [
  { key: 'business', label: 'Business Information', hint: 'Identity & contact', icon: 'building' },
  { key: 'fees', label: 'Fees & Revenue Share', hint: 'Commission schedule', icon: 'wallet' },
  { key: 'settlement', label: 'Settlement', hint: 'Bank account', icon: 'building-bank' },
  { key: 'delivery', label: 'Report Delivery', hint: 'How reports are sent', icon: 'report' },
  { key: 'alerts', label: 'Alert Settings', hint: 'Balance notifications', icon: 'bell' },
  { key: 'other', label: 'Other Info', hint: 'Store locations', icon: 'notes' },
  { key: 'review', label: 'Review & Save', hint: 'Confirm & submit', icon: 'clipboard-check' },
]

export const EDIT_TABS = STEPS.filter((step) => step.key !== 'review')

const initialFees = MAIN_TRANSACTION_TYPES.reduce((acc, type) => {
  acc[type.id] = { trans_fee: '', comms_per_trans: '', charge_to: '' }
  return acc
}, {})

export const empty = {
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
  business: ['merchant_id', 'exact_legal_name', 'entity_type', 'address1', 'city', 'contactmobile', 'contactphone', 'contactfax', 'contactemail', 'contactname', 'username', 'password'],
  settlement: ['payment_mode', 'bank_name', 'bank_branch', 'account_name', 'account_number'],
  delivery: ['via_sms', 'via_email', 'via_hardcopy', 'sms_daily', 'sms_weekly', 'sms_monthly', 'sms_primary', 'email_daily', 'email_weekly', 'email_monthly', 'email_primary', 'hardcopy_daily', 'hardcopy_weekly', 'hardcopy_monthly', 'hardcopy_address'],
  alerts: ['alert_amount', 'alert_sms_hour', 'alert_sms_recipients', 'alert_email_hour', 'alert_email_recipients'],
}

// Fee-row errors use dynamic keys (fee_trans_fee_<id> / fee_comms_per_trans_<id>),
// so step membership can't be a plain list lookup for the 'fees' step.
export const fieldBelongsToStep = (field, stepKey) => {
  if (stepKey === 'fees') return field === 'revenue_value' || field.startsWith('fee_')
  return (stepFieldMap[stepKey] || []).includes(field)
}

export const findStepIndexForErrors = (validationErrors, steps) => {
  const fields = Object.keys(validationErrors)
  const index = steps.findIndex((step) => fields.some((field) => fieldBelongsToStep(field, step.key)))
  return index >= 0 ? index : 0
}
