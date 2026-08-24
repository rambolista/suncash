export const MENU_ACTIONS = [
  { key: 'can_view', capability: 'supports_view', label: 'View', defaultSupported: true },
  { key: 'can_add', capability: 'supports_add', label: 'Add', defaultSupported: true },
  { key: 'can_edit', capability: 'supports_edit', label: 'Edit', defaultSupported: true },
  { key: 'can_delete', capability: 'supports_delete', label: 'Delete', defaultSupported: true },
  { key: 'can_approve', capability: 'supports_approve', label: 'Approve', defaultSupported: false },
  { key: 'can_execute', capability: 'supports_execute', label: 'Execute', defaultSupported: false },
  { key: 'can_cancel', capability: 'supports_cancel', label: 'Cancel', defaultSupported: false },
  { key: 'can_reverse', capability: 'supports_reverse', label: 'Reverse', defaultSupported: false },
  { key: 'can_export', capability: 'supports_export', label: 'Export', defaultSupported: false },
  { key: 'can_print', capability: 'supports_print', label: 'Print', defaultSupported: false },
]

export const DEFAULT_MENU_CAPABILITIES = MENU_ACTIONS.reduce((defaults, action) => ({
  ...defaults,
  [action.capability]: action.defaultSupported,
}), {})
