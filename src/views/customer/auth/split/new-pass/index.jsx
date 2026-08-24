import AuthShell from '../../components/AuthShell'
import NewPasswordForm from '../../components/NewPasswordForm'

const Page = () => (
  <AuthShell
    title="Set a New Password"
    subtitle="Enter the email address from your reset link and choose a secure new password."
    footerLink="/customer/login"
    footerLinkText="Sign in"
    footerPrefix="Return to"
  >
    <NewPasswordForm />
  </AuthShell>
)

export default Page
