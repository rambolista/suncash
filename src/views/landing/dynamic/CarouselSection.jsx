import RichTextContent from '@/components/wrappers/RichTextContent'
import { Carousel, Container } from 'react-bootstrap'
import { getSectionAnchor } from './defaultAssets'
import LandingLink from './LandingLink'
import { getSectionBackgroundStyle, SectionBackgroundOverlay } from './SectionMedia'

const CarouselSection = ({ section }) => {
  const settings = section.settings ?? {}
  const slides = section.items ?? []
  const configuredInterval = Number(settings.carousel_interval ?? 5000)
  const interval = Number.isFinite(configuredInterval) && configuredInterval >= 1000 ? configuredInterval : 5000
  const fullWidth = Boolean(settings.carousel_full_width)
  const mediaClassName = `d-block w-100 ${fullWidth ? '' : 'rounded-4'}`
  const carouselWrapperStyle = fullWidth
    ? { marginLeft: 'calc(50% - 50vw)', width: '100vw' }
    : undefined

  return (
    <section
      id={getSectionAnchor(section)}
      className="section-custom position-relative overflow-hidden"
      style={getSectionBackgroundStyle(section)}
    >
      <SectionBackgroundOverlay section={section} />
      <Container className="position-relative">
        {(section.title || section.subtitle || section.content) && (
          <div className={`text-${settings.alignment || 'center'} mb-5`}>
            {section.subtitle && <span className="text-muted">{section.subtitle}</span>}
            {section.title && <h2 className="mt-3 fw-bold">{section.title}</h2>}
            <RichTextContent value={section.content} className="text-muted" />
          </div>
        )}
      </Container>
      <div className={fullWidth ? 'position-relative' : 'container position-relative'} style={carouselWrapperStyle}>
        {slides.length > 0 ? (
          <Carousel
            fade={Boolean(settings.carousel_fade)}
            interval={settings.carousel_autoplay === false ? null : interval}
            controls={slides.length > 1}
            indicators={slides.length > 1}
            pause="hover"
            touch
          >
            {slides.map((slide) => {
              const image = slide.image_url || section.image_url

              return (
                <Carousel.Item key={slide.id}>
                  {image ? (
                    <img
                      src={image}
                      alt={slide.title || section.title || ''}
                      className={mediaClassName}
                      style={{ height: 'clamp(320px, 55vw, 650px)', objectFit: 'cover' }}
                    />
                  ) : (
                    <div className={`bg-body-tertiary ${fullWidth ? '' : 'rounded-4'}`} style={{ height: 'clamp(320px, 55vw, 650px)' }} />
                  )}
                  {(slide.title || slide.subtitle || slide.content || slide.link_label) && (
                    <Carousel.Caption className="bg-dark bg-opacity-75 rounded-4 px-4 py-3">
                      {slide.subtitle && <div className="text-white-50 mb-2">{slide.subtitle}</div>}
                      {slide.title && <h3>{slide.title}</h3>}
                      <RichTextContent value={slide.content} className="text-white" />
                      <LandingLink url={slide.link_url} label={slide.link_label} variant="light" />
                    </Carousel.Caption>
                  )}
                </Carousel.Item>
              )
            })}
          </Carousel>
        ) : section.image_url ? (
          <img src={section.image_url} alt={section.title || ''} className={mediaClassName} />
        ) : null}
      </div>
    </section>
  )
}

export default CarouselSection
