import AuthShell from '../../components/AuthShell'
import SignInForm from '../../components/SignInForm'

const Page = () => (
  <AuthShell
    title="Welcome Customer"
    subtitle="Let’s get you signed in. Enter your email and password to continue."
    footerLink="/auth/sign-in"
    footerLinkText="Admin sign in"
    footerPrefix="Continue to"
  >
    <SignInForm />
  </AuthShell>
)

export default Page
