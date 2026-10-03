import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Card } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import useCurrentUser from '@/hooks/useCurrentUser'
import { getModulePermission } from '@/utils/modulePermissions'
import { useNotificationContext } from '@/context/useNotificationContext'
import TicketPromoModal from './components/TicketPromoModal'
import TicketPromoTable from './components/TicketPromoTable'

const TicketPromoSettingsPage = () => {
  const { showNotification } = useNotificationContext()
  const currentUser = useCurrentUser()
  const permission = useMemo(() => getModulePermission(currentUser, '/promotions/ticket-settings'), [currentUser])
  const [list, setList] = useState(null)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState({ show: false, mode: 'add', row: null })

  const load = () => {
    setLoading(true)
    ApiService.getTicketPromoSettings()
      .then(setList)
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load ticket promos.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const open = (mode, row = null) => setModal({ show: true, mode, row })

  return (
    <>
      <PageBreadcrumb title="Promo Ticket Settings" subtitle="Promotions" />
      <Card>
        <Card.Body>
          {loading && !list ? <LoadingState /> : !list ? null : !list.promo_title ? (
            <Alert variant="warning" className="mb-0">No active promo is configured, so there are no ticket settings to manage.</Alert>
          ) : (
            <>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">{list.promo_title} Ticket Settings</h5>
                {permission.can_add && <Button onClick={() => open('add')}><Icon icon="plus" className="me-1" /> Add Ticket Promo</Button>}
              </div>
              <TicketPromoTable
                data={list.data}
                canEdit={Boolean(permission.can_edit)}
                canAdd={Boolean(permission.can_add)}
                onEdit={(row) => open('edit', row)}
                onCopy={(row) => open('copy', row)}
              />
              <TicketPromoModal
                show={modal.show}
                onHide={() => setModal((m) => ({ ...m, show: false }))}
                mode={modal.mode}
                row={modal.row}
                rows={list.data}
                options={list}
                canDelete={Boolean(permission.can_delete)}
                onSaved={load}
              />
            </>
          )}
        </Card.Body>
      </Card>
    </>
  )
}

export default TicketPromoSettingsPage
