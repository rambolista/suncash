import { useEffect, useMemo, useState } from 'react'
import { Card, Nav } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import useCurrentUser from '@/hooks/useCurrentUser'
import { getModulePermission } from '@/utils/modulePermissions'
import CashPromoTab from './components/CashPromoTab'
import PhysicalItemsTab from './components/PhysicalItemsTab'

const TYPE_TABS = [
  { key: 'cash', label: 'Cash Promo Settings', icon: 'cash' },
  { key: 'items', label: 'Physical Items Settings', icon: 'gift' },
]

const PromoSettingsPage = () => {
  const currentUser = useCurrentUser()
  const modulePermission = useMemo(() => getModulePermission(currentUser, '/promotions/settings'), [currentUser])
  const [type, setType] = useState('cash')
  const [islands, setIslands] = useState([])

  useEffect(() => {
    ApiService.getPromoIslands().then((data) => setIslands(Array.isArray(data) ? data : []))
  }, [])

  return (
    <>
      <PageBreadcrumb title="Settings" subtitle="Promotions" />
      <Card>
        <Card.Header className="px-3 pt-3 pb-0 bg-body">
          <div className="customer-profile-tabs-scroll">
            <Nav variant="tabs" activeKey={type} onSelect={(key) => key && setType(key)} className="nav-bordered nav-bordered-primary customer-profile-tabs flex-nowrap">
              {TYPE_TABS.map((tab) => (
                <Nav.Item key={tab.key}>
                  <Nav.Link eventKey={tab.key} className="d-flex align-items-center gap-2">
                    <span
                      className="rounded-circle d-inline-flex align-items-center justify-content-center flex-shrink-0 bg-primary-subtle"
                      style={{ width: 32, height: 32 }}
                    >
                      <Icon icon={tab.icon} className="text-primary" style={{ fontSize: '1rem' }} />
                    </span>
                    <span className="fw-semibold text-nowrap">{tab.label}</span>
                  </Nav.Link>
                </Nav.Item>
              ))}
            </Nav>
          </div>
        </Card.Header>
        <Card.Body>
          {type === 'cash' ? (
            <CashPromoTab editable={modulePermission.can_edit} islands={islands} />
          ) : (
            <PhysicalItemsTab editable={modulePermission.can_edit} />
          )}
        </Card.Body>
      </Card>
    </>
  )
}

export default PromoSettingsPage
