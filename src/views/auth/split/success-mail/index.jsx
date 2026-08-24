import auth from '@/assets/images/auth.jpg'
import checkmark from '@/assets/images/checkmark.png'
import AuthLogo from '@/components/AuthLogo'
import { currentYear, META_DATA } from '@/config/constants'
import { Button, Card, CardBody, Col, Row } from 'react-bootstrap'
import { Link } from 'react-router'
const Page = () => {
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
        <div className="col-xl-auto">
          <Card className="auth-box-form border-0 mb-0">
            <CardBody className="min-vh-100 d-flex flex-column justify-content-center">
              <div className="auth-brand mb-0 text-center">
                <AuthLogo />
              </div>
              <div className="mt-auto text-center">
                <div className="mb-4">
                  <div className="avatar-xxl mx-auto mt-2">
                    <div className="avatar-title bg-light-subtle border border-light border-dashed rounded-circle">
                      <img src={checkmark} alt="Email sent" height={64} />
                    </div>
                  </div>
                </div>
                <h4 className="fw-bold text-center mb-2">Check Your Email</h4>
                <p className="text-muted text-center mb-4">Follow the secure link in your email to choose a new password.</p>
                <div className="d-grid">
                  <Button as={Link} to="/auth/sign-in" variant="primary" className="fw-semibold py-2">
                    Return to Sign In
                  </Button>
                </div>
              </div>
              <p className="text-muted text-center mt-4 mb-0">
                Return to&nbsp;
                <Link to="/auth/sign-in" className="text-decoration-underline link-offset-3 fw-semibold">
                  Sign in
                </Link>
              </p>
              <p className="text-center text-muted mt-auto mb-0">
                © {currentYear}&nbsp;
                {META_DATA.name} — by&nbsp;
                <span className="fw-bold">{META_DATA.author}</span>
              </p>
            </CardBody>
          </Card>
        </div>
      </Row>
    </div>
  )
}
export default Page
