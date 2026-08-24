import Customizer from '@/layouts/components/Customizer'
import CustomerCustomizer from '@/layouts/components/CustomerCustomizer'
import Footer from '@/layouts/components/Footer'
import TopBar from '@/layouts/components/TopBar'
import { Container } from 'react-bootstrap'
import ResponsiveNav from './components/ResponsiveNav'
const HorizontalLayout = ({ children }) => {
  return (
    <>
      <div className="wrapper">
        <TopBar />
        <ResponsiveNav />
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
export default HorizontalLayout
