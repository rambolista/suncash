import { Col, Row } from 'react-bootstrap'
import CustomerField from './CustomerField'

const InformationTab = ({ customer }) => (
  <Row className="g-4">
    <Col md={4}><CustomerField label="First name" value={customer.first_name} /></Col>
    <Col md={4}><CustomerField label="Middle name" value={customer.middle_name} /></Col>
    <Col md={4}><CustomerField label="Last name" value={customer.last_name} /></Col>
    <Col md={6}><CustomerField label="Email address" value={customer.email} /></Col>
    <Col md={6}><CustomerField label="Mobile number" value={customer.mobile_number} /></Col>
    <Col xs={12}><CustomerField label="Address" value={customer.address} /></Col>
  </Row>
)

export default InformationTab
