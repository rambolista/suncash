import { useEffect, useState } from 'react'
import { Button, Card, CardBody, Col, Form, Row, Table } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import LoadingState from '@/components/LoadingState'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'

const money = (value) => `$${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const KioskCashMetersPage = () => {
  const { showNotification } = useNotificationContext()

  const [branches, setBranches] = useState([])
  const [terminals, setTerminals] = useState([])
  const [transactionTypes, setTransactionTypes] = useState({})
  const [branchId, setBranchId] = useState('')
  const [terminalId, setTerminalId] = useState('')
  const [type, setType] = useState('')
  const [loadingFilters, setLoadingFilters] = useState(true)
  const [loadingResults, setLoadingResults] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    setLoadingFilters(true)
    ApiService.getKioskCashMeters()
      .then((data) => {
        setBranches(Array.isArray(data?.branches) ? data.branches : [])
        setTerminals(Array.isArray(data?.terminals) ? data.terminals : [])
        setTransactionTypes(data?.transaction_types || {})
      })
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load filters.', variant: 'danger' }))
      .finally(() => setLoadingFilters(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleBranchChange = (value) => {
    setBranchId(value)
    setTerminalId('')
    ApiService.getKioskCashMeterTerminals(value || null)
      .then((data) => setTerminals(Array.isArray(data?.data) ? data.data : []))
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load terminals.', variant: 'danger' }))
  }

  const handleApply = () => {
    if (!terminalId) {
      showNotification({ title: 'Missing terminal', message: 'Please select a terminal id.', variant: 'warning' })
      return
    }
    if (!type) {
      showNotification({ title: 'Missing type', message: 'Please select a transaction type.', variant: 'warning' })
      return
    }

    setLoadingResults(true)
    ApiService.getKioskCashMeterReadings(terminalId, type)
      .then((data) => {
        setResult(data)
        if (!data?.has_data) {
          showNotification({ title: 'No results', message: 'No record found.', variant: 'warning' })
        }
      })
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Something went wrong.', variant: 'danger' }))
      .finally(() => setLoadingResults(false))
  }

  const isDispenser = result?.type === 'out'
  const columnLabel = isDispenser ? 'Out (Dispensed)' : 'In (Accepted)'

  return (
    <>
      <PageBreadcrumb title="Cash Meters (Transaction)" subtitle="Kiosk" />

      <Card className="mb-3">
        <CardBody>
          {loadingFilters ? <LoadingState message="Loading filters..." /> : (
            <Row className="g-3 align-items-end">
              <Col md={3}>
                <Form.Label>Kiosk Branch</Form.Label>
                <Form.Select value={branchId} onChange={(e) => handleBranchChange(e.target.value)}>
                  <option value="">-- Select a Branch --</option>
                  {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </Form.Select>
              </Col>
              <Col md={3}>
                <Form.Label>Kiosk Terminal</Form.Label>
                <Form.Select value={terminalId} onChange={(e) => setTerminalId(e.target.value)}>
                  <option value="">--Select a Terminal--</option>
                  {terminals.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </Form.Select>
              </Col>
              <Col md={3}>
                <Form.Label>Transaction Type</Form.Label>
                <Form.Select value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="">--Select Meter Type--</option>
                  {Object.entries(transactionTypes).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </Form.Select>
              </Col>
              <Col md="auto">
                <Button variant="primary" onClick={handleApply} disabled={loadingResults}>
                  <Icon icon="filter" className="me-1" /> Apply Filters
                </Button>
              </Col>
            </Row>
          )}
        </CardBody>
      </Card>

      {result && (
        <Card>
          <CardBody>
            {loadingResults ? <LoadingState message="Loading readings..." /> : (
              <div className="table-responsive">
                <Table bordered hover className="align-middle mb-0">
                  <thead className="thead-sm text-uppercase fs-xxs">
                    <tr>
                      <th>Denom</th>
                      <th>{columnLabel}</th>
                      <th>Current</th>
                      {isDispenser && <th>Reject</th>}
                      <th>Lifetime</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.length === 0 ? (
                      <tr>
                        <td colSpan={isDispenser ? 5 : 4} className="text-center text-muted py-4">No records found</td>
                      </tr>
                    ) : (
                      <>
                        {result.rows.map((row) => (
                          <tr key={row.denom}>
                            <td className="text-center fw-semibold">{row.denom}</td>
                            <td className="text-center">{row.service_count} ({money(row.service_value)})</td>
                            <td className="text-center">{row.current_count} ({money(row.current_value)})</td>
                            {isDispenser && <td className="text-center">{row.reject_count} ({money(row.reject_value)})</td>}
                            <td className="text-center">{row.lifetime_count} ({money(row.lifetime_value)})</td>
                          </tr>
                        ))}
                        <tr className="table-active fw-bold">
                          <td className="text-center">Total</td>
                          <td className="text-center">{result.totals.service_count} ({money(result.totals.service_value)})</td>
                          <td className="text-center">{result.totals.current_count} ({money(result.totals.current_value)})</td>
                          {isDispenser && <td className="text-center">{result.totals.reject_count} ({money(result.totals.reject_value)})</td>}
                          <td className="text-center">{result.totals.lifetime_count} ({money(result.totals.lifetime_value)})</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </Table>
              </div>
            )}
          </CardBody>
        </Card>
      )}
    </>
  )
}

export default KioskCashMetersPage
