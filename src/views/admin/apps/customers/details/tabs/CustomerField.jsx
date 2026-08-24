const CustomerField = ({ label, value }) => (
  <div>
    <div className="text-muted small">{label}</div>
    <div className="fw-medium">{value || '—'}</div>
  </div>
)

export default CustomerField
