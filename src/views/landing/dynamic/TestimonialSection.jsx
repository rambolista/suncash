import bgPattern from '@/assets/images/bg-pattern.png'
import Icon from '@/components/wrappers/Icon'
import RichTextContent from '@/components/wrappers/RichTextContent'
import { Card, Col, Container, Row } from 'react-bootstrap'
import { getDefaultAsset, getSectionAnchor } from './defaultAssets'
import { getSectionBackgroundStyle, SectionBackgroundOverlay } from './SectionMedia'

const TestimonialSection = ({ section }) => (
  <section id={getSectionAnchor(section)} className="section-custom position-relative overflow-hidden" style={getSectionBackgroundStyle(section)}>
    <SectionBackgroundOverlay section={section} />
    {!section.background_image_url && <div className="position-absolute top-0 start-50 translate-middle-x mt-5 opacity-50"><img src={bgPattern} alt="" /></div>}
    <Container className="position-relative">
      <div className="text-center mb-5">
        {section.subtitle && <span className="text-muted">{section.subtitle}</span>}
        <h2 className="mt-3 fw-bold">{section.title}</h2>
        {section.image_url && <img src={section.image_url} alt={section.title || ''} className="img-fluid rounded-4 shadow-sm mt-4" style={{ maxHeight: 360, objectFit: 'cover' }} />}
      </div>
      <Row className="justify-content-center">
        {(section.items ?? []).map((item) => {
          const image = item.image_url || getDefaultAsset(item.settings?.default_image)
          return (
            <Col lg={4} key={item.id} className="mb-4">
              <Card className="border-light rounded-4 p-3 h-100">
                <Card.Body className="text-center">
                  {image && <div className="avatar avatar-xl mx-auto mb-3"><img src={image} alt={item.subtitle || item.title || ''} className="img-fluid rounded-circle" /></div>}
                  <span className="text-warning fs-lg mb-3 d-flex justify-content-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => <Icon icon="star-filled" key={star} />)}
                  </span>
                  <h4 className="mb-2 fs-md">{item.title}</h4>
                  <RichTextContent value={item.content} as="div" className="text-muted fst-italic fs-sm" />
                  {item.subtitle && <div className="fw-semibold">{item.subtitle}</div>}
                </Card.Body>
              </Card>
            </Col>
          )
        })}
      </Row>
    </Container>
  </section>
)

export default TestimonialSection
