import { useProjectSettingsContext } from '@/context/useProjectSettingsContext'
import useScrollEvent from '@/hooks/useScrollEvent'
import clsx from 'clsx'
import { Container } from 'react-bootstrap'
import { Link } from 'react-router'
import CustomizerToggler from './components/CustomizerToggler'
import CustomerCustomizerToggler from './components/CustomerCustomizerToggler'
import FullscreenToggler from './components/FullscreenToggler'
import MenuToggler from './components/MenuToggler'
import MonochromeToggler from './components/MonochromeToggler'
import NotificationDropdownAlert from './components/NotificationDropdownAlert'
import SearchBox from './components/SearchBox'
import SimpleUserDropdown from './components/SimpleUserDropdown'
import ThemeToggler from './components/ThemeToggler'
import ProjectSettingsToggler from './components/ProjectSettingsToggler'
import { useLocation } from 'react-router'
const TopBar = () => {
  const { scrollY } = useScrollEvent()
  const { settings } = useProjectSettingsContext()
  const location = useLocation()
  const isCustomerRoute = location.pathname.startsWith('/customer')
  return (
    <header
      className={clsx('app-topbar', {
        'topbar-active': scrollY > 50,
      })}
    >
      <Container fluid className="topbar-menu">
        <div className="d-flex align-items-center gap-2">
          <div className="logo-topbar">
            <Link to="/" className="logo-light">
              <span className="logo-lg">
                <img src={settings.logo_light_url} alt={`${settings.name} light logo`} style={{ width: '150px', height: 'auto' }} />
              </span>
              <span className="logo-sm">
                <img src={settings.logo_sm_url} alt={`${settings.name} small logo`} style={{ width: '35px', height: 'auto' }} />
              </span>
            </Link>
            <Link to="/" className="logo-dark">
              <span className="logo-lg">
                <img src={settings.logo_dark_url} alt={`${settings.name} dark logo`} style={{ width: '150px', height: 'auto' }} />
              </span>
              <span className="logo-sm">
                <img src={settings.logo_sm_url} alt={`${settings.name} small logo`} style={{ width: '35px', height: 'auto' }} />
              </span>
            </Link>
          </div>

          {!isCustomerRoute && <MenuToggler />}

          {!isCustomerRoute && <SearchBox />}

        </div>
        <div className="d-flex align-items-center gap-2">
          <ThemeToggler />


          <NotificationDropdownAlert />

          {!isCustomerRoute && <FullscreenToggler />}

          {!isCustomerRoute && <MonochromeToggler />}

          <CustomizerToggler />

          <CustomerCustomizerToggler />

          <ProjectSettingsToggler />

          <SimpleUserDropdown />
        </div>
      </Container>
    </header>
  )
}
export default TopBar
