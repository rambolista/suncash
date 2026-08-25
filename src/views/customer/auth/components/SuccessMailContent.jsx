import checkmark from '@/assets/images/checkmark.png'
import { Button } from 'react-bootstrap'
import { Link } from 'react-router'

const SuccessMailContent = () => (
  <>
    <div className="mb-4">
      <div className="avatar-xxl mx-auto mt-2">
        <div className="avatar-title bg-light-subtle border border-light border-dashed rounded-circle">
          <img src={checkmark} alt="Email sent" height={64} />
        </div>
      </div>
    </div>
    <h4 className="fw-bold text-center mb-2">Check Your Email</h4>
    <p className="text-muted text-center mb-4">Follow the secure link in your email to choose a new password.</p>
    <div className="d-grid">
      <Button as={Link} to="/auth/sign-in" variant="primary" className="fw-semibold py-2">
        Return to Sign In
      </Button>
    </div>
  </>
)

export default SuccessMailContent
