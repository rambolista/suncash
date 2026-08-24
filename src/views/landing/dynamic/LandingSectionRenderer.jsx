import AboutSection from './AboutSection'
import BlogSection from './BlogSection'
import CarouselSection from './CarouselSection'
import ContactSection from './ContactSection'
import ContentSection from './ContentSection'
import CtaSection from './CtaSection'
import FaqSection from './FaqSection'
import FooterSection from './FooterSection'
import HeroSection from './HeroSection'
import PricingSection from './PricingSection'
import TestimonialSection from './TestimonialSection'

const renderers = {
  hero: HeroSection,
  carousel: CarouselSection,
  features: ContentSection,
  about: AboutSection,
  gallery: ContentSection,
  pricing: PricingSection,
  testimonials: TestimonialSection,
  blog: BlogSection,
  faq: FaqSection,
  contact: ContactSection,
  cta: CtaSection,
  footer: FooterSection,
}

const LandingSectionRenderer = ({ section }) => {
  const Renderer = renderers[section.type]
  return Renderer ? <Renderer section={section} /> : null
}

export default LandingSectionRenderer
