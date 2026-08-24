import Customizer from '@/layouts/components/Customizer'
import CustomerCustomizer from '@/layouts/components/CustomerCustomizer'
import Footer from '@/layouts/components/Footer'
import Sidenav from '@/layouts/components/Sidenav'
import TopBar from '@/layouts/components/TopBar'
import { Container } from 'react-bootstrap'
const VerticalLayout = ({ children }) => {
  return (
    <>
      <div className="wrapper">
        <Sidenav />
        <TopBar />
        <div className="content-page">
          <Container fluid>{children}</Container>
          <Footer />
        </div>
      </div>
      <Customizer />
      <CustomerCustomizer />
    </>
  )
}
export default VerticalLayout
