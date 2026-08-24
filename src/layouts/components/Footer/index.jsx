import { useProjectSettingsContext } from '@/context/useProjectSettingsContext'
import { Col, Container, Row } from 'react-bootstrap'
const Footer = () => {
  const { settings } = useProjectSettingsContext()
  return (
    <>
      <footer className="footer">
        <Container fluid>
          <Row>
            <Col className="text-center text-md-start">
              © {settings.year} {settings.name} By <span className="fw-semibold">{settings.author}</span>
            </Col>
          </Row>
        </Container>
      </footer>
    </>
  )
}
export default Footer
