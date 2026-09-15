import { useEffect, useState } from 'react'
import { Button, Card, CardBody, Col, Form, Row } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import useCurrentUser from '@/hooks/useCurrentUser'
import { getModulePermission } from '@/utils/modulePermissions'
import { useNotificationContext } from '@/context/useNotificationContext'
import KiosksTable from './components/KiosksTable'
import ExportAllModal from './components/ExportAllModal'
import DetailView from './components/DetailView'

const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

const KioskDepositsAdjustmentsPage = () => {
  const currentUser = useCurrentUser()
  const { showNotification } = useNotificationContext()
  const modulePermission = getModulePermission(currentUser, '/kiosk/deposits-and-adjustments')
  const canExport = Boolean(modulePermission.can_export)
  const canExecute = Boolean(modulePermission.can_execute)

  const [view, setView] = useState('list')
  const [selectedTerminal, setSelectedTerminal] = useState(null)

  const [kiosks, setKiosks] = useState([])
  const [branches, setBranches] = useState([])
  const [branchId, setBranchId] = useState('')
  const [terminalId, setTerminalId] = useState('')
  const [loading, setLoading] = useState(true)
  const [showExportModal, setShowExportModal] = useState(false)

  const load = (filters = {}) => {
    setLoading(true)
    ApiService.getKioskDepositsAdjustments(filters)
      .then((data) => {
        setKiosks(Array.isArray(data?.kiosks) ? data.kiosks : [])
        setBranches(Array.isArray(data?.branches) ? data.branches : [])
      })
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load kiosks.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleApply = () => load({ branch_id: branchId || null, terminal_id: terminalId || null })

  const handleGlobalExport = async (filters, format) => {
    try {
      const { blob, filename } = await ApiService.exportKioskDepositsAdjustments(filters, format)
      downloadBlob(blob, filename)
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.message || `Failed to export ${format.toUpperCase()}.`, variant: 'danger' })
    }
  }

  const openDetail = (kiosk) => {
    setSelectedTerminal(kiosk)
    setView('detail')
  }

  if (view === 'detail' && selectedTerminal) {
    return (
      <>
        <PageBreadcrumb title="Deposits and Adjustments" subtitle="Kiosk" />
        <DetailView
          terminal={selectedTerminal}
          canExport={canExport}
          canExecute={canExecute}
          onBack={() => { setView('list'); setSelectedTerminal(null) }}
        />
      </>
    )
  }

  return (
    <>
      <PageBreadcrumb title="Deposits and Adjustments" subtitle="Kiosk" />

      <Card className="mb-3">
        <CardBody>
          <Row className="g-3 align-items-end">
            <Col md={3}>
              <Form.Label>Branch</Form.Label>
              <Form.Select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                <option value="">All</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Label>Kiosk Terminal</Form.Label>
              <Form.Select value={terminalId} onChange={(e) => setTerminalId(e.target.value)}>
                <option value="">All</option>
                {kiosks.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
              </Form.Select>
            </Col>
            <Col md="auto">
              <Button variant="primary" onClick={handleApply} disabled={loading}>
                <Icon icon="filter" className="me-1" /> Apply Filters
              </Button>
            </Col>
            {canExport && (
              <Col md="auto" className="ms-auto">
                <Button variant="success" onClick={() => setShowExportModal(true)}>
                  <Icon icon="download" className="me-1" /> Export
                </Button>
              </Col>
            )}
          </Row>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          {loading ? <LoadingState message="Loading kiosks..." /> : (
            <KiosksTable data={kiosks} onViewDetails={openDetail} />
          )}
        </CardBody>
      </Card>

      <ExportAllModal
        show={showExportModal}
        onHide={() => setShowExportModal(false)}
        onExport={handleGlobalExport}
      />
    </>
  )
}

export default KioskDepositsAdjustmentsPage
