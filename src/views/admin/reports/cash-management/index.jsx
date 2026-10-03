import ApiService from '@/services/ApiService'
import TabbedReportPage from '../components/TabbedReportPage'
import UserClientReportTab from '../user-client-management/components/UserClientReportTab'

// Both reports take only a From/To day range; legacy loaded them all-time (no date preset).
const TABS = {
  sales_by_product: { date: true },
  sales_by_location: { date: true },
}
const API = { load: ApiService.getCashManagementReport, export: ApiService.exportCashManagementReport }

/** Cash Management: legacy's "List of Reports" dropdown (Sales by Product, Sales by Location) as tabs; access is per tab. */
const CashManagementPage = () => (
  <TabbedReportPage title="Cash Management" routePath="/reports/cash-management">
    {(tab) => <UserClientReportTab key={tab.key} tabKey={tab.key} label={tab.label} canExport={Boolean(tab.can_export)} config={TABS} api={API} />}
  </TabbedReportPage>
)

export default CashManagementPage
