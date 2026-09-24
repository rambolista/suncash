import Icon from '@/components/wrappers/Icon'
import { useProjectSettingsContext } from '@/context/useProjectSettingsContext'
import useFavorites from '@/hooks/useFavorites'
import useMenuItems, { findMenuByPath } from '@/hooks/useMenuItems'
import clsx from 'clsx'
import { useState } from 'react'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'
import { Link, useLocation } from 'react-router'
import PageMetaData from './PageMetaData'

const FavoriteToggle = ({ menu }) => {
  const { isFavorite, toggleFavorite } = useFavorites()
  const [pending, setPending] = useState(false)
  const active = isFavorite(menu.id)

  const handleClick = async () => {
    if (pending) return
    setPending(true)
    try {
      await toggleFavorite(menu.id)
    } finally {
      setPending(false)
    }
  }

  return (
    <OverlayTrigger placement="top" delay={{ show: 250, hide: 0 }} overlay={<Tooltip>{active ? 'Remove from favorites' : 'Add to favorites'}</Tooltip>}>
      <button type="button" className="btn btn-sm btn-icon btn-ghost-warning ms-2" onClick={handleClick} disabled={pending}>
        <Icon icon={active ? 'star-filled' : 'star'} style={{ fontSize: '1.15rem' }} className={clsx(active && 'text-warning')} />
      </button>
    </OverlayTrigger>
  )
}

const PageBreadcrumb = ({ title, subtitle }) => {
  const { settings, loading } = useProjectSettingsContext()
  const location = useLocation()
  const isCustomerRoute = location.pathname === '/customer' || location.pathname.startsWith('/customer/')
  const { flatMenus } = useMenuItems()
  const currentMenu = !isCustomerRoute ? findMenuByPath(flatMenus, location.pathname) : null

  return (
    <>
      <PageMetaData title={title} />

      <div className="page-title-head d-flex align-items-center">
        <div className="flex-grow-1 d-flex align-items-center">
          <h4 className="page-main-title m-0">{title}</h4>
          {currentMenu && <FavoriteToggle menu={currentMenu} />}
        </div>
        <div className="text-end">
          <ol className="breadcrumb m-0 py-0">
            {!loading && (
              <li className="breadcrumb-item">
                <Link to="">{settings.name}</Link>
              </li>
            )}
            {subtitle && (
              <li className="breadcrumb-item">
                <Link to="">{subtitle}</Link>
              </li>
            )}
            <li className="breadcrumb-item active">{title}</li>
          </ol>
        </div>
      </div>
    </>
  )
}
export default PageBreadcrumb
