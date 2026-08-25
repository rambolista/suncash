import PageFrame from '../../components/PageFrame'
import NewPasswordForm from '../../components/NewPasswordForm'

const Page = () => (
  <PageFrame
    variant="card"
    title="Set New Password"
    subtitle="Choose a new password for your customer account."
    footerLink="/auth/sign-in"
    footerLinkText="Sign in"
    footerPrefix="Back to"
  >
    <NewPasswordForm />
  </PageFrame>
)

export default Page
