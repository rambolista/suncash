import RichTextContent from '@/components/wrappers/RichTextContent'
import { Accordion, Col, Container, Row } from 'react-bootstrap'
import { getSectionAnchor } from './defaultAssets'
import { getSectionBackgroundStyle, SectionBackgroundOverlay } from './SectionMedia'

const FaqSection = ({ section }) => {
  const settings = section.settings ?? {}
  const entries = section.items ?? []

  return (
    <section
      id={getSectionAnchor(section)}
      className="section-custom position-relative overflow-hidden"
      style={getSectionBackgroundStyle(section)}
    >
      <SectionBackgroundOverlay section={section} />
      <Container className="position-relative">
        <div className={`text-${settings.alignment || 'center'} mb-5`}>
          {section.subtitle && <span className="text-muted">{section.subtitle}</span>}
          {section.title && <h2 className="mt-3 fw-bold">{section.title}</h2>}
          <RichTextContent value={section.content} className="text-muted mx-auto" style={{ maxWidth: 760 }} />
        </div>
        <Row className="g-4 align-items-start justify-content-center">
          {section.image_url && (
            <Col lg={5}>
              <img src={section.image_url} alt={section.title || ''} className="img-fluid rounded-4 shadow-sm" />
            </Col>
          )}
          <Col lg={section.image_url ? 7 : 9}>
            <Accordion defaultActiveKey={settings.faq_open_first && entries.length ? String(entries[0].id) : undefined}>
              {entries.map((entry) => (
                <Accordion.Item eventKey={String(entry.id)} key={entry.id}>
                  <Accordion.Header>
                    <span>
                      {entry.subtitle && <small className="d-block text-muted mb-1">{entry.subtitle}</small>}
                      {entry.title}
                    </span>
                  </Accordion.Header>
                  <Accordion.Body>
                    <RichTextContent value={entry.content} />
                    {entry.image_url && <img src={entry.image_url} alt={entry.title || ''} className="img-fluid rounded-3 mt-3" />}
                    {entry.link_url && (
                      <a href={entry.link_url} className="d-inline-block mt-3">
                        {entry.link_label || 'Learn more'}
                      </a>
                    )}
                  </Accordion.Body>
                </Accordion.Item>
              ))}
            </Accordion>
          </Col>
        </Row>
      </Container>
    </section>
  )
}

export default FaqSection
