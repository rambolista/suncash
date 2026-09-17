import Icon from '@/components/wrappers/Icon'
import { useLayoutContext } from '@/context/useLayoutContext'
import useCurrentUser from '@/hooks/useCurrentUser'
const CustomizerToggler = () => {
  const { toggleCustomizer } = useLayoutContext()
  const currentUser = useCurrentUser()

  // super_admin level 1 or 2 unlocks the Admin Customizer (level 2 additionally gets Project & Landing Setup).
  if (!currentUser?.super_admin) return null

  return (
    <div className="topbar-item d-none d-sm-flex">
      <button className="topbar-link" type="button" aria-label="Open layout customizer" onClick={toggleCustomizer}>
        <span className="topbar-link-icon">
          <Icon icon="settings" />
        </span>
      </button>
    </div>
  )
}
export default CustomizerToggler
