import { useProjectSettingsContext } from '@/context/useProjectSettingsContext'
import RichTextContent from '@/components/wrappers/RichTextContent'
import { Col, Container, Row } from 'react-bootstrap'
import { getSectionAnchor } from './defaultAssets'
import { getSectionBackgroundStyle, SectionBackgroundOverlay } from './SectionMedia'

const FooterSection = ({ section }) => {
  const { settings: project } = useProjectSettingsContext()
  return (
    <footer
      id={getSectionAnchor(section)}
      className="section-custom section-footer pb-2 position-relative overflow-hidden"
      style={getSectionBackgroundStyle(section)}
    >
      <SectionBackgroundOverlay section={section} />
      <Container className="position-relative">
        <Row className="g-4">
          <Col lg={5}>
            <img src={section.image_url || project.logo_light_url} alt={`${project.name} logo`} style={{ maxHeight: 80, maxWidth: '100%' }} />
            <RichTextContent value={section.content || project.description} as="div" className="mt-3 fs-sm" />
          </Col>
          <Col lg={7}>
            <Row className="g-3 justify-content-lg-end">
              {(section.items ?? []).map((item) => (
                <Col xs={6} md={4} key={item.id}>
                  <h6>{item.title}</h6>
                  {item.link_url && <a href={item.link_url} className="nav-link px-0">{item.link_label || item.subtitle || item.title}</a>}
                  <RichTextContent value={item.content} as="div" className="small" />
                </Col>
              ))}
            </Row>
          </Col>
        </Row>
        <hr className="border-secondary my-4" />
        <div className="text-center">© 2014 - {project.year} {project.name} By <span className="fw-semibold">{project.author}</span></div>
      </Container>
    </footer>
  )
}

export default FooterSection
