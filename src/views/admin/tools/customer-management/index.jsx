import { useMemo, useState } from 'react'
import { Button, Card, CardBody, Col, Form, Row } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import useCurrentUser from '@/hooks/useCurrentUser'
import { getModulePermission } from '@/utils/modulePermissions'
import { useNotificationContext } from '@/context/useNotificationContext'
import CustomerSearchResultsTable from './components/CustomerSearchResultsTable'
import CustomerDetailPage from './components/CustomerDetailPage'

const EMPTY_FILTERS = { first_name: '', last_name: '', mobile_number: '', card_number: '', email: '', bank_topup: '' }

const CustomerManagementPage = () => {
  const currentUser = useCurrentUser()
  const { showNotification } = useNotificationContext()
  const modulePermission = useMemo(() => getModulePermission(currentUser, '/tools/customer-management'), [currentUser])

  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [rows, setRows] = useState([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(null)

  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }))

  const handleSearch = (event) => {
    event.preventDefault()
    setLoading(true)
    setSearched(true)
    ApiService.searchCustomerManagement(filters)
      .then((data) => setRows(Array.isArray(data?.data) ? data.data : []))
      .catch((err) => {
        setRows([])
        showNotification({ title: 'Failed', message: err?.message || 'No records found.', variant: 'danger' })
      })
      .finally(() => setLoading(false))
  }

  if (selected) {
    return (
      <CustomerDetailPage
        customerId={selected.id}
        initialTab={selected.tab}
        modulePermission={modulePermission}
        onBack={() => setSelected(null)}
      />
    )
  }

  return (
    <>
      <PageBreadcrumb title="Customer Management" subtitle="Tools" />

      <Card className="mb-3">
        <CardBody>
          <Form onSubmit={handleSearch}>
            <Row className="g-3">
              <Col md={4}>
                <Form.Label>First Name</Form.Label>
                <Form.Control value={filters.first_name} onChange={(e) => updateFilter('first_name', e.target.value)} />
              </Col>
              <Col md={4}>
                <Form.Label>Last Name</Form.Label>
                <Form.Control value={filters.last_name} onChange={(e) => updateFilter('last_name', e.target.value)} />
              </Col>
              <Col md={4}>
                <Form.Label>Mobile Number</Form.Label>
                <Form.Control value={filters.mobile_number} onChange={(e) => updateFilter('mobile_number', e.target.value)} />
              </Col>
              <Col md={4}>
                <Form.Label>Card Number</Form.Label>
                <Form.Control value={filters.card_number} onChange={(e) => updateFilter('card_number', e.target.value)} />
              </Col>
              <Col md={4}>
                <Form.Label>Email</Form.Label>
                <Form.Control value={filters.email} onChange={(e) => updateFilter('email', e.target.value)} />
              </Col>
              <Col md={4}>
                <Form.Label>Bank Topup#</Form.Label>
                <Form.Control value={filters.bank_topup} onChange={(e) => updateFilter('bank_topup', e.target.value)} />
              </Col>
              <Col md="auto">
                <Button type="submit" variant="primary" disabled={loading}>
                  <Icon icon="search" className="me-1" /> {loading ? 'Searching...' : 'Search'}
                </Button>
              </Col>
            </Row>
          </Form>
        </CardBody>
      </Card>

      {searched && (
        <Card>
          <CardBody>
            {loading ? <LoadingState message="Searching customers..." /> : (
              rows.length
                ? <CustomerSearchResultsTable data={rows} onOpen={(row, tab) => setSelected({ id: row.id, tab })} />
                : <p className="text-muted text-center py-4 mb-0">No records found.</p>
            )}
          </CardBody>
        </Card>
      )}
    </>
  )
}

export default CustomerManagementPage
