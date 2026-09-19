import { useEffect, useState } from 'react'
import { Button, Card, CardBody, Col, Form, Row, Table } from 'react-bootstrap'
import QRCode from 'qrcode'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'
import { money, formatDateTime } from '@/utils/reportHelpers'
import { printReceiptHtml } from '@/utils/printReceipt'
import logo from '@/assets/images/logo-black.png'

const KioskReprintReceiptPage = () => {
  const { showNotification } = useNotificationContext()
  const [types, setTypes] = useState([])
  const [transactionType, setTransactionType] = useState('')
  const [transactionId, setTransactionId] = useState('')
  const [searching, setSearching] = useState(false)
  const [printing, setPrinting] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    ApiService.getKioskReprintReceiptTypes()
      .then((data) => {
        const list = Array.isArray(data?.types) ? data.types : []
        setTypes(list)
        if (list.length) setTransactionType(list[0].value)
      })
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load transaction types.', variant: 'danger' }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSearch = (event) => {
    event.preventDefault()
    if (!transactionId.trim() || !transactionType) {
      showNotification({ title: 'Invalid search', message: 'Please check your field(s).', variant: 'danger' })
      return
    }

    setSearching(true)
    setResult(null)
    ApiService.searchKioskReprintReceipt(transactionId.trim(), transactionType)
      .then(setResult)
      .catch((err) => showNotification({ title: 'No records found', message: err?.message || 'No records found.', variant: 'danger' }))
      .finally(() => setSearching(false))
  }

  const buildReceiptHtml = async ({ brand, terminal, lines, footer, qr_payload: qrPayload }) => {
    let qrImg = ''
    if (qrPayload) {
      try {
        const dataUrl = await QRCode.toDataURL(qrPayload, { width: 160, margin: 1 })
        qrImg = `<div style="text-align:center;margin-top:10px;"><img src="${dataUrl}" alt="QR code" /></div>`
      } catch {
        qrImg = ''
      }
    }

    const rows = lines.map(({ label, text }) => `
      <div style="padding:0 5px;">
        <span style="font-size:12pt;font-family:Arial;display:inline-block;width:41%;">${label}</span>
        <span style="font-size:12pt;font-family:Arial;font-weight:bold;text-align:right;display:inline-block;width:55%;">${text ?? ''}</span>
      </div>
    `).join('')

    return `
      <div style="text-align:center;font-family:Arial;">
        <img src="${logo}" alt="SunCash" style="margin-top:20px;max-width:160px;" />
        <div style="font-size:12pt;font-weight:bold;margin:8px 0;">${brand || ''} — ${terminal || ''}</div>
        <div style="border-top:1px dashed #000;margin:6px 0;"></div>
        ${rows}
        ${qrImg}
        <div style="border-top:1px dashed #000;margin:10px 0;"></div>
        <div style="font-size:11pt;">How to reach customer service</div>
        <div style="font-size:11pt;">Phone: (242) 393 4777</div>
        <div style="font-size:11pt;">Whatsapp: (242) 801 4744</div>
        <div style="font-size:11pt;">Email: fastpay@mysuncash.com</div>
        ${footer ? footer.map((line) => `<div style="font-size:11pt;">${line}</div>`).join('') : ''}
      </div>
    `
  }

  const handlePrint = async () => {
    setPrinting(true)
    try {
      const receipt = await ApiService.getKioskReprintReceipt(transactionId.trim(), transactionType)
      const html = await buildReceiptHtml(receipt)
      printReceiptHtml(html, 'Kiosk Receipt')
    } catch (err) {
      showNotification({ title: 'Unable to reprint receipt', message: err?.message || 'Unable to reprint receipt.', variant: 'danger' })
    } finally {
      setPrinting(false)
    }
  }

  return (
    <>
      <PageBreadcrumb title="Reprint Receipt" subtitle="Kiosk" />

      <Card>
        <CardBody>
          <p className="text-muted small mb-3">
            Search a kiosk transaction by type and ID, then reprint its receipt. This opens your browser's print
            dialog — the same as printing any other page.
          </p>

          <Form onSubmit={handleSearch}>
            <Row className="g-3 align-items-end">
              <Col md={4}>
                <Form.Label>Transaction Type</Form.Label>
                <Form.Select value={transactionType} onChange={(e) => setTransactionType(e.target.value)}>
                  {types.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                </Form.Select>
              </Col>
              <Col md={4}>
                <Form.Label>Transaction ID</Form.Label>
                <Form.Control value={transactionId} onChange={(e) => setTransactionId(e.target.value)} placeholder="Enter transaction ID" />
              </Col>
              <Col md={2}>
                <Button type="submit" variant="success" className="w-100" disabled={searching}>
                  {searching ? 'Searching...' : 'Search Transaction'}
                </Button>
              </Col>
            </Row>
          </Form>

          {result && (
            <div className="table-responsive mt-4">
              <Table bordered size="sm" className="align-middle mb-0">
                <thead>
                  <tr>
                    <th>Date/Time</th>
                    <th>Kiosk</th>
                    <th>Location</th>
                    <th>Product</th>
                    <th>Transaction ID</th>
                    <th>Customer/Account No</th>
                    <th>Cash Received</th>
                    <th>Total Fees</th>
                    <th>Product Amount</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="text-nowrap">{formatDateTime(result.settlement_time)}</td>
                    <td>{result.terminal}</td>
                    <td>{result.location}</td>
                    <td>{result.brand}</td>
                    <td>{result.transaction_id}</td>
                    <td>{result.customer_number}</td>
                    <td>{money(result.total_amount_receive)}</td>
                    <td>{money(result.total_fees)}</td>
                    <td>{money(result.product_amount)}</td>
                    <td>
                      <Button size="sm" variant="primary" onClick={handlePrint} disabled={printing}>
                        {printing ? 'Preparing...' : 'Print'}
                      </Button>
                    </td>
                  </tr>
                </tbody>
              </Table>
            </div>
          )}
        </CardBody>
      </Card>
    </>
  )
}

export default KioskReprintReceiptPage
