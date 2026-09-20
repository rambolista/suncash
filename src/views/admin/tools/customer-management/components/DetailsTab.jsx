import { useEffect, useState } from 'react'
import { Alert, Button, Card, Col, Form, Row } from 'react-bootstrap'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'
import { formatDateTime } from '@/utils/reportHelpers'
import ConfirmActionModal from '../../../merchants/components/ConfirmActionModal'
import AccountStatusActionModal from './AccountStatusActionModal'
import AccountStatusHistoryModal from './AccountStatusHistoryModal'
import ScannedIdsModal from './ScannedIdsModal'
import LinkedCardsModal from './LinkedCardsModal'
import LinkedBankAccountsModal from './LinkedBankAccountsModal'

const ReadOnlyField = ({ label, value }) => (
  <Form.Group as={Row} className="mb-2">
    <Form.Label column sm={5} className="text-muted small">{label}</Form.Label>
    <Col sm={7}><Form.Control size="sm" value={value ?? '—'} disabled readOnly /></Col>
  </Form.Group>
)

const SectionHeader = ({ children }) => <h6 className="text-uppercase text-muted small fw-bold mt-4 mb-3 pb-1 border-bottom">{children}</h6>

const money = (value) => `$${Number(value || 0).toFixed(2)}`

const STATUS_BADGE = {
  A: { label: 'Active', className: 'bg-success-subtle text-success' },
  L: { label: 'Locked', className: 'bg-danger-subtle text-danger' },
  R: { label: 'Restricted', className: 'bg-warning-subtle text-warning' },
  I: { label: 'Deactivated', className: 'bg-dark-subtle text-dark' },
}

const NEW_STATUS = { locked: 'LOCKED', restricted: 'RESTRICTED', restore: 'ACTIVE' }

const statusMessage = (detail) => {
  if (detail.status === 'L' && detail.locked_reason) {
    return `Locked by ${detail.locked_by} on ${formatDateTime(detail.locked_date)} — ${detail.locked_reason}${detail.locked_note ? `: ${detail.locked_note}` : ''}`
  }
  if (detail.status === 'R' && detail.restricted_reason) {
    return `Restricted by ${detail.restricted_by} on ${formatDateTime(detail.restricted_date)} — ${detail.restricted_reason}${detail.restricted_note ? `: ${detail.restricted_note}` : ''}`
  }
  if (detail.status === 'I') return 'This account is deactivated (archived).'
  return 'This account has no current restrictions.'
}

const DetailsTab = ({ customerId, detail, canEdit, canDelete, onSaved }) => {
  const { showNotification } = useNotificationContext()
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [reasons, setReasons] = useState({ locked: [], restricted: [], restoration: [] })
  const [actionType, setActionType] = useState(null)
  const [showHistory, setShowHistory] = useState(false)
  const [showScannedIds, setShowScannedIds] = useState(false)
  const [showLinkedCards, setShowLinkedCards] = useState(false)
  const [showLinkedBankAccounts, setShowLinkedBankAccounts] = useState(false)
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false)
  const [showResetPinConfirm, setShowResetPinConfirm] = useState(false)

  const [dropdowns, setDropdowns] = useState({ countries: [], islands: [] })
  const [cities, setCities] = useState([])

  const [cards, setCards] = useState([])
  const [bankAccounts, setBankAccounts] = useState([])
  const [selectedCardId, setSelectedCardId] = useState('')
  const [selectedBankId, setSelectedBankId] = useState('')

  useEffect(() => {
    if (!detail) return
    setForm({
      first_name: detail.first_name || '',
      middle_name: detail.middle_name || '',
      last_name: detail.last_name || '',
      email: detail.email || '',
      gender: detail.gender || '',
      country: detail.country || '',
      birthday: detail.birthday ? detail.birthday.slice(0, 10) : '',
      address1: detail.address1 || '',
      address2: detail.address2 || '',
      zip: detail.zip || '',
      island: detail.island || '',
      city: detail.city || '',
      customer_tag: detail.customer_tag || '',
      risk_rating: detail.risk_rating || '',
      is_card_beta_user: Boolean(detail.is_card_beta_user),
      is_pep: Boolean(detail.is_pep),
    })
  }, [detail])

  useEffect(() => {
    ApiService.getCustomerManagementAccountStatusReasons()
      .then(setReasons)
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load reasons.', variant: 'danger' }))
    ApiService.getCustomerManagementDropdowns()
      .then((result) => setDropdowns({ countries: result?.countries || [], islands: result?.islands || [] }))
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load dropdown lists.', variant: 'danger' }))
    ApiService.getCustomerManagementLinkedCards(customerId)
      .then((result) => setCards(Array.isArray(result?.data) ? result.data : []))
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load linked cards.', variant: 'danger' }))
    ApiService.getCustomerManagementLinkedBankAccounts(customerId)
      .then((result) => setBankAccounts(Array.isArray(result?.data) ? result.data : []))
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load linked bank accounts.', variant: 'danger' }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId])

  useEffect(() => {
    if (!form?.island) {
      setCities([])
      return
    }
    ApiService.getCustomerManagementCitiesByIsland(form.island)
      .then((result) => setCities(result?.data || []))
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load cities.', variant: 'danger' }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form?.island])

  if (!form || !detail) return null

  const updateField = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  const handleIslandChange = (value) => setForm((current) => ({ ...current, island: value, city: '' }))

  const handleSave = async (event) => {
    event.preventDefault()
    setError('')
    setSaving(true)
    try {
      await ApiService.updateCustomerManagement(customerId, form)
      showNotification({ title: 'Success', message: 'Customer profile has been updated.', variant: 'success' })
      onSaved?.()
    } catch (err) {
      setError(err?.errors ? Object.values(err.errors)[0]?.[0] : (err?.message || 'Unable to save changes.'))
    } finally {
      setSaving(false)
    }
  }

  const status = detail.status || 'A'
  const badge = STATUS_BADGE[status] || STATUS_BADGE.A
  const isLockedOrRestricted = status === 'L' || status === 'R'
  const isArchived = status === 'I'
  const reasonListFor = (type) => (type === 'restore' ? reasons.restoration : reasons[type]) || []

  return (
    <>
      <Card className="mb-3">
        <Card.Header><h5 className="mb-0">Cardholder Profile</h5></Card.Header>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 pb-3 border-bottom">
            <div>
              <div className="text-muted small mb-1">Account Status</div>
              <span className={`badge badge-label ${badge.className} me-2`}>{badge.label}</span>
              <span className="text-muted small">{statusMessage(detail)}</span>
            </div>
            {!isArchived && (
              <div className="d-flex gap-2 flex-wrap">
                {canEdit && !isLockedOrRestricted && (
                  <>
                    <Button variant="danger" size="sm" onClick={() => setActionType('locked')}>
                      <Icon icon="lock" className="me-1" /> Lock Account
                    </Button>
                    <Button variant="warning" size="sm" onClick={() => setActionType('restricted')}>
                      <Icon icon="ban" className="me-1" /> Restrict Account
                    </Button>
                  </>
                )}
                {canEdit && isLockedOrRestricted && (
                  <Button variant="success" size="sm" onClick={() => setActionType('restore')}>
                    <Icon icon="lock-open" className="me-1" /> Restore Account
                  </Button>
                )}
                <Button variant="outline-secondary" size="sm" onClick={() => setShowHistory(true)}>
                  <Icon icon="history" className="me-1" /> View Status History
                </Button>
              </div>
            )}
          </div>

          {error && <Alert variant="danger" className="py-2 small mb-3 mt-3">{error}</Alert>}
          <fieldset disabled={!canEdit}>
            <Form onSubmit={handleSave}>
              <SectionHeader>Personal Information</SectionHeader>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-2"><Form.Label className="small text-muted">First Name</Form.Label><Form.Control size="sm" value={form.first_name} onChange={(e) => updateField('first_name', e.target.value)} /></Form.Group>
                  <Form.Group className="mb-2"><Form.Label className="small text-muted">Middle Name</Form.Label><Form.Control size="sm" value={form.middle_name} onChange={(e) => updateField('middle_name', e.target.value)} /></Form.Group>
                  <Form.Group className="mb-2"><Form.Label className="small text-muted">Last Name</Form.Label><Form.Control size="sm" value={form.last_name} onChange={(e) => updateField('last_name', e.target.value)} /></Form.Group>
                  <ReadOnlyField label="Mobile Number" value={detail?.mobile} />
                  <Form.Group className="mb-2"><Form.Label className="small text-muted">Email</Form.Label><Form.Control size="sm" type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} /></Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-2"><Form.Label className="small text-muted">Gender</Form.Label>
                    <Form.Select size="sm" value={form.gender} onChange={(e) => updateField('gender', e.target.value)}>
                      <option value="">—</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="mb-2"><Form.Label className="small text-muted">Birthday</Form.Label><Form.Control size="sm" type="date" value={form.birthday} onChange={(e) => updateField('birthday', e.target.value)} /></Form.Group>
                  <ReadOnlyField label="Date Account Created" value={formatDateTime(detail?.created_date)} />
                  <div>
                    <Form.Label className="small text-muted d-block mb-1">Politically Exposed Person (PEP)</Form.Label>
                    <Form.Check inline type="radio" name="is_pep" label="Yes" checked={form.is_pep} onChange={() => updateField('is_pep', true)} />
                    <Form.Check inline type="radio" name="is_pep" label="No" checked={!form.is_pep} onChange={() => updateField('is_pep', false)} />
                  </div>
                </Col>
              </Row>

              <SectionHeader>Address</SectionHeader>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-2"><Form.Label className="small text-muted">Country</Form.Label>
                    <Form.Select size="sm" value={form.country} onChange={(e) => updateField('country', e.target.value)}>
                      <option value="">—</option>
                      {dropdowns.countries.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="mb-2"><Form.Label className="small text-muted">Address 1</Form.Label><Form.Control size="sm" value={form.address1} onChange={(e) => updateField('address1', e.target.value)} /></Form.Group>
                  <Form.Group className="mb-2"><Form.Label className="small text-muted">Address 2</Form.Label><Form.Control size="sm" value={form.address2} onChange={(e) => updateField('address2', e.target.value)} /></Form.Group>
                  <Form.Group className="mb-2"><Form.Label className="small text-muted">Zip</Form.Label><Form.Control size="sm" value={form.zip} onChange={(e) => updateField('zip', e.target.value)} /></Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-2"><Form.Label className="small text-muted">Island</Form.Label>
                    <Form.Select size="sm" value={form.island} onChange={(e) => handleIslandChange(e.target.value)}>
                      <option value="">—</option>
                      {dropdowns.islands.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="mb-2"><Form.Label className="small text-muted">City</Form.Label>
                    <Form.Select size="sm" value={form.city} onChange={(e) => updateField('city', e.target.value)} disabled={!form.island}>
                      <option value="">—</option>
                      {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <SectionHeader>Account Details</SectionHeader>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-2"><Form.Label className="small text-muted">Shortcode</Form.Label><Form.Control size="sm" value={form.customer_tag} onChange={(e) => updateField('customer_tag', e.target.value)} /></Form.Group>
                  <Form.Group className="mb-2"><Form.Label className="small text-muted">Risk Rating</Form.Label>
                    <Form.Select size="sm" value={form.risk_rating} onChange={(e) => updateField('risk_rating', e.target.value)}>
                      <option value="">—</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </Form.Select>
                  </Form.Group>
                  <ReadOnlyField label="Occupation" value={detail?.occupation_name} />
                  <ReadOnlyField label="Position Level" value={detail?.employment_position_level_name} />
                </Col>
                <Col md={6}>
                  <ReadOnlyField label="Bank Topup Account" value={detail?.suncash_bank_account} />
                  <ReadOnlyField label="KYC Status" value={detail?.kyc_status} />
                  <Form.Check className="mt-2" type="switch" label="Card Beta User" checked={form.is_card_beta_user} onChange={(e) => updateField('is_card_beta_user', e.target.checked)} />
                </Col>
              </Row>

              <SectionHeader>Card &amp; Transactions</SectionHeader>
              <Row>
                <Col md={6}>
                  <ReadOnlyField label="Prepaid Card Number" value={detail?.prepaid_card_number} />
                  <ReadOnlyField label="Avg. Weekly/Monthly Transactions Debits" value={money(detail?.avg_monthly_debit)} />
                </Col>
                <Col md={6}>
                  <ReadOnlyField label="Avg. Weekly/Monthly Transactions Credits" value={money(detail?.avg_monthly_credit)} />
                </Col>
              </Row>

              <SectionHeader>App &amp; Devices</SectionHeader>
              <Row>
                <Col md={6}>
                  <ReadOnlyField label="iOS App Version" value={detail?.ios_version} />
                  <ReadOnlyField label="Android App Version" value={detail?.android_version} />
                </Col>
                <Col md={6}>
                  <Form.Label className="small text-muted d-block mb-1">Authorized Devices</Form.Label>
                  {(detail?.authorized_devices || []).length === 0
                    ? <p className="text-muted small">No authorized devices on file.</p>
                    : (
                      <ul className="small ps-3 mb-0">
                        {detail.authorized_devices.map((d) => (
                          <li key={d.id}>{d.model || 'Unknown device'} — {formatDateTime(d.timestamp)}</li>
                        ))}
                      </ul>
                    )}
                </Col>
              </Row>

              <Row className="mt-2 g-2 align-items-end">
                <Col md={6}>
                  <Form.Label className="small text-muted">Linked Cards</Form.Label>
                  <div className="d-flex gap-2">
                    <Form.Select size="sm" value={selectedCardId} onChange={(e) => setSelectedCardId(e.target.value)} disabled={cards.length === 0}>
                      <option value="">{cards.length === 0 ? 'No linked cards' : 'Select a card'}</option>
                      {cards.map((c) => <option key={c.id} value={c.id}>{c.cardholder_name} — •••• {c.card_last_four_digits}</option>)}
                    </Form.Select>
                    <Button variant="outline-secondary" size="sm" disabled={!selectedCardId} onClick={() => setShowLinkedCards(true)}>View</Button>
                  </div>
                </Col>
                <Col md={6}>
                  <Form.Label className="small text-muted">Linked Bank Accounts</Form.Label>
                  <div className="d-flex gap-2">
                    <Form.Select size="sm" value={selectedBankId} onChange={(e) => setSelectedBankId(e.target.value)} disabled={bankAccounts.length === 0}>
                      <option value="">{bankAccounts.length === 0 ? 'No linked bank accounts' : 'Select a bank account'}</option>
                      {bankAccounts.map((b) => <option key={b.id} value={b.id}>{b.bank} — {b.account_number}</option>)}
                    </Form.Select>
                    <Button variant="outline-secondary" size="sm" disabled={!selectedBankId} onClick={() => setShowLinkedBankAccounts(true)}>View</Button>
                  </div>
                </Col>
              </Row>

              {canEdit && (
                <Button type="submit" variant="primary" className="mt-3" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              )}
            </Form>
          </fieldset>

          <hr />
          <div className="d-flex gap-2 flex-wrap">
            {canEdit && (
              <Button variant="secondary" size="sm" onClick={() => setShowResetPinConfirm(true)}>
                <Icon icon="key" className="me-1" /> Reset Pin
              </Button>
            )}
            <Button variant="outline-secondary" size="sm" onClick={() => setShowScannedIds(true)}>
              <Icon icon="id" className="me-1" /> View Scanned ID&apos;s
            </Button>
            {canDelete && (
              <Button variant="danger" size="sm" disabled={isArchived} onClick={() => setShowArchiveConfirm(true)}>
                <Icon icon="archive" className="me-1" /> {isArchived ? 'Already Archived' : 'Archive'}
              </Button>
            )}
          </div>
        </Card.Body>
      </Card>

      <AccountStatusActionModal
        show={Boolean(actionType)}
        onHide={() => setActionType(null)}
        actionType={actionType}
        reasons={reasonListFor(actionType)}
        onSubmit={({ reasonId, reasonLabel, reference, note }) => ApiService.updateCustomerManagementAccountStatus(customerId, {
          current_status: status,
          new_status: NEW_STATUS[actionType],
          reason_id: reasonId,
          reason_label: reasonLabel,
          note,
          change_type: actionType,
          reference,
        })}
        onSaved={() => {
          showNotification({ title: 'Success', message: 'Account Status has been updated.', variant: 'success' })
          onSaved?.()
        }}
      />
      <AccountStatusHistoryModal show={showHistory} onHide={() => setShowHistory(false)} customerId={customerId} />
      <ScannedIdsModal show={showScannedIds} onHide={() => setShowScannedIds(false)} customerId={customerId} canEdit={canEdit} />
      <LinkedCardsModal
        show={showLinkedCards}
        onHide={() => setShowLinkedCards(false)}
        card={cards.find((c) => String(c.id) === String(selectedCardId))}
        canDelete={canDelete}
        onDeleted={(cardId) => {
          setCards((current) => current.filter((c) => c.id !== cardId))
          setSelectedCardId('')
        }}
      />
      <LinkedBankAccountsModal
        show={showLinkedBankAccounts}
        onHide={() => setShowLinkedBankAccounts(false)}
        account={bankAccounts.find((b) => String(b.id) === String(selectedBankId))}
      />
      <ConfirmActionModal
        show={showArchiveConfirm}
        onHide={() => setShowArchiveConfirm(false)}
        title="Archive customer"
        message="Are you sure you want to archive this customer? This frees up their mobile number for reuse and deactivates their account."
        confirmLabel="Archive"
        confirmVariant="danger"
        successMessage="Customer status has been updated."
        onConfirm={() => ApiService.archiveCustomerManagement(customerId)}
        onDone={onSaved}
      />
      <ConfirmActionModal
        show={showResetPinConfirm}
        onHide={() => setShowResetPinConfirm(false)}
        title="Reset PIN"
        message="Are you sure you want to reset this customer's PIN?"
        confirmLabel="Reset Pin"
        confirmVariant="danger"
        successMessage="Customer PIN has been reset."
        onConfirm={() => ApiService.resetCustomerManagementPin(customerId)}
      />
    </>
  )
}

export default DetailsTab
