import Icon from '@/components/wrappers/Icon'
import RichTextContent from '@/components/wrappers/RichTextContent'
import { Card, Col, Container, Row } from 'react-bootstrap'
import { getDefaultAsset, getSectionAnchor } from './defaultAssets'
import LandingLink from './LandingLink'
import { getSectionBackgroundStyle, SectionBackgroundOverlay } from './SectionMedia'

const ContentSection = ({ section }) => {
  const settings = section.settings ?? {}
  const isGallery = section.type === 'gallery'
  return (
    <section
      id={getSectionAnchor(section)}
      className={`section-custom position-relative overflow-hidden ${section.type === 'gallery' ? 'bg-light bg-opacity-30 border-top border-bottom border-light' : ''}`}
      style={getSectionBackgroundStyle(section)}
    >
      <SectionBackgroundOverlay section={section} />
      <Container className="py-lg-4 position-relative">
        <div className={`text-${settings.alignment || 'center'} mb-5`}>
          {section.subtitle && <span className="text-muted rounded-3 d-inline-block">{section.subtitle}</span>}
          {section.title && <h2 className="fw-bold">{section.title}</h2>}
          <RichTextContent value={section.content} as="div" className="text-body-secondary mx-auto" style={{ maxWidth: 760 }} />
          {section.image_url && (
            <img
              src={section.image_url}
              alt={section.title || ''}
              className="img-fluid rounded-4 shadow-sm mt-4"
              style={{ maxHeight: 420, objectFit: 'cover', width: '100%' }}
            />
          )}
        </div>
        <Row className="g-4 justify-content-center">
          {(section.items ?? []).map((item) => (
            <Col key={item.id} md={6} lg={isGallery ? 4 : 4}>
              <Card className="h-100 border-0 p-2 overflow-hidden">
                {(item.image_url || getDefaultAsset(item.settings?.default_image)) && <Card.Img variant="top" src={item.image_url || getDefaultAsset(item.settings?.default_image)} alt={item.title || ''} style={{ height: isGallery ? 260 : 190, objectFit: 'cover' }} />}
                <Card.Body>
                  {item.icon && <span className="avatar-title text-bg-secondary rounded-circle fs-22 mb-3" style={{ width: 64, height: 64 }}><Icon icon={item.icon} /></span>}
                  <Card.Title>{item.title}</Card.Title>
                  {item.subtitle && <Card.Subtitle className="text-muted mb-2">{item.subtitle}</Card.Subtitle>}
                  <RichTextContent value={item.content} as="div" className="card-text" />
                  <LandingLink url={item.link_url} label={item.link_label} variant="link" className="px-0" />
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  )
}

export default ContentSection
