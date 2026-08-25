import { useProjectSettingsContext } from '@/context/useProjectSettingsContext'
import { Link } from 'react-router'

const CustomerAuthLogo = () => {
  const { settings, loading } = useProjectSettingsContext()
  if (loading) return null

  return (
    <>
      <Link to="/auth/sign-in" className="logo-dark">
        <img src={settings.logo_dark_url} alt={`${settings.name} dark logo`} style={{ width: '150px', height: 'auto' }} />
      </Link>
      <Link to="/auth/sign-in" className="logo-light">
        <img src={settings.logo_light_url} alt={`${settings.name} light logo`} style={{ width: '150px', height: 'auto' }} />
      </Link>
    </>
  )
}

export default CustomerAuthLogo
