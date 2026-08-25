import AuthLogo from '@/components/AuthLogo'
import { useProjectSettingsContext } from '@/context/useProjectSettingsContext'
import { Card, Col, Container, Row } from 'react-bootstrap'
import LoginForm from './components/Form'
const Page = () => {
  const { settings } = useProjectSettingsContext()
  return (
    <>
      <div className="auth-box overflow-hidden align-items-center d-flex">
        <Container>
          <Row className="justify-content-center">
            <Col xxl={4} md={6} sm={8}>
              <div className="auth-brand text-center mb-4">
                <AuthLogo />
                <h4 className="fw-bold mt-3">Welcome</h4>
                <p className="text-muted w-lg-75 mx-auto">Let’s get you signed in. Enter your email and password to continue.</p>
              </div>

              <Card className="p-4">
                <LoginForm />
              </Card>

              <p className="text-center text-muted mt-4 mb-0">
                © {settings.year} {settings.name} — by
                <span className="fw-bold"> {settings.author}</span>
              </p>
            </Col>
          </Row>
        </Container>
      </div>
    </>
  )
}
export default Page
