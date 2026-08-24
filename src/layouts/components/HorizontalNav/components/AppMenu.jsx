import Icon from '@/components/wrappers/Icon'
import useMenuItems from '@/hooks/useMenuItems'
import clsx from 'clsx'
import { Fragment, useState } from 'react'
import { Dropdown, DropdownMenu, DropdownToggle } from 'react-bootstrap'
import { Link, useLocation } from 'react-router'
const MenuItemWithChildren = ({ item, wrapperClass, togglerClass, level }) => {
  const menuLevel = level ?? 1
  const pathname = useLocation().pathname
  const [open, setOpen] = useState(false)
  const toggleOpen = (isOpen, metadata) => {
    if (metadata?.source === 'select' || metadata?.source === 'click' || metadata?.source === 'rootClose') {
      setOpen(isOpen)
    }
  }
  const isChildActive = (items) =>
    items.some((child) => {
      if (child.url) return child.children?.length ? pathname.startsWith(child.url) : pathname === child.url
      if (child.children) return isChildActive(child.children)
      return false
    })
  const isActive = isChildActive(item.children || [])
  return (
    <Dropdown
      as={menuLevel > 1 ? 'div' : 'li'}
      drop={menuLevel > 1 ? 'end' : 'down'}
      show={open}
      onToggle={toggleOpen}
      autoClose="outside"
      navbar
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      className={clsx(wrapperClass, {
        active: isActive,
      })}
    >
      <DropdownToggle
        onToggle={(e) => setOpen(e.newState === 'open')}
        as="a"
        className={clsx(togglerClass, 'drop-arrow-none', {
          active: isActive,
        })}
      >
        {item.icon && (
          <span className="menu-icon">
            <Icon icon={item.icon} />
          </span>
        )}

        <span className="menu-text">{item.label}</span>

        {item.badge && <span className={clsx('badge', 'ms-auto', item.badge.className)}>{item.badge.text}</span>}

        <div className="menu-arrow drop-arrow-none">
          <Icon icon="chevron-down" />
        </div>
      </DropdownToggle>

      <DropdownMenu
        flip
        className={clsx({
          'dropdown-menu': item.children.length > 15 && open,
          'd-none': (item.children.length > 15 && !open) || (item.children.length > 10 && item.children.length <= 15 && !open),
          'dropdown-menu-md': item.children.length > 10 && item.children.length <= 15 && open,
        })}
      >
        {(item.children || []).map((child, idx) => (
          <Fragment key={idx}>{child.children ? <MenuItemWithChildren item={child} togglerClass="dropdown-item" level={menuLevel + 1} /> : <MenuItem item={child} linkClass="dropdown-item" level={menuLevel + 1} />}</Fragment>
        ))}
      </DropdownMenu>
    </Dropdown>
  )
}
const MenuItem = ({ item, linkClass, wrapperClass, level }) => {
  const menuLevel = level ?? 1
  const pathname = useLocation().pathname
  const isActive = item.url && pathname === item.url
  const link = (
    <Link
      to={item.url ?? '/'}
      target={item.target}
      aria-disabled={item.isDisabled || undefined}
      tabIndex={item.isDisabled ? -1 : undefined}
      onClick={item.isDisabled ? (event) => event.preventDefault() : undefined}
      className={clsx(linkClass, {
        active: isActive,
        disabled: item.isDisabled,
        'special-menu': item.isSpecial,
      })}
    >
      {item.icon && (
        <span className="menu-icon">
          <Icon icon={item.icon} />
        </span>
      )}
      <span className="menu-text">{item.label}</span>
      {item.badge && <span className={clsx('badge', 'opacity-50', item.badge.className)}>{item.badge.text}</span>}
    </Link>
  )
  return menuLevel > 1 ? (
    link
  ) : (
    <li
      className={clsx(wrapperClass, {
        active: isActive,
      })}
    >
      {link}
    </li>
  )
}
const NavSkeleton = () => (
  <ul className="navbar-nav placeholder-glow d-flex flex-row align-items-center gap-1">
    {[88, 72, 80, 66, 76].map((w, i) => (
      <li key={i} className="nav-item">
        <span className="placeholder rounded nav-link px-0" style={{ width: w, display: 'inline-block' }} />
      </li>
    ))}
  </ul>
)

const AppMenu = () => {
  const { menuItems, loading } = useMenuItems()

  if (loading) return <NavSkeleton />

  // Render every item that has content (children or a url).
  // Title items with children become top-level dropdowns (same as the original
  // data.js behaviour). Pure section-header titles with neither are skipped.
  const navItems = menuItems.filter((item) => item.children?.length || item.url)

  return (
    <ul className="navbar-nav">
      {navItems.map((item, idx) => (
        <Fragment key={item.slug ?? idx}>{item.children ? <MenuItemWithChildren item={item} wrapperClass="nav-item" togglerClass="nav-link" /> : <MenuItem item={item} linkClass="nav-link" wrapperClass="nav-item" />}</Fragment>
      ))}
    </ul>
  )
}
export default AppMenu
