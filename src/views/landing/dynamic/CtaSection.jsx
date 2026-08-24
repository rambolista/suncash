import { Container } from 'react-bootstrap'
import RichTextContent from '@/components/wrappers/RichTextContent'
import { getDefaultAsset, getSectionAnchor } from './defaultAssets'
import LandingLink from './LandingLink'
import { SectionBackgroundOverlay } from './SectionMedia'

const CtaSection = ({ section }) => {
  const background = section.background_image_url || getDefaultAsset(section.settings?.default_background)
  return (
    <section id={getSectionAnchor(section)}>
      <div
        className="section-cta position-relative card-side-img overflow-hidden"
        style={{
          backgroundColor: section.settings?.background_color || 'var(--bs-primary)',
          backgroundImage: background ? `url("${background}")` : undefined,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
        }}
      >
        <SectionBackgroundOverlay section={{ ...section, background_image_url: background }} />
        <div className={`card-img-overlay d-flex align-items-center flex-column gap-3 justify-content-center auth-overlay text-${section.settings?.alignment || 'center'}`}>
          {section.image_url && <img src={section.image_url} alt={section.title || ''} className="img-fluid rounded-3" style={{ maxHeight: 120 }} />}
          <h2 className="text-white fs-24 mb-0 fw-bold">{section.title}</h2>
          {section.subtitle && <p className="text-white text-opacity-75 fs-md mb-0">{section.subtitle}</p>}
          <RichTextContent value={section.content} as="div" className="text-white text-opacity-75 mb-0" />
          <div className="d-flex gap-2">
            <LandingLink url={section.primary_link_url} label={section.primary_link_label} variant="light" />
            <LandingLink url={section.secondary_link_url} label={section.secondary_link_label} variant="outline-light" />
          </div>
        </div>
      </div>
    </section>
  )
}

export default CtaSection
