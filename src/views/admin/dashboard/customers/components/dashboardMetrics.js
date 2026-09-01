export const dashboardMetrics = [
  {
    key: 'customers',
    label: 'Total Customers',
    description: 'All customer records in the system.',
    icon: 'users',
    route: '/customers/archive',
    colorClass: 'text-primary',
    bgClass: 'bg-primary-subtle',
  },
  {
    key: 'active',
    label: 'Active Customers',
    description: 'Customers currently active and able to transact.',
    icon: 'circle-check',
    route: '/customers/archive',
    colorClass: 'text-success',
    bgClass: 'bg-success-subtle',
  },
  {
    key: 'inactive',
    label: 'Inactive Customers',
    description: 'Customers suspended, rejected, or archived.',
    icon: 'ban',
    route: '/customers/archive',
    colorClass: 'text-danger',
    bgClass: 'bg-danger-subtle',
  },
  {
    key: 'verified',
    label: 'Verified Customers',
    description: 'Customers with a fully approved KYC upgrade.',
    icon: 'clipboard-check',
    route: '/customers/kyc-upgrade',
    colorClass: 'text-info',
    bgClass: 'bg-info-subtle',
  },
  {
    key: 'pending',
    label: 'Pending Verification',
    description: 'Customers awaiting KYC upgrade approval.',
    icon: 'hourglass-empty',
    route: '/customers/kyc-upgrade',
    colorClass: 'text-warning',
    bgClass: 'bg-warning-subtle',
  },
]

export const accountStatusMetrics = [
  {
    key: 'active',
    label: 'Active',
    route: '/customers/archive',
    chartColor: 'success',
  },
  {
    key: 'inactive',
    label: 'Inactive',
    route: '/customers/archive',
    chartColor: 'danger',
  },
]

export const customerTypeMetrics = [
  {
    key: 'new',
    label: 'New',
    route: '/customers/archive',
    chartColor: 'info',
  },
  {
    key: 'existing',
    label: 'Existing',
    route: '/customers/archive',
    chartColor: 'secondary',
  },
]

// "quickstart" customers have never submitted a KYC upgrade request, so
// they never appear in the KYC Upgrade queue (which only lists
// pending/full/rejected) — routed to Archive instead of a queue they'd
// never show up in.
export const verificationStatusMetrics = [
  { key: 'quickstart', label: 'Quickstart', route: '/customers/archive', chartColor: 'secondary' },
  { key: 'pending', label: 'Pending', route: '/customers/kyc-upgrade', chartColor: 'warning' },
  { key: 'full', label: 'Verified', route: '/customers/kyc-upgrade', chartColor: 'info' },
  { key: 'rejected', label: 'Rejected', route: '/customers/kyc-upgrade', chartColor: 'danger' },
]

// The other Customers-menu review queues — live current counts (see
// CustomerDashboardController::menuActivity()), not scoped to the period
// filter since none of these screens have a date filter of their own.
export const menuActivityConfig = [
  {
    key: 'kyc_upgrade',
    label: 'KYC Upgrade',
    icon: 'user-check',
    route: '/customers/kyc-upgrade',
    segments: [
      { key: 'pending', label: 'Pending', variant: 'warning' },
      { key: 'approved', label: 'Approved', variant: 'success' },
      { key: 'rejected', label: 'Rejected', variant: 'danger' },
    ],
  },
  {
    key: 'documents',
    label: 'Documents',
    icon: 'file-text',
    route: '/customers/documents',
    segments: [
      { key: 'total', label: 'Submissions', variant: 'info' },
    ],
  },
  {
    key: 'card_verification',
    label: 'Card Verification',
    icon: 'credit-card',
    route: '/customers/card-verification',
    segments: [
      { key: 'pending', label: 'Pending', variant: 'warning' },
      { key: 'approved', label: 'Approved', variant: 'success' },
      { key: 'rejected', label: 'Rejected', variant: 'danger' },
      { key: 'blacklisted', label: 'Blacklisted', variant: 'dark' },
    ],
  },
  {
    key: 'settlements',
    label: 'Settlements',
    icon: 'building-bank',
    route: '/customers/settlements',
    segments: [
      { key: 'pending', label: 'Pending', variant: 'warning' },
      { key: 'approved', label: 'Processed', variant: 'success' },
      { key: 'rejected', label: 'Rejected', variant: 'danger' },
    ],
  },
  {
    key: 'bank_loads',
    label: 'Bank Loads',
    icon: 'building-bank',
    route: '/customers/bank-loads',
    segments: [
      { key: 'pending', label: 'Pending', variant: 'warning' },
      { key: 'approved', label: 'Processed', variant: 'success' },
      { key: 'rejected', label: 'Rejected', variant: 'danger' },
    ],
  },
]
