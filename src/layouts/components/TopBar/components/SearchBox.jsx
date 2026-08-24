import Icon from '@/components/wrappers/Icon'
import useMenuItems from '@/hooks/useMenuItems'
import { useEffect, useMemo, useRef, useState } from 'react'
import { FormControl, Spinner } from 'react-bootstrap'
import { useNavigate } from 'react-router'

const flattenSearchableMenus = (items = [], parents = []) => {
  return items.flatMap((item) => {
    const nextParents = item.isTitle ? parents : [...parents, item.label].filter(Boolean)
    const children = Array.isArray(item.children) ? flattenSearchableMenus(item.children, nextParents) : []

    if (!item.url || item.isTitle || item.is_active === false) {
      return children
    }

    return [
      {
        id: item.id ?? item.slug ?? item.url,
        label: item.label,
        slug: item.slug ?? '',
        url: item.url,
        icon: item.icon ?? null,
        trail: parents.join(' / '),
        breadcrumb: [...parents, item.label].filter(Boolean).join(' / '),
        searchText: [item.label, item.slug, item.url, parents.join(' ')].filter(Boolean).join(' ').toLowerCase(),
      },
      ...children,
    ]
  })
}

const Search = () => {
  const navigate = useNavigate()
  const { menuItems, loading } = useMenuItems()
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef(null)

  const searchableMenus = useMemo(() => flattenSearchableMenus(menuItems), [menuItems])

  const matches = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return []
    return searchableMenus.filter((item) => item.searchText.includes(term)).slice(0, 8)
  }, [query, searchableMenus])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (item) => {
    setQuery(item.label)
    setIsOpen(false)
    navigate(item.url)
  }

  return (
    <div
      id="search-box"
      ref={wrapperRef}
      className="app-search d-none d-xl-flex"
      style={{ position: 'relative' }}
    >
      <FormControl
        type="search"
        className="topbar-search"
        name="search"
        value={query}
        placeholder="Search menu..."
        autoComplete="off"
        onFocus={() => setIsOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value)
          setIsOpen(true)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            setIsOpen(false)
            return
          }

          if (event.key === 'Enter' && matches.length) {
            event.preventDefault()
            handleSelect(matches[0])
          }
        }}
      />
      {loading ? (
        <Spinner animation="border" size="sm" className="app-search-icon text-muted" />
      ) : (
        <Icon icon="search" className="app-search-icon text-muted" />
      )}

      {isOpen && query.trim() && (
        <div
          className="dropdown-menu show w-100 mt-2 p-2"
          style={{ top: '100%', left: 0, minWidth: 320, maxHeight: 360, overflowY: 'auto' }}
        >
          {matches.length ? (
            matches.map((item) => (
              <button
                key={item.id}
                type="button"
                className="dropdown-item rounded px-2 py-2"
                onClick={() => handleSelect(item)}
              >
                <div className="d-flex align-items-center gap-2">
                  {item.icon && (
                    <span className="border rounded d-inline-flex align-items-center justify-content-center bg-light flex-shrink-0" style={{ width: 28, height: 28 }}>
                      <Icon icon={item.icon} className="fs-5" />
                    </span>
                  )}
                  <div className="min-w-0">
                    <div className="fw-medium text-truncate">{item.label}</div>
                    <div className="small text-muted text-truncate">{item.breadcrumb || item.label}</div>
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="px-2 py-2 small text-muted">No menu found.</div>
          )}
        </div>
      )}
    </div>
  )
}

export default Search
