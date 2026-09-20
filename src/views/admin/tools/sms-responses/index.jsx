import { useEffect, useState } from 'react'
import { Card, CardBody, Col, Form, Row } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import ApiService from '@/services/ApiService'
import useCurrentUser from '@/hooks/useCurrentUser'
import { getModulePermission } from '@/utils/modulePermissions'
import { useNotificationContext } from '@/context/useNotificationContext'
import SmsResponseTable from './components/SmsResponseTable'
import EditTemplateModal from './components/EditTemplateModal'

const SmsResponsesPage = () => {
  const currentUser = useCurrentUser()
  const { showNotification } = useNotificationContext()
  const canEdit = Boolean(getModulePermission(currentUser, '/tools/sms-responses').can_edit)

  const [merchants, setMerchants] = useState([])
  const [merchantId, setMerchantId] = useState('0')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [editTarget, setEditTarget] = useState(null)

  useEffect(() => {
    ApiService.getSmsResponseMerchants()
      .then((data) => setMerchants(Array.isArray(data?.data) ? data.data : []))
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load merchants.', variant: 'danger' }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const load = (id = merchantId) => {
    setLoading(true)
    ApiService.getSmsResponses(id)
      .then((data) => setRows(Array.isArray(data?.data) ? data.data : []))
      .catch((err) => {
        setRows([])
        showNotification({ title: 'Failed', message: err?.message || 'SMS templates not found.', variant: 'danger' })
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(merchantId) }, [merchantId]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <PageBreadcrumb title="SMS Responses" subtitle="Tools" />

      <Card className="mb-3">
        <CardBody>
          <p className="text-muted small mb-3">
            Canned SMS reply templates. Rows marked <span className="text-muted">*</span> are inherited from "All Merchants" and haven&apos;t
            been overridden for the selected merchant.
          </p>
          <Row className="g-3">
            <Col md={4}>
              <Form.Label>Merchant</Form.Label>
              <Form.Select value={merchantId} onChange={(e) => setMerchantId(e.target.value)}>
                {merchants.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </Form.Select>
            </Col>
          </Row>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          {loading ? <LoadingState message="Loading SMS templates..." /> : (
            <SmsResponseTable data={rows} canEdit={canEdit} onEdit={setEditTarget} />
          )}
        </CardBody>
      </Card>

      <EditTemplateModal
        show={Boolean(editTarget)}
        onHide={() => setEditTarget(null)}
        row={editTarget}
        merchantId={merchantId}
        onSubmit={(mid, title, content) => ApiService.updateSmsResponse({ merchant_id: mid, response_title: title, message_template: content })}
        onSaved={() => {
          showNotification({ title: 'Success', message: 'Successfully saved template.', variant: 'success' })
          load()
        }}
      />
    </>
  )
}

export default SmsResponsesPage
