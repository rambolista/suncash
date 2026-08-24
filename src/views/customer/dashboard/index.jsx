import PageBreadcrumb from '@/components/PageBreadcrumb'
import useCurrentUser from '@/hooks/useCurrentUser'
import useCustomerAuth from '@/hooks/useCustomerAuth'
import { Button, Card, CardBody } from 'react-bootstrap'

const CustomerDashboard = () => {
  const currentUser = useCurrentUser()
  const { logout } = useCustomerAuth()

  return (
    <>
      <PageBreadcrumb title="Customer Dashboard" subtitle="Customer" />
      <Card>
        <CardBody className="d-flex flex-column gap-3">
          <div>
            <h4 className="mb-1">Welcome{currentUser?.name ? `, ${currentUser.name}` : ''}!</h4>
            <p className="text-muted mb-0">Your customer portal is ready.</p>
          </div>
          <div className="text-muted small">
            Account Number: <strong>{currentUser?.account_number || '—'}</strong>
          </div>
          <div className="alert alert-light border mb-0">
            Customer menu list is currently empty.
          </div>
          <div>
            <Button variant="outline-danger" onClick={logout}>Log Out</Button>
          </div>
        </CardBody>
      </Card>
    </>
  )
}

export default CustomerDashboard
