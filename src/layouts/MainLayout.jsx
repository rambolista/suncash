import { useLayoutContext } from '@/context/useLayoutContext'
import { useAuth } from '@/hooks/useAuth'
import useLogPageVisit from '@/hooks/useLogPageVisit'
import HorizontalLayout from '@/layouts/HorizontalLayout'
import VerticalLayout from '@/layouts/VerticalLayout'
import { Suspense } from 'react'
import { Outlet } from 'react-router'
import LoadingState from '@/components/LoadingState'

const PageLoadingFallback = () => (
  <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ zIndex: 1090, backgroundColor: 'rgba(0, 0, 0, 0.18)' }}>
    <div className="bg-body border rounded-3 shadow px-4 py-3">
      <LoadingState minHeight={70} />
    </div>
  </div>
)

const MainLayout = () => {
  const { orientation } = useLayoutContext()
  const { isAuthenticated } = useAuth()
  useLogPageVisit()
  if (!isAuthenticated) {
    return null
  }
  return (
    <>
      {orientation === 'vertical' && (
        <VerticalLayout>
          <Suspense fallback={<PageLoadingFallback />}>
            <Outlet />
          </Suspense>
        </VerticalLayout>
      )}
      {orientation === 'horizontal' && (
        <HorizontalLayout>
          <Suspense fallback={<PageLoadingFallback />}>
            <Outlet />
          </Suspense>
        </HorizontalLayout>
      )}
    </>
  )
}
export default MainLayout
