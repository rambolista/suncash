import { normalizeExternalUrl } from '@/utils/linkUrl'

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const hasHtmlMarkup = (value) => /<\/?[a-z][\s\S]*>/i.test(String(value ?? ''))

const normalizeLinks = (html) =>
  html.replace(
    /(<a\b[^>]*\bhref=["'])([^"']+)(["'])/gi,
    (_, prefix, url, suffix) => `${prefix}${normalizeExternalUrl(url)}${suffix}`,
  )

const normalizeRichText = (value) => {
  const text = String(value ?? '').trim()
  if (!text) {
    return ''
  }

  if (hasHtmlMarkup(text)) {
    return normalizeLinks(text)
  }

  return escapeHtml(text).replace(/\r?\n/g, '<br />')
}

const RichTextContent = ({ value, className = '', as: Tag = 'div', ...props }) => {
  const html = normalizeRichText(value)
  if (!html) {
    return null
  }

  const mergedClassName = ['rich-text-content', className].filter(Boolean).join(' ')

  return <Tag className={mergedClassName} dangerouslySetInnerHTML={{ __html: html }} {...props} />
}

export default RichTextContent
