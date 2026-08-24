import { useProjectSettingsContext } from '@/context/useProjectSettingsContext'
import { Link } from 'react-router'
const AuthLogo = () => {
  const { settings, loading } = useProjectSettingsContext()
  if (loading) return null
  return (
    <>
      <Link to="/" className="logo-dark">
        <img src={settings.logo_dark_url} alt={`${settings.name} dark logo`} style={{ width: '150px', height: 'auto' }} />
      </Link>
      <Link to="/" className="logo-light">
        <img src={settings.logo_light_url} alt={`${settings.name} light logo`} style={{ width: '150px', height: 'auto' }} />
      </Link>
    </>
  )
}
export default AuthLogo
