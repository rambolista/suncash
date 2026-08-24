import PageFrame from '../../components/PageFrame'
import ResetPasswordForm from '../../components/ResetPasswordForm'

const Page = () => (
  <PageFrame
    variant="card"
    title="Reset Password"
    subtitle="Enter your email to receive a secure password reset link."
    footerLink="/customer/login"
    footerLinkText="Sign in"
    footerPrefix="Remembered it?"
  >
    <ResetPasswordForm />
  </PageFrame>
)

export default Page
