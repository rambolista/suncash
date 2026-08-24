import Icon from '@/components/wrappers/Icon'
import { useNotificationContext } from '@/context/useNotificationContext'
import ApiService from '@/services/ApiService'
import { useEffect, useMemo, useState } from 'react'
import { Alert, Badge, Button, Card, Col, ListGroup, Row, Spinner } from 'react-bootstrap'
import DeleteConfirmationModal from './DeleteConfirmationModal'
import DuplicateLandingPageModal from './DuplicateLandingPageModal'
import LandingItemModal from './LandingItemModal'
import LandingPageModal from './LandingPageModal'
import LandingSectionModal from './LandingSectionModal'

const getPayloadData = (response) =>
  response?.landing_page ?? response?.section ?? response?.item ?? response?.data ?? response

const LandingPageSetup = ({ landingPages = [], loading, onReload }) => {
  const { showNotification } = useNotificationContext()
  const [selectedPageId, setSelectedPageId] = useState(null)
  const [pageDetails, setPageDetails] = useState(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [modal, setModal] = useState(null)
  const [editing, setEditing] = useState(null)
  const [activeSection, setActiveSection] = useState(null)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => {
    if (!selectedPageId && landingPages.length) setSelectedPageId(landingPages[0].id)
    if (selectedPageId && !landingPages.some((page) => page.id === selectedPageId)) {
      setSelectedPageId(landingPages[0]?.id ?? null)
    }
  }, [landingPages, selectedPageId])

  const loadPageDetails = async (pageId = selectedPageId) => {
    if (!pageId) {
      setPageDetails(null)
      return
    }
    setDetailsLoading(true)
    try {
      const response = await ApiService.getLandingPage(pageId)
      setPageDetails(getPayloadData(response))
    } catch (error) {
      showNotification({ title: 'Failed', message: error?.message ?? 'Unable to load the landing page.', variant: 'danger' })
    } finally {
      setDetailsLoading(false)
    }
  }

  useEffect(() => {
    loadPageDetails(selectedPageId)
  }, [selectedPageId])

  const sections = useMemo(
    () => [...(pageDetails?.sections ?? [])].sort((a, b) => a.sort_order - b.sort_order),
    [pageDetails],
  )

  const closeModal = () => {
    setModal(null)
    setEditing(null)
    setActiveSection(null)
    setErrors({})
  }

  const savePage = async (form) => {
    setSaving(true)
    setErrors({})
    try {
      const response = editing
        ? await ApiService.updateLandingPage(editing.id, form)
        : await ApiService.createLandingPage(form)
      const saved = getPayloadData(response)
      showNotification({ title: 'Success', message: `Landing page ${editing ? 'updated' : 'created'}.`, variant: 'success' })
      closeModal()
      await onReload()
      if (saved?.id) {
        setSelectedPageId(saved.id)
        await loadPageDetails(saved.id)
      }
    } catch (error) {
      setErrors(error?.errors ?? {})
      showNotification({ title: 'Failed', message: error?.message ?? 'Unable to save the landing page.', variant: 'danger' })
    } finally {
      setSaving(false)
    }
  }

  const saveSection = async (payload) => {
    setSaving(true)
    setErrors({})
    try {
      if (editing) await ApiService.updateLandingSection(selectedPageId, editing.id, payload)
      else await ApiService.createLandingSection(selectedPageId, payload)
      showNotification({ title: 'Success', message: `Section ${editing ? 'updated' : 'created'}.`, variant: 'success' })
      closeModal()
      await loadPageDetails()
    } catch (error) {
      setErrors(error?.errors ?? {})
      showNotification({ title: 'Failed', message: error?.message ?? 'Unable to save the section.', variant: 'danger' })
    } finally {
      setSaving(false)
    }
  }

  const duplicatePage = async (form) => {
    setSaving(true)
    setErrors({})
    try {
      const response = await ApiService.duplicateLandingPage(editing.id, form)
      const saved = getPayloadData(response)
      showNotification({ title: 'Success', message: 'Landing page copied as a draft.', variant: 'success' })
      closeModal()
      await onReload()
      if (saved?.id) setSelectedPageId(saved.id)
    } catch (error) {
      setErrors(error?.errors ?? {})
      showNotification({ title: 'Failed', message: error?.message ?? 'Unable to copy the landing page.', variant: 'danger' })
    } finally {
      setSaving(false)
    }
  }

  const saveItem = async (payload) => {
    setSaving(true)
    setErrors({})
    try {
      if (editing) {
        await ApiService.updateLandingSectionItem(selectedPageId, activeSection.id, editing.id, payload)
      } else {
        await ApiService.createLandingSectionItem(selectedPageId, activeSection.id, payload)
      }
      showNotification({ title: 'Success', message: `Section item ${editing ? 'updated' : 'created'}.`, variant: 'success' })
      closeModal()
      await loadPageDetails()
    } catch (error) {
      setErrors(error?.errors ?? {})
      showNotification({ title: 'Failed', message: error?.message ?? 'Unable to save the section item.', variant: 'danger' })
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setSaving(true)
    try {
      if (deleteTarget.kind === 'page') await ApiService.deleteLandingPage(deleteTarget.value.id)
      if (deleteTarget.kind === 'section') {
        await ApiService.deleteLandingSection(selectedPageId, deleteTarget.value.id)
      }
      if (deleteTarget.kind === 'item') {
        await ApiService.deleteLandingSectionItem(
          selectedPageId,
          deleteTarget.value.landing_page_section_id,
          deleteTarget.value.id,
        )
      }
      showNotification({ title: 'Deleted', message: `${deleteTarget.label} deleted.`, variant: 'success' })
      setDeleteTarget(null)
      if (deleteTarget.kind === 'page') await onReload()
      else await loadPageDetails()
    } catch (error) {
      showNotification({ title: 'Failed', message: error?.message ?? `Unable to delete ${deleteTarget.label.toLowerCase()}.`, variant: 'danger' })
    } finally {
      setSaving(false)
    }
  }

  const reorder = async (kind, values, index, direction, parentId) => {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= values.length) return
    const reordered = [...values]
    ;[reordered[index], reordered[nextIndex]] = [reordered[nextIndex], reordered[index]]
    try {
      const positions = reordered.map((entry, sortOrder) => ({
        id: entry.id,
        sort_order: sortOrder,
      }))
      if (kind === 'section') {
        await ApiService.reorderLandingSections(selectedPageId, positions)
      } else {
        await ApiService.reorderLandingSectionItems(selectedPageId, parentId, positions)
      }
      await loadPageDetails()
    } catch (error) {
      showNotification({ title: 'Failed', message: error?.message ?? 'Unable to reorder content.', variant: 'danger' })
    }
  }

  return (
    <>
      <Row>
        <Col xl={3}>
          <Card>
            <Card.Header className="d-flex align-items-center justify-content-between">
              <h5 className="mb-0">Landing Pages</h5>
              <Button size="sm" onClick={() => setModal('page')}><Icon icon="plus" /></Button>
            </Card.Header>
            <ListGroup variant="flush">
              {loading && <ListGroup.Item className="text-center"><Spinner size="sm" /></ListGroup.Item>}
              {!loading && !landingPages.length && <ListGroup.Item className="text-muted">No landing pages yet.</ListGroup.Item>}
              {landingPages.map((page) => (
                <ListGroup.Item
                  key={page.id}
                  action
                  active={page.id === selectedPageId}
                  onClick={() => setSelectedPageId(page.id)}
                  className="d-flex justify-content-between align-items-center gap-2"
                >
                  <span className="text-truncate">{page.name}</span>
                  <Badge bg={page.status === 'published' && page.is_active ? 'success' : 'secondary'}>
                    {page.status === 'published' && page.is_active ? 'Live' : 'Draft'}
                  </Badge>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Card>
        </Col>
        <Col xl={9}>
          {!selectedPageId && <Alert variant="info">Create a landing page to start building sections.</Alert>}
          {selectedPageId && detailsLoading && <div className="text-center py-5"><Spinner /></div>}
          {selectedPageId && !detailsLoading && pageDetails && (
            <>
              <Card>
                <Card.Body className="d-flex flex-wrap align-items-start justify-content-between gap-3">
                  <div>
                    <div className="d-flex align-items-center gap-2">
                      <h4 className="mb-1">{pageDetails.name}</h4>
                      <Badge bg={pageDetails.status === 'published' && pageDetails.is_active ? 'success' : 'secondary'}>
                        {pageDetails.status === 'published' && pageDetails.is_active ? 'Published' : 'Draft'}
                      </Badge>
                    </div>
                    <div className="text-muted">/{pageDetails.slug}</div>
                    {pageDetails.description && <p className="mb-0 mt-2">{pageDetails.description}</p>}
                  </div>
                  <div className="d-flex gap-2">
                    <Button variant="outline-secondary" onClick={() => { setEditing(pageDetails); setModal('duplicate') }}>Duplicate</Button>
                    <Button variant="outline-primary" onClick={() => { setEditing(pageDetails); setModal('page') }}>Edit Page</Button>
                    <Button variant="outline-danger" onClick={() => setDeleteTarget({ kind: 'page', value: pageDetails, label: 'Landing page' })}>Delete</Button>
                  </div>
                </Card.Body>
              </Card>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h5 className="mb-0">Page Sections</h5>
                <Button onClick={() => setModal('section')}><Icon icon="plus" className="me-1" /> Add Section</Button>
              </div>
              {!sections.length && <Alert variant="secondary">This page has no sections.</Alert>}
              {sections.map((section, sectionIndex) => {
                const items = [...(section.items ?? [])].sort((a, b) => a.sort_order - b.sort_order)
                const isCarousel = section.type === 'carousel'
                const isFaq = section.type === 'faq'
                const itemLabel = isCarousel ? 'Slide' : isFaq ? 'FAQ' : 'Item'
                return (
                  <Card key={section.id}>
                    <Card.Header className="d-flex flex-wrap align-items-center justify-content-between gap-2">
                      <div className="d-flex align-items-center gap-2">
                        <Badge bg="primary">{section.type}</Badge>
                        <strong>{section.title || 'Untitled section'}</strong>
                        {!section.is_enabled && <Badge bg="secondary">Hidden</Badge>}
                      </div>
                      <div className="d-flex gap-1">
                        <Button size="sm" variant="light" disabled={sectionIndex === 0} onClick={() => reorder('section', sections, sectionIndex, -1)}><Icon icon="arrow-up" /></Button>
                        <Button size="sm" variant="light" disabled={sectionIndex === sections.length - 1} onClick={() => reorder('section', sections, sectionIndex, 1)}><Icon icon="arrow-down" /></Button>
                        <Button size="sm" variant="outline-primary" onClick={() => { setEditing(section); setModal('section') }}>Edit</Button>
                        <Button size="sm" variant="outline-danger" onClick={() => setDeleteTarget({ kind: 'section', value: section, label: 'Section' })}>Delete</Button>
                      </div>
                    </Card.Header>
                    <Card.Body>
                      {section.subtitle && <p className="text-muted">{section.subtitle}</p>}
                      {section.image_url && <img src={section.image_url} alt="" className="rounded mb-3" style={{ width: 120, height: 80, objectFit: 'cover' }} />}
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <strong>{itemLabel}s</strong>
                        <Button size="sm" variant="outline-primary" onClick={() => { setActiveSection(section); setModal('item') }}>
                          <Icon icon="plus" className="me-1" /> Add {itemLabel}
                        </Button>
                      </div>
                      {!items.length && <div className="text-muted">No {itemLabel.toLowerCase()}s in this section.</div>}
                      {items.map((item, itemIndex) => (
                        <div key={item.id} className="border rounded p-2 mb-2 d-flex align-items-center justify-content-between gap-2">
                          <div className="d-flex align-items-center gap-2 min-w-0">
                            {item.image_url && <img src={item.image_url} alt="" className="rounded" style={{ width: 48, height: 48, objectFit: 'cover' }} />}
                            <div className="text-truncate">
                              <div className="fw-semibold">{item.title}</div>
                              <small className="text-muted">{item.link_label || item.subtitle}</small>
                            </div>
                          </div>
                          <div className="d-flex gap-1">
                            <Button size="sm" variant="light" disabled={itemIndex === 0} onClick={() => reorder('item', items, itemIndex, -1, section.id)}><Icon icon="arrow-up" /></Button>
                            <Button size="sm" variant="light" disabled={itemIndex === items.length - 1} onClick={() => reorder('item', items, itemIndex, 1, section.id)}><Icon icon="arrow-down" /></Button>
                            <Button size="sm" variant="outline-primary" onClick={() => { setActiveSection(section); setEditing(item); setModal('item') }}>Edit</Button>
                            <Button size="sm" variant="outline-danger" onClick={() => setDeleteTarget({ kind: 'item', value: item, label: 'Section item' })}>Delete</Button>
                          </div>
                        </div>
                      ))}
                    </Card.Body>
                  </Card>
                )
              })}
            </>
          )}
        </Col>
      </Row>

      <LandingPageModal show={modal === 'page'} page={editing} saving={saving} errors={errors} onHide={closeModal} onSave={savePage} />
      <DuplicateLandingPageModal show={modal === 'duplicate'} page={editing} landingPages={landingPages} saving={saving} errors={errors} onHide={closeModal} onSave={duplicatePage} />
      <LandingSectionModal show={modal === 'section'} section={editing} saving={saving} errors={errors} onHide={closeModal} onSave={saveSection} />
      <LandingItemModal show={modal === 'item'} section={activeSection} item={editing} saving={saving} errors={errors} onHide={closeModal} onSave={saveItem} />
      <DeleteConfirmationModal
        show={Boolean(deleteTarget)}
        title={`Delete ${deleteTarget?.label ?? 'item'}?`}
        message={`This permanently deletes the selected ${deleteTarget?.label?.toLowerCase() ?? 'item'} and its managed media.`}
        deleting={saving}
        onHide={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </>
  )
}

export default LandingPageSetup
