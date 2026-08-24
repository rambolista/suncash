import RichTextContent from '@/components/wrappers/RichTextContent'
import { Card, Col, Container, Row } from 'react-bootstrap'
import { getSectionAnchor } from './defaultAssets'
import LandingLink from './LandingLink'
import { getSectionBackgroundStyle, SectionBackgroundOverlay } from './SectionMedia'

const PricingSection = ({ section }) => (
  <section
    id={getSectionAnchor(section)}
    className="section-custom position-relative overflow-hidden"
    style={getSectionBackgroundStyle(section)}
  >
    <SectionBackgroundOverlay section={section} />
    <Container className="position-relative">
      <div className="text-center mb-5">
        {section.subtitle && <span className="text-muted">{section.subtitle}</span>}
        <h2 className="mt-3 fw-bold">{section.title}</h2>
        <RichTextContent value={section.content} as="div" className="text-muted" />
        {section.image_url && <img src={section.image_url} alt={section.title || ''} className="img-fluid rounded-4 shadow-sm mt-4" style={{ maxHeight: 360, objectFit: 'cover' }} />}
      </div>
      <Row className="justify-content-center g-4">
        {(section.items ?? []).map((item) => {
          return (
            <Col lg={4} key={item.id}>
              <Card className={`h-100 bg-light bg-opacity-10 rounded-3 ${item.settings?.badge ? 'border-dashed border' : 'border-light'}`}>
                <Card.Body className="px-lg-4 p-5 pb-2 text-center">
                  {item.settings?.badge && <span className="badge bg-primary-subtle text-primary rounded-pill mb-3">{item.settings.badge}</span>}
                  <h3 className="fw-bold mb-1">{item.title}</h3>
                  <p className="text-muted">{item.subtitle}</p>
                  {item.settings?.price && <h1 className="display-6 fw-bold my-4">{item.settings.price}</h1>}
                  <RichTextContent value={item.content} as="div" className="text-start fs-sm fw-medium" />
                </Card.Body>
                <Card.Footer className="bg-transparent border-0 px-5 pb-4">
                  <LandingLink url={item.link_url} label={item.link_label} className="w-100 rounded-pill" />
                </Card.Footer>
              </Card>
            </Col>
          )
        })}
      </Row>
    </Container>
  </section>
)

export default PricingSection
