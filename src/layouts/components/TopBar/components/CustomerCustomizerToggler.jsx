import Icon from '@/components/wrappers/Icon'
import { useLayoutContext } from '@/context/useLayoutContext'
import useCurrentUser from '@/hooks/useCurrentUser'

const CustomerCustomizerToggler = () => {
  const { toggleCustomerCustomizer } = useLayoutContext()
  const currentUser = useCurrentUser()

  if (!currentUser?.super_admin) return null

  return (
    <div className="topbar-item d-none d-sm-flex">
      <button className="topbar-link" type="button" aria-label="Open customer customizer" onClick={toggleCustomerCustomizer}>
        <span className="topbar-link-icon">
          <Icon icon="settings-automation" />
        </span>
      </button>
    </div>
  )
}

export default CustomerCustomizerToggler
