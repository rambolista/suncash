import { useEffect, useState } from 'react'
import ApiService from '@/services/ApiService'
import TabbedReportPage from '../components/TabbedReportPage'
import UserClientReportTab from '../user-client-management/components/UserClientReportTab'

// From/To always; Voided Sales and Voids by Product also filter by Location and Cashier. Legacy loaded all voids unfiltered.
const LOCATION_CASHIER = [
  { key: 'location', label: 'Location', placeholder: '--Select Location--', options: 'locations' },
  { key: 'cashier', label: 'Cashier', placeholder: '--Select Cashier--', options: 'cashiers' },
]
const TABS = {
  voided_sales: { date: true, selects: LOCATION_CASHIER },
  voids_by_product: { date: true, selects: LOCATION_CASHIER },
  number_of_voids: { date: true },
}
const API = { load: ApiService.getVoidReport, export: ApiService.exportVoidReport }

/** Void: legacy's "List of Reports" dropdown (Voided Sales, Voids by Product, Number of Voids) as tabs; access is per tab. */
const VoidReportsPage = () => {
  const [options, setOptions] = useState({})

  useEffect(() => {
    ApiService.getVoidReportOptions().then(setOptions).catch(() => setOptions({}))
  }, [])

  return (
    <TabbedReportPage title="Void" routePath="/reports/void">
      {(tab) => <UserClientReportTab key={tab.key} tabKey={tab.key} label={tab.label} canExport={Boolean(tab.can_export)} options={options} config={TABS} api={API} />}
    </TabbedReportPage>
  )
}

export default VoidReportsPage
