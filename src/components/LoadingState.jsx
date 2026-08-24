import { Spinner } from 'react-bootstrap'

const LoadingState = ({ className = '', minHeight = 160 }) => (
  <div
    className={`d-flex align-items-center justify-content-center text-center ${className}`.trim()}
    style={{ minHeight }}
  >
    <div>
      <Spinner animation="border" variant="primary" className="mb-2" role="status">
        <span className="visually-hidden">Loading...</span>
      </Spinner>
      <div className="fw-semibold">Loading... Please wait...</div>
    </div>
  </div>
)

export default LoadingState
