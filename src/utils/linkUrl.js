const externalDomainPattern = /^(?:www\.)?(?:[a-z0-9-]+\.)+[a-z]{2,}(?::\d+)?(?:[/?#].*)?$/i
const externalIpPattern = /^(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?(?:[/?#].*)?$/

export const normalizeExternalUrl = (value) => {
  const url = String(value ?? '').trim()

  if (url.startsWith('//')) {
    return `https:${url}`
  }

  if (externalDomainPattern.test(url) || externalIpPattern.test(url)) {
    return `https://${url}`
  }

  return url
}
