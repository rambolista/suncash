import AuthShell from '../../components/AuthShell'
import SignUpForm from '../../components/SignUpForm'

const Page = () => (
  <AuthShell
    title="Create Customer Account"
    subtitle="Enter your details to continue."
    footerLink="/customer/login"
    footerLinkText="Login"
    footerPrefix="Already have an account?"
  >
    <SignUpForm />
  </AuthShell>
)

export default Page
