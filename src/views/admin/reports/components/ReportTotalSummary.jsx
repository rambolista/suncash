import { Card, CardBody } from 'react-bootstrap'

/** Small "Total Summary" strip shown below a report table — reused by Money Transfer and Utility Billpay. */
const ReportTotalSummary = ({ lines }) => (
  <Card className="mt-3">
    <CardBody className="py-2">
      <div className="d-flex flex-wrap gap-4">
        {lines.map(({ label, value }) => (
          <div key={label}>
            <span className="text-muted small me-1">{label}:</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </CardBody>
  </Card>
)

export default ReportTotalSummary
