/** Mirrors `PaymentManagementService::ACTIONS`/`STATUS_LABELS` on the backend — keep in sync. */
export const STATUS_LABELS = {
  DRAFT: 'Draft',
  PENDING: 'Pending Verification',
  RETURNED: 'Returned',
  VERIFIED: 'Verified',
  APPROVED: 'Approved',
  PROCESSING: 'Processing',
  PAID: 'Paid',
  FAILED: 'Failed',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
}

// Legend colors are canonical — the legacy summary cards used a slightly different
// shade for "Approved" than its own legend; normalized to one color here.
export const STATUS_COLORS = {
  DRAFT: '#6c757d',
  PENDING: '#fdb515',
  RETURNED: '#f0ad4e',
  VERIFIED: '#3498db',
  APPROVED: '#1578d3',
  PROCESSING: '#7054d8',
  PAID: '#20a34a',
  FAILED: '#e5484d',
  REJECTED: '#dc3545',
  CANCELLED: '#495057',
}

export const LEGEND_STATUSES = ['PENDING', 'VERIFIED', 'APPROVED', 'PROCESSING', 'PAID', 'FAILED']

export const PROCESS_FLOW = [
  { status: 'PENDING', label: 'Pending Verification', icon: 'clipboard-list' },
  { status: 'VERIFIED', label: 'Verified', icon: 'circle-check' },
  { status: 'APPROVED', label: 'Approved', icon: 'thumb-up' },
  { status: 'PROCESSING', label: 'Processing', icon: 'settings' },
  { status: 'PAID', label: 'Paid', icon: 'cash' },
]

/** action => [confirm message (null when a reason is captured instead), button variant, permission flag]. */
export const ACTION_CONFIG = {
  submit: { label: 'Submit', icon: 'send', variant: 'success', permission: 'can_execute', confirmMessage: 'Submit this payment for verification?' },
  verify: { label: 'Verify', icon: 'circle-check', variant: 'primary', permission: 'can_execute', confirmMessage: 'Mark this payment as verified?' },
  return: { label: 'Return', icon: 'corner-up-left', variant: 'warning', permission: 'can_cancel', reasonRequired: true, reasonTitle: 'Return Payment', reasonPrompt: 'Return this payment to draft for correction?' },
  resubmit: { label: 'Resubmit', icon: 'refresh', variant: 'success', permission: 'can_execute', confirmMessage: 'Resubmit this payment for verification?' },
  approve: { label: 'Approve', icon: 'thumb-up', variant: 'primary', permission: 'can_approve', confirmMessage: 'Approve this payment?' },
  reject: { label: 'Reject', icon: 'thumb-down', variant: 'danger', permission: 'can_cancel', reasonRequired: true, reasonTitle: 'Reject Payment', reasonPrompt: 'Reject this payment? Please provide a reason.' },
  process: { label: 'Process', icon: 'settings', variant: 'primary', permission: 'can_execute', confirmMessage: 'Are you sure you want to process this payment?' },
  retry: { label: 'Retry', icon: 'refresh', variant: 'primary', permission: 'can_execute', confirmMessage: 'Retry processing this payment?' },
  cancel: { label: 'Cancel', icon: 'x', variant: 'danger', permission: 'can_cancel', reasonRequired: true, reasonTitle: 'Cancel Payment', reasonPrompt: 'Cancel this payment? Please provide a reason.' },
  clone_draft: { label: 'Save as Draft', icon: 'copy', variant: 'primary', permission: 'can_add', confirmMessage: 'Create a new draft from this rejected payment?' },
}

/** status => ordered action keys shown on that row (before "view"/"history", which every row gets). */
export const STATUS_ACTIONS = {
  DRAFT: ['edit', 'submit', 'cancel'],
  PENDING: ['verify', 'return', 'cancel'],
  RETURNED: ['edit', 'resubmit', 'cancel'],
  VERIFIED: ['approve', 'reject'],
  APPROVED: ['process', 'cancel'],
  FAILED: ['retry', 'cancel'],
  REJECTED: ['clone_draft'],
  PROCESSING: [],
  PAID: [],
  CANCELLED: [],
}
