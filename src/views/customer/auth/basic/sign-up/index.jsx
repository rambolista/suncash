import PageFrame from '../../components/PageFrame'
import SignUpForm from '../../components/SignUpForm'

const Page = () => (
  <PageFrame
    variant="basic"
    title="Create Customer Account"
    subtitle="Fill in your details to create a customer account."
    footerLink="/customer/login"
    footerLinkText="Sign in"
    footerPrefix="Already have an account?"
  >
    <SignUpForm />
  </PageFrame>
)

export default Page
