import OTPInput from '@/components/OTPInput'
import { useNotificationContext } from '@/context/useNotificationContext'
import { useAuth } from '@/hooks/useAuth'
import ApiService from '@/services/ApiService'
import { getToken } from '@/services/HttpService'
import { getTwoFactorChallenge } from '@/utils/twoFactorChallenge'
import { useEffect, useState } from 'react'
import { Alert, Button, Form, Spinner } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router'
import QRCode from 'qrcode'

const emptyCode = () => Array(6).fill('')
const errorMessage = (error, field) =>
  error?.errors?.[field]?.[0] ?? error?.message ?? 'The request could not be completed.'

const TwoFactorForm = () => {
  const navigate = useNavigate()
  const { verifyTwoFactor, loading: verifying, error: verificationError } = useAuth()
  const { showNotification } = useNotificationContext()
  const loginChallenge = getTwoFactorChallenge()
  const authenticated = Boolean(getToken())
  const [status, setStatus] = useState(null)
  const [loadingStatus, setLoadingStatus] = useState(authenticated)
  const [submitting, setSubmitting] = useState(false)
  const [method, setMethod] = useState('email')
  const [currentPassword, setCurrentPassword] = useState('')
  const [setup, setSetup] = useState(null)
  const [code, setCode] = useState(emptyCode)
  const [qrCodeUrl, setQrCodeUrl] = useState('')

  useEffect(() => {
    if (loginChallenge || !authenticated) return

    ApiService.getTwoFactorStatus()
      .then(setStatus)
      .catch((error) => showNotification({
        title: 'Unable to load security settings',
        message: errorMessage(error),
        variant: 'danger',
      }))
      .finally(() => setLoadingStatus(false))
  }, [authenticated, loginChallenge?.token, showNotification])

  useEffect(() => {
    if (!setup?.otpauth_uri) {
      setQrCodeUrl('')
      return
    }

    let active = true
    QRCode.toDataURL(setup.otpauth_uri, {
      width: 240,
      margin: 2,
      errorCorrectionLevel: 'M',
    })
      .then((url) => {
        if (active) setQrCodeUrl(url)
      })
      .catch((error) => {
        if (!active) return
        setQrCodeUrl('')
        showNotification({
          title: 'QR code failed',
          message: error?.message ?? 'Unable to generate the authenticator QR code.',
          variant: 'danger',
        })
      })

    return () => {
      active = false
    }
  }, [setup?.otpauth_uri, showNotification])

  const handleLoginVerification = async (event) => {
    event.preventDefault()
    await verifyTwoFactor(code.join(''))
  }

  const handleSetup = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    try {
      const response = await ApiService.setupTwoFactor(method, currentPassword)
      setSetup(response)
      setCode(emptyCode())
      setCurrentPassword('')
      showNotification({
        title: 'Verification required',
        message: method === 'email' ? 'A verification code was sent to your email.' : 'Add the secret to your authenticator app.',
        variant: 'success',
      })
    } catch (error) {
      showNotification({ title: 'Setup failed', message: errorMessage(error, 'current_password'), variant: 'danger' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleConfirm = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    try {
      const response = await ApiService.confirmTwoFactor(setup.challenge, code.join(''))
      setStatus({ enabled: true, method: response.method, enabled_at: new Date().toISOString() })
      setSetup(null)
      setCode(emptyCode())
      showNotification({ title: 'Security updated', message: response.message, variant: 'success' })
      navigate('/', { replace: true })
    } catch (error) {
      showNotification({ title: 'Invalid code', message: errorMessage(error, error?.errors?.code ? 'code' : 'challenge'), variant: 'danger' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDisable = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    try {
      const response = await ApiService.disableTwoFactor(currentPassword)
      setStatus({ enabled: false, method: null, enabled_at: null })
      setCurrentPassword('')
      showNotification({ title: 'Security updated', message: response.message, variant: 'success' })
      navigate('/', { replace: true })
    } catch (error) {
      showNotification({ title: 'Unable to disable 2FA', message: errorMessage(error, 'current_password'), variant: 'danger' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loginChallenge) {
    return (
      <Form onSubmit={handleLoginVerification}>
        <p className="text-muted">
          Enter the code from your {loginChallenge.method === 'email' ? 'email' : 'authenticator app'}.
        </p>
        <OTPInput code={code} setCode={setCode} label="Enter your 6-digit code" />
        {verificationError && <p className="text-danger mt-2">{verificationError}</p>}
        <div className="d-grid mt-3">
          <Button type="submit" disabled={verifying || code.join('').length !== 6}>
            {verifying ? 'Verifying...' : 'Verify and Continue'}
          </Button>
        </div>
      </Form>
    )
  }

  if (!authenticated) {
    return (
      <Alert variant="warning">
        Your verification request expired. <Link to="/auth/sign-in">Sign in again</Link>.
      </Alert>
    )
  }

  if (loadingStatus) {
    return <div className="text-center"><Spinner animation="border" size="sm" /></div>
  }

  if (setup) {
    return (
      <Form onSubmit={handleConfirm}>
        {setup.method === 'authenticator' && (
          <Alert variant="info">
            <strong>Scan with your authenticator app</strong>
            {qrCodeUrl && (
              <div className="text-center my-3">
                <img
                  src={qrCodeUrl}
                  alt="Authenticator setup QR code"
                  width={240}
                  height={240}
                  className="img-fluid bg-white rounded"
                />
              </div>
            )}
            <small className="d-block mb-1">If you cannot scan the QR code, enter this secret manually:</small>
            <Form.Control className="my-2" value={setup.secret} readOnly />
            <small>Then enter the six-digit code generated by your app below.</small>
          </Alert>
        )}
        <OTPInput code={code} setCode={setCode} label="Verification code" />
        <div className="d-grid gap-2 mt-3">
          <Button type="submit" disabled={submitting || code.join('').length !== 6}>
            {submitting ? 'Confirming...' : 'Enable Two-Factor Authentication'}
          </Button>
          <Button variant="link" type="button" onClick={() => setSetup(null)}>Cancel</Button>
          <Button variant="outline-secondary" type="button" onClick={() => navigate('/')}>
            Back to Application
          </Button>
        </div>
      </Form>
    )
  }

  if (status?.enabled) {
    return (
      <Form onSubmit={handleDisable}>
        <Alert variant="success">
          Two-factor authentication is enabled using <strong>{status.method}</strong>.
        </Alert>
        <Form.Group className="mb-3">
          <Form.Label>Current password</Form.Label>
          <Form.Control type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required />
        </Form.Group>
        <div className="d-grid gap-2">
          <Button variant="danger" type="submit" disabled={submitting}>
            {submitting ? 'Disabling...' : 'Disable Two-Factor Authentication'}
          </Button>
          <Button variant="outline-secondary" type="button" onClick={() => navigate('/')}>
            Back to Application
          </Button>
        </div>
      </Form>
    )
  }

  return (
    <Form onSubmit={handleSetup}>
      <Form.Group className="mb-3">
        <Form.Label>Verification method</Form.Label>
        <Form.Select value={method} onChange={(event) => setMethod(event.target.value)}>
          <option value="email">Email code</option>
          <option value="authenticator">Authenticator app</option>
        </Form.Select>
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Current password</Form.Label>
        <Form.Control type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required />
      </Form.Group>
      <div className="d-grid gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Starting setup...' : 'Set Up Two-Factor Authentication'}
        </Button>
        <Button variant="outline-secondary" type="button" onClick={() => navigate('/')}>
          Back to Application
        </Button>
      </div>
    </Form>
  )
}

export default TwoFactorForm
