import Icon from '@/components/wrappers/Icon'

const CustomerTabEmptyState = ({ icon, title, description }) => (
  <div className="text-center py-5">
    <span className="avatar-title bg-primary-subtle text-primary rounded-circle mx-auto mb-3" style={{ width: 56, height: 56 }}>
      <Icon icon={icon} className="fs-2" />
    </span>
    <h5>{title}</h5>
    <p className="text-muted mb-0">{description}</p>
  </div>
)

export default CustomerTabEmptyState
