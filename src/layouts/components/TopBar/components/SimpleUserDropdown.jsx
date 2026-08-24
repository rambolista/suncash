import User1 from '@/assets/images/users/user-1.jpg'
import useCurrentUser from '@/hooks/useCurrentUser'
import { useAuth } from '@/hooks/useAuth'
import useCustomerAuth from '@/hooks/useCustomerAuth'
import Icon from '@/components/wrappers/Icon'
import { META_DATA } from '@/config/constants'
import { Dropdown, DropdownDivider, DropdownHeader, DropdownItem, DropdownMenu, DropdownToggle } from 'react-bootstrap'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { lockScreen } from '@/utils/lockScreen'
import UserProfileModal from './UserProfileModal'
import ChangePasswordModal from './ChangePasswordModal'
import CustomerProfileModal from '@/views/customer/profile/CustomerProfileModal'

const UserDropdown = () => {
  const currentUser = useCurrentUser()
  const { logout } = useAuth()
  const { logout: logoutCustomer } = useCustomerAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showProfile, setShowProfile] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const isCustomerRoute = location.pathname.startsWith('/customer')
  const handleLogout = isCustomerRoute ? logoutCustomer : logout

  const avatarVersion = currentUser?.updated_at
    ? encodeURIComponent(currentUser.updated_at)
    : null
  const userImage = currentUser?.avatar_url
    ? `${currentUser.avatar_url}${currentUser.avatar_url.includes('?') ? '&' : '?'}v=${avatarVersion ?? 'current'}`
    : User1
  const userName = currentUser?.name || META_DATA.username

  return (
    <div id="simple-user-dropdown" className="topbar-item nav-user">
      <Dropdown>
        <DropdownToggle className="topbar-link drop-arrow-none" type="button">
          <img src={userImage} width={32} height={32} className="rounded-circle me-lg-2 d-flex object-fit-cover" alt="user-image" />
          <div className="d-lg-flex align-items-center gap-1 d-none">
            <h5 className="my-0">{userName}</h5>
            <Icon icon="chevron-down" className="align-middle" />
          </div>
        </DropdownToggle>
        <DropdownMenu className="dropdown-menu-end">
          <DropdownHeader className="noti-title">
            <h6 className="text-overflow m-0">Welcome back!</h6>
          </DropdownHeader>

          <DropdownItem as="button" type="button" onClick={() => setShowProfile(true)}>
            <Icon icon="user-circle" className="me-1 fs-lg align-middle" />
            <span className="align-middle">Profile</span>
          </DropdownItem>

          <DropdownItem as="button" type="button" onClick={() => setShowChangePassword(true)}>
            <Icon icon="key" className="me-1 fs-lg align-middle" />
            <span className="align-middle">Change Password</span>
          </DropdownItem>

          <DropdownItem as="button" type="button" onClick={() => navigate(isCustomerRoute ? '/customer/two-factor' : '/auth/two-factor')}>
            <Icon icon="shield-lock" className="me-1 fs-lg align-middle" />
            <span className="align-middle">Two-Factor Authentication</span>
          </DropdownItem>

          {!isCustomerRoute && (
            <DropdownItem as="button" type="button" onClick={() => navigate('/auth/login-pin')}>
              <Icon icon="password" className="me-1 fs-lg align-middle" />
              <span className="align-middle">{currentUser?.has_pin ? 'Change PIN' : 'Create PIN'}</span>
            </DropdownItem>
          )}

          <DropdownDivider />

          {!isCustomerRoute && (
            <DropdownItem
              as="button"
              type="button"
              onClick={() => {
                lockScreen(`${location.pathname}${location.search}`)
                navigate('/auth/lock-screen')
              }}
            >
              <Icon icon="lock" className="me-1 fs-lg align-middle" />
              <span className="align-middle">Lock Screen</span>
            </DropdownItem>
          )}

          <DropdownItem as="button" type="button" className="text-danger fw-semibold" onClick={handleLogout}>
            <Icon icon="logout" className="me-1 fs-lg align-middle" />
            <span className="align-middle">Log Out</span>
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
      {isCustomerRoute ? (
       <CustomerProfileModal show={showProfile} onHide={() => setShowProfile(false)} />
      ) : (
       <UserProfileModal show={showProfile} onHide={() => setShowProfile(false)} />
      )}
      <ChangePasswordModal show={showChangePassword} onHide={() => setShowChangePassword(false)} />
    </div>
  )
}
export default UserDropdown
