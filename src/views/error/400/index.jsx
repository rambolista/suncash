import AuthLogo from '@/components/AuthLogo'
import { currentYear, META_DATA } from '@/config/constants'
import { Col, Container, Row } from 'react-bootstrap'
import { Link } from 'react-router'
const Page = () => {
  return (
    <>
      <div className="auth-box overflow-hidden align-items-center d-flex">
        <Container>
          <Row className="justify-content-center">
            <Col xxl={4} md={6} sm={8}>
              <div className="auth-brand text-center mb-3">
                <AuthLogo />
              </div>
              <div className="p-2 text-center">
                <div className="error-glitch" data-text="400">
                  400
                </div>
                <h3 className="fw-bold text-uppercase">Bad Request</h3>
                <p className="text-muted">Something's not right in the request you made.</p>

                <Link to="/" className="btn btn-primary mt-3 rounded-pill">
                  Go Home
                </Link>
              </div>

              <p className="text-center text-muted mt-5 mb-0">
                © {currentYear} {META_DATA.name} — by <span className="fw-bold">{META_DATA.author}</span>
              </p>
            </Col>
          </Row>
        </Container>
      </div>
    </>
  )
}
export default Page
