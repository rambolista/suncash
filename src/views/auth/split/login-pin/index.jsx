import auth from '@/assets/images/auth.jpg'
import AuthLogo from '@/components/AuthLogo'
import AuthUserAvatar from '@/views/auth/components/AuthUserAvatar'
import AuthLogoutButton from '@/views/auth/components/AuthLogoutButton'
import { currentYear, META_DATA } from '@/config/constants'
import { Card, CardBody, Col, Row } from 'react-bootstrap'
import LoginPinForm from './components/Forms'
const Page = () => {
  return (
    <>
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
                  <h4 className="fw-bold">Welcome to Admin</h4>
                  <p className="text-muted mx-auto mb-5">This screen is locked. Enter your PIN to continue.</p>
                  <div className="text-center mb-4">
                    <AuthUserAvatar />
                  </div>
                  <LoginPinForm />
                </div>
                <p className="text-muted text-center mt-4 mb-0">
                  Not you? Return to
                  <AuthLogoutButton />
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
    </>
  )
}
export default Page
