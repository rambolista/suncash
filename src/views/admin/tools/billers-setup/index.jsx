import { useEffect, useMemo, useState } from 'react'
import { Button, Card, CardBody, InputGroup, Form } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import useCurrentUser from '@/hooks/useCurrentUser'
import { getModulePermission } from '@/utils/modulePermissions'
import { useNotificationContext } from '@/context/useNotificationContext'
import BillerCategoryAccordion from './components/BillerCategoryAccordion'

const buildCheckedMap = (groups) => {
  const map = {}
  groups.forEach((group) => group.billers.forEach((biller) => { map[biller.id] = Boolean(biller.is_biller) }))
  return map
}

const BillersSetupPage = () => {
  const currentUser = useCurrentUser()
  const { showNotification } = useNotificationContext()
  const canEdit = Boolean(getModulePermission(currentUser, '/tools/billers-setup').can_edit)

  const [groups, setGroups] = useState([])
  const [checkedMap, setCheckedMap] = useState({})
  const [savedMap, setSavedMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [manualActiveKeys, setManualActiveKeys] = useState([])

  const load = () => {
    setLoading(true)
    ApiService.getBillersSetup()
      .then((data) => {
        const rows = Array.isArray(data?.data) ? data.data : []
        setGroups(rows)
        const map = buildCheckedMap(rows)
        setCheckedMap(map)
        setSavedMap(map)
      })
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load billers.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(load, []) // eslint-disable-line react-hooks/exhaustive-deps

  const filter = search.trim().toLowerCase()

  const filteredGroups = useMemo(() => {
    if (!filter) return groups
    return groups
      .map((group) => ({
        ...group,
        billers: group.billers.filter((b) => `${b.suntag_shortcode} ${b.dba_name}`.toLowerCase().includes(filter)),
      }))
      .filter((group) => group.billers.length > 0)
  }, [groups, filter])

  const activeKeys = filter ? filteredGroups.map((g) => g.name) : manualActiveKeys

  const totalCount = groups.reduce((sum, g) => sum + g.billers.length, 0)
  const selectedCount = Object.values(checkedMap).filter(Boolean).length
  const isDirty = useMemo(() => Object.keys(savedMap).some((id) => Boolean(savedMap[id]) !== Boolean(checkedMap[id])), [savedMap, checkedMap])

  const toggleOne = (id, checked) => setCheckedMap((current) => ({ ...current, [id]: checked }))
  const toggleCategory = (ids, checked) => setCheckedMap((current) => {
    const next = { ...current }
    ids.forEach((id) => { next[id] = checked })
    return next
  })

  const handleSave = () => {
    setSaving(true)
    const selectedIds = Object.keys(checkedMap).filter((id) => checkedMap[id]).map(Number)
    ApiService.saveBillersSetup(selectedIds)
      .then((result) => {
        showNotification({ title: 'Success', message: result?.message || 'Billers updated successfully.', variant: 'success' })
        setSavedMap(checkedMap)
      })
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to save billers.', variant: 'danger' }))
      .finally(() => setSaving(false))
  }

  const handleReset = () => setCheckedMap(savedMap)

  return (
    <>
      <PageBreadcrumb title="Billers Setup" subtitle="Tools" />

      <Card>
        <CardBody>
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
            <div>
              <p className="text-muted small mb-0">
                Choose which approved merchants appear as Bills Payment billers.
              </p>
              <p className="text-muted small mb-0">
                <strong>{selectedCount}</strong> of <strong>{totalCount}</strong> selected
                {isDirty && <span className="text-warning ms-2"><Icon icon="alert-triangle" className="me-1" />Unsaved changes</span>}
              </p>
            </div>
            {canEdit && (
              <div className="d-flex gap-2">
                {isDirty && (
                  <Button variant="outline-secondary" onClick={handleReset} disabled={saving}>
                    Reset
                  </Button>
                )}
                <Button variant="primary" onClick={handleSave} disabled={saving || !isDirty}>
                  <Icon icon="device-floppy" className="me-1" /> {saving ? 'Saving...' : 'Save Billers'}
                </Button>
              </div>
            )}
          </div>

          <InputGroup className="mb-3">
            <InputGroup.Text><Icon icon="search" /></InputGroup.Text>
            <Form.Control
              placeholder="Search billers by shortcode or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <Button variant="outline-secondary" onClick={() => setSearch('')}>
                <Icon icon="x" />
              </Button>
            )}
          </InputGroup>

          {loading ? <LoadingState message="Loading billers..." /> : (
            filteredGroups.length === 0 ? (
              <div className="text-center text-muted py-5">No billers match your search.</div>
            ) : (
              <BillerCategoryAccordion
                groups={filteredGroups}
                checkedMap={checkedMap}
                canEdit={canEdit}
                activeKeys={activeKeys}
                onActiveKeysChange={setManualActiveKeys}
                onToggleOne={toggleOne}
                onToggleCategory={toggleCategory}
              />
            )
          )}
        </CardBody>
      </Card>
    </>
  )
}

export default BillersSetupPage
