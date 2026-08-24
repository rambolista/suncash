import darkImg from '@/assets/images/layouts/theme-dark.png'
import lightImg from '@/assets/images/layouts/theme-light.png'
import systemImg from '@/assets/images/layouts/theme-system.png'
import { useLayoutContext } from '@/context/useLayoutContext'
import { toTitleCase } from '@/utils/helpers'
const themeOptions = [
  {
    value: 'light',
    image: lightImg,
  },
  {
    value: 'dark',
    image: darkImg,
  },
  {
    value: 'system',
    image: systemImg,
  },
]
const Theme = () => {
  const { updateGlobalTheme, globalTheme, themePreference } = useLayoutContext()
  const handleThemeChange = (value) => {
    updateGlobalTheme(value)
  }
  return (
    <div id="theme" className="p-3 border-bottom border-dashed">
      <h5 className="mb-1 fw-bold">Global Color Scheme</h5>
      <p className="text-muted fs-sm mb-3">This theme is also used by signed-out authentication pages.</p>
      {themePreference && themePreference !== globalTheme && (
        <div className="alert alert-warning py-2 fs-sm" role="status">
          Your personal theme is {toTitleCase(themePreference)}, while the global authentication theme is {toTitleCase(globalTheme)}.
          Selecting an option below will synchronize both.
        </div>
      )}
      <div className="row">
        {themeOptions.map((item) => (
          <div className="col-4" id={`theme-${item.value}`} key={item.value}>
            <div className="form-check card-radio">
              <input
                className="form-check-input"
                type="radio"
                name="global-color-scheme"
                id={`layout-color-${item.value}`}
                aria-label={`${toTitleCase(item.value)} global color scheme`}
                checked={globalTheme === item.value}
                onChange={() => handleThemeChange(item.value)}
              />
              <label className="form-check-label p-0 w-100" htmlFor={`layout-color-${item.value}`}>
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
