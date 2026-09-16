import { Button, Col, Form, Row } from 'react-bootstrap'
import { useWizard } from 'react-use-wizard'
import Icon from '@/components/wrappers/Icon'

export const OtherFields = ({ values, setField }) => (
  <Row className="g-3">
    <Col md={8}>
      <Form.Group>
        <Form.Label>Store Locations (one location per line)</Form.Label>
        <Form.Control as="textarea" rows={5} name="locations" value={values.locations} onChange={setField} />
      </Form.Group>
    </Col>
  </Row>
)

export const StepOther = (props) => {
  const { nextStep, previousStep } = useWizard()
  return (
    <div className="pt-4">
      <OtherFields {...props} />
      <div className="d-flex justify-content-between mt-4">
        <Button variant="light" onClick={previousStep}><Icon icon="arrow-left" className="me-1" /> Back</Button>
        <Button variant="primary" onClick={nextStep}>Next: Review &amp; Save <Icon icon="arrow-right" className="ms-1" /></Button>
      </div>
    </div>
  )
}
