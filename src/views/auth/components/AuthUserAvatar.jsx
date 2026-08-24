import fallbackAvatar from '@/assets/images/users/user-1.jpg'
import useCurrentUser from '@/hooks/useCurrentUser'

const AuthUserAvatar = () => {
  const currentUser = useCurrentUser()
  const avatarVersion = currentUser?.updated_at ? encodeURIComponent(currentUser.updated_at) : 'current'
  const avatarUrl = currentUser?.avatar_url
    ? `${currentUser.avatar_url}${currentUser.avatar_url.includes('?') ? '&' : '?'}v=${avatarVersion}`
    : fallbackAvatar

  const handleImageError = (event) => {
    if (event.currentTarget.src !== fallbackAvatar) {
      event.currentTarget.src = fallbackAvatar
    }
  }

  return (
    <>
      <img
        src={avatarUrl}
        className="rounded-circle img-thumbnail avatar-xxl mb-2 object-fit-cover"
        alt={`${currentUser?.name || 'User'} avatar`}
        onError={handleImageError}
      />
      <h5 className="fs-md">{currentUser?.name || 'User'}</h5>
    </>
  )
}

export default AuthUserAvatar
