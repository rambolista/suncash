import PageFrame from '../../components/PageFrame'
import SignInForm from '../../components/SignInForm'

const Page = () => (
  <PageFrame
    variant="card"
    title="Welcome Customer"
    subtitle="Let’s get you signed in. Enter your email and password to continue."
    footerLink="/auth/sign-in"
    footerLinkText="Admin sign in"
    footerPrefix="Continue to"
  >
    <SignInForm />
  </PageFrame>
)

export default Page
