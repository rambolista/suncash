import settingsBg from '@/assets/images/settings-bg.png'
import Icon from '@/components/wrappers/Icon'
import { SimpleBar } from '@/components/wrappers/SimpleBar'
import { useLayoutContext } from '@/context/useLayoutContext'
import useCurrentUser from '@/hooks/useCurrentUser'
import { Button, Offcanvas } from 'react-bootstrap'
import Dir from './components/Dir'
import Orientation from './components/Orientation'
import Position from './components/Position'
import SidenavColor from './components/SidenavColor'
import SidenavSize from './components/SidenavSize'
import SidenavStyle from './components/SidenavStyle'
import Skin from './components/Skin'
import CustomerTheme from './components/Theme'
import TopbarColor from './components/TopbarColor'
import Width from './components/Width'

const CustomerCustomizer = () => {
  const { isCustomerCustomizerOpen, toggleCustomerCustomizer, resetCustomerSettings } = useLayoutContext()
  const currentUser = useCurrentUser()

  if (!currentUser?.super_admin) return null

  return (
    <Offcanvas show={isCustomerCustomizerOpen} onHide={toggleCustomerCustomizer} placement="end" className="overflow-hidden" tabIndex={-1} id="customer-theme-settings-offcanvas">
      <div
        className="d-flex justify-content-between text-bg-primary gap-2 p-3"
        style={{
          backgroundImage: `url("${settingsBg}")`,
        }}
      >
        <div>
          <h5 className="mb-1 fw-bold text-white text-uppercase">Customer Customizer</h5>
          <p className="text-white text-opacity-75 fst-italic fw-medium mb-0">Configure the customer portal appearance.</p>
        </div>
        <div className="flex-grow-0">
          <button type="button" onClick={toggleCustomerCustomizer} className="d-block btn btn-sm bg-white bg-opacity-25 text-white rounded-circle btn-icon" data-bs-dismiss="offcanvas">
            <Icon icon="x" className="fs-lg" />
          </button>
        </div>
      </div>
      <SimpleBar className="offcanvas-body theme-customizer-bar p-0 h-100">
        <Skin />
        <CustomerTheme />
        <TopbarColor />
        <Orientation />
        <SidenavColor />
        <SidenavStyle />
        <SidenavSize />
        <Width />
        <Dir />
        <Position />
      </SimpleBar>
      <div className="offcanvas-footer border-top p-3 text-center">
        <Button onClick={resetCustomerSettings} variant="danger" type="button" className="fw-semibold py-2 w-100" id="reset-customer-layout">
          <Icon icon="refresh" className="me-2 fs-md" /> Reset
        </Button>
      </div>
    </Offcanvas>
  )
}

export default CustomerCustomizer
