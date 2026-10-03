import { useEffect, useState } from 'react'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import ApiService from '@/services/ApiService'
import useCurrentUser from '@/hooks/useCurrentUser'
import { getModulePermission } from '@/utils/modulePermissions'
import UserClientReportTab from '../user-client-management/components/UserClientReportTab'

// Legacy: an optional From/To range (applied only as a pair), Account No. and Provider; with nothing set it lists the newest top-ups.
const CONFIG = {
  mobile_topup: {
    date: true,
    selects: [
      { key: 'account', label: 'Account No.', placeholder: '--Select All--', options: 'accounts' },
      { key: 'provider', label: 'Provider', placeholder: '--Select All--', options: 'providers' },
    ],
  },
}
const API = { load: (tab, params) => ApiService.getMobileTopupReport(params), export: (tab, params, format) => ApiService.exportMobileTopupReport(params, format) }

const MobileTopupReportPage = () => {
  const currentUser = useCurrentUser()
  const canExport = Boolean(getModulePermission(currentUser, '/reports/mobile-topup').can_export)
  const [options, setOptions] = useState(null)

  useEffect(() => {
    ApiService.getMobileTopupReportOptions().then(setOptions).catch(() => setOptions({ accounts: [], providers: [] }))
  }, [])

  return (
    <>
      <PageBreadcrumb title="Mobile Top Up" subtitle="Reports" />
      {options && <UserClientReportTab tabKey="mobile_topup" label="Mobile Top Up Report" canExport={canExport} options={options} config={CONFIG} api={API} />}
    </>
  )
}

export default MobileTopupReportPage
