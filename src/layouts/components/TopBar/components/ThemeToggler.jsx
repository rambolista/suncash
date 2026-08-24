import Icon from '@/components/wrappers/Icon'
import { useLayoutContext } from '@/context/useLayoutContext'
const ThemeMode = () => {
  const { theme, updateThemePreference } = useLayoutContext()
  const themes = ['light', 'dark', 'system']
  const toggleTheme = () => {
    const nextTheme = themes[(themes.indexOf(theme) + 1) % themes.length]
    updateThemePreference(nextTheme)
  }
  return (
    <div id="theme-toggler" className="topbar-item d-none d-sm-flex">
      <button
        className="topbar-link"
        id="light-dark-mode"
        type="button"
        title={`Theme: ${theme}. Click to switch.`}
        aria-label={`Current theme is ${theme}. Switch theme.`}
        onClick={toggleTheme}
      >
        <span className="topbar-link-icon">
          <Icon icon={theme === 'system' ? 'device-desktop' : theme === 'dark' ? 'moon' : 'sun'} />
        </span>
      </button>
    </div>
  )
}
export default ThemeMode
