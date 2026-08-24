import { Col, Row } from 'react-bootstrap'
import CustomerField from './CustomerField'

const OverviewTab = ({ customer }) => (
  <Row className="g-4">
    <Col md={6} xl={3}><CustomerField label="Account number" value={customer.account_number} /></Col>
    <Col md={6} xl={3}><CustomerField label="Customer name" value={customer.name} /></Col>
    <Col md={6} xl={3}><CustomerField label="Status" value={customer.status} /></Col>
    <Col md={6} xl={3}><CustomerField label="Last updated" value={customer.updated_at ? new Date(customer.updated_at).toLocaleString() : null} /></Col>
    <Col md={6}><CustomerField label="Email address" value={customer.email} /></Col>
    <Col md={6}><CustomerField label="Mobile number" value={customer.mobile_number} /></Col>
    <Col xs={12}><CustomerField label="Service address" value={customer.address} /></Col>
  </Row>
)

export default OverviewTab
