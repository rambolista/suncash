import Icon from '@/components/wrappers/Icon'
import RichTextContent from '@/components/wrappers/RichTextContent'
import { useNotificationContext } from '@/context/useNotificationContext'
import { Button, Col, Container, Form, Row } from 'react-bootstrap'
import { getSectionAnchor } from './defaultAssets'
import { getSectionBackgroundStyle, SectionBackgroundOverlay } from './SectionMedia'

const ContactSection = ({ section }) => {
  const { showNotification } = useNotificationContext()

  return (
    <section
      id={getSectionAnchor(section)}
      className="section-custom position-relative overflow-hidden"
      style={getSectionBackgroundStyle(section)}
    >
      <SectionBackgroundOverlay section={section} />
      <Container className="position-relative">
      <div className="text-center mb-5">
        {section.subtitle && <span className="text-muted">{section.subtitle}</span>}
        <h2 className="mt-3 fw-bold">{section.title}</h2>
        <RichTextContent value={section.content} as="div" className="text-muted" />
      </div>
      <Row>
        <Col xxl={4}>
          <div className="p-4">
            {section.image_url && <img src={section.image_url} alt={section.title || ''} className="img-fluid rounded-4 shadow-sm mb-4" />}
            {(section.items ?? []).map((item) => (
              <div className="d-flex gap-3 mb-5" key={item.id}>
                <div className="avatar-xl flex-shrink-0">
                  <span className="avatar-title bg-secondary-subtle text-secondary rounded-circle fs-22"><Icon icon={item.icon || 'info-circle'} /></span>
                </div>
                <div>
                  <span className="text-muted">{item.title}</span>
                  <RichTextContent value={item.content} as="div" className="my-2 fw-semibold" />
                </div>
              </div>
            ))}
          </div>
        </Col>
        <Col xxl={8}>
          <Form
            className="p-4 border rounded-4 border-dashed"
            onSubmit={(event) => {
              event.preventDefault()
              showNotification({
                title: 'Contact form not configured',
                message: 'Please use the contact details shown beside the form.',
                variant: 'warning',
              })
            }}
          >
            <Row className="g-3">
              <Col md={6}><Form.Label>Full Name</Form.Label><Form.Control className="py-2" placeholder="Enter your full name" /></Col>
              <Col md={6}><Form.Label>Email Address</Form.Label><Form.Control type="email" className="py-2" placeholder="Enter your email" /></Col>
              <Col md={12}><Form.Label>Subject</Form.Label><Form.Control className="py-2" placeholder="What's the reason for contact?" /></Col>
              <Col md={12}><Form.Label>Message</Form.Label><Form.Control as="textarea" className="py-2" rows={5} placeholder="Write your message here..." /></Col>
              <Col md={12} className="text-end"><Button type="submit" className="rounded-pill">{section.primary_link_label || 'Send Message'}</Button></Col>
            </Row>
          </Form>
        </Col>
      </Row>
      </Container>
    </section>
  )
}

export default ContactSection
