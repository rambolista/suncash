import AuthShell from '../../components/AuthShell'
import SignInForm from '../../components/SignInForm'

const Page = () => (
  <AuthShell
    title="Welcome Customer"
    subtitle="Let’s get you signed in. Enter your email and password to continue."
    footerLink="/customer/register"
    footerLinkText="Create an account"
    footerPrefix="New here?"
  >
    <SignInForm />
  </AuthShell>
)

export default Page
