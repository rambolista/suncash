import auth from '@/assets/images/auth.jpg'
import { useProjectSettingsContext } from '@/context/useProjectSettingsContext'
import { Card, CardBody, Col, Container, Row } from 'react-bootstrap'
import { Link } from 'react-router'
import CustomerAuthLogo from './CustomerAuthLogo'

const PageFrame = ({ variant = 'basic', title, subtitle, footerLink, footerLinkText, footerPrefix = 'Return to', children }) => {
  const { settings, loading } = useProjectSettingsContext()

  if (loading) {
    return null
  }

  if (variant === 'card') {
    return (
      <div className="auth-box d-flex align-items-center">
        <Container fluid="xxl">
          <Row className="align-items-center justify-content-center">
            <Col xl={10}>
              <Card className="rounded-4">
                <Row className="justify-content-between g-0">
                  <Col lg={6}>
                    <CardBody>
                      <div className="auth-brand text-center mb-4">
                        <CustomerAuthLogo />
                        <h4 className="fw-bold mt-4">{title}</h4>
                        <p className="text-muted w-lg-75 mx-auto">{subtitle}</p>
                      </div>

                      {children}

                      {footerLink && (
                        <p className="text-muted text-center mt-4 mb-0">
                          {footerPrefix}&nbsp;
                          <Link to={footerLink} className="text-decoration-underline link-offset-3 fw-semibold">
                            {footerLinkText}
                          </Link>
                        </p>
                      )}
                      <p className="text-center text-muted mt-4 mb-0">
                        © {settings.year} {settings.name} — by <span className="fw-bold">{settings.author}</span>
                      </p>
                    </CardBody>
                  </Col>
                  <Col lg={6} className="d-none d-lg-block">
                    <div
                      className="h-100 position-relative card-side-img rounded-end overflow-hidden"
                      style={{
                        backgroundImage: `url(${auth})`,
                      }}
                    >
                      <div className="p-4 card-img-overlay rounded-end d-flex align-items-end justify-content-center" />
                    </div>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    )
  }

  return (
    <div className="auth-box overflow-hidden align-items-center d-flex">
      <Container>
        <Row className="justify-content-center">
          <Col xxl={4} md={6} sm={8}>
            <div className="auth-brand text-center mb-4">
              <CustomerAuthLogo />
              <h4 className="fw-bold mt-3">{title}</h4>
              <p className="text-muted w-lg-75 mx-auto">{subtitle}</p>
            </div>

            <Card className="p-4">
              {children}
            </Card>

            {footerLink && (
              <p className="text-muted text-center mt-4 mb-0">
                {footerPrefix}&nbsp;
                <Link to={footerLink} className="text-decoration-underline link-offset-3 fw-semibold">
                  {footerLinkText}
                </Link>
              </p>
            )}

            <p className="text-center text-muted mt-4 mb-0">
              © {settings.year} {settings.name} — by
              <span className="fw-bold"> {settings.author}</span>
            </p>
          </Col>
        </Row>
      </Container>
    </div>
  )
}

export default PageFrame
