import { useProjectSettingsContext } from '@/context/useProjectSettingsContext'
import auth from '@/assets/images/auth.jpg'
import CustomerAuthLogo from './CustomerAuthLogo'
import { Card, CardBody, Col, Row } from 'react-bootstrap'

const TwoFactorShell = ({ children }) => {
  const { settings, loading } = useProjectSettingsContext()

  if (loading) return null

  return (
    <div className="auth-box p-0 w-100">
      <Row className="w-100 g-0">
        <Col>
          <div
            className="h-100 position-relative card-side-img rounded-0 overflow-hidden"
            style={{
              backgroundImage: `url("${auth}")`,
            }}
          >
            <div className="p-4 card-img-overlay d-flex align-items-end justify-content-center" />
          </div>
        </Col>
        <div className="col-md-auto">
          <Card className="auth-box-form border-0 mb-0">
            <CardBody className="min-vh-100 d-flex flex-column justify-content-center">
              <div className="auth-brand mb-0 text-center">
                <CustomerAuthLogo />
              </div>
              <div className="mt-auto text-center">
                <h4 className="fw-bold">Two-Factor Authentication</h4>
                <p className="text-muted auth-sub-text mx-auto">Secure your customer account with an extra verification step.</p>
                {children}
              </div>
              <p className="text-center text-muted mt-auto mb-0">
                © {settings.year}&nbsp;
                {settings.name} — by&nbsp;
                <span className="fw-bold">{settings.author}</span>
              </p>
            </CardBody>
          </Card>
        </div>
      </Row>
    </div>
  )
}

export default TwoFactorShell
