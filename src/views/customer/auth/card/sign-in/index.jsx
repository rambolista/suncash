import PageFrame from '../../components/PageFrame'
import SignInForm from '../../components/SignInForm'

const Page = () => (
  <PageFrame
    variant="card"
    title="Welcome Customer"
    subtitle="Let’s get you signed in. Enter your email and password to continue."
    footerLink="/customer/register"
    footerLinkText="Create an account"
    footerPrefix="New here?"
  >
    <SignInForm />
  </PageFrame>
)

export default Page
