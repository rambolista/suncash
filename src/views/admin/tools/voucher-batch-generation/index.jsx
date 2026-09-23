import { useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Button, Card, CardBody, Col, Form, Row } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import Icon from '@/components/wrappers/Icon'
import Select from '@/components/wrappers/Select'
import ApiService from '@/services/ApiService'
import useCurrentUser from '@/hooks/useCurrentUser'
import { getModulePermission } from '@/utils/modulePermissions'
import { useNotificationContext } from '@/context/useNotificationContext'
import { downloadBlob } from '@/utils/reportHelpers'
import VoucherBatchTable from './components/VoucherBatchTable'
import ConfirmActionModal from './components/ConfirmActionModal'

const VoucherBatchGenerationPage = () => {
  const currentUser = useCurrentUser()
  const { showNotification } = useNotificationContext()
  const canEdit = Boolean(getModulePermission(currentUser, '/tools/voucher-batch-generation').can_edit)

  const fileInputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [rowErrors, setRowErrors] = useState([])
  const [downloadingTemplate, setDownloadingTemplate] = useState(false)

  const [batches, setBatches] = useState([])
  const [loadingBatches, setLoadingBatches] = useState(true)
  const [batchId, setBatchId] = useState('')

  const [rows, setRows] = useState([])
  const [loadingRows, setLoadingRows] = useState(false)

  const [confirmAction, setConfirmAction] = useState(null)
  const [actionSubmitting, setActionSubmitting] = useState(false)
  const [exporting, setExporting] = useState('')

  const loadBatches = () => {
    setLoadingBatches(true)
    ApiService.getVoucherBatches()
      .then((data) => setBatches(Array.isArray(data?.data) ? data.data : []))
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load batches.', variant: 'danger' }))
      .finally(() => setLoadingBatches(false))
  }

  useEffect(() => { loadBatches() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadRows = (id) => {
    if (!id) { setRows([]); return }
    setLoadingRows(true)
    ApiService.getVoucherBatchRows(id)
      .then((data) => setRows(Array.isArray(data?.data) ? data.data : []))
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load batch rows.', variant: 'danger' }))
      .finally(() => setLoadingRows(false))
  }

  useEffect(() => { loadRows(batchId) }, [batchId]) // eslint-disable-line react-hooks/exhaustive-deps

  const selectedBatch = useMemo(() => batches.find((b) => String(b.id) === String(batchId)), [batches, batchId])

  const batchOptions = useMemo(() => batches.map((b) => ({ value: String(b.id), label: b.batch_name })), [batches])
  const selectedBatchOption = useMemo(() => batchOptions.find((o) => o.value === String(batchId)) || null, [batchOptions, batchId])

  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true)
    try {
      const { blob, filename } = await ApiService.downloadVoucherBatchTemplate()
      downloadBlob(blob, filename || 'Voucher Batch Sample.xlsx')
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
      const response = await ApiService.importVoucherBatch(file)
      showNotification({ title: 'Success', message: response?.message || 'Upload successful.', variant: 'success' })
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      loadBatches()
      if (response?.batch_id) setBatchId(String(response.batch_id))
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
      const { blob, filename } = await ApiService.exportVoucherBatch(batchId || null, format)
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
      if (confirmAction.type === 'process') response = await ApiService.processVoucherBatch(batchId)
      if (confirmAction.type === 'resend') response = await ApiService.resendVoucherBatch(batchId)
      if (confirmAction.type === 'cancelRow') response = await ApiService.skipVoucherBatchRow(confirmAction.row.id)

      showNotification({ title: 'Success', message: response?.message || 'Done.', variant: 'success' })
      setConfirmAction(null)
      loadBatches()
      loadRows(batchId)
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.message || 'Action failed.', variant: 'danger' })
    } finally {
      setActionSubmitting(false)
    }
  }

  return (
    <>
      <PageBreadcrumb title="Voucher Batch Generation" subtitle="Tools" />

      <Card className="mb-3">
        <CardBody>
          <h5 className="mb-3">Upload Voucher Batch</h5>
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
                  <Form.Label>Voucher File</Form.Label>
                  <Form.Control ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={(e) => setFile(e.target.files?.[0] || null)} required />
                </Col>
                <Col md="auto">
                  <Button type="submit" variant="primary" disabled={uploading || !file}>{uploading ? 'Uploading...' : 'Upload'}</Button>
                </Col>
              </Row>
            </Form>
          )}

          <p className="small mb-1 text-primary fw-semibold mt-3">Excel Template Format</p>
          <p className="small text-muted mb-1">Please follow (name, mobile, amount, email, issuer, issued id) when uploading.</p>
          <Button variant="link" size="sm" className="p-0" disabled={downloadingTemplate} onClick={handleDownloadTemplate}>
            <Icon icon="paperclip" className="me-1" />{downloadingTemplate ? 'Preparing...' : 'Download sample format'}
          </Button>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <Row className="g-3 align-items-end mb-3">
            <Col md={4}>
              <Form.Label>Batch</Form.Label>
              {loadingBatches ? <LoadingState message="Loading batches..." /> : (
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
              )}
            </Col>
            <Col className="d-flex justify-content-end gap-2">
              <Button
                variant="primary"
                disabled={!canEdit || !batchId}
                onClick={() => setConfirmAction({ type: 'process' })}
              >
                Process
              </Button>
              <Button
                variant="outline-secondary"
                disabled={!canEdit || !batchId}
                onClick={() => setConfirmAction({ type: 'resend' })}
              >
                Resend
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
            loadingRows ? <LoadingState /> : (
              <>
                <VoucherBatchTable data={rows} canEdit={canEdit} onSkip={(row) => setConfirmAction({ type: 'cancelRow', row })} />
                {selectedBatch && (
                  <div className="d-flex gap-4 mt-3 text-muted small">
                    <span>Processed: <strong>{selectedBatch.processed}</strong></span>
                    <span>Unprocessed: <strong>{selectedBatch.unprocessed}</strong></span>
                    <span>Cancelled: <strong>{selectedBatch.skipped}</strong></span>
                  </div>
                )}
              </>
            )
          )}
        </CardBody>
      </Card>

      <ConfirmActionModal
        show={confirmAction?.type === 'process'}
        onHide={() => setConfirmAction(null)}
        onConfirm={runConfirmedAction}
        submitting={actionSubmitting}
        title="Process Batch"
        confirmLabel="Process"
        body={(
          <>
            Please don&apos;t close your browser while the voucher is being processed — closing it may cause errors.
            <p className="text-muted small mt-2 mb-0">
              This processes up to 500 recipients at a time. If the batch has more, click Process again once this run finishes.
            </p>
          </>
        )}
      />

      <ConfirmActionModal
        show={confirmAction?.type === 'resend'}
        onHide={() => setConfirmAction(null)}
        onConfirm={runConfirmedAction}
        submitting={actionSubmitting}
        title="Resend Batch"
        confirmLabel="Resend"
        body="Resend the voucher code and PIN to every recipient in this batch whose voucher is still unclaimed?"
      />

      <ConfirmActionModal
        show={confirmAction?.type === 'cancelRow'}
        onHide={() => setConfirmAction(null)}
        onConfirm={runConfirmedAction}
        submitting={actionSubmitting}
        title="Cancel Recipient"
        confirmLabel="Cancel Recipient"
        confirmVariant="danger"
        body={`Cancel the voucher for "${confirmAction?.row?.name || ''}"? This recipient will be skipped when the batch is processed.`}
      />
    </>
  )
}

export default VoucherBatchGenerationPage
