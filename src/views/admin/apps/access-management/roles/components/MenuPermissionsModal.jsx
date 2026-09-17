import { useEffect, useState } from 'react'
import { Button, Form, Modal, Spinner, Table } from 'react-bootstrap'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'
import { MENU_ACTIONS } from '@/utils/menuPermissions'
import LoadingState from '@/components/LoadingState'

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Takes a flat list of menus (from /roles/{id}/menu-permissions) and returns
 * them in a display order: section headers first, then their children,
 * then grandchildren indented. Menus without a section header go at the end.
 */
const buildDisplayRows = (flat) => {
  const result = []
  const placed = new Set()

  const titleItems = flat.filter((m) => m.is_title)
  const linkItems  = flat.filter((m) => !m.is_title)

  const appendMenu = (menu, depth) => {
    result.push({ ...menu, _depth: depth, _isHeader: false, _isTab: false })
    placed.add(menu.menu_id)
    ;(menu.tabs || []).forEach((tab) => {
      result.push({
        ...tab,
        menu_id: menu.menu_id,
        _depth: depth + 1,
        _isHeader: false,
        _isTab: true,
      })
    })
  }

  for (const title of titleItems) {
    result.push({ ...title, _depth: 0, _isHeader: true })
    placed.add(title.menu_id)

    const firstLevel = linkItems.filter((m) => m.parent_id === title.menu_id)
    for (const child of firstLevel) {
      appendMenu(child, 1)
      const secondLevel = linkItems.filter((m) => m.parent_id === child.menu_id)
      for (const gc of secondLevel) {
        appendMenu(gc, 2)
      }
    }
  }

  // Any items not yet placed (orphans)
  linkItems.filter((m) => !placed.has(m.menu_id)).forEach((m) => appendMenu(m, 1))

  return result
}

// ── MenuPermissionsModal ─────────────────────────────────────────────────────

const MenuPermissionsModal = ({ show, onHide, role, readOnly = false }) => {
  const { showNotification } = useNotificationContext()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const notify = (variant, message) =>
    showNotification({ title: variant === 'success' ? 'Success' : 'Failed', message, variant })

  useEffect(() => {
    if (!show || !role) return
    setLoading(true)
    setRows([])
    ApiService.getRoleMenuPermissions(role.id)
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch(() => notify('danger', 'Failed to load permissions.'))
      .finally(() => setLoading(false))
  }, [show, role])

  const toggle = (menuId, perm) =>
    setRows((prev) =>
      prev.map((r) => r.menu_id === menuId ? { ...r, [perm]: !r[perm] } : r)
    )

  const toggleAll = (perm, value) =>
    setRows((prev) => {
      const { capability } = MENU_ACTIONS.find(({ key }) => key === perm)
      return prev.map((r) => {
        const next = r.is_title || !r[capability] ? r : { ...r, [perm]: value }
        if (!r.tabs?.length) return next
        return { ...next, tabs: r.tabs.map((tab) => tab[capability] ? { ...tab, [perm]: value } : tab) }
      })
    })

  const toggleTab = (menuId, tabId, permission) =>
    setRows((prev) => prev.map((row) => row.menu_id !== menuId ? row : {
      ...row,
      tabs: (row.tabs || []).map((tab) => tab.tab_id === tabId ? { ...tab, [permission]: !tab[permission] } : tab),
    }))

  const handleSave = async () => {
    setSaving(true)
    try {
      const permissions = rows
        .filter((r) => !r.is_title)
        .map((row) => ({
          menu_id: row.menu_id,
          ...MENU_ACTIONS.reduce((values, { key }) => ({ ...values, [key]: Boolean(row[key]) }), {}),
        }))
      const tabPermissions = rows.flatMap((row) =>
        (row.tabs || []).map((tab) => ({
          tab_id: tab.tab_id,
          ...MENU_ACTIONS.reduce((values, { key }) => ({ ...values, [key]: Boolean(tab[key]) }), {}),
        }))
      )
      await ApiService.saveRoleMenuPermissions(role.id, permissions, tabPermissions)
      notify('success', 'Permissions saved successfully.')
    } catch {
      notify('danger', 'Failed to save permissions.')
    } finally {
      setSaving(false)
    }
  }

  const displayed = buildDisplayRows(rows)

  return (
    <Modal
      show={show}
      onHide={onHide}
      className="fade modal-full-width menu-permissions-modal"
      dialogClassName="modal-full-width modal-dialog-scrollable"
      backdrop="static"
    >
      <Modal.Header closeButton className="bg-dark text-white">
        <Modal.Title>
          Menu Access Control &mdash;&nbsp;
          <span className="text-warning fw-bold">{role?.name}</span>
          {readOnly && <span className="text-muted small ms-2">(View Only)</span>}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-0">
        {loading ? (
          <LoadingState minHeight={200} />
        ) : (
          <div className="menu-permissions-table-wrapper">
            <Table bordered hover size="sm" className="mb-0 align-middle menu-permissions-table">
              <thead className="menu-permissions-table-head">
                <tr>
                  <th style={{ minWidth: 280 }}>Menu / Page</th>
                  {MENU_ACTIONS.map(({ key, label, capability }) => {
                    const eligible = [
                      ...rows.filter((r) => !r.is_title && r[capability]),
                      ...rows.flatMap((r) => (r.tabs || []).filter((tab) => tab[capability])),
                    ]
                    const allOn = eligible.length > 0 && eligible.every((r) => r[key])
                    const someOn = !allOn && eligible.some((r) => r[key])
                    return (
                      <th key={key} className="text-center" style={{ width: 100, minWidth: 100 }}>
                        <div className="fw-bold">{label}</div>
                        <Form.Check
                          type="checkbox"
                          className="d-inline-block mt-1"
                          checked={allOn}
                          disabled={readOnly || eligible.length === 0}
                          ref={(el) => { if (el) el.indeterminate = someOn }}
                          onChange={() => toggleAll(key, !allOn)}
                          aria-label={`Toggle all ${label}`}
                        />
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {displayed.length === 0 && (
                  <tr>
                    <td colSpan={MENU_ACTIONS.length + 1} className="text-center text-muted py-4">
                      No menus available.
                    </td>
                  </tr>
                )}
                {displayed.map((row) =>
                  row._isHeader ? (
                    <tr key={`hdr-${row.menu_id}`} className="table-secondary">
                      <td
                        colSpan={MENU_ACTIONS.length + 1}
                        className="fw-bold text-uppercase small text-muted"
                        style={{ letterSpacing: '0.08em', paddingLeft: 12 }}
                      >
                        {row.label}
                      </td>
                    </tr>
                  ) : row._isTab ? (
                    <tr key={`tab-${row.tab_id}`} className="bg-body-tertiary">
                      <td style={{ paddingLeft: 24 + (row._depth * 24) }}>
                        <span className="text-muted me-2">↳</span>
                        <span className="small">{row.label}</span>
                        <code className="ms-2 text-muted small">{row.key}</code>
                      </td>
                      {MENU_ACTIONS.map(({ key, capability }) => (
                        <td key={key} className="text-center">
                          {row[capability] ? (
                            <Form.Check
                              type="checkbox"
                              checked={Boolean(row[key])}
                              disabled={readOnly}
                              onChange={() => toggleTab(row.menu_id, row.tab_id, key)}
                              className="d-inline-block"
                              aria-label={`${key} ${row.label} tab`}
                            />
                          ) : <span className="text-muted">—</span>}
                        </td>
                      ))}
                    </tr>
                  ) : (
                    <tr key={row.menu_id}>
                      <td style={{ paddingLeft: row._depth === 2 ? 48 : 24 }}>
                        <span className="small fw-medium">{row.label}</span>
                        <code className="ms-2 text-muted small">{row.slug}</code>
                      </td>
                      {MENU_ACTIONS.map(({ key, capability }) => (
                        <td key={key} className="text-center">
                          {row[capability] ? (
                            <Form.Check
                              type="checkbox"
                              checked={Boolean(row[key])}
                              disabled={readOnly}
                              onChange={() => toggle(row.menu_id, key)}
                              className="d-inline-block"
                              aria-label={`${key} ${row.label}`}
                            />
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  )
                )}
              </tbody>
            </Table>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={saving}>Close</Button>
        {!readOnly && (
          <Button variant="primary" onClick={handleSave} disabled={saving || loading}>
            {saving ? (
              <><Spinner animation="border" size="sm" className="me-1" />Saving...</>
            ) : (
              'Save permissions'
            )}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  )
}

export default MenuPermissionsModal
