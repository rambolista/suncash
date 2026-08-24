import Icon from '@/components/wrappers/Icon'
import RichTextContent from '@/components/wrappers/RichTextContent'
import { Card, Col, Container, Row } from 'react-bootstrap'
import { getDefaultAsset, getSectionAnchor } from './defaultAssets'
import LandingLink from './LandingLink'
import { getSectionBackgroundStyle, SectionBackgroundOverlay } from './SectionMedia'

const BlogSection = ({ section }) => (
  <section
    id={getSectionAnchor(section)}
    className="section-custom bg-light bg-opacity-30 border-top border-bottom border-light position-relative overflow-hidden"
    style={getSectionBackgroundStyle(section)}
  >
    <SectionBackgroundOverlay section={section} />
    <Container className="position-relative">
      <div className="text-center mb-5">
        {section.subtitle && <span className="text-muted">{section.subtitle}</span>}
        <h2 className="mt-3 fw-bold">{section.title}</h2>
        {section.image_url && <img src={section.image_url} alt={section.title || ''} className="img-fluid rounded-4 shadow-sm mt-4" style={{ maxHeight: 360, objectFit: 'cover' }} />}
      </div>
      <Row className="g-4">
        {(section.items ?? []).map((item) => {
          const image = item.image_url || getDefaultAsset(item.settings?.default_image)
          return (
            <Col lg={4} key={item.id}>
              <Card className="rounded-3 border-0 shadow-sm h-100 overflow-hidden">
                {item.subtitle && <span className="badge text-bg-dark position-absolute top-0 start-0 m-3">{item.subtitle}</span>}
                {image && <Card.Img variant="top" src={image} alt={item.title || ''} />}
                <Card.Body>
                  <h5>{item.title}</h5>
                  <RichTextContent value={item.content} as="div" className="text-muted" />
                  {item.settings?.meta && <p className="text-muted fs-sm"><Icon icon="calendar" className="me-1" />{item.settings.meta}</p>}
                  <LandingLink url={item.link_url} label={item.link_label || 'Read more'} variant="link" className="px-0" />
                </Card.Body>
              </Card>
            </Col>
          )
        })}
      </Row>
    </Container>
  </section>
)

export default BlogSection
