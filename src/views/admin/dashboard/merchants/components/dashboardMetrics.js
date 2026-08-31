export const dashboardMetrics = [
  {
    key: 'merchants',
    label: 'Total Merchants',
    description: 'All merchant records in the system.',
    icon: 'building-store',
    route: '/merchants/registration',
    colorClass: 'text-primary',
    bgClass: 'bg-primary-subtle',
  },
  {
    key: 'active',
    label: 'Active Merchants',
    description: 'Merchants currently active and able to transact.',
    icon: 'circle-check',
    route: '/merchants/registration',
    filter: { status: 'active' },
    colorClass: 'text-success',
    bgClass: 'bg-success-subtle',
  },
  {
    key: 'inactive',
    label: 'Inactive Merchants',
    description: 'Merchants currently suspended.',
    icon: 'ban',
    route: '/merchants/registration',
    filter: { status: 'inactive' },
    colorClass: 'text-danger',
    bgClass: 'bg-danger-subtle',
  },
  {
    key: 'approved',
    label: 'Approved Registrations',
    description: 'Merchants with an approved registration status.',
    icon: 'clipboard-check',
    route: '/merchants/registration',
    filter: { registration: 'approved' },
    colorClass: 'text-info',
    bgClass: 'bg-info-subtle',
  },
  {
    key: 'pending',
    label: 'Pending Registrations',
    description: 'Merchants awaiting registration approval.',
    icon: 'hourglass-empty',
    route: '/merchants/registration',
    filter: { registration: 'pending' },
    colorClass: 'text-warning',
    bgClass: 'bg-warning-subtle',
  },
]

export const accountStatusMetrics = [
  {
    key: 'active',
    label: 'Active',
    route: '/merchants/registration',
    filter: { status: 'active' },
    chartColor: 'success',
  },
  {
    key: 'inactive',
    label: 'Inactive',
    route: '/merchants/registration',
    filter: { status: 'inactive' },
    chartColor: 'danger',
  },
]

export const registrationStatusMetrics = [
  {
    key: 'approved',
    label: 'Approved',
    route: '/merchants/registration',
    filter: { registration: 'approved' },
    chartColor: 'info',
  },
  {
    key: 'pending',
    label: 'Pending',
    route: '/merchants/registration',
    filter: { registration: 'pending' },
    chartColor: 'warning',
  },
]

export const entityTypeMetrics = [
  { key: '1', label: 'Merchant', route: '/merchants/registration', filter: { entity_type: '1' }, chartColor: 'primary' },
  { key: '2', label: 'Supplier', route: '/merchants/registration', filter: { entity_type: '2' }, chartColor: 'secondary' },
  { key: '3', label: 'Biller', route: '/merchants/registration', filter: { entity_type: '3' }, chartColor: 'info' },
  { key: '4', label: 'Charitable Institutions', route: '/merchants/registration', filter: { entity_type: '4' }, chartColor: 'success' },
  { key: '5', label: 'Business', route: '/merchants/registration', filter: { entity_type: '5' }, chartColor: 'warning' },
  { key: '6', label: 'Charity', route: '/merchants/registration', filter: { entity_type: '6' }, chartColor: 'dark' },
]
