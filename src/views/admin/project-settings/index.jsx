import PageBreadcrumb from '@/components/PageBreadcrumb'
import ApiService from '@/services/ApiService'
import { useEffect, useState } from 'react'
import { Alert, Tab, Tabs } from 'react-bootstrap'
import LandingPageSetup from './components/LandingPageSetup'
import ProjectSetupForm from './components/ProjectSetupForm'

const ProjectSettingsPage = () => {
  const [landingPages, setLandingPages] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const loadLandingPages = async () => {
    setLoading(true)
    setLoadError('')
    try {
      const response = await ApiService.getLandingPages()
      const pages = response?.landing_pages ?? response?.data ?? response
      setLandingPages(Array.isArray(pages) ? pages : [])
    } catch (error) {
      setLoadError(error?.message ?? 'Unable to load landing pages.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLandingPages()
  }, [])

  return (
    <>
      <PageBreadcrumb title="Project & Landing Setup" />
      {loadError && <Alert variant="danger">{loadError}</Alert>}
      <Tabs defaultActiveKey="project" className="mb-3">
        <Tab eventKey="project" title="Project Setup">
          <ProjectSetupForm landingPages={landingPages} />
        </Tab>
        <Tab eventKey="landing" title="Landing Page Setup">
          <LandingPageSetup
            landingPages={landingPages}
            loading={loading}
            onReload={loadLandingPages}
          />
        </Tab>
      </Tabs>
    </>
  )
}

export default ProjectSettingsPage
