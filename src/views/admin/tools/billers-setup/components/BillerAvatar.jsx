import Icon from '@/components/wrappers/Icon'

const BillerAvatar = ({ src, size = 32 }) => (
  src ? (
    <img src={src} alt="" className="rounded-circle flex-shrink-0" style={{ width: size, height: size, objectFit: 'cover' }} />
  ) : (
    <div
      className="rounded-circle bg-light-subtle d-flex align-items-center justify-content-center text-muted flex-shrink-0"
      style={{ width: size, height: size }}
    >
      <Icon icon="building-store" style={{ fontSize: size * 0.5 }} />
    </div>
  )
)

export default BillerAvatar
