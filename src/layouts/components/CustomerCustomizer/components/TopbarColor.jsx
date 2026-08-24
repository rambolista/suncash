import darkImg from '@/assets/images/layouts/topbar-color-dark.png'
import gradientImg from '@/assets/images/layouts/topbar-color-gradient.png'
import grayImg from '@/assets/images/layouts/topbar-color-gray.png'
import lightImg from '@/assets/images/layouts/topbar-color-light.png'
import { useLayoutContext } from '@/context/useLayoutContext'
import { toTitleCase } from '@/utils/helpers'

const topbarColorOptions = [
  { value: 'light', image: lightImg },
  { value: 'dark', image: darkImg },
  { value: 'gray', image: grayImg },
  { value: 'gradient', image: gradientImg },
]

const TopbarColor = () => {
  const { customerSettings, updateCustomerSettings } = useLayoutContext()
  const topbarColor = customerSettings.topbarColor ?? 'light'

  return (
    <div id="customer-topbar-color" className="p-3 border-bottom border-dashed">
      <h5 className="mb-3 fw-bold">Topbar Color</h5>
      <div className="row g-3">
        {topbarColorOptions.map((option) => (
          <div className="col-4" id={`customer-topbar-color-${option.value}`} key={option.value}>
            <div className="form-check card-radio">
              <input
                className="form-check-input"
                type="radio"
                name="customer-data-topbar-color"
                id={`customer-layout-topbar-color-${option.value}`}
                checked={topbarColor === option.value}
                onChange={() => updateCustomerSettings({ topbarColor: option.value })}
              />
              <label className="form-check-label p-0 w-100" htmlFor={`customer-layout-topbar-color-${option.value}`}>
                <img src={option.image} alt="layout-img" className="img-fluid" />
              </label>
            </div>
            <h5 className="fs-sm text-center text-muted mt-2 mb-0">{toTitleCase(option.value)}</h5>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TopbarColor
