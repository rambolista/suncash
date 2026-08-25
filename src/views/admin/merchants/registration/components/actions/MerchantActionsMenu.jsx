import { Modal } from 'react-bootstrap'
import Icon from '@/components/wrappers/Icon'

const ACTIONS = [
  { key: 'principal-info', label: 'Principal Info', description: "Manage the merchant's authorized officer details.", icon: 'user-star' },
  { key: 'prefund', label: 'Merchant Prefund', description: 'Credit or debit the merchant prefund balance.', icon: 'wallet' },
  { key: 'auto-replenish', label: 'Auto Replenish', description: 'Configure automatic prefund top-ups.', icon: 'refresh' },
  { key: 'branch', label: 'Branch', description: 'Manage this merchant\'s branch locations.', icon: 'building-store' },
  { key: 'terminals', label: 'Terminals', description: 'Manage this merchant\'s registered devices.', icon: 'device-desktop' },
  { key: 'password', label: 'Password', description: 'Reset the portal login password and e-mail new credentials.', icon: 'key' },
  { key: 'users', label: 'User Management', description: 'View and add portal sub-users for this merchant.', icon: 'users' },
  { key: 'ezpay', label: 'Ezpay Access', description: 'Control which Ezpay card transactions this merchant may perform.', icon: 'credit-card' },
  { key: 'services', label: 'Services Permission', description: 'Grant or revoke access to individual platform services.', icon: 'apps' },
  { key: 'pos-users', label: 'POS Users', description: 'Manage branch/POS portal logins for this merchant.', icon: 'user-cog' },
  { key: 'agent-commission', label: 'Agent Commission Settings', description: 'Set agent commission rates and notification e-mails.', icon: 'percentage' },
  { key: 'float-account', label: 'Store Float Account', description: 'Enable, request, or edit the store float account.', icon: 'building-bank' },
]

const MerchantActionsMenu = ({ show, onHide, merchant, onSelect, isActive }) => (
  <Modal show={show} onHide={onHide} centered>
    <Modal.Header closeButton>
      <Modal.Title>
        Manage {merchant?.dba_name || merchant?.legal_name || merchant?.client_id}
      </Modal.Title>
    </Modal.Header>
    <Modal.Body className="p-0">
      <div className="list-group list-group-flush">
        {ACTIONS.map((action) => (
          <button
            key={action.key}
            type="button"
            className="list-group-item list-group-item-action d-flex align-items-center gap-3 py-3"
            onClick={() => onSelect(action.key)}
          >
            <span className="avatar-sm avatar-img-size flex-shrink-0">
              <span className="avatar-title text-bg-light rounded-circle fs-lg">
                <Icon icon={action.icon} />
              </span>
            </span>
            <span className="flex-grow-1">
              <span className="d-block fw-medium">{action.label}</span>
              <span className="d-block text-muted fs-xs">{action.description}</span>
            </span>
            <Icon icon="chevron-right" className="text-muted" />
          </button>
        ))}
        <button
          type="button"
          className="list-group-item list-group-item-action d-flex align-items-center gap-3 py-3"
          onClick={() => onSelect('deactivate')}
        >
          <span className="avatar-sm avatar-img-size flex-shrink-0">
            <span className={`avatar-title rounded-circle fs-lg ${isActive ? 'text-bg-danger-subtle text-danger' : 'text-bg-success-subtle text-success'}`}>
              <Icon icon={isActive ? 'ban' : 'circle-check'} />
            </span>
          </span>
          <span className="flex-grow-1">
            <span className="d-block fw-medium">{isActive ? 'Deactivate' : 'Activate'}</span>
            <span className="d-block text-muted fs-xs">{isActive ? 'Suspend this merchant’s account.' : 'Reinstate this merchant’s account.'}</span>
          </span>
          <Icon icon="chevron-right" className="text-muted" />
        </button>
      </div>
    </Modal.Body>
  </Modal>
)

export default MerchantActionsMenu
