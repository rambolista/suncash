export const getSectionBackgroundStyle = (section, fallbackColor) => {
  const settings = section.settings ?? {}

  return {
    backgroundColor: settings.background_color || fallbackColor,
    backgroundImage: section.background_image_url ? `url("${section.background_image_url}")` : undefined,
    backgroundPosition: 'center',
    backgroundSize: 'cover',
    color: settings.text_color || undefined,
  }
}

export const SectionBackgroundOverlay = ({ section }) => {
  if (!section.background_image_url) {
    return null
  }

  const configuredOpacity = Number(section.settings?.overlay_opacity ?? 0)
  const opacity = Math.min(100, Math.max(0, Number.isFinite(configuredOpacity) ? configuredOpacity : 0)) / 100

  return (
    <div
      className="position-absolute top-0 start-0 w-100 h-100 bg-dark"
      style={{ opacity }}
      aria-hidden="true"
    />
  )
}
