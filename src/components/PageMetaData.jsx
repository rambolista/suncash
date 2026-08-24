import { META_DATA } from '@/config/constants'
import { useProjectSettingsContext } from '@/context/useProjectSettingsContext'
const PageMetaData = ({ title }) => {
  const { settings, loading } = useProjectSettingsContext()

  if (loading) {
    return null
  }

  return (
    <>
      <title>{title ? `${title} | ${settings.name}` : settings.name}</title>
      <meta name="description" content={settings.description} />
      <meta name="keywords" content={META_DATA.keywords} />
    </>
  )
}
export default PageMetaData
