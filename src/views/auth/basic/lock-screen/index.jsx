import AuthLogo from '@/components/AuthLogo'
import AuthUserAvatar from '@/views/auth/components/AuthUserAvatar'
import AuthLogoutButton from '@/views/auth/components/AuthLogoutButton'
import { useProjectSettingsContext } from '@/context/useProjectSettingsContext'
import { lockScreen } from '@/utils/lockScreen'
import { useEffect } from 'react'
import { Card, Col, Container, Row } from 'react-bootstrap'
import Forms from './components/Forms'

const Page = () => {
  const { settings } = useProjectSettingsContext()

  useEffect(() => {
    lockScreen('/')
  }, [])

  return (
    <>
      <div className="auth-box overflow-hidden align-items-center d-flex">
        <Container>
          <Row className="justify-content-center">
            <Col xxl={4} md={6} sm={8}>
              <div className="auth-brand text-center mb-4 position-relative">
                <AuthLogo />
                <h4 className="fw-bold mt-3">Lock Screen!</h4>
                <p className="text-muted w-lg-75 mx-auto">This screen is locked. Enter your password to continue</p>
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
                © {settings.year} {settings.name} — by
                <span className="fw-semibold">&nbsp;{settings.author}</span>
              </p>
            </Col>
          </Row>
        </Container>
      </div>
    </>
  )
}
export default Page
