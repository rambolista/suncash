import { Button, OverlayTrigger, Tooltip } from 'react-bootstrap'
import Icon from '@/components/wrappers/Icon'

const ActionButton = ({ label, icon, iconClassName, onClick, disabled }) => (
  <OverlayTrigger placement="top" delay={{ show: 250, hide: 0 }} overlay={<Tooltip>{label}</Tooltip>}>
    <span>
      <Button variant="light" size="sm" className="btn-icon rounded-circle" aria-label={label} onClick={onClick} disabled={disabled}>
        <Icon icon={icon} className={`fs-lg${iconClassName ? ` ${iconClassName}` : ''}`} />
      </Button>
    </span>
  </OverlayTrigger>
)

export default ActionButton
