import blog3 from '@/assets/images/blog/blog-3.jpg'
import blog4 from '@/assets/images/blog/blog-4.jpg'
import blog5 from '@/assets/images/blog/blog-5.jpg'
import chat from '@/assets/images/chat.png'
import dashboard from '@/assets/images/dashboard-1.png'
import fileManager from '@/assets/images/file-manager.png'
import landingCta from '@/assets/images/landing-cta.jpg'
import team from '@/assets/images/team.png'
import user1 from '@/assets/images/users/user-1.jpg'
import user2 from '@/assets/images/users/user-2.jpg'
import user3 from '@/assets/images/users/user-3.jpg'
import user4 from '@/assets/images/users/user-4.jpg'
import user5 from '@/assets/images/users/user-5.jpg'

const assets = {
  'blog-3': blog3,
  'blog-4': blog4,
  'blog-5': blog5,
  chat,
  dashboard,
  'file-manager': fileManager,
  'landing-cta': landingCta,
  team,
  'user-1': user1,
  'user-2': user2,
  'user-3': user3,
  'user-4': user4,
  'user-5': user5,
}

export const getDefaultAsset = (key) => assets[key] ?? null

export const getSectionAnchor = (section) => {
  const label = section.settings?.nav_label?.trim()
  return label ? label.toLowerCase().replace(/[^a-z0-9]+/g, '-') : `landing-section-${section.id}`
}
