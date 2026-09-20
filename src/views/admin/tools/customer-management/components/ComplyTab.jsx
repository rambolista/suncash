import { useEffect, useState } from 'react'
import { Alert, Card, Col, Row } from 'react-bootstrap'
import LoadingState from '@/components/LoadingState'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'

const Field = ({ label, value }) => (
  <Col md={6} className="mb-2">
    <div className="text-muted small">{label}</div>
    <div className="fw-semibold">{value ?? '—'}</div>
  </Col>
)

const ComplyTab = ({ customerId }) => {
  const { showNotification } = useNotificationContext()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    setLoading(true)
    ApiService.getCustomerManagementComplyProfile(customerId)
      .then(setProfile)
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load ComplyAdvantage profile.', variant: 'danger' }))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId])

  if (loading) return <LoadingState message="Loading ComplyAdvantage profile..." />

  const stepDetails = profile?.step_details || {}
  const screeningResult = stepDetails['customer-screening']?.step_output?.screening_result

  return (
    <Card>
      <Card.Header><h5 className="mb-0">ComplyAdvantage Profile</h5></Card.Header>
      <Card.Body>
        {profile?.message && <Alert variant={profile.configured ? 'danger' : 'warning'} className="py-2 small">{profile.message}</Alert>}

        <Row>
          <Field label="First Name" value={profile?.first_name} />
          <Field label="Middle Name" value={profile?.middle_name} />
          <Field label="Last Name" value={profile?.last_name} />
          <Field label="Workflow Status" value={profile?.status} />
          <Field label="Workflow ID" value={profile?.workflow_instance_identifier} />
          {screeningResult && (
            <Col md={6} className="mb-2">
              <div className="text-muted small">Screening Result</div>
              <span className={`badge badge-label ${screeningResult === 'HAS_PROFILES' ? 'bg-danger-subtle text-danger' : 'bg-success-subtle text-success'}`}>
                {screeningResult}
              </span>
            </Col>
          )}
        </Row>

        {Object.keys(stepDetails).length > 0 && (
          <>
            <hr />
            <h6>Workflow Steps</h6>
            <Row>
              {Object.entries(stepDetails).map(([step, info]) => (
                <Field key={step} label={step} value={info?.status} />
              ))}
            </Row>
          </>
        )}
      </Card.Body>
    </Card>
  )
}

export default ComplyTab
