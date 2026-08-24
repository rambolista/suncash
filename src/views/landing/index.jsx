import Icon from '@/components/wrappers/Icon'
import useScrollEvent from '@/hooks/useScrollEvent'
import ApiService from '@/services/ApiService'
import { useEffect, useState } from 'react'
import { Alert, Button, Container, Spinner } from 'react-bootstrap'
import LandingHeader from './dynamic/LandingHeader'
import LandingSectionRenderer from './dynamic/LandingSectionRenderer'

const Landing = () => {
  const { scrollY } = useScrollEvent()
  const [page, setPage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    ApiService.getActiveLandingPage()
      .then((response) => setPage(response?.landing_page ?? response?.data ?? response))
      .catch((requestError) => setError(requestError?.message ?? 'Unable to load the landing page.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="min-vh-100 d-flex align-items-center justify-content-center"><Spinner /></div>
  }

  if (error || !page) {
    return (
      <Container className="py-5">
        <Alert variant="warning">{error || 'No landing page is currently selected.'}</Alert>
      </Container>
    )
  }

  const sections = page.sections ?? []

  return (
    <div className="bg-body">
      <LandingHeader page={page} sections={sections} />
      <main>
        {sections.map((section) => <LandingSectionRenderer key={section.id} section={section} />)}
      </main>
      {scrollY > 300 && (
        <Button
          type="button"
          className="position-fixed bottom-0 end-0 m-4 rounded-circle shadow btn-icon"
          style={{ zIndex: 1030 }}
          aria-label="Back to top"
          title="Back to top"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <Icon icon="arrow-up" className="fs-20" />
        </Button>
      )}
    </div>
  )
}
export default Landing
