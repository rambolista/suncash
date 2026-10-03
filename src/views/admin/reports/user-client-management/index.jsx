import { useEffect, useState } from 'react'
import ApiService from '@/services/ApiService'
import TabbedReportPage from '../components/TabbedReportPage'
import UserClientReportTab from './components/UserClientReportTab'

/** Users / Client Management: legacy's "List of Reports" dropdown as tabs; access (view + export) is granted per tab. */
const UserClientManagementPage = () => {
  const [amounts, setAmounts] = useState([])

  useEffect(() => {
    ApiService.getUserClientReportOptions().then((res) => setAmounts(res?.amounts || [])).catch(() => setAmounts([]))
  }, [])

  return (
    <TabbedReportPage title="Users / Client Management" routePath="/reports/user-client-management">
      {(tab) => <UserClientReportTab key={tab.key} tabKey={tab.key} label={tab.label} canExport={Boolean(tab.can_export)} options={{ amounts }} />}
    </TabbedReportPage>
  )
}

export default UserClientManagementPage
