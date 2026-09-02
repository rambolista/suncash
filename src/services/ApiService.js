/**
 * ApiService — all application API calls in one place.
 *
 * Every method delegates to HttpService so token injection, error
 * normalisation, and 401 redirects are handled transparently.
 *
 * Laravel Sanctum token-based auth endpoints:
 *   POST   /auth/login                 → { token, user }
 *   POST   /auth/register              → { token, user }
 *   POST   /auth/logout                → 204
 *   GET    /auth/user                  → { user }
 *   POST   /auth/forgot-password       → { message }
 *   POST   /auth/reset-password        → { message }
 *   PUT    /auth/change-password       → { message }
 *
 * Protected resource examples:
 *   GET    /user/profile               → { user }
 *   PUT    /user/profile               → { user }
 *   PUT    /user/avatar                → { avatar_url }  (FormData)
 */

import http from './HttpService'

const isFormDataPayload = (data) =>
  typeof FormData !== 'undefined' && data instanceof FormData

const withMethodOverride = (data, method) => {
  const payload = new FormData()

  for (const [key, value] of data.entries()) {
    payload.append(key, value)
  }

  payload.append('_method', method)

  return payload
}

const ApiService = {
  getProjectSettings: () =>
    http.get('/project-settings'),

  updateProjectSettings: (data) =>
    http.post('/project-settings', withMethodOverride(data, 'PUT'), true),

  // ── Landing pages ──────────────────────────────────────────────────────────

  getActiveLandingPage: () =>
    http.get('/landing-page'),

  getLandingPages: () =>
    http.get('/landing-pages'),

  getLandingPage: (id) =>
    http.get(`/landing-pages/${id}`),

  createLandingPage: (data) =>
    http.post('/landing-pages', data),

  updateLandingPage: (id, data) =>
    http.put(`/landing-pages/${id}`, data),

  duplicateLandingPage: (id, data) =>
    http.post(`/landing-pages/${id}/duplicate`, data),

  deleteLandingPage: (id) =>
    http.delete(`/landing-pages/${id}`),

  createLandingSection: (pageId, data) =>
    http.post(`/landing-pages/${pageId}/sections`, data, isFormDataPayload(data)),

  updateLandingSection: (pageId, sectionId, data) =>
    isFormDataPayload(data)
      ? http.post(
          `/landing-pages/${pageId}/sections/${sectionId}`,
          withMethodOverride(data, 'PUT'),
          true,
        )
      : http.put(`/landing-pages/${pageId}/sections/${sectionId}`, data),

  deleteLandingSection: (pageId, sectionId) =>
    http.delete(`/landing-pages/${pageId}/sections/${sectionId}`),

  reorderLandingSections: (pageId, sections) =>
    http.patch(`/landing-pages/${pageId}/sections/reorder`, { sections }),

  createLandingSectionItem: (pageId, sectionId, data) =>
    http.post(
      `/landing-pages/${pageId}/sections/${sectionId}/items`,
      data,
      isFormDataPayload(data),
    ),

  updateLandingSectionItem: (pageId, sectionId, itemId, data) =>
    isFormDataPayload(data)
      ? http.post(
          `/landing-pages/${pageId}/sections/${sectionId}/items/${itemId}`,
          withMethodOverride(data, 'PUT'),
          true,
        )
      : http.put(
          `/landing-pages/${pageId}/sections/${sectionId}/items/${itemId}`,
          data,
        ),

  deleteLandingSectionItem: (pageId, sectionId, itemId) =>
    http.delete(`/landing-pages/${pageId}/sections/${sectionId}/items/${itemId}`),

  reorderLandingSectionItems: (pageId, sectionId, items) =>
    http.patch(`/landing-pages/${pageId}/sections/${sectionId}/items/reorder`, { items }),

  // ── Authentication ──────────────────────────────────────────────────────────

  /**
   * Authenticate a user and receive a Sanctum API token.
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{ token: string, user: object }>}
   */
  login: (email, password) =>
    http.post('/auth/login', { email, password }),

  /**
   * Register a new user account.
   * @param {string} name
   * @param {string} email
   * @param {string} password
   * @param {string} password_confirmation
   * @returns {Promise<{ token: string, user: object }>}
   */
  register: (data) =>
    http.post('/auth/register', data),

  /**
   * Revoke the current Sanctum token (server-side).
   * @returns {Promise<null>}
   */
  logout: () =>
    http.post('/auth/logout'),

  /**
   * Fetch the currently authenticated user.
   * @returns {Promise<{ user: object }>}
   */
  getUser: () =>
    http.get('/auth/user'),

  customerLogin: (email, password) =>
    http.post('/customer/login', { email, password }),

  customerRegister: (data) =>
    http.post('/customer/register', data),

  customerForgotPassword: (email) =>
    http.post('/customer/forgot-password', { email }),

  customerResetPassword: (token, email, password, password_confirmation) =>
    http.post('/customer/reset-password', { token, email, password, password_confirmation }),

  customerGetProfile: () =>
    http.get('/customer/profile'),

  customerUpdateProfile: (data) =>
    isFormDataPayload(data)
      ? http.post('/customer/profile', withMethodOverride(data, 'PUT'), true)
      : http.put('/customer/profile', data),

  customerGetTwoFactorStatus: () =>
    http.get('/customer/2fa'),

  customerSetupTwoFactor: (method, current_password) =>
    http.post('/customer/2fa/setup', { method, current_password }),

  customerConfirmTwoFactor: (challenge, code) =>
    http.post('/customer/2fa/confirm', { challenge, code }),

  customerDisableTwoFactor: (current_password) =>
    http.post('/customer/2fa/disable', { current_password }),

  customerVerifyTwoFactorChallenge: (challenge, code) =>
    http.post('/customer/two-factor/challenge/verify', { challenge, code }),

  /**
   * Send a password-reset link to the given email address.
   * @param {string} email
   * @returns {Promise<{ message: string }>}
   */
  forgotPassword: (email) =>
    http.post('/auth/forgot-password', { email }),

  /**
   * Reset the user's password using the token from the reset-link email.
   * @param {string} token
   * @param {string} email
   * @param {string} password
   * @param {string} password_confirmation
   * @returns {Promise<{ message: string }>}
   */
  resetPassword: (token, email, password, password_confirmation) =>
    http.post('/auth/reset-password', { token, email, password, password_confirmation }),

  /**
   * Change password for the currently authenticated user.
   * @param {string} current_password
   * @param {string} password
   * @param {string} password_confirmation
   * @returns {Promise<{ message: string }>}
   */
  changePassword: (current_password, password, password_confirmation) =>
    http.put('/auth/change-password', { current_password, password, password_confirmation }),

  unlockScreen: (password) =>
    http.post('/auth/unlock', { password }),

  getTwoFactorStatus: () =>
    http.get('/auth/2fa'),

  setupTwoFactor: (method, current_password) =>
    http.post('/auth/2fa/setup', { method, current_password }),

  confirmTwoFactor: (challenge, code) =>
    http.post('/auth/2fa/confirm', { challenge, code }),

  verifyTwoFactorChallenge: (challenge, code) =>
    http.post('/auth/2fa/challenge/verify', { challenge, code }),

  disableTwoFactor: (current_password) =>
    http.post('/auth/2fa/disable', { current_password }),

  updatePin: (current_password, pin, pin_confirmation) =>
    http.put('/auth/pin', { current_password, pin, pin_confirmation }),

  verifyPin: (pin) =>
    http.post('/auth/pin/verify', { pin }),

  deleteAccount: (current_password) =>
    http.delete('/auth/account', { current_password }),

  // ── User Profile ─────────────────────────────────────────────────────────────

  /**
   * Get the authenticated user's profile.
   * @returns {Promise<{ user: object }>}
   */
  getProfile: () =>
    http.get('/user/profile'),

  getProfileHistory: () =>
    http.get('/user/profile/history'),

  /**
   * Update the authenticated user's profile.
   * @param {{ name?: string, email?: string }} data
   * @returns {Promise<{ user: object }>}
   */
  updateProfile: (data) =>
    http.put('/user/profile', data),

  /**
   * Upload a new avatar (multipart/form-data).
   * @param {FormData} formData
   * @returns {Promise<{ avatar_url: string }>}
   */
  updateAvatar: (formData) =>
    http.post('/user/avatar', formData, true),

  // ── Access Management — Menus ─────────────────────────────────────────────

  /** Fetch all menu items (flat list, ordered by sort_order). */
  getMenus: () =>
    http.get('/access-management/menus'),

  /** Fetch every menu for access-management administration. */
  getAllMenus: () =>
    http.get('/access-management/menus?all=1'),

  getCustomerMenus: () =>
    http.get('/customer-menus'),

  getAllCustomerMenus: () =>
    http.get('/access-management/customer-menus?all=1'),

  getCustomers: () =>
    http.get('/access-management/customers'),

  getCustomer: (id) =>
    http.get(`/access-management/customers/${id}`),

  createCustomer: (data) =>
    isFormDataPayload(data)
      ? http.post('/access-management/customers', data, true)
      : http.post('/access-management/customers', data),

  updateCustomer: (id, data) =>
    isFormDataPayload(data)
      ? http.post(`/access-management/customers/${id}`, withMethodOverride(data, 'PUT'), true)
      : http.put(`/access-management/customers/${id}`, data),

  deleteCustomer: (id) =>
    http.delete(`/access-management/customers/${id}`),

  getMerchantDashboardStats: (period) =>
    http.get(`/dashboard/merchants${period && period !== 'all' ? `?period=${encodeURIComponent(period)}` : ''}`),

  getCustomerDashboardStats: (period) =>
    http.get(`/dashboard/customers${period && period !== 'all' ? `?period=${encodeURIComponent(period)}` : ''}`),

  getMerchants: () =>
    http.get('/access-management/merchants'),

  getMerchant: (id) =>
    http.get(`/access-management/merchants/${id}`),

  checkMerchantId: (clientId) =>
    http.get(`/access-management/merchants/check-id?client_id=${encodeURIComponent(clientId)}`),

  checkMerchantUsername: (username) =>
    http.get(`/access-management/merchants/check-username?username=${encodeURIComponent(username)}`),

  registerMerchant: (data) =>
    http.post('/access-management/merchants', data),

  updateMerchant: (id, data) =>
    http.put(`/access-management/merchants/${id}`, data),

  uploadMerchantLogo: (file) => {
    const payload = new FormData()
    payload.append('logo', file)
    return http.post('/access-management/merchants/logo-upload', payload, true)
  },

  getMerchantPrincipalInfo: (id) =>
    http.get(`/access-management/merchants/${id}/principal-info`),

  saveMerchantPrincipalInfo: (id, data) =>
    http.put(`/access-management/merchants/${id}/principal-info`, data),

  resetMerchantPassword: (id) =>
    http.post(`/access-management/merchants/${id}/reset-password`),

  getMerchantUsers: (id) =>
    http.get(`/access-management/merchants/${id}/users`),

  addMerchantUser: (id, data) =>
    http.post(`/access-management/merchants/${id}/users`, data),

  toggleMerchantStatus: (id) =>
    http.post(`/access-management/merchants/${id}/toggle-status`),

  getMerchantEzpayAccess: (id) =>
    http.get(`/access-management/merchants/${id}/ezpay-access`),

  updateMerchantEzpayAccess: (id, access) =>
    http.put(`/access-management/merchants/${id}/ezpay-access`, { access }),

  getMerchantServices: (id) =>
    http.get(`/access-management/merchants/${id}/services`),

  updateMerchantServices: (id, serviceIds) =>
    http.put(`/access-management/merchants/${id}/services`, { service_ids: serviceIds }),

  adjustMerchantPrefund: (id, data) =>
    http.post(`/access-management/merchants/${id}/prefund`, data),

  getMerchantAutoReplenish: (id) =>
    http.get(`/access-management/merchants/${id}/auto-replenish`),

  updateMerchantAutoReplenish: (id, data) =>
    http.put(`/access-management/merchants/${id}/auto-replenish`, data),

  getMerchantAgentCommission: (id) =>
    http.get(`/access-management/merchants/${id}/agent-commission`),

  updateMerchantAgentCommission: (id, data) =>
    http.put(`/access-management/merchants/${id}/agent-commission`, data),

  addMerchantAgentCommissionEmail: (id, email) =>
    http.post(`/access-management/merchants/${id}/agent-commission/emails`, { email }),

  updateMerchantAgentCommissionEmail: (id, emailId, data) =>
    http.put(`/access-management/merchants/${id}/agent-commission/emails/${emailId}`, data),

  deleteMerchantAgentCommissionEmail: (id, emailId) =>
    http.delete(`/access-management/merchants/${id}/agent-commission/emails/${emailId}`),

  getMerchantBranches: (id) =>
    http.get(`/access-management/merchants/${id}/branches`),

  getBranchIslands: () =>
    http.get('/access-management/merchants/branches/islands'),

  addMerchantBranch: (id, data) =>
    http.post(`/access-management/merchants/${id}/branches`, data),

  updateMerchantBranch: (id, branchId, data) =>
    http.put(`/access-management/merchants/${id}/branches/${branchId}`, data),

  changeMerchantBranchStatus: (id, branchId, status) =>
    http.post(`/access-management/merchants/${id}/branches/${branchId}/status`, { status }),

  getMerchantTerminals: (id) =>
    http.get(`/access-management/merchants/${id}/terminals`),

  addMerchantTerminal: (id, data) =>
    http.post(`/access-management/merchants/${id}/terminals`, data),

  updateMerchantTerminal: (id, terminalId, data) =>
    http.put(`/access-management/merchants/${id}/terminals/${terminalId}`, data),

  changeMerchantTerminalStatus: (id, terminalId, status) =>
    http.post(`/access-management/merchants/${id}/terminals/${terminalId}/status`, { status }),

  getMerchantPosUsers: (id) =>
    http.get(`/access-management/merchants/${id}/pos-users`),

  addMerchantPosUser: (id, data) =>
    http.post(`/access-management/merchants/${id}/pos-users`, data),

  updateMerchantPosUser: (id, userId, data) =>
    http.put(`/access-management/merchants/${id}/pos-users/${userId}`, data),

  deleteMerchantPosUser: (id, userId) =>
    http.delete(`/access-management/merchants/${id}/pos-users/${userId}`),

  getMerchantFloatAccount: (id) =>
    http.get(`/access-management/merchants/${id}/float-account`),

  toggleMerchantFloatAccount: (id) =>
    http.post(`/access-management/merchants/${id}/float-account/toggle`),

  requestMerchantFloatAccount: (id, data) =>
    http.post(`/access-management/merchants/${id}/float-account/request`, data),

  updateMerchantFloatAccount: (id, data) =>
    http.put(`/access-management/merchants/${id}/float-account`, data),

  /**
   * Search available menu icons.
   * @param {string} search
   * @param {number} limit
   */
  searchMenuIcons: (search = '', limit = 50) =>
    http.get(`/access-management/menu-icons?search=${encodeURIComponent(search)}&limit=${limit}`),

  /**
   * Create a new menu item.
   * @param {{ label, slug, url?, icon?, parent_id?, sort_order?, is_title?, is_active?, badge_text?, badge_class? }} data
   */
  createMenu: (data) =>
    http.post('/access-management/menus', data),

  /**
   * Update an existing menu item.
   * @param {number} id
   * @param {object} data
   */
  updateMenu: (id, data) =>
    http.put(`/access-management/menus/${id}`, data),

  /**
   * Delete a menu item (children cascade).
   * @param {number} id
   */
  deleteMenu: (id) =>
    http.delete(`/access-management/menus/${id}`),

  createCustomerMenu: (data) =>
    http.post('/access-management/customer-menus', data),

  updateCustomerMenu: (id, data) =>
    http.put(`/access-management/customer-menus/${id}`, data),

  deleteCustomerMenu: (id) =>
    http.delete(`/access-management/customer-menus/${id}`),

  // ── Access Management — Roles ────────────────────────────────────────────

  getRoles: () =>
    http.get('/access-management/roles'),

  createRole: (data) =>
    http.post('/access-management/roles', data),

  updateRole: (id, data) =>
    http.put(`/access-management/roles/${id}`, data),

  deleteRole: (id) =>
    http.delete(`/access-management/roles/${id}`),

  /** Returns flat list of all menus with current permission flags for a role */
  getRoleMenuPermissions: (roleId) =>
    http.get(`/access-management/roles/${roleId}/menu-permissions`),

  /** Save menu action and menu-tab permissions for a role. */
  saveRoleMenuPermissions: (roleId, permissions, tabPermissions = []) =>
    http.post(`/access-management/roles/${roleId}/menu-permissions`, {
      permissions,
      tab_permissions: tabPermissions,
    }),

  // ── Access Management — Users ────────────────────────────────────────────

  getUsers: () =>
    http.get('/access-management/users'),

  createUser: (data) =>
    isFormDataPayload(data)
      ? http.post('/access-management/users', data, true)
      : http.post('/access-management/users', data),

  updateUser: (id, data) =>
    isFormDataPayload(data)
      ? http.post(`/access-management/users/${id}`, withMethodOverride(data, 'PUT'), true)
      : http.put(`/access-management/users/${id}`, data),

  deleteUser: (id) =>
    http.delete(`/access-management/users/${id}`),

  assignRolesToUser: (userId, roleIds) =>
    http.post(`/access-management/users/${userId}/roles`, { role_ids: roleIds }),

  // ── Notifications ─────────────────────────────────────────────────────────

  getNotifications: () =>
    http.get('/notifications'),

  markNotificationRead: (id) =>
    http.patch(`/notifications/${id}/read`),

  markAllNotificationsRead: () =>
    http.post('/notifications/read-all'),

  dismissNotification: (id) =>
    http.delete(`/notifications/${id}`),

  // ── Global layout settings ────────────────────────────────────────────────

  getLayoutSettings: (scope = 'admin') =>
    http.get(`/layout-settings?scope=${encodeURIComponent(scope)}`),

  updateLayoutSettings: (settings, scope = 'admin') =>
    http.put(`/layout-settings?scope=${encodeURIComponent(scope)}`, settings),

  updateGlobalTheme: (theme) =>
    http.put('/layout-settings/theme', { theme }),

  updateThemePreference: (theme) =>
    http.put('/user/theme-preference', { theme }),

  // ── Settings ───────────────────────────────────────────────────────────────

  getNotificationSettings: (type) =>
    http.get(`/settings/notifications?type=${encodeURIComponent(type)}`),

  getNotificationSetting: (id) =>
    http.get(`/settings/notifications/${id}`),

  updateNotificationSetting: (id, data) =>
    http.put(`/settings/notifications/${id}`, data),

  toggleNotificationSetting: (id, isEnabled) =>
    http.post(`/settings/notifications/${id}/toggle`, { is_enabled: isEnabled }),

  getCustomerAppSettings: () =>
    http.get('/settings/customer-app'),

  toggleCustomerAppSetting: (id, isEnabled) =>
    http.post(`/settings/customer-app/${id}/toggle`, { is_enabled: isEnabled }),

  getWuSettings: () =>
    http.get('/settings/wu'),

  toggleWuSetting: (id, isEnabled) =>
    http.post(`/settings/wu/${id}/toggle`, { is_enabled: isEnabled }),

  // ── Promotions ─────────────────────────────────────────────────────────────

  getPromoIslands: () =>
    http.get('/promotions/islands'),

  getPromoCountries: () =>
    http.get('/promotions/countries'),

  getPromoMerchants: () =>
    http.get('/promotions/merchants'),

  getPromoBranches: (merchantId) =>
    http.get(`/promotions/branches?merchant_id=${encodeURIComponent(merchantId)}`),

  getPromoTicketReports: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return http.get(`/promotions/ticket-reports${query ? `?${query}` : ''}`)
  },

  exportPromoTicketReports: (params = {}, format) => {
    const query = new URLSearchParams({ ...params, format }).toString()
    return http.download(`/promotions/ticket-reports/export?${query}`)
  },

  getCashPromoSettings: () =>
    http.get('/promotions/cash-promos'),

  createCashPromoSetting: (data) =>
    http.post('/promotions/cash-promos', data),

  updateCashPromoSetting: (id, data) =>
    http.put(`/promotions/cash-promos/${id}`, data),

  deleteCashPromoSetting: (id) =>
    http.delete(`/promotions/cash-promos/${id}`),

  getPromoItems: () =>
    http.get('/promotions/promo-items'),

  createPromoItem: (data) =>
    isFormDataPayload(data)
      ? http.post('/promotions/promo-items', data, true)
      : http.post('/promotions/promo-items', data),

  updatePromoItem: (id, data) =>
    isFormDataPayload(data)
      ? http.post(`/promotions/promo-items/${id}`, data, true)
      : http.post(`/promotions/promo-items/${id}`, data),

  deletePromoItem: (id) =>
    http.delete(`/promotions/promo-items/${id}`),

  getGeoPromos: () =>
    http.get('/promotions/geo-promo'),

  getGeoPromo: (id) =>
    http.get(`/promotions/geo-promo/${id}`),

  createGeoPromo: (data) =>
    http.post('/promotions/geo-promo', data),

  updateGeoPromo: (id, data) =>
    http.put(`/promotions/geo-promo/${id}`, data),

  deleteGeoPromo: (id) =>
    http.delete(`/promotions/geo-promo/${id}`),

  // Float Management
  getMainReserveAccounts: () =>
    http.get('/float-management/main-reserve-account'),

  approveMainReserveAccount: (id) =>
    http.post(`/float-management/main-reserve-account/${id}/approve`),

  rejectMainReserveAccount: (id) =>
    http.post(`/float-management/main-reserve-account/${id}/reject`),

  confirmMainReserveAccount: (id) =>
    http.post(`/float-management/main-reserve-account/${id}/confirm`),

  topupMainReserveAccount: (amount) =>
    http.post('/float-management/main-reserve-account/topup', { amount }),

  requestMainReserveReplenishment: (amount) =>
    http.post('/float-management/main-reserve-account/request-replenishment', { amount }),

  getMainReserveAccountSettings: () =>
    http.get('/float-management/set-main-reserve-account'),

  setupMainReserveAccount: (data) =>
    http.post('/float-management/set-main-reserve-account', data),

  updateMainReserveAccountSettings: (data) =>
    http.put('/float-management/set-main-reserve-account', data),

  getStoreFloatReplenishments: () =>
    http.get('/float-management/store-float-replenishments'),

  approveStoreFloatReplenishment: (id) =>
    http.post(`/float-management/store-float-replenishments/${id}/approve`),

  rejectStoreFloatReplenishment: (id) =>
    http.post(`/float-management/store-float-replenishments/${id}/reject`),

  confirmStoreFloatReplenishment: (id) =>
    http.post(`/float-management/store-float-replenishments/${id}/confirm`),

  getCurrentStoreFloatAmounts: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return http.get(`/float-management/current-store-float-amounts${query ? `?${query}` : ''}`)
  },

  createStoreFloatAccount: (data) =>
    http.post('/float-management/current-store-float-amounts/create-account', data),

  topupStoreFloatAccount: (id, amount) =>
    http.post(`/float-management/current-store-float-amounts/${id}/topup`, { amount }),

  requestStoreFloatReplenishment: (id, amount) =>
    http.post(`/float-management/current-store-float-amounts/${id}/request-replenishment`, { amount }),

  // Business Management / Charity Management — shared lookups
  getMerchantTypeSoleProprietorships: (type) =>
    http.get(`/merchant-type-lookups/sole-proprietorships?type=${encodeURIComponent(type)}`),

  getMerchantTypeBusinessCategories: () =>
    http.get('/merchant-type-lookups/business-categories'),

  getMerchantTypeIdTypes: () =>
    http.get('/merchant-type-lookups/id-types'),

  getMerchantTypePositionLevels: () =>
    http.get('/merchant-type-lookups/position-levels'),

  getMerchantTypeIslands: () =>
    http.get('/merchant-type-lookups/islands'),

  getMerchantTypeCountries: () =>
    http.get('/merchant-type-lookups/countries'),

  // Business Management
  getBusinesses: () =>
    http.get('/business-management'),

  getBusiness: (id) =>
    http.get(`/business-management/${id}`),

  updateBusiness: (id, data) =>
    http.put(`/business-management/${id}`, data),

  approveBusiness: (id) =>
    http.post(`/business-management/${id}/approve`),

  rejectBusiness: (id) =>
    http.post(`/business-management/${id}/reject`),

  activateBusiness: (id) =>
    http.post(`/business-management/${id}/activate`),

  updateBusinessCardHoldSettings: (id, cardHoldDays) =>
    http.put(`/business-management/${id}/card-hold-settings`, { card_hold_days: cardHoldDays }),

  updateBusinessTransactionFee: (id, fee) =>
    http.put(`/business-management/${id}/transaction-fee`, { suncash_transaction_fee: fee }),

  updateBusinessAuthorizedAuth: (id, limit, holdDays) =>
    http.put(`/business-management/${id}/authorized-auth`, { reauth_amount_limit: limit, reauth_card_hold_days: holdDays }),

  updateBusinessGcFee: (id, fee) =>
    http.put(`/business-management/${id}/gc-fee`, { gc_fee: fee }),

  getBusinessVoucherSettings: (id) =>
    http.get(`/business-management/${id}/voucher-settings`),

  updateBusinessVoucherSettings: (id, voucherTypes) =>
    http.put(`/business-management/${id}/voucher-settings`, { voucher_types: voucherTypes }),

  getBusinessLinkedCards: (id) =>
    http.get(`/business-management/${id}/linked-cards`),

  approveBusinessLinkedCard: (id, cardId) =>
    http.post(`/business-management/${id}/linked-cards/${cardId}/approve`),

  rejectBusinessLinkedCard: (id, cardId, reason) =>
    http.post(`/business-management/${id}/linked-cards/${cardId}/reject`, { reason }),

  downloadBusinessSubAccountTemplate: () =>
    http.download('/business-management/sub-accounts/template'),

  importBusinessSubAccounts: (id, file) => {
    const formData = new FormData()
    formData.append('file', file)
    return http.post(`/business-management/${id}/sub-accounts/import`, formData, true)
  },

  addBusinessOwner: (merchantId, data) =>
    http.post(`/business-management/${merchantId}/owners`, data),

  updateBusinessOwner: (merchantId, ownerId, data) =>
    http.put(`/business-management/${merchantId}/owners/${ownerId}`, data),

  exportBusinesses: (status, format) => {
    const query = new URLSearchParams({ ...(status ? { status } : {}), format }).toString()
    return http.download(`/business-management/export?${query}`)
  },

  // Charity Management
  getCharities: () =>
    http.get('/charity-management'),

  getCharity: (id) =>
    http.get(`/charity-management/${id}`),

  updateCharity: (id, data) =>
    http.put(`/charity-management/${id}`, data),

  approveCharity: (id) =>
    http.post(`/charity-management/${id}/approve`),

  rejectCharity: (id) =>
    http.post(`/charity-management/${id}/reject`),

  activateCharity: (id) =>
    http.post(`/charity-management/${id}/activate`),

  exportCharities: (status, format) => {
    const query = new URLSearchParams({ ...(status ? { status } : {}), format }).toString()
    return http.download(`/charity-management/export?${query}`)
  },

  // Merchant Settlements
  getMerchantSettlements: () =>
    http.get('/merchant-settlements'),

  getMerchantSettlement: (id) =>
    http.get(`/merchant-settlements/${id}`),

  getMerchantSettlementHistory: (merchantId) =>
    http.get(`/merchant-settlements/merchants/${merchantId}/history`),

  getMerchantTransactionHistory: (merchantId) =>
    http.get(`/merchant-settlements/merchants/${merchantId}/transactions`),

  getSettlementBanks: () =>
    http.get('/merchant-settlements/banks'),

  getLinkedBankAccounts: () =>
    http.get('/merchant-settlements/linked-bank-accounts'),

  linkSettlementBankAccount: (data) =>
    http.post('/merchant-settlements/linked-bank-accounts', data),

  approveMerchantSettlement: (id, data) =>
    http.post(`/merchant-settlements/${id}/approve`, data),

  rejectMerchantSettlement: (id, data) =>
    http.post(`/merchant-settlements/${id}/reject`, data),

  exportMerchantSettlements: (status, format) => {
    const query = new URLSearchParams({ ...(status ? { status } : {}), format }).toString()
    return http.download(`/merchant-settlements/export?${query}`)
  },

  // Business Billpay
  getBusinessBillpay: () =>
    http.get('/business-billpay'),

  getBusinessBillpayDetail: (id) =>
    http.get(`/business-billpay/${id}`),

  approveBusinessBillpay: (id) =>
    http.post(`/business-billpay/${id}/approve`),

  rejectBusinessBillpay: (id) =>
    http.post(`/business-billpay/${id}/reject`),

  exportBusinessBillpay: (status, format) => {
    const query = new URLSearchParams({ ...(status ? { status } : {}), format }).toString()
    return http.download(`/business-billpay/export?${query}`)
  },

  // Merchant Statement
  getMerchantStatementList: (search) => {
    const query = new URLSearchParams(search ? { search } : {}).toString()
    return http.get(`/merchant-statement${query ? `?${query}` : ''}`)
  },

  getMerchantStatement: (id, dateFrom, dateTo) => {
    const query = new URLSearchParams({ date_from: dateFrom, date_to: dateTo }).toString()
    return http.get(`/merchant-statement/${id}?${query}`)
  },

  exportMerchantStatement: (id, dateFrom, dateTo, format) => {
    const query = new URLSearchParams({ date_from: dateFrom, date_to: dateTo, format }).toString()
    return http.download(`/merchant-statement/${id}/export?${query}`)
  },

  adjustMerchantStatementBalance: (id, data) =>
    http.post(`/merchant-statement/${id}/adjustment`, data),

  // Terminals Management
  getTerminalsManagement: () => http.get('/terminals-management'),

  getTerminalManagementMerchants: () => http.get('/terminals-management/merchants'),

  addTerminalManagement: (data) => http.post('/terminals-management', data),

  updateTerminalManagement: (id, data) => http.put(`/terminals-management/${id}`, data),

  changeTerminalManagementStatus: (id, status) => http.post(`/terminals-management/${id}/status`, { status }),

  // Giftcards — Products
  getGiftcardProducts: () => http.get('/giftcard-products'),

  getGiftcardProductTypes: (id) => http.get(`/giftcard-products/${id}/product-types`),

  activateGiftcardProduct: (id) => http.post(`/giftcard-products/${id}/activate`),

  deactivateGiftcardProduct: (id) => http.post(`/giftcard-products/${id}/deactivate`),

  // Customers — KYC Upgrade
  getKycUpgrades: () => http.get('/kyc-upgrade'),

  getKycUpgrade: (id) => http.get(`/kyc-upgrade/${id}`),

  approveKycUpgrade: (id) => http.post(`/kyc-upgrade/${id}/approve`),

  rejectKycUpgrade: (id, reason) => http.post(`/kyc-upgrade/${id}/reject`, { reason }),

  exportKycUpgrades: (status, format) => {
    const query = new URLSearchParams({ ...(status ? { status } : {}), format }).toString()
    return http.download(`/kyc-upgrade/export?${query}`)
  },

  // Customers — Documents
  getCustomerDocuments: () => http.get('/customer-documents'),

  getCustomerDocument: (id) => http.get(`/customer-documents/${id}`),

  // Customers — Card Verification
  getCardVerifications: () => http.get('/card-verification'),

  getCardVerification: (id) => http.get(`/card-verification/${id}`),

  approveCardVerification: (id) => http.post(`/card-verification/${id}/approve`),

  rejectCardVerification: (id, reason) => http.post(`/card-verification/${id}/reject`, { reason }),

  blacklistCardVerification: (id, reason) => http.post(`/card-verification/${id}/blacklist`, { reason }),

  // Customers — Settlements
  getCustomerSettlements: () => http.get('/customer-settlements'),

  getCustomerSettlement: (id) => http.get(`/customer-settlements/${id}`),

  getCustomerSettlementHistory: (id) => http.get(`/customer-settlements/${id}/history`),

  getCustomerSettlementTransactions: (id) => http.get(`/customer-settlements/${id}/transactions`),

  getCustomerSettlementLinkedBankAccounts: () => http.get('/customer-settlements/linked-bank-accounts'),

  approveCustomerSettlement: (id, data) => http.post(`/customer-settlements/${id}/approve`, data),

  rejectCustomerSettlement: (id, data) => http.post(`/customer-settlements/${id}/reject`, data),

  // Customers — Bank Loads
  getCustomerBankLoads: () => http.get('/customer-bank-loads'),

  getCustomerBankLoad: (id) => http.get(`/customer-bank-loads/${id}`),

  getCustomerBankLoadHistory: (id) => http.get(`/customer-bank-loads/${id}/history`),

  getCustomerBankLoadTransactions: (id) => http.get(`/customer-bank-loads/${id}/transactions`),

  approveCustomerBankLoad: (id, data) => http.post(`/customer-bank-loads/${id}/approve`, data),

  rejectCustomerBankLoad: (id, data) => http.post(`/customer-bank-loads/${id}/reject`, data),

  // Customers — Archive
  getCustomerArchiveList: () => http.get('/customer-archive'),

  getCustomerArchive: (id) => http.get(`/customer-archive/${id}`),

  getCustomerArchiveTransactions: (id, from, to) => http.get(`/customer-archive/${id}/transactions?from=${from}&to=${to}`),

  archiveCustomer: (id) => http.post(`/customer-archive/${id}/archive`),

  exportCustomerArchiveTransactions: (id, format, from, to) => {
    const query = new URLSearchParams({ format, ...(from && to ? { from, to } : {}) }).toString()
    return http.download(`/customer-archive/${id}/export?${query}`)
  },

  // Customers — Login Logs
  getCustomerSuccessLogs: (from, to) => http.get(`/customer-login-logs/success?from=${from}&to=${to}`),

  getCustomerFailedLogs: (from, to) => http.get(`/customer-login-logs/failed?from=${from}&to=${to}`),

  // Transactions — Void Transaction
  searchVoidTransaction: (data) => http.post('/void-transaction/search', data),

  voidTransaction: (data) => http.post('/void-transaction/void', data),

  // Administration — User Activity
  getUserActivity: (filters = {}) => {
    const query = new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '' && v != null))).toString()
    return http.get(`/user-activity${query ? `?${query}` : ''}`)
  },

  logPageVisit: (path) => http.post('/user-activity/visit', { path }),
}

export default ApiService
