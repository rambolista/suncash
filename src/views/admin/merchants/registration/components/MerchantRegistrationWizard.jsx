import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Button, Card } from 'react-bootstrap'
import { Wizard } from 'react-use-wizard'
import ApiService from '@/services/ApiService'
import LoadingState from '@/components/LoadingState'
import { BANKS } from '../data/merchantReferenceData'
import { StepBusiness } from './steps/BusinessInfoStep'
import { StepFees } from './steps/FeesStep'
import { StepSettlement } from './steps/SettlementStep'
import { StepDelivery } from './steps/DeliveryStep'
import { StepAlerts } from './steps/AlertsStep'
import { StepOther } from './steps/OtherInfoStep'
import { StepReview } from './steps/ReviewStep'
import { WizardHeader } from './steps/WizardHeader'
import { EditMerchantTabs } from './steps/EditMerchantTabs'
import {
  AMOUNT_PATTERN,
  BAHAMAS_PHONE_PATTERN,
  EMAIL_PATTERN,
  empty,
  fieldBelongsToStep,
  formatBahamasPhone,
  maskPhoneInput,
} from './steps/wizardConstants'

const MerchantRegistrationWizard = ({ onCancel, onSaved, merchantId }) => {
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
          contactphone: formatBahamasPhone(data.contactphone),
          contactmobile: formatBahamasPhone(data.contactmobile),
          contactfax: formatBahamasPhone(data.contactfax),
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

  // Reformats a phone/mobile/fax field to the canonical "242-123-4567" shape
  // once the admin leaves it, rather than fighting their typing on every
  // keystroke — leaves anything that isn't a recognizable 10-digit Bahamas
  // number alone so the format validation can flag it instead of silently
  // mangling it.
  const handlePhoneChange = (e) => {
    const { name, value } = e.target
    set(name, maskPhoneInput(value))
  }

  const handlePhoneBlur = (e) => {
    const { name, value } = e.target
    const formatted = formatBahamasPhone(value)
    if (formatted !== value) set(name, formatted)
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
    if (values.contactfax && !BAHAMAS_PHONE_PATTERN.test(values.contactfax.trim())) {
      nextErrors.contactfax = 'Enter a valid Bahamas fax number, e.g. 242-123-4567.'
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
        contactphone: formatBahamasPhone(values.contactphone),
        contactmobile: formatBahamasPhone(values.contactmobile),
        contactfax: formatBahamasPhone(values.contactfax),
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
    onPhoneChange: handlePhoneChange,
    onPhoneBlur: handlePhoneBlur,
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
      />
    )
  }

  return (
    <Card>
      <Card.Header className="border-0 pb-0">
        <div>
          <h5 className="mb-1">Register a New Merchant</h5>
          <p className="text-muted small mb-3">Walk through business info, fees, settlement, and delivery preferences before saving.</p>
        </div>
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
