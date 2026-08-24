import { Col, Container, Row } from 'react-bootstrap'
import RichTextContent from '@/components/wrappers/RichTextContent'
import { getDefaultAsset, getSectionAnchor } from './defaultAssets'
import LandingLink from './LandingLink'
import { getSectionBackgroundStyle, SectionBackgroundOverlay } from './SectionMedia'

const AboutSection = ({ section }) => {
  const settings = section.settings ?? {}
  const image = section.image_url || getDefaultAsset(settings.default_image)
  const imageRight = settings.image_position === 'right'
  const imageColumn = image && (
    <Col lg={6} xl={5} className={`py-3 ${imageRight ? 'order-lg-2 ms-auto' : ''}`}>
      <img src={image} alt={section.title || ''} className="rounded-3 shadow-lg img-fluid" />
    </Col>
  )

  return (
    <section
      id={getSectionAnchor(section)}
      className="section-custom bg-light bg-opacity-30 position-relative overflow-hidden"
      style={getSectionBackgroundStyle(section)}
    >
      <SectionBackgroundOverlay section={section} />
      <Container className="position-relative">
        <Row className="align-items-center py-4">
          {!imageRight && imageColumn}
          <Col lg={5} className={`${imageRight ? 'order-lg-1' : 'ms-auto'} py-3`}>
            {section.subtitle && <div className="text-primary fw-semibold mb-2">{section.subtitle}</div>}
            <h2 className="mb-4 lh-base">{section.title}</h2>
            <RichTextContent value={section.content} as="div" className="lead text-body-secondary" />
            <div className="d-flex gap-2 flex-wrap">
              <LandingLink url={section.primary_link_url} label={section.primary_link_label} />
              <LandingLink url={section.secondary_link_url} label={section.secondary_link_label} variant="outline-primary" />
            </div>
            {!!section.items?.length && (
              <div className="d-flex flex-wrap justify-content-between gap-4 mt-4">
                {section.items.map((item) => (
                  <div key={item.id}>
                    <h3 className="mb-2">{item.title}</h3>
                    <p className="text-muted mb-0">{item.subtitle}</p>
                  </div>
                ))}
              </div>
            )}
          </Col>
          {imageRight && imageColumn}
        </Row>
      </Container>
    </section>
  )
}

export default AboutSection
