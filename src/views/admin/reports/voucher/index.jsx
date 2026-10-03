import { useEffect, useState } from 'react'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import ApiService from '@/services/ApiService'
import useCurrentUser from '@/hooks/useCurrentUser'
import { getModulePermission } from '@/utils/modulePermissions'
import UserClientReportTab from '../user-client-management/components/UserClientReportTab'

const STATUSES = [
  { value: 'ALL', label: '--ALL STATUS--' },
  { value: 'ACTIVE', label: 'ACTIVE' },
  { value: 'REDEEMED', label: 'REDEEMED' },
  { value: 'VOIDED', label: 'VOIDED' },
]

// Legacy opened on today's SunCash vouchers (product 1) with every source; both dates are required.
const CONFIG = {
  voucher: {
    date: true,
    today: true,
    requireDates: true,
    selects: [
      { key: 'status', label: 'Status', options: 'statuses', initial: 'ALL', noEmpty: true },
      { key: 'sku', label: 'Voucher Product', options: 'products', initial: '1', noEmpty: true },
      { key: 'purchased', label: 'Purchased Source', placeholder: 'All', options: 'purchased' },
      { key: 'redeemed', label: 'Redeemed Source', placeholder: 'All', options: 'redeemed' },
    ],
  },
}
const API = { load: (tab, params) => ApiService.getVoucherReport(params), export: (tab, params, format) => ApiService.exportVoucherReport(params, format) }

const VoucherReportPage = () => {
  const currentUser = useCurrentUser()
  const canExport = Boolean(getModulePermission(currentUser, '/reports/voucher').can_export)
  const [options, setOptions] = useState(null)

  useEffect(() => {
    ApiService.getVoucherReportOptions().then((res) => setOptions({ ...res, statuses: STATUSES })).catch(() => setOptions({ products: [], purchased: [], redeemed: [], statuses: STATUSES }))
  }, [])

  return (
    <>
      <PageBreadcrumb title="Voucher" subtitle="Reports" />
      {options && <UserClientReportTab tabKey="voucher" label="Voucher Report" canExport={canExport} options={options} config={CONFIG} api={API} />}
    </>
  )
}

export default VoucherReportPage
