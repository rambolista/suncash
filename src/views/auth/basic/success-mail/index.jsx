import icon from '@/assets/images/checkmark.png'
import AuthLogo from '@/components/AuthLogo'
import { currentYear, META_DATA } from '@/config/constants'
import { Button, Card, Col, Container, Row } from 'react-bootstrap'
import { Link } from 'react-router'
const Page = () => {
  return (
    <>
      <div className="auth-box overflow-hidden align-items-center d-flex">
        <Container>
          <Row className="justify-content-center">
            <Col xxl={4} md={6} sm={8}>
              <div className="auth-brand text-center mb-4">
                <AuthLogo />
                <p className="text-muted w-lg-75 mt-3 mx-auto">Follow the secure link in your email to choose a new password.</p>
              </div>
              <Card className="p-4">
                <div className="mb-4">
                  <div className="avatar-xxl mx-auto mt-2">
                    <div className="avatar-title bg-light-subtle border border-light border-dashed rounded-circle">
                      <img src={icon} alt="Email sent" height={64} />
                    </div>
                  </div>
                </div>
                <h4 className="fw-bold text-center mb-4">Check Your Email</h4>
                <div className="d-grid">
                  <Button as={Link} to="/auth/sign-in" variant="primary" className="fw-semibold py-2">
                    Return to Sign In
                  </Button>
                </div>
              </Card>
              <p className="text-center text-muted mt-4 mb-0">
                © {currentYear} {META_DATA.name} — by
                <span className="fw-semibold">&nbsp;{META_DATA.author}</span>
              </p>
            </Col>
          </Row>
        </Container>
      </div>
    </>
  )
}
export default Page
