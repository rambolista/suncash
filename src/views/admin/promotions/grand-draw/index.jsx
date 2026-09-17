import { useEffect, useState } from 'react'
import { Button, Card, CardBody } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import useCurrentUser from '@/hooks/useCurrentUser'
import { getModulePermission } from '@/utils/modulePermissions'
import { useNotificationContext } from '@/context/useNotificationContext'
import WinnersModal from './components/WinnersModal'

const GrandDrawPage = () => {
  const currentUser = useCurrentUser()
  const { showNotification } = useNotificationContext()
  const canExecute = Boolean(getModulePermission(currentUser, '/promotions/grand-draw').can_execute)

  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [winners, setWinners] = useState([])
  const [showWinners, setShowWinners] = useState(false)

  const loadStatus = () => {
    setLoading(true)
    ApiService.getGrandDrawStatus()
      .then(setStatus)
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load the grand draw status.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadStatus() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleRun = () => {
    setRunning(true)
    ApiService.runGrandDraw()
      .then((data) => {
        setWinners(Array.isArray(data?.winners) ? data.winners : [])
        setShowWinners(true)
        loadStatus()
      })
      .catch((err) => showNotification({ title: 'Unable to run the draw', message: err?.message || 'Unable to run the draw.', variant: 'danger' }))
      .finally(() => setRunning(false))
  }

  const handleShowWinners = () => {
    ApiService.getGrandDrawWinners()
      .then((data) => {
        setWinners(Array.isArray(data?.winners) ? data.winners : [])
        setShowWinners(true)
      })
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load the winner.', variant: 'danger' }))
  }

  return (
    <>
      <PageBreadcrumb title="Grand Draw" subtitle="Promotions" />

      <Card>
        <CardBody className="text-center py-5">
          {loading ? (
            <LoadingState message="Loading grand draw status..." />
          ) : (
            <>
              <h4 className="mb-1">{status?.promo_title || 'Grand Draw'}</h4>
              <p className="text-muted mb-4">
                {status?.promo_active
                  ? 'Randomly draws one eligible customer per configured island for today’s scheduled prize(s).'
                  : 'This promotion is not currently active.'}
              </p>
              <div className="d-flex justify-content-center gap-2">
                <Button variant="danger" size="lg" disabled={!canExecute || !status?.can_run || running} onClick={handleRun}>
                  <Icon icon="trophy" className="me-1" /> {running ? 'Running...' : 'RUN'}
                </Button>
                <Button variant="outline-secondary" size="lg" disabled={!status?.can_show} onClick={handleShowWinners}>
                  <Icon icon="eye" className="me-1" /> Show Winner
                </Button>
              </div>
            </>
          )}
        </CardBody>
      </Card>

      <WinnersModal show={showWinners} onHide={() => setShowWinners(false)} winners={winners} />
    </>
  )
}

export default GrandDrawPage
