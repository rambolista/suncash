import Quill from 'quill'
import { normalizeExternalUrl } from './linkUrl'

const BaseLink = Quill.import('formats/link')

class ExternalAwareLink extends BaseLink {
  static sanitize(value) {
    return super.sanitize(normalizeExternalUrl(value))
  }
}

Quill.register(ExternalAwareLink, true)

export default Quill
