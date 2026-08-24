import PageFrame from '../../components/PageFrame'
import NewPasswordForm from '../../components/NewPasswordForm'

const Page = () => (
  <PageFrame
    variant="basic"
    title="Set New Password"
    subtitle="Choose a new password for your customer account."
    footerLink="/customer/login"
    footerLinkText="Sign in"
    footerPrefix="Back to"
  >
    <NewPasswordForm />
  </PageFrame>
)

export default Page
