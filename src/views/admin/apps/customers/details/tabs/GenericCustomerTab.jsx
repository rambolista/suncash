import CustomerTabEmptyState from './CustomerTabEmptyState'

const GenericCustomerTab = ({ tab }) => (
  <CustomerTabEmptyState
    icon={tab.icon || 'layout-bottombar'}
    title={tab.label}
    description={`Content for the ${tab.label} tab can be connected here.`}
  />
)

export default GenericCustomerTab
