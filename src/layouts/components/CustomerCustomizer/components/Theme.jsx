import darkImg from '@/assets/images/layouts/theme-dark.png'
import lightImg from '@/assets/images/layouts/theme-light.png'
import systemImg from '@/assets/images/layouts/theme-system.png'
import { useLayoutContext } from '@/context/useLayoutContext'
import { toTitleCase } from '@/utils/helpers'

const themeOptions = [
  { value: 'light', image: lightImg },
  { value: 'dark', image: darkImg },
  { value: 'system', image: systemImg },
]

const Theme = () => {
  const { customerSettings, updateCustomerSettings } = useLayoutContext()
  const theme = customerSettings.theme ?? 'light'

  return (
    <div id="customer-theme" className="p-3 border-bottom border-dashed">
      <h5 className="mb-1 fw-bold">Customer Color Scheme</h5>
      <p className="text-muted fs-sm mb-3">This color scheme is used by customer pages.</p>
      <div className="row">
        {themeOptions.map((item) => (
          <div className="col-4" id={`customer-theme-${item.value}`} key={item.value}>
            <div className="form-check card-radio">
              <input
                className="form-check-input"
                type="radio"
                name="customer-color-scheme"
                id={`customer-layout-color-${item.value}`}
                aria-label={`${toTitleCase(item.value)} customer color scheme`}
                checked={theme === item.value}
                onChange={() => updateCustomerSettings({ theme: item.value })}
              />
              <label className="form-check-label p-0 w-100" htmlFor={`customer-layout-color-${item.value}`}>
                <img src={item.image} alt="layout-img" className="img-fluid" />
              </label>
            </div>
            <h5 className="text-center text-muted mt-2 mb-0">{toTitleCase(item.value)}</h5>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Theme
