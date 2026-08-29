import { useEffect, useMemo, useState } from 'react'
import { Badge, Card, Nav } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import useCurrentUser from '@/hooks/useCurrentUser'
import { getModulePermission } from '@/utils/modulePermissions'
import { useNotificationContext } from '@/context/useNotificationContext'
import ConfirmActionModal from '../../merchants/components/ConfirmActionModal'
import ProductsTable from './components/ProductsTable'
import ProductTypesModal from './components/ProductTypesModal'

const TABS = [
  { key: 'pending', label: 'Pending', icon: 'clock' },
  { key: 'active', label: 'Active', icon: 'circle-check' },
  { key: 'disabled', label: 'Disabled', icon: 'circle-x' },
]

const GiftcardProductsPage = () => {
  const currentUser = useCurrentUser()
  const { showNotification } = useNotificationContext()
  const modulePermission = useMemo(() => getModulePermission(currentUser, '/giftcards/products'), [currentUser])

  const [tab, setTab] = useState('pending')
  const [rows, setRows] = useState({ pending: [], active: [], disabled: [] })
  const [loading, setLoading] = useState(true)
  const [activeConfirm, setActiveConfirm] = useState(null) // { type: 'activate'|'deactivate', product }
  const [viewingTypesFor, setViewingTypesFor] = useState(null)

  const canEdit = Boolean(modulePermission.can_edit)

  const load = () => {
    setLoading(true)
    ApiService.getGiftcardProducts()
      .then((data) => setRows({ pending: data?.pending || [], active: data?.active || [], disabled: data?.disabled || [] }))
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load giftcard products.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const activeRows = rows[tab] || []

  const confirmConfig = activeConfirm ? {
    activate: {
      title: 'Activate product',
      message: `Are you sure you want to activate "${activeConfirm.product?.product_name}"? This will also activate all of its product types.`,
      confirmLabel: 'Activate',
      confirmVariant: 'success',
      successMessage: 'Product has been activated.',
      run: () => ApiService.activateGiftcardProduct(activeConfirm.product.id),
    },
    deactivate: {
      title: 'Deactivate product',
      message: `Are you sure you want to deactivate "${activeConfirm.product?.product_name}"? This will also deactivate all of its product types.`,
      confirmLabel: 'Deactivate',
      confirmVariant: 'danger',
      successMessage: 'Product has been deactivated.',
      run: () => ApiService.deactivateGiftcardProduct(activeConfirm.product.id),
    },
  }[activeConfirm.type] : null

  return (
    <>
      <PageBreadcrumb title="Products" subtitle="Giftcards" />
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
          {loading ? (
            <LoadingState />
          ) : (
            <ProductsTable
              key={tab}
              data={activeRows}
              tab={tab}
              canEdit={canEdit}
              onActivate={(product) => setActiveConfirm({ type: 'activate', product })}
              onDeactivate={(product) => setActiveConfirm({ type: 'deactivate', product })}
              onViewTypes={(product) => setViewingTypesFor(product)}
            />
          )}
        </Card.Body>
      </Card>

      {confirmConfig && (
        <ConfirmActionModal
          show={Boolean(activeConfirm)}
          onHide={() => setActiveConfirm(null)}
          title={confirmConfig.title}
          message={confirmConfig.message}
          confirmLabel={confirmConfig.confirmLabel}
          confirmVariant={confirmConfig.confirmVariant}
          successMessage={confirmConfig.successMessage}
          onConfirm={confirmConfig.run}
          onDone={load}
        />
      )}

      <ProductTypesModal
        show={Boolean(viewingTypesFor)}
        onHide={() => setViewingTypesFor(null)}
        product={viewingTypesFor}
      />
    </>
  )
}

export default GiftcardProductsPage
