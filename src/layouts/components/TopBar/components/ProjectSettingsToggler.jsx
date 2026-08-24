import Icon from '@/components/wrappers/Icon'
import useCurrentUser from '@/hooks/useCurrentUser'
import { useNavigate } from 'react-router'

const ProjectSettingsToggler = () => {
  const currentUser = useCurrentUser()
  const navigate = useNavigate()

  if (!currentUser?.super_admin) return null

  return (
    <div className="topbar-item">
      <button
        type="button"
        className="topbar-link"
        title="Project setup"
        aria-label="Open project setup"
        onClick={() => navigate('/project-setup')}
      >
        <Icon icon="building-cog" className="fs-xxl" />
      </button>
    </div>
  )
}

export default ProjectSettingsToggler
