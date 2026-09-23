import { useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Badge, Button, Card, CardBody, Col, Form, Nav, Row } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import Icon from '@/components/wrappers/Icon'
import Select from '@/components/wrappers/Select'
import ApiService from '@/services/ApiService'
import useCurrentUser from '@/hooks/useCurrentUser'
import { getModulePermission } from '@/utils/modulePermissions'
import { useNotificationContext } from '@/context/useNotificationContext'
import { downloadBlob } from '@/utils/reportHelpers'
import CustomerBenefitsTable from './components/CustomerBenefitsTable'
import ConfirmActionModal from './components/ConfirmActionModal'

const CustomerBenefitsDistributionPage = () => {
  const currentUser = useCurrentUser()
  const { showNotification } = useNotificationContext()
  const canEdit = Boolean(getModulePermission(currentUser, '/tools/customer-benefits-distribution').can_edit)

  const fileInputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [rowErrors, setRowErrors] = useState([])
  const [downloadingTemplate, setDownloadingTemplate] = useState(false)

  const [tab, setTab] = useState('all')
  const [batches, setBatches] = useState([])
  const [active, setActive] = useState([])
  const [paid, setPaid] = useState([])
  const [loadingIndex, setLoadingIndex] = useState(true)
  const [batchId, setBatchId] = useState('')

  const [batchRows, setBatchRows] = useState([])
  const [loadingRows, setLoadingRows] = useState(false)

  const [confirmAction, setConfirmAction] = useState(null)
  const [actionSubmitting, setActionSubmitting] = useState(false)
  const [exporting, setExporting] = useState('')

  const load = () => {
    setLoadingIndex(true)
    ApiService.getCustomerBenefits()
      .then((data) => {
        setBatches(Array.isArray(data?.batches) ? data.batches : [])
        setActive(Array.isArray(data?.active) ? data.active : [])
        setPaid(Array.isArray(data?.paid) ? data.paid : [])
      })
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load customer benefits.', variant: 'danger' }))
      .finally(() => setLoadingIndex(false))
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadRows = (id) => {
    if (!id) { setBatchRows([]); return }
    setLoadingRows(true)
    ApiService.getCustomerBenefitBatchRows(id)
      .then((data) => setBatchRows(Array.isArray(data?.data) ? data.data : []))
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load batch rows.', variant: 'danger' }))
      .finally(() => setLoadingRows(false))
  }

  useEffect(() => { loadRows(batchId) }, [batchId]) // eslint-disable-line react-hooks/exhaustive-deps

  const batchOptions = useMemo(() => batches.map((b) => ({ value: String(b.id), label: b.batch_name })), [batches])
  const selectedBatchOption = useMemo(() => batchOptions.find((o) => o.value === String(batchId)) || null, [batchOptions, batchId])

  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true)
    try {
      const { blob, filename } = await ApiService.downloadCustomerBenefitsTemplate()
      downloadBlob(blob, filename || 'Customer Benefits Sample.xlsx')
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.message || 'Failed to download the sample format.', variant: 'danger' })
    } finally {
      setDownloadingTemplate(false)
    }
  }

  const handleUpload = async (event) => {
    event.preventDefault()
    if (!file) return
    setUploading(true)
    setUploadError('')
    setRowErrors([])
    try {
      const response = await ApiService.importCustomerBenefits(file)
      showNotification({ title: 'Success', message: response?.message || 'Upload successful.', variant: 'success' })
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      load()
      if (response?.batch_id) {
        setTab('all')
        setBatchId(String(response.batch_id))
      }
    } catch (err) {
      if (Array.isArray(err?.errors?.rows)) {
        setRowErrors(err.errors.rows)
      } else {
        setUploadError(err?.errors?.file?.[0] || err?.message || 'Failed to upload file.')
      }
    } finally {
      setUploading(false)
    }
  }

  const handleExport = async (format) => {
    setExporting(format)
    try {
      const { blob, filename } = await ApiService.exportCustomerBenefits(tab === 'all' ? (batchId || null) : null, format)
      downloadBlob(blob, filename)
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.message || `Failed to export ${format.toUpperCase()}.`, variant: 'danger' })
    } finally {
      setExporting('')
    }
  }

  const runConfirmedAction = async () => {
    if (!confirmAction) return
    setActionSubmitting(true)
    try {
      let response
      if (confirmAction.type === 'processBatch') response = await ApiService.processCustomerBenefitBatch(batchId)
      if (confirmAction.type === 'processRow') response = await ApiService.processCustomerBenefitRow(confirmAction.row.id)

      showNotification({ title: 'Success', message: response?.message || 'Done.', variant: 'success' })
      setConfirmAction(null)
      load()
      loadRows(batchId)
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.message || 'Action failed.', variant: 'danger' })
    } finally {
      setActionSubmitting(false)
    }
  }

  return (
    <>
      <PageBreadcrumb title="Customer Benefits Distribution" subtitle="Tools" />

      <Card className="mb-3">
        <CardBody>
          <h5 className="mb-3">Upload Customer Benefits</h5>
          {uploadError && <Alert variant="danger" className="py-2 small mb-3">{uploadError}</Alert>}
          {rowErrors.length > 0 && (
            <Alert variant="danger" className="py-2 small mb-3">
              <ul className="mb-0 ps-3">
                {rowErrors.map((message, index) => <li key={index}>{message}</li>)}
              </ul>
            </Alert>
          )}

          {canEdit && (
            <Form onSubmit={handleUpload}>
              <Row className="g-3 align-items-end">
                <Col md={5}>
                  <Form.Label>Benefits File</Form.Label>
                  <Form.Control ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={(e) => setFile(e.target.files?.[0] || null)} required />
                </Col>
                <Col md="auto">
                  <Button type="submit" variant="primary" disabled={uploading || !file}>{uploading ? 'Uploading...' : 'Upload'}</Button>
                </Col>
              </Row>
            </Form>
          )}

          <p className="small mb-1 text-primary fw-semibold mt-3">Excel Template Format</p>
          <p className="small text-muted mb-1">Please follow (name, mobile, amount, email, issuer, NIB number) when uploading. Uploading auto-processes every recipient right away.</p>
          <Button variant="link" size="sm" className="p-0" disabled={downloadingTemplate} onClick={handleDownloadTemplate}>
            <Icon icon="paperclip" className="me-1" />{downloadingTemplate ? 'Preparing...' : 'Download sample format'}
          </Button>
        </CardBody>
      </Card>

      <Card>
        <Card.Header className="px-3 pt-3 pb-0 bg-body">
          <Nav variant="tabs" activeKey={tab} onSelect={(key) => key && setTab(key)} className="nav-bordered nav-bordered-primary flex-nowrap">
            <Nav.Item>
              <Nav.Link eventKey="all">All</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="active" className="d-flex align-items-center gap-2">
                Active <Badge bg={tab === 'active' ? 'primary' : 'light'} text={tab === 'active' ? undefined : 'dark'} className="rounded-pill">{active.length}</Badge>
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="paid" className="d-flex align-items-center gap-2">
                Paid <Badge bg={tab === 'paid' ? 'primary' : 'light'} text={tab === 'paid' ? undefined : 'dark'} className="rounded-pill">{paid.length}</Badge>
              </Nav.Link>
            </Nav.Item>
          </Nav>
        </Card.Header>

        <CardBody>
          {loadingIndex ? <LoadingState /> : (
            <>
              {tab === 'all' && (
                <>
                  <Row className="g-3 align-items-end mb-3">
                    <Col md={4}>
                      <Form.Label>Batch</Form.Label>
                      <Select
                        className="react-select"
                        classNamePrefix="react-select"
                        options={batchOptions}
                        value={selectedBatchOption}
                        onChange={(selected) => setBatchId(selected?.value || '')}
                        placeholder="Select Batch"
                        isSearchable
                        isClearable
                        menuPortalTarget={document.body}
                        styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                      />
                    </Col>
                    <Col className="d-flex justify-content-end gap-2">
                      <Button
                        variant="primary"
                        disabled={!canEdit || !batchId}
                        onClick={() => setConfirmAction({ type: 'processBatch' })}
                      >
                        Process
                      </Button>
                      <Button variant="outline-secondary" disabled={exporting !== ''} onClick={() => handleExport('pdf')}>
                        {exporting === 'pdf' ? 'Exporting...' : 'Export to PDF'}
                      </Button>
                      <Button variant="outline-success" disabled={exporting !== ''} onClick={() => handleExport('csv')}>
                        {exporting === 'csv' ? 'Exporting...' : 'Export to Excel'}
                      </Button>
                    </Col>
                  </Row>

                  {batchId && (
                    loadingRows ? <LoadingState /> : <CustomerBenefitsTable data={batchRows} showBatchName={false} showAction={false} canEdit={canEdit} />
                  )}
                </>
              )}

              {tab === 'active' && (
                <CustomerBenefitsTable
                  data={active}
                  showBatchName
                  showAction
                  canEdit={canEdit}
                  onProcessRow={(row) => setConfirmAction({ type: 'processRow', row })}
                />
              )}

              {tab === 'paid' && (
                <CustomerBenefitsTable data={paid} showBatchName showAction={false} canEdit={canEdit} />
              )}
            </>
          )}
        </CardBody>
      </Card>

      <ConfirmActionModal
        show={confirmAction?.type === 'processBatch'}
        onHide={() => setConfirmAction(null)}
        onConfirm={runConfirmedAction}
        submitting={actionSubmitting}
        title="Process Batch"
        confirmLabel="Process"
        body={(
          <>
            Please don&apos;t close your browser while the benefits are being processed — closing it may cause errors.
            <p className="text-muted small mt-2 mb-0">
              This processes up to 500 recipients at a time. If the batch has more, click Process again once this run finishes.
            </p>
          </>
        )}
      />

      <ConfirmActionModal
        show={confirmAction?.type === 'processRow'}
        onHide={() => setConfirmAction(null)}
        onConfirm={runConfirmedAction}
        submitting={actionSubmitting}
        title="Process Recipient"
        confirmLabel="Process"
        body={`Process the benefit for "${confirmAction?.row?.name || ''}"?`}
      />
    </>
  )
}

export default CustomerBenefitsDistributionPage
