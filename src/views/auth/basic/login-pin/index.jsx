import AuthLogo from '@/components/AuthLogo'
import AuthUserAvatar from '@/views/auth/components/AuthUserAvatar'
import AuthLogoutButton from '@/views/auth/components/AuthLogoutButton'
import { currentYear, META_DATA } from '@/config/constants'
import { Card, Col, Container, Row } from 'react-bootstrap'
import Forms from './components/Forms'
const Page = () => {
  return (
    <>
      <div className="auth-box overflow-hidden align-items-center d-flex">
        <Container>
          <Row className="justify-content-center">
            <Col xxl={4} md={6} sm={8}>
              <div className="auth-brand text-center mb-4">
                <AuthLogo />
                <h4 className="fw-bold mt-3">Login with PIN!</h4>
                <p className="text-muted w-lg-75 mx-auto">This screen is locked. Enter your PIN to continue.</p>
              </div>
              <Card className="p-4">
                <div className="text-center mb-4">
                  <AuthUserAvatar />
                </div>
                <Forms />
                <p className="text-muted text-center mt-4 mb-0">
                  Not you? Return to&nbsp;
                  <AuthLogoutButton />
                </p>
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
