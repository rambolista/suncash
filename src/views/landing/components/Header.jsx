import Icon from '@/components/wrappers/Icon'
import { META_DATA } from '@/config/constants'
import { useLayoutContext } from '@/context/useLayoutContext'
import { useProjectSettingsContext } from '@/context/useProjectSettingsContext'
import { useMemo, useState } from 'react'
import { Alert, Button, Container, Nav, Navbar, NavbarCollapse, NavbarToggle, NavLink } from 'react-bootstrap'
import { Link } from 'react-router'
const navItems = ['Home', 'Services', 'Features', 'Plans', 'Reviews', 'Blog', 'Contact']
export default function Header({ page }) {
  const { theme, setThemePreview } = useLayoutContext()
  const { settings } = useProjectSettingsContext()
  const headerActions = useMemo(() => ({
    signInLabel: page?.header_sign_in_label || 'SIGN IN',
    signInUrl: page?.header_sign_in_url || '/auth/sign-in',
    signUpLabel: page?.header_sign_up_label || 'Sign Up',
    signUpUrl: page?.header_sign_up_url || '/auth/sign-in',
  }), [page])
  const toggleTheme = () => {
    setThemePreview(theme === 'dark' ? 'light' : 'dark')
  }
  const [isCollapsed, setIsCollapsed] = useState(true)
  return (
    <>
      <Alert variant="primary" className="top-alert text-center mb-0 rounded-0" dismissible closeVariant="white">
        <div className="fst-italic fw-medium">
          🚀 {settings.name} is here with Bootstrap 5, dark mode, and a refreshed UI.&nbsp;
          <a href={META_DATA.buyUrl} target="_blank" rel="noopener noreferrer" className="fw-semibold fst-normal text-white text-decoration-underline link-offset-3 ms-2">
            Buy Now!
          </a>
        </div>
      </Alert>

      <header className={page?.is_navigation_fixed ? 'sticky-top' : undefined}>
        <Navbar expand="lg" className="py-3" id="landing-navbar">
          <Container>
            <div className="auth-brand mb-0">
              <a href="/" className="logo-dark">
                <img src={settings.logo_dark_url} alt={`${settings.name} dark logo`} height={32} />
              </a>
              <a href="/" className="logo-light">
                <img src={settings.logo_light_url} alt={`${settings.name} light logo`} height={32} />
              </a>
            </div>

            <NavbarToggle aria-controls="navbarSupportedContent" onClick={() => setIsCollapsed(!isCollapsed)} />
            <NavbarCollapse in={!isCollapsed} id="navbarSupportedContent">
              <Nav className="fw-medium gap-2 fs-sm mx-auto mt-2 mt-lg-0">
                {navItems.map((item, idx) => (
                  <li className="nav-item" key={idx}>
                    <NavLink className="nav-link" href={`#${item.toLowerCase()}`}>
                      {item}
                    </NavLink>
                  </li>
                ))}
              </Nav>
              <div>
                <Button variant="link" className="btn-icon fw-semibold text-body" onClick={toggleTheme}>
                  <Icon icon="contrast" className="fs-22" />
                </Button>
                &nbsp;
                <Link to={headerActions.signInUrl} className="btn btn-link fw-semibold text-body ps-2">
                  {headerActions.signInLabel}
                </Link>
                &nbsp;
                <Link to={headerActions.signUpUrl} className="btn btn-sm btn-primary">
                  {headerActions.signUpLabel}
                </Link>
              </div>
            </NavbarCollapse>
          </Container>
        </Navbar>
      </header>
    </>
  )
}
