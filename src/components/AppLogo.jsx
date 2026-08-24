import { useProjectSettingsContext } from '@/context/useProjectSettingsContext'
import { Link } from 'react-router'
const AppLogo = () => {
  const { settings, loading } = useProjectSettingsContext()
  if (loading) return null
  return (
    <Link to="/" className="logo">
      <span className="logo logo-light">
        <span className="logo-lg">
          <img src={settings.logo_light_url} alt={`${settings.name} light logo`} style={{ width: '150px', height: 'auto' }} />
        </span>
        <span className="logo-sm">
          <img src={settings.logo_sm_url} alt={`${settings.name} small logo`} style={{ width: '35px', height: 'auto' }} />
        </span>
      </span>
      <span className="logo logo-dark">
        <span className="logo-lg">
          <img src={settings.logo_dark_url} alt={`${settings.name} dark logo`} style={{ width: '150px', height: 'auto' }} />
        </span>
        <span className="logo-sm">
          <img src={settings.logo_sm_url} alt={`${settings.name} small logo`} style={{ width: '35px', height: 'auto' }} />
        </span>
      </span>
    </Link>
  )
}
export default AppLogo
