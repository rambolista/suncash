import Icon from '@/components/wrappers/Icon'
import useMenuItems from '@/hooks/useMenuItems'
import { scrollToElement } from '@/utils/layout'
import clsx from 'clsx'
import { Fragment, useCallback, useEffect, useState } from 'react'
import { Collapse } from 'react-bootstrap'
import { Link, useLocation } from 'react-router'
const MenuItemWithChildren = ({ item, openMenuKey, setOpenMenuKey, level = 0 }) => {
  const pathname = useLocation().pathname
  const isTopLevel = level === 0
  const [localOpen, setLocalOpen] = useState(false)
  const [didAutoOpen, setDidAutoOpen] = useState(false)
  const isChildActive = useCallback((children = []) => children.some((child) => (child.url && (child.children?.length ? pathname.startsWith(child.url) : pathname === child.url)) || (child.children && isChildActive(child.children))), [pathname])
  const isActive = (item.url && pathname === item.url) || isChildActive(item.children)
  const isOpen = isTopLevel ? openMenuKey === item.slug : localOpen
  useEffect(() => {
    if (isActive && !didAutoOpen) {
      if (isTopLevel) {
        setOpenMenuKey(item.slug)
      } else {
        setLocalOpen(true)
      }
      setDidAutoOpen(true)
    }
  }, [isActive, didAutoOpen, isTopLevel, item.slug, setOpenMenuKey])
  const toggleOpen = (e) => {
    if (item.children?.length) e.preventDefault()
    if (isTopLevel) {
      setOpenMenuKey(isOpen ? null : item.slug)
    } else {
      setLocalOpen((prev) => !prev)
    }
  }
  return (
    <li
      className={clsx('side-nav-item', {
        active: isActive,
      })}
    >
      <Link to={item.url ?? '#'} onClick={toggleOpen} className={clsx('side-nav-link', isActive && 'active')} aria-expanded={isOpen}>
        {item.icon && (
          <span className="menu-icon">
            <Icon icon={item.icon} />
          </span>
        )}

        <span className="menu-text">{item.label}</span>
        {item.badge ? <span className={clsx('badge', item.badge.className)}>{item.badge.text}</span> : <span className="menu-arrow" />}
      </Link>

      <Collapse in={isOpen}>
        <div>
          <ul className="sub-menu">
            {(item.children || []).map((child) => (child.children ? <MenuItemWithChildren key={child.slug} item={child} openMenuKey={openMenuKey} setOpenMenuKey={setOpenMenuKey} level={level + 1} /> : <MenuItem key={child.slug} item={child} level={level + 1} />))}
          </ul>
        </div>
      </Collapse>
    </li>
  )
}
const MenuItem = ({ item, level = 0 }) => {
  const pathname = useLocation().pathname
  const isTopLevel = level === 0
  const isActive = item.url && pathname === item.url
  return (
    <li className={clsx('side-nav-item', isActive && 'active')}>
      <Link
        to={item.url ?? '/'}
        target={item.target}
        aria-disabled={item.isDisabled || undefined}
        tabIndex={item.isDisabled ? -1 : undefined}
        onClick={item.isDisabled ? (event) => event.preventDefault() : undefined}
        className={clsx('side-nav-link', isActive && 'active', item.isDisabled && 'disabled', item.isSpecial && 'special-menu')}
      >
        {item.icon && (
          <span className="menu-icon">
            <Icon icon={item.icon} />
          </span>
        )}
        <span className="menu-text">{item.label}</span>
        {item.badge && <span className={clsx('badge', item.badge.className)}>{item.badge.text}</span>}
      </Link>
    </li>
  )
}
const MenuSkeleton = () => (
  <ul className="side-nav placeholder-glow">
    <li className="side-nav-title mt-2">
      <span className="placeholder col-4" />
    </li>
    {[55, 70, 45, 65].map((w, i) => (
      <li key={i} className="side-nav-item">
        <span className="side-nav-link d-flex align-items-center gap-2 pe-none" style={{ pointerEvents: 'none' }}>
          <span className="placeholder rounded flex-shrink-0" style={{ width: 18, height: 18 }} />
          <span className="placeholder" style={{ width: `${w}%` }} />
        </span>
      </li>
    ))}
    <li className="side-nav-title mt-3">
      <span className="placeholder col-5" />
    </li>
    {[50, 75, 60].map((w, i) => (
      <li key={i + 4} className="side-nav-item">
        <span className="side-nav-link d-flex align-items-center gap-2 pe-none" style={{ pointerEvents: 'none' }}>
          <span className="placeholder rounded flex-shrink-0" style={{ width: 18, height: 18 }} />
          <span className="placeholder" style={{ width: `${w}%` }} />
        </span>
      </li>
    ))}
  </ul>
)

const AppMenu = () => {
  const [openMenuKey, setOpenMenuKey] = useState(null)
  const { menuItems, loading } = useMenuItems()
  const scrollToActiveLink = () => {
    const activeItem = document.querySelector('.side-nav-link.active')
    if (activeItem) {
      const simpleBarContent = document.querySelector('#sidenav .simplebar-content-wrapper')
      if (simpleBarContent) {
        const offset = activeItem.offsetTop - window.innerHeight * 0.4
        scrollToElement(simpleBarContent, offset, 500)
      }
    }
  }
  useEffect(() => {
    setTimeout(scrollToActiveLink, 150)
  }, [])
  return loading ? (
    <MenuSkeleton />
  ) : (
    <ul className="side-nav">
      {menuItems.map((item, idx) => (
        <Fragment key={idx}>
          {item.isTitle && <li className="side-nav-title mt-2">{item.label}</li>}
          {(item.children || [item]).map((item, idx) => (
            <Fragment key={idx}>{item.children ? <MenuItemWithChildren key={item.slug} item={item} openMenuKey={openMenuKey} setOpenMenuKey={setOpenMenuKey} /> : <MenuItem key={item.slug} item={item} />}</Fragment>
          ))}
        </Fragment>
      ))}
    </ul>
  )
}
export default AppMenu
