import { LayoutProvider } from '@/context/useLayoutContext'
import { NotificationProvider } from '@/context/useNotificationContext'
import { ProjectSettingsProvider } from '@/context/useProjectSettingsContext'
const AppProvidersWrapper = ({ children }) => {
  return (
    <ProjectSettingsProvider>
      <NotificationProvider>
        <LayoutProvider>{children}</LayoutProvider>
      </NotificationProvider>
    </ProjectSettingsProvider>
  )
}
export default AppProvidersWrapper
