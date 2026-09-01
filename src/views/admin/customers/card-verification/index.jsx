import { useEffect, useState } from 'react'
import { Badge, Button, Card, Nav } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'
import CardVerificationTable from './components/CardVerificationTable'
import CardDetailPage from './components/CardDetailPage'

const TABS = [
  { key: 'pending', label: 'Pending', icon: 'clock' },
  { key: 'approved', label: 'Approved', icon: 'circle-check' },
  { key: 'rejected', label: 'Rejected History', icon: 'circle-x' },
  { key: 'blacklisted', label: 'Blacklisted', icon: 'ban' },
]

const CardVerificationPage = () => {
  const { showNotification } = useNotificationContext()

  const [tab, setTab] = useState('pending')
  const [rows, setRows] = useState({ pending: [], approved: [], rejected: [], blacklisted: [] })
  const [reasons, setReasons] = useState([])
  const [blacklistReasons, setBlacklistReasons] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState(null)

  const load = () => {
    setLoading(true)
    ApiService.getCardVerifications()
      .then((data) => {
        setRows({
          pending: data?.pending || [],
          approved: data?.approved || [],
          rejected: data?.rejected || [],
          blacklisted: data?.blacklisted || [],
        })
        setReasons(data?.reject_reasons || [])
        setBlacklistReasons(data?.blacklist_reasons || [])
      })
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load card verification requests.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const activeRows = rows[tab] || []

  if (selectedId) {
    return (
      <CardDetailPage
        cardId={selectedId}
        reasons={reasons}
        blacklistReasons={blacklistReasons}
        onBack={() => { setSelectedId(null); load() }}
      />
    )
  }

  return (
    <>
      <PageBreadcrumb title="Card Verification" subtitle="Customers" />
      <Card>
        <Card.Header className="px-3 pt-3 pb-0 bg-body">
          <div className="customer-profile-tabs-scroll">
            <Nav variant="tabs" activeKey={tab} onSelect={(key) => key && setTab(key)} className="nav-bordered nav-bordered-primary customer-profile-tabs flex-nowrap">
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
                        {rows[t.key].length}
                      </Badge>
                    </Nav.Link>
                  </Nav.Item>
                )
              })}
            </Nav>
          </div>
        </Card.Header>
        <Card.Body>
          <div className="d-flex justify-content-end mb-3">
            <Button variant="outline-secondary" size="sm" onClick={load} disabled={loading}>
              <Icon icon="refresh" className="me-1" /> Refresh
            </Button>
          </div>
          {loading ? (
            <LoadingState />
          ) : (
            <CardVerificationTable
              key={tab}
              data={activeRows}
              tab={tab}
              onView={(row) => setSelectedId(row.id)}
            />
          )}
        </Card.Body>
      </Card>
    </>
  )
}

export default CardVerificationPage
