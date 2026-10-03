import { useEffect, useState } from 'react'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import ApiService from '@/services/ApiService'
import useCurrentUser from '@/hooks/useCurrentUser'
import { getModulePermission } from '@/utils/modulePermissions'
import UserClientReportTab from '../user-client-management/components/UserClientReportTab'

// Legacy: today's sales by default; Merchant and Branch narrow it, and picking a merchant narrows the Branch list to its branches.
const CONFIG = {
  global_sales: {
    date: true,
    today: true,
    requireDates: true,
    selects: [
      { key: 'merchant', label: 'Merchant', placeholder: '--SELECT MERCHANT--', options: 'merchants', dependent: { key: 'branch', load: (merchant) => ApiService.getGlobalSalesBranches(merchant) } },
      { key: 'branch', label: 'Branch', placeholder: '--SELECT BRANCH--', options: 'branches' },
    ],
  },
}
const API = { load: (tab, params) => ApiService.getGlobalSalesReport(params), export: (tab, params, format) => ApiService.exportGlobalSalesReport(params, format) }

const GlobalSalesReportPage = () => {
  const currentUser = useCurrentUser()
  const canExport = Boolean(getModulePermission(currentUser, '/reports/global-sales').can_export)
  const [options, setOptions] = useState(null)

  useEffect(() => {
    ApiService.getGlobalSalesReportOptions().then(setOptions).catch(() => setOptions({ merchants: [], branches: [] }))
  }, [])

  return (
    <>
      <PageBreadcrumb title="Global Sales" subtitle="Reports" />
      {options && <UserClientReportTab tabKey="global_sales" label="Global Sales Report" canExport={canExport} options={options} config={CONFIG} api={API} />}
    </>
  )
}

export default GlobalSalesReportPage
