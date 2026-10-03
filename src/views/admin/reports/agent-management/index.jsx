import PageBreadcrumb from '@/components/PageBreadcrumb'
import ApiService from '@/services/ApiService'
import useCurrentUser from '@/hooks/useCurrentUser'
import { getModulePermission } from '@/utils/modulePermissions'
import UserClientReportTab from '../user-client-management/components/UserClientReportTab'

// Legacy: Agent Commissions by Location, with an optional From/To range (applied only as a pair).
const CONFIG = { agent_commissions: { date: true } }
const API = { load: (tab, params) => ApiService.getAgentManagementReport(params), export: (tab, params, format) => ApiService.exportAgentManagementReport(params, format) }

const AgentManagementReportPage = () => {
  const currentUser = useCurrentUser()
  const canExport = Boolean(getModulePermission(currentUser, '/reports/agent-management').can_export)

  return (
    <>
      <PageBreadcrumb title="Agent Management" subtitle="Reports" />
      <UserClientReportTab tabKey="agent_commissions" label="Agent Commissions by Location" canExport={canExport} config={CONFIG} api={API} />
    </>
  )
}

export default AgentManagementReportPage
