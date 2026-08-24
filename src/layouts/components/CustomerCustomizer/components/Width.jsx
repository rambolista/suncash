import boxedImg from '@/assets/images/layouts/width-boxed.png'
import fluidImg from '@/assets/images/layouts/width-fluid.png'
import { useLayoutContext } from '@/context/useLayoutContext'
import { toPascalCase } from '@/utils/helpers'
import { Col } from 'react-bootstrap'

const widthOptions = [
  { value: 'fluid', image: fluidImg },
  { value: 'boxed', image: boxedImg },
]

const Width = () => {
  const { customerSettings, updateCustomerSettings } = useLayoutContext()
  const width = customerSettings.width ?? 'fluid'

  return (
    <div id="customer-width" className="p-3 border-bottom border-dashed">
      <h5 className="mb-3 fw-bold">Layout Width</h5>
      <div className="row g-3">
        {widthOptions.map((option) => (
          <Col xs={4} id={`customer-width-${option.value}`} key={option.value}>
            <div className="form-check sidebar-setting card-radio">
              <input
                className="form-check-input"
                type="radio"
                name="customer-data-layout-width"
                id={`customer-layout-width-${option.value}`}
                checked={width === option.value}
                onChange={() => updateCustomerSettings({ width: option.value })}
              />
              <label className="form-check-label p-0 w-100" htmlFor={`customer-layout-width-${option.value}`}>
                <img src={option.image} alt="layout-img" className="img-fluid" />
              </label>
            </div>
            <h5 className="mb-0 text-center text-muted mt-2">{toPascalCase(option.value)}</h5>
          </Col>
        ))}
      </div>
    </div>
  )
}

export default Width
