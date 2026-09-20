import { useEffect, useState } from 'react'
import { Alert, Button, Card, CardBody, Col, Form, Row } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import ApiService from '@/services/ApiService'
import useCurrentUser from '@/hooks/useCurrentUser'
import { getModulePermission } from '@/utils/modulePermissions'
import { useNotificationContext } from '@/context/useNotificationContext'
import { formatDateTime } from '@/utils/reportHelpers'
import LookupAmountTable from '../components/LookupAmountTable'

const COLUMNS = [
  { key: 'timestamp', label: 'Time Stamp', render: formatDateTime },
  { key: 'from_currency', label: 'Source Currency' },
  { key: 'to_currency', label: 'Destination Currency' },
  { key: 'rate', label: 'Rate' },
]

const ForexRatePage = () => {
  const currentUser = useCurrentUser()
  const { showNotification } = useNotificationContext()
  const canAdd = Boolean(getModulePermission(currentUser, '/tools/forex-rate').can_add)

  const [rows, setRows] = useState([])
  const [sourceCurrencies, setSourceCurrencies] = useState([])
  const [destinationCurrencies, setDestinationCurrencies] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [fromCurrency, setFromCurrency] = useState('')
  const [toCurrency, setToCurrency] = useState('')
  const [rate, setRate] = useState('')

  const load = () => {
    setLoading(true)
    ApiService.getForexRates()
      .then((data) => {
        setRows(Array.isArray(data?.data) ? data.data : [])
        const sources = Array.isArray(data?.source_currencies) ? data.source_currencies : []
        const destinations = Array.isArray(data?.destination_currencies) ? data.destination_currencies : []
        setSourceCurrencies(sources)
        setDestinationCurrencies(destinations)
        setFromCurrency((current) => current || sources[0] || '')
        setToCurrency((current) => current || destinations[0] || '')
      })
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load forex rates.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!rate || Number.isNaN(Number(rate)) || Number(rate) <= 0) {
      setError('Please enter a valid rate.')
      return
    }

    setSubmitting(true)
    try {
      await ApiService.createForexRate({ from_currency: fromCurrency, to_currency: toCurrency, rate: Number(rate) })
      showNotification({ title: 'Success', message: 'Successfully saved forex.', variant: 'success' })
      setRate('')
      load()
    } catch (err) {
      setError(err?.errors ? Object.values(err.errors)[0]?.[0] : (err?.message || 'Unable to save forex.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <PageBreadcrumb title="Forex Rate" subtitle="Tools" />

      {canAdd && (
        <Card className="mb-3">
          <CardBody>
            <p className="text-muted small mb-3">
              Saving a new rate adds it to the history below — it doesn&apos;t edit an existing row. The most recent rate for a
              currency pair is the one used live for cross-currency transactions.
            </p>
            {error && <Alert variant="danger" className="py-2 small mb-3">{error}</Alert>}
            <Form onSubmit={handleSubmit}>
              <Row className="g-3 align-items-end">
                <Col md={3}>
                  <Form.Label>Source Currency</Form.Label>
                  <Form.Select value={fromCurrency} onChange={(e) => setFromCurrency(e.target.value)}>
                    {sourceCurrencies.map((c) => <option key={c} value={c}>{c}</option>)}
                  </Form.Select>
                </Col>
                <Col md={3}>
                  <Form.Label>Destination Currency</Form.Label>
                  <Form.Select value={toCurrency} onChange={(e) => setToCurrency(e.target.value)}>
                    {destinationCurrencies.map((c) => <option key={c} value={c}>{c}</option>)}
                  </Form.Select>
                </Col>
                <Col md={3}>
                  <Form.Label>Rate</Form.Label>
                  <Form.Control type="number" step="0.0001" min="0" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="0.00" />
                </Col>
                <Col md="auto">
                  <Button type="submit" variant="primary" disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</Button>
                </Col>
              </Row>
            </Form>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardBody>
          {loading ? <LoadingState message="Loading forex rates..." /> : <LookupAmountTable data={rows} columns={COLUMNS} canEdit={false} />}
        </CardBody>
      </Card>
    </>
  )
}

export default ForexRatePage
