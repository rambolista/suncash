import Icon from '@/components/wrappers/Icon'
import { useLayoutContext } from '@/context/useLayoutContext'
import { useProjectSettingsContext } from '@/context/useProjectSettingsContext'
import { Button, Container, Nav, Navbar } from 'react-bootstrap'
import { Link } from 'react-router'
import { getSectionAnchor } from './defaultAssets'

const LandingHeader = ({ page, sections }) => {
  const { settings } = useProjectSettingsContext()
  const { theme, setThemePreview } = useLayoutContext()
  const signInLabel = page?.header_sign_in_label || 'SIGN IN'
  const signInUrl = page?.header_sign_in_url || '/auth/sign-in'
  const signUpLabel = page?.header_sign_up_label || 'Sign Up'
  const signUpUrl = page?.header_sign_up_url || '/auth/sign-up'
  const toggleTheme = () => {
    setThemePreview(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <header className={page?.is_navigation_fixed ? 'sticky-top' : undefined}>
      <Navbar expand="lg" className="py-3 bg-body" id="landing-navbar">
        <Container>
          <Navbar.Brand as={Link} to="/landing" className="auth-brand mb-0">
            <img src={theme === 'dark' ? settings.logo_light_url : settings.logo_dark_url} alt={`${settings.name} logo`} style={{ width: '150px', height: 'auto' }} />
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="landing-navigation" />
          <Navbar.Collapse id="landing-navigation">
            <Nav className="fw-medium gap-2 fs-sm mx-auto mt-2 mt-lg-0">
              {sections.map((section) => {
                const label = section.settings?.nav_label
                if (!label || section.type === 'footer') return null
                return <Nav.Link key={section.id} href={`#${getSectionAnchor(section)}`}>{label}</Nav.Link>
              })}
            </Nav>
            <div className="d-flex align-items-center">
              <Button
                variant="link"
                className="btn-icon fw-semibold text-body"
                aria-label="Toggle theme"
                onClick={toggleTheme}
              >
                <Icon icon="contrast" className="fs-22" />
              </Button>
              <Link to={signInUrl} className="btn btn-link fw-semibold text-body">{signInLabel}</Link>
              <Link to={signUpUrl} className="btn btn-sm btn-primary">{signUpLabel}</Link>
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </header>
  )
}

export default LandingHeader
