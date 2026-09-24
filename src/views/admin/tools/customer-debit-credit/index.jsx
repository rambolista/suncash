import { useMemo, useState } from 'react'
import { Button, Card, CardBody, Col, Form, Row } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import useCurrentUser from '@/hooks/useCurrentUser'
import { getModulePermission } from '@/utils/modulePermissions'
import { useNotificationContext } from '@/context/useNotificationContext'
import DebitCreditSearchResultsTable from './components/DebitCreditSearchResultsTable'
import CustomerDebitCreditDetailPage from './components/CustomerDebitCreditDetailPage'

const EMPTY_FILTERS = { first_name: '', last_name: '', mobile_number: '', card_number: '', email: '', bank_topup: '' }

const FIELD_OPTIONS = [
  { value: 'mobile_number', label: 'Mobile Number' },
  { value: 'first_name', label: 'First Name' },
  { value: 'last_name', label: 'Last Name' },
  { value: 'card_number', label: 'Card Number' },
  { value: 'email', label: 'Email' },
  { value: 'bank_topup', label: 'Bank Topup#' },
]

const CustomerDebitCreditPage = () => {
  const currentUser = useCurrentUser()
  const { showNotification } = useNotificationContext()
  const modulePermission = useMemo(() => getModulePermission(currentUser, '/tools/customer-debit-credit'), [currentUser])

  const [advanced, setAdvanced] = useState(false)
  const [quickField, setQuickField] = useState('mobile_number')
  const [quickValue, setQuickValue] = useState('')
  const [filters, setFilters] = useState(EMPTY_FILTERS)

  const [rows, setRows] = useState([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(null)

  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }))

  const runSearch = (searchFilters) => {
    setLoading(true)
    setSearched(true)
    ApiService.searchCustomerDebitCredit(searchFilters)
      .then((data) => setRows(Array.isArray(data?.data) ? data.data : []))
      .catch((err) => {
        setRows([])
        showNotification({ title: 'Failed', message: err?.message || 'No records found.', variant: 'danger' })
      })
      .finally(() => setLoading(false))
  }

  const handleQuickSearch = (event) => {
    event.preventDefault()
    runSearch({ ...EMPTY_FILTERS, [quickField]: quickValue })
  }

  const handleAdvancedSearch = (event) => {
    event.preventDefault()
    runSearch(filters)
  }

  if (selected) {
    return (
      <CustomerDebitCreditDetailPage
        customerId={selected.id}
        modulePermission={modulePermission}
        onBack={() => setSelected(null)}
      />
    )
  }

  return (
    <>
      <PageBreadcrumb title="Customer Debit/Credit" subtitle="Tools" />

      <Card className="mb-3">
        <CardBody>
          {!advanced ? (
            <Form onSubmit={handleQuickSearch}>
              <Row className="g-2 align-items-end">
                <Col md="auto">
                  <Form.Label className="small text-muted mb-1">Search By</Form.Label>
                  <Form.Select value={quickField} onChange={(e) => setQuickField(e.target.value)}>
                    {FIELD_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </Form.Select>
                </Col>
                <Col md={4}>
                  <Form.Label className="small text-muted mb-1">&nbsp;</Form.Label>
                  <Form.Control value={quickValue} onChange={(e) => setQuickValue(e.target.value)} placeholder={FIELD_OPTIONS.find((f) => f.value === quickField)?.label} />
                </Col>
                <Col md="auto">
                  <Button type="submit" variant="primary" disabled={loading}>
                    <Icon icon="search" className="me-1" /> {loading ? 'Searching...' : 'Search'}
                  </Button>
                </Col>
                <Col md="auto" className="ms-auto">
                  <Button type="button" variant="link" className="px-0" onClick={() => setAdvanced(true)}>
                    Advanced Search
                  </Button>
                </Col>
              </Row>
            </Form>
          ) : (
            <Form onSubmit={handleAdvancedSearch}>
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
                <Col md="auto" className="ms-auto">
                  <Button type="button" variant="link" className="px-0" onClick={() => setAdvanced(false)}>
                    Simple Search
                  </Button>
                </Col>
              </Row>
            </Form>
          )}
        </CardBody>
      </Card>

      {searched && (
        <Card>
          <CardBody>
            {loading ? <LoadingState message="Searching customers..." /> : (
              rows.length
                ? <DebitCreditSearchResultsTable data={rows} onOpen={(row) => setSelected({ id: row.id })} />
                : <p className="text-muted text-center py-4 mb-0">No records found.</p>
            )}
          </CardBody>
        </Card>
      )}
    </>
  )
}

export default CustomerDebitCreditPage
