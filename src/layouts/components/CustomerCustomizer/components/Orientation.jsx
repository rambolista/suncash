import horizontalImg from '@/assets/images/layouts/orientation-horizontal.png'
import verticalImg from '@/assets/images/layouts/orientation-vertical.png'
import { useLayoutContext } from '@/context/useLayoutContext'
import { toTitleCase } from '@/utils/helpers'

const orientationOptions = [
  { value: 'vertical', image: verticalImg },
  { value: 'horizontal', image: horizontalImg },
]

const Orientation = () => {
  const { customerSettings, updateCustomerSettings } = useLayoutContext()
  const orientation = customerSettings.orientation ?? 'vertical'

  return (
    <div id="customer-orientation" className="p-3 border-bottom border-dashed">
      <h5 className="mb-3 fw-bold">Orientation</h5>
      <div className="row g-3">
        {orientationOptions.map((option) => (
          <div className="col-4" id={`customer-orientation-${option.value}`} key={option.value}>
            <div className="form-check card-radio">
              <input
                className="form-check-input"
                type="radio"
                name="customer-data-orientation"
                id={`customer-layout-orientation-${option.value}`}
                checked={orientation === option.value}
                onChange={() => updateCustomerSettings({ orientation: option.value })}
              />
              <label className="form-check-label p-0 w-100" htmlFor={`customer-layout-orientation-${option.value}`}>
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

export default Orientation
