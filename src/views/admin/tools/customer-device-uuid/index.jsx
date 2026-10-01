import { useEffect, useState } from 'react'
import { Button, Card, CardBody, Col, Form, Row } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import useCurrentUser from '@/hooks/useCurrentUser'
import { getModulePermission } from '@/utils/modulePermissions'
import { useNotificationContext } from '@/context/useNotificationContext'
import { downloadBlob } from '@/utils/reportHelpers'
import ConfirmActionModal from '@/views/admin/merchants/components/ConfirmActionModal'
import CustomerDeviceUuidTable from './components/CustomerDeviceUuidTable'

const CustomerDeviceUuidPage = () => {
  const currentUser = useCurrentUser()
  const { showNotification } = useNotificationContext()
  const modulePermission = getModulePermission(currentUser, '/tools/customer-device-uuid')
  const canDelete = Boolean(modulePermission.can_delete)
  const canExport = Boolean(modulePermission.can_export)

  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  const load = (from = dateFrom, to = dateTo) => {
    setLoading(true)
    ApiService.getCustomerDeviceUuids(from, to)
      .then((data) => setRows(Array.isArray(data?.data) ? data.data : []))
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load customer device UUIDs.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleExport = async (format) => {
    setExporting(format)
    try {
      const { blob, filename } = await ApiService.exportCustomerDeviceUuids(dateFrom, dateTo, format)
      downloadBlob(blob, filename)
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.message || `Failed to export ${format.toUpperCase()}.`, variant: 'danger' })
    } finally {
      setExporting('')
    }
  }

  return (
    <>
      <PageBreadcrumb title="Customer Device UUID" subtitle="Tools" />

      <Card className="mb-3">
        <CardBody>
          <Row className="g-2 align-items-end">
            <Col md={3}>
              <Form.Label className="small text-muted mb-1">Date From</Form.Label>
              <Form.Control size="sm" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </Col>
            <Col md={3}>
              <Form.Label className="small text-muted mb-1">Date To</Form.Label>
              <Form.Control size="sm" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </Col>
            <Col md="auto">
              <Button size="sm" variant="primary" onClick={() => load(dateFrom, dateTo)}>
                <Icon icon="filter" className="me-1" /> Apply Filters
              </Button>
            </Col>
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
          {loading ? <LoadingState /> : (
            <CustomerDeviceUuidTable data={rows} canDelete={canDelete} onDelete={setDeleteTarget} />
          )}
        </CardBody>
      </Card>

      <ConfirmActionModal
        show={Boolean(deleteTarget)}
        onHide={() => setDeleteTarget(null)}
        title="Delete Customer Uuid"
        message={`Are you sure you want to delete the device "${deleteTarget?.uuid}" for ${deleteTarget?.customer_name || 'this customer'}?`}
        confirmLabel="Delete"
        confirmVariant="danger"
        successMessage="Customer Uuid Successfully Deleted"
        onConfirm={() => ApiService.deleteCustomerDeviceUuid(deleteTarget.id)}
        onDone={() => load()}
      />
    </>
  )
}

export default CustomerDeviceUuidPage
