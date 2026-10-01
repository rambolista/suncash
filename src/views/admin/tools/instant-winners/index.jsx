import { useEffect, useState } from 'react'
import { Button, Card, CardBody, Col, Form, Row } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import ApiService from '@/services/ApiService'
import useCurrentUser from '@/hooks/useCurrentUser'
import { getModulePermission } from '@/utils/modulePermissions'
import { useNotificationContext } from '@/context/useNotificationContext'
import { downloadBlob } from '@/utils/reportHelpers'
import ConfirmActionModal from '@/views/admin/merchants/components/ConfirmActionModal'
import InstantWinnersTable from './components/InstantWinnersTable'

const InstantWinnersPage = () => {
  const currentUser = useCurrentUser()
  const { showNotification } = useNotificationContext()
  const modulePermission = getModulePermission(currentUser, '/tools/instant-winners')
  const canAdd = Boolean(modulePermission.can_add)
  const canExport = Boolean(modulePermission.can_export)

  const [rows, setRows] = useState([])
  const [prizes, setPrizes] = useState([])
  const [nextTicketThreshold, setNextTicketThreshold] = useState(0)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState('')
  const [ticketId, setTicketId] = useState('')
  const [prizeValue, setPrizeValue] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)

  const load = () => {
    setLoading(true)
    ApiService.getInstantWinners()
      .then((data) => {
        setRows(Array.isArray(data?.data) ? data.data : [])
        setPrizes(Array.isArray(data?.prizes) ? data.prizes : [])
        setNextTicketThreshold(data?.next_ticket_threshold ?? 0)
      })
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load instant winners.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleExport = async (format) => {
    setExporting(format)
    try {
      const { blob, filename } = await ApiService.exportInstantWinners(format)
      downloadBlob(blob, filename)
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.message || `Failed to export ${format.toUpperCase()}.`, variant: 'danger' })
    } finally {
      setExporting('')
    }
  }

  const handleApply = () => {
    // Legacy: tickets are displayed/typed as "#0<id>" — a leading 0 is stripped before sending.
    const cleanTicketId = ticketId.charAt(0) === '0' ? ticketId.slice(1) : ticketId
    if (!cleanTicketId || !prizeValue) return
    setShowConfirm(true)
  }

  const [id, , prizeType] = prizeValue.split(',')

  return (
    <>
      <PageBreadcrumb title="Instant Winners" subtitle="Tools" />

      <Card className="mb-3">
        <CardBody>
          <Row className="g-2 align-items-end">
            <Col md={4}>
              <Form.Label className="small text-muted mb-1">List of Tickets</Form.Label>
              <Form.Control
                placeholder={nextTicketThreshold ? String(nextTicketThreshold) : ''}
                value={ticketId}
                onChange={(e) => setTicketId(e.target.value)}
              />
            </Col>
            <Col md={5}>
              <Form.Label className="small text-muted mb-1">List of Promos</Form.Label>
              <Form.Select value={prizeValue} onChange={(e) => setPrizeValue(e.target.value)}>
                <option value="">---SELECT---</option>
                {prizes.map((p) => <option key={`${p.prize_type}-${p.id}`} value={`${p.id},${p.price ?? ''},${p.prize_type}`}>{p.label}</option>)}
              </Form.Select>
            </Col>
            {canAdd && (
              <Col md="auto">
                <Button size="sm" variant="success" onClick={handleApply} disabled={!ticketId || !prizeValue}>Apply</Button>
              </Col>
            )}
            {canExport && (
              <Col className="d-flex justify-content-end gap-2">
                <Button size="sm" variant="outline-secondary" disabled={exporting !== ''} onClick={() => handleExport('pdf')}>
                  {exporting === 'pdf' ? 'Exporting...' : 'Export to PDF'}
                </Button>
                <Button size="sm" variant="outline-success" disabled={exporting !== ''} onClick={() => handleExport('csv')}>
                  {exporting === 'csv' ? 'Exporting...' : 'Export to Excel'}
                </Button>
              </Col>
            )}
          </Row>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          {loading ? <LoadingState /> : <InstantWinnersTable data={rows} />}
        </CardBody>
      </Card>

      <ConfirmActionModal
        show={showConfirm}
        onHide={() => setShowConfirm(false)}
        title="Add Winner"
        message="Are you sure you want to add winner?"
        confirmLabel="Add Winner"
        successMessage="Instant Winner successfully added."
        onConfirm={() => {
          const cleanTicketId = ticketId.charAt(0) === '0' ? ticketId.slice(1) : ticketId
          return ApiService.addInstantWinner({ ticket_id: cleanTicketId, prize_id: id, prize_type: prizeType })
        }}
        onDone={() => {
          setTicketId('')
          setPrizeValue('')
          load()
        }}
      />
    </>
  )
}

export default InstantWinnersPage
