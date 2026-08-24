import bgPattern from '@/assets/images/bg-pattern.png'
import user1 from '@/assets/images/users/user-1.jpg'
import user2 from '@/assets/images/users/user-2.jpg'
import user3 from '@/assets/images/users/user-3.jpg'
import user4 from '@/assets/images/users/user-4.jpg'
import user5 from '@/assets/images/users/user-5.jpg'
import RichTextContent from '@/components/wrappers/RichTextContent'
import { Col, Container, Row } from 'react-bootstrap'
import { getDefaultAsset, getSectionAnchor } from './defaultAssets'
import LandingLink from './LandingLink'
import { getSectionBackgroundStyle, SectionBackgroundOverlay } from './SectionMedia'

const HeroSection = ({ section }) => {
  const settings = section.settings ?? {}
  const image = section.image_url || getDefaultAsset(settings.default_image)
  const users = [user1, user2, user3, user4, user5]
  return (
    <section
      id={getSectionAnchor(section)}
      className="bg-light bg-opacity-50 border-top border-light position-relative overflow-hidden"
      style={getSectionBackgroundStyle(section)}
    >
      <SectionBackgroundOverlay section={section} />
      {!section.background_image_url && <div className="position-absolute top-0 start-50 translate-middle-x mt-5 opacity-50"><img src={bgPattern} alt="" /></div>}
      <Container className="pt-5 position-relative">
        <Row>
          <Col lg={8} className={`text-${settings.alignment || 'center'} mx-auto`}>
            {section.subtitle && <span className="fw-semibold text-muted fst-italic">{section.subtitle}</span>}
            {settings.show_trusted_avatars && (
              <div className="avatar-group avatar-group-sm justify-content-center mt-2">
                {users.map((user) => <div className="avatar" key={user}><img src={user} alt="" className="avatar-sm rounded-circle" /></div>)}
              </div>
            )}
            <h1 className="my-4 fs-36 fw-bold lh-base">{section.title}</h1>
            <RichTextContent value={section.content} as="div" className="mb-4 fs-sm text-muted lh-lg" />
            <div className={`d-flex flex-wrap gap-2 justify-content-${settings.alignment || 'center'}`}>
              <LandingLink url={section.primary_link_url} label={section.primary_link_label} />
              <LandingLink url={section.secondary_link_url} label={section.secondary_link_label} variant="light" />
            </div>
          </Col>
        </Row>
        {image && (
          <Row>
            <Col md={10} className="mx-auto position-relative">
              <img src={image} alt={section.title || ''} className="rounded-top-4 shadow-lg img-fluid mt-5" />
            </Col>
          </Row>
        )}
      </Container>
    </section>
  )
}

export default HeroSection
