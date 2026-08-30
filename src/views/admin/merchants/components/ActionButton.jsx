import { useState } from 'react'
import { Button, OverlayTrigger, Tooltip } from 'react-bootstrap'
import Icon from '@/components/wrappers/Icon'

/**
 * These buttons are mounted via a standalone `createRoot()` inside a
 * DataTables row (outside the main app's React tree), since DataTables owns
 * that DOM. When a click swaps the whole table away (e.g. to a detail page),
 * that root is never explicitly unmounted, so the tooltip's floating portal
 * can get orphaned mid-display instead of closing.
 *
 * Setting `show` to false on click isn't enough on its own: clicking a
 * button also focuses it, and Bootstrap's default triggers are BOTH hover
 * and focus — so the focus event immediately calls `onToggle(true)` right
 * back, undoing our `setShow(false)` before the row even has a chance to
 * unmount. Restricting the trigger to hover only stops that re-open;
 * blurring on click covers the rest (no lingering focus ring either).
 * `transition={false}` additionally makes hide instant rather than an
 * async fade, so there's no window where Popper repositions the tooltip
 * against a button that's already been ripped out of the DOM (which
 * otherwise snaps it to (0,0) — visually landing on top of the sidebar).
 */
const ActionButton = ({ label, icon, iconClassName, onClick, disabled }) => {
  const [show, setShow] = useState(false)

  const handleClick = (event) => {
    setShow(false)
    event.currentTarget.blur()
    onClick?.(event)
  }

  return (
    <OverlayTrigger
      placement="top"
      trigger={['hover']}
      delay={{ show: 250, hide: 0 }}
      overlay={<Tooltip>{label}</Tooltip>}
      show={show}
      onToggle={setShow}
      transition={false}
    >
      <span>
        <Button variant="light" size="sm" className="btn-icon rounded-circle" aria-label={label} onClick={handleClick} disabled={disabled}>
          <Icon icon={icon} className={`fs-lg${iconClassName ? ` ${iconClassName}` : ''}`} />
        </Button>
      </span>
    </OverlayTrigger>
  )
}

export default ActionButton
