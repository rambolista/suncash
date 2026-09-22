import { useEffect, useState } from 'react'
import { Badge, Card, Nav } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import useCurrentUser from '@/hooks/useCurrentUser'
import { getModulePermission } from '@/utils/modulePermissions'
import { useNotificationContext } from '@/context/useNotificationContext'
import CreditCardApprovalTable from './components/CreditCardApprovalTable'
import CardDetailModal from './components/CardDetailModal'

const TABS = [
  { key: 'pending', label: 'Pending', icon: 'clock' },
  { key: 'approved', label: 'Approved', icon: 'circle-check' },
  { key: 'rejected', label: 'Rejected', icon: 'ban' },
]

const CreditCardApprovalPage = () => {
  const currentUser = useCurrentUser()
  const { showNotification } = useNotificationContext()
  const canEdit = Boolean(getModulePermission(currentUser, '/tools/credit-card-approval').can_edit)

  const [tab, setTab] = useState('pending')
  const [rows, setRows] = useState([])
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 })
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [startRejecting, setStartRejecting] = useState(false)

  const load = () => {
    setLoading(true)
    ApiService.getCreditCardApprovals(tab)
      .then((data) => {
        setRows(Array.isArray(data?.data) ? data.data : [])
        setCounts(data?.counts || { pending: 0, approved: 0, rejected: 0 })
      })
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load credit card approval requests.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [tab]) // eslint-disable-line react-hooks/exhaustive-deps

  const openView = (item) => { setSelected(item); setStartRejecting(false) }
  const openReject = (item) => { setSelected(item); setStartRejecting(true) }

  const handleApprove = async (item) => {
    if (!window.confirm('Are you sure you want to approve this request?')) return
    try {
      await ApiService.approveCreditCard(item.id)
      showNotification({ title: 'Success', message: 'Card has been approved.', variant: 'success' })
      load()
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.message || 'Failed to approve card.', variant: 'danger' })
    }
  }

  return (
    <>
      <PageBreadcrumb title="Credit Card Approval" subtitle="Tools" />
      <Card>
        <Card.Header className="px-3 pt-3 pb-0 bg-body">
          <Nav variant="tabs" activeKey={tab} onSelect={(key) => key && setTab(key)} className="nav-bordered nav-bordered-primary flex-nowrap">
            {TABS.map((t) => {
              const isActive = t.key === tab
              return (
                <Nav.Item key={t.key}>
                  <Nav.Link eventKey={t.key} className="d-flex align-items-center gap-2">
                    <span className="rounded-circle d-inline-flex align-items-center justify-content-center flex-shrink-0 bg-primary-subtle" style={{ width: 32, height: 32 }}>
                      <Icon icon={t.icon} className="text-primary" style={{ fontSize: '1rem' }} />
                    </span>
                    <span className="fw-semibold text-nowrap">{t.label}</span>
                    <Badge bg={isActive ? 'primary' : 'light'} text={isActive ? undefined : 'dark'} className="rounded-pill">
                      {counts[t.key]}
                    </Badge>
                  </Nav.Link>
                </Nav.Item>
              )
            })}
          </Nav>
        </Card.Header>
        <Card.Body>
          {loading ? <LoadingState /> : (
            <CreditCardApprovalTable
              key={tab}
              data={rows}
              tab={tab}
              canEdit={canEdit}
              onView={openView}
              onApprove={handleApprove}
              onReject={openReject}
            />
          )}
        </Card.Body>
      </Card>

      <CardDetailModal
        show={Boolean(selected)}
        onHide={() => setSelected(null)}
        card={selected}
        canEdit={canEdit}
        startRejecting={startRejecting}
        onSaved={load}
      />
    </>
  )
}

export default CreditCardApprovalPage
