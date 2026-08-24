import PageFrame from '../../components/PageFrame'
import SuccessMailContent from '../../components/SuccessMailContent'

const Page = () => (
  <PageFrame
    variant="card"
    title="Email Sent"
    subtitle="Check your inbox for a secure password reset link."
  >
    <SuccessMailContent />
  </PageFrame>
)

export default Page
