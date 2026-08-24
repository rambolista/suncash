import { useLayoutContext } from '@/context/useLayoutContext'

const Position = () => {
  const { customerSettings, updateCustomerSettings } = useLayoutContext()
  const position = customerSettings.position ?? 'fixed'

  return (
    <div id="customer-position" className="p-3 border-bottom border-dashed">
      <div className="d-flex justify-content-between align-items-center">
        <h5 className="fw-bold mb-0">Layout Position</h5>
        <div className="d-flex gap-1">
          <div id="customer-position-fixed">
            <input
              type="radio"
              className="btn-check"
              name="customer-data-layout-position"
              id="customer-layout-position-fixed"
              checked={position === 'fixed'}
              onChange={() => updateCustomerSettings({ position: 'fixed' })}
            />
            <label className="btn btn-sm btn-soft-warning w-sm" htmlFor="customer-layout-position-fixed">
              Fixed
            </label>
          </div>
          <div id="customer-position-scrollable">
            <input
              type="radio"
              className="btn-check"
              name="customer-data-layout-position"
              id="customer-layout-position-scrollable"
              checked={position === 'scrollable'}
              onChange={() => updateCustomerSettings({ position: 'scrollable' })}
            />
            <label className="btn btn-sm btn-soft-warning w-sm ms-0" htmlFor="customer-layout-position-scrollable">
              Scrollable
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Position
