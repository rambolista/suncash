import Icon from '@/components/wrappers/Icon'
import { useLayoutContext } from '@/context/useLayoutContext'

const options = [
  { value: 'default', label: 'Default', icon: 'layout-sidebar' },
  { value: 'no-icons-with-lines', label: 'No Icons With Lines', icon: 'list' },
  { value: 'with-lines', label: 'Sidebar With Lines', icon: 'list-tree' },
]

const SidenavStyle = () => {
  const { customerSettings, updateCustomerSettings } = useLayoutContext()
  const sidenavStyle = customerSettings.sidenavStyle ?? 'default'

  return (
    <div id="customer-sidenav-style" className="p-3 border-bottom border-dashed">
      <h5 className="mb-3 fw-bold">Sidebar Style</h5>
      <div className="row g-3">
        {options.map((option) => (
          <div className="col-4" key={option.value}>
            <div className="form-check sidebar-setting card-radio">
              <input
                className="form-check-input"
                type="radio"
                name="customer-data-sidenav-style"
                id={`customer-layout-sidenav-style-${option.value}`}
                checked={sidenavStyle === option.value}
                onChange={() => updateCustomerSettings({ sidenavStyle: option.value })}
              />
              <label
                className="form-check-label border rounded p-3 w-100 d-flex align-items-center justify-content-center"
                htmlFor={`customer-layout-sidenav-style-${option.value}`}
                style={{ minHeight: 76 }}
              >
                <Icon icon={option.icon} className="fs-1" />
              </label>
            </div>
            <h5 className="mb-0 text-center text-muted mt-2 fs-sm">{option.label}</h5>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SidenavStyle
