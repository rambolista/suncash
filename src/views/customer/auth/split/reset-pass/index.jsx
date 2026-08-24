import AuthShell from '../../components/AuthShell'
import ResetPasswordForm from '../../components/ResetPasswordForm'

const Page = () => (
  <AuthShell
    title="Forgot Password?"
    subtitle="Enter your email address and we'll send you a link to reset your password."
    footerLink="/customer/login"
    footerLinkText="Sign in"
    footerPrefix="Return to"
  >
    <ResetPasswordForm />
  </AuthShell>
)

export default Page
