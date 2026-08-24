import { Button } from 'react-bootstrap'
import { Link } from 'react-router'

const isExternalUrl = (url) => /^https?:\/\//i.test(url ?? '')

const LandingLink = ({ url, label, variant = 'primary', className = '' }) => {
  if (!url || !label) return null

  if (isExternalUrl(url)) {
    return (
      <Button as="a" href={url} target="_blank" rel="noreferrer" variant={variant} className={className}>
        {label}
      </Button>
    )
  }

  if (url.startsWith('#')) {
    return <Button as="a" href={url} variant={variant} className={className}>{label}</Button>
  }

  return <Button as={Link} to={url} variant={variant} className={className}>{label}</Button>
}

export default LandingLink
