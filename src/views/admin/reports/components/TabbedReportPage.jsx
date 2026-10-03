import { useEffect, useState } from 'react'
import { Alert, Col, Nav, Row } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import useCurrentUser from '@/hooks/useCurrentUser'
import useModuleTabs from '@/hooks/useModuleTabs'

/**
 * A Reports menu whose legacy "List of Reports" dropdown became tabs (as on Kiosk > Reports). Which tabs show, and
 * whether a tab may export, comes from the role's per-tab permissions (`menu_tabs`); `children(tab)` renders the tab body.
 */
const TabbedReportPage = ({ title, routePath, children }) => {
  const currentUser = useCurrentUser()
  const { tabs: visibleTabs, tabLayout } = useModuleTabs(currentUser, routePath)
  const [activeTab, setActiveTab] = useState(null)

  useEffect(() => {
    if (!activeTab && visibleTabs.length) setActiveTab(visibleTabs[0].key)
  }, [activeTab, visibleTabs])

  const currentTab = visibleTabs.find((t) => t.key === activeTab)

  const tabNavigation = (
    <Nav
      variant="tabs"
      activeKey={activeTab}
      onSelect={(key) => key && setActiveTab(key)}
      className={`nav-bordered nav-bordered-primary${tabLayout === 'vertical' ? ' nav-tabs-vertical flex-column' : ' module-tabs-horizontal mb-3 flex-nowrap'}`}
    >
      {visibleTabs.map((t) => (
        <Nav.Item key={t.tab_id || t.key}>
          <Nav.Link eventKey={t.key} className="d-flex align-items-center gap-2">
            <Icon icon={t.icon} className="fs-lg" />
            <span className="fw-semibold">{t.label}</span>
          </Nav.Link>
        </Nav.Item>
      ))}
    </Nav>
  )

  const tabContent = currentTab && children(currentTab, visibleTabs)

  return (
    <>
      <PageBreadcrumb title={title} subtitle="Reports" />

      {!visibleTabs.length ? (
        <Alert variant="warning">Your role does not have access to any tabs under {title}.</Alert>
      ) : tabLayout === 'vertical' ? (
        <Row className="g-3">
          <Col xs={12} md={3} lg={2}>{tabNavigation}</Col>
          <Col xs={12} md={9} lg={10}>{tabContent}</Col>
        </Row>
      ) : (
        <>
          {tabNavigation}
          {tabContent}
        </>
      )}
    </>
  )
}

export default TabbedReportPage
