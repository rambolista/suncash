import { useAuth } from '@/hooks/useAuth'

const AuthLogoutButton = () => {
  const { logout } = useAuth()

  return (
    <button
      type="button"
      className="btn btn-link p-0 text-decoration-underline link-offset-3 fw-semibold"
      onClick={logout}
    >
      Sign in
    </button>
  )
}

export default AuthLogoutButton
