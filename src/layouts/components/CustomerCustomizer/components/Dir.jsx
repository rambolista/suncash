import ltr from '@/assets/images/layouts/dir-ltr.png'
import rtl from '@/assets/images/layouts/dir-rtl.png'
import { useLayoutContext } from '@/context/useLayoutContext'
import { Col, Row } from 'react-bootstrap'

const directionOptions = [
  { value: 'ltr', image: ltr },
  { value: 'rtl', image: rtl },
]

const Dir = () => {
  const { customerSettings, updateCustomerSettings } = useLayoutContext()
  const dir = customerSettings.dir ?? 'ltr'

  return (
    <div id="customer-dir" className="p-3 border-bottom border-dashed">
      <h5 className="mb-3 fw-bold">Layout Direction</h5>
      <Row className="g-3">
        {directionOptions.map((option) => (
          <Col xs={4} key={option.value}>
            <div className="form-check sidebar-setting card-radio">
              <input
                className="form-check-input"
                type="radio"
                name="customer-dir"
                id={`customer-layout-dir-${option.value}`}
                checked={dir === option.value}
                onChange={() => updateCustomerSettings({ dir: option.value })}
              />
              <label className="form-check-label p-0 w-100" htmlFor={`customer-layout-dir-${option.value}`}>
                <img src={option.image} alt={`${option.value} layout`} className="img-fluid" />
              </label>
            </div>
            <h5 className="fs-sm text-center text-muted mt-2 mb-0">{option.value.toUpperCase()}</h5>
          </Col>
        ))}
      </Row>
    </div>
  )
}

export default Dir
