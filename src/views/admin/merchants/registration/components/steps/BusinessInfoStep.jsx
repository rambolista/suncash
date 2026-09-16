import { Button, Col, Form, Row } from 'react-bootstrap'
import { useWizard } from 'react-use-wizard'
import Icon from '@/components/wrappers/Icon'
import { BAHAMAS_ISLANDS, ENTITY_TYPES } from '../../data/merchantReferenceData'
import { Required } from './wizardConstants'

export const BusinessFields = ({
  values, errors, setField, isEdit, idStatus, usernameStatus, onIdChange, onUsernameChange,
  logoUploading, logoError, onLogoSelect, onLogoClear, onPhoneChange, onPhoneBlur,
}) => (
  <Row className="g-3">
    <Col md={12}>
      <Form.Check type="checkbox" id="ezpay_merchant" name="ezpay_merchant" label="Mark as Ezpay Merchant" checked={values.ezpay_merchant} onChange={setField} />
    </Col>
    <Col md={6}>
      <Form.Group>
        <Form.Label>Merchant Logo</Form.Label>
        <div className="d-flex align-items-center gap-3">
          <div className="rounded border d-flex align-items-center justify-content-center bg-light flex-shrink-0" style={{ width: 64, height: 64, overflow: 'hidden' }}>
            {values.logo ? (
              <img src={values.logo} alt="Merchant logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <Icon icon="photo" className="text-muted fs-4" />
            )}
          </div>
          <div>
            <Form.Control type="file" accept="image/*" size="sm" onChange={onLogoSelect} disabled={logoUploading} />
            {logoUploading && <div className="small text-muted mt-1">Uploading…</div>}
            {logoError && <div className="small text-danger mt-1">{logoError}</div>}
            {values.logo && !logoUploading && (
              <Button variant="link" size="sm" className="p-0 mt-1 text-danger" onClick={onLogoClear}>Remove logo</Button>
            )}
          </div>
        </div>
      </Form.Group>
    </Col>
    <Col md={6}>
      <Form.Group>
        <Form.Label>Merchant ID {!isEdit && <Required />}</Form.Label>
        <Form.Control
          name="merchant_id"
          value={values.merchant_id}
          onChange={(e) => { setField(e); onIdChange(e.target.value) }}
          isInvalid={!!errors.merchant_id}
          readOnly={isEdit}
          plaintext={isEdit}
        />
        <Form.Control.Feedback type="invalid">{errors.merchant_id}</Form.Control.Feedback>
        {!isEdit && idStatus === 'checking' && <div className="small text-muted">Checking availability…</div>}
        {!isEdit && idStatus === 'available' && <div className="small text-success">Available</div>}
        {!isEdit && idStatus === 'taken' && !errors.merchant_id && <div className="small text-danger">Merchant ID already exists.</div>}
      </Form.Group>
    </Col>
    <Col md={6}>
      <Form.Group>
        <Form.Label>Entity Type <Required /></Form.Label>
        <Form.Select name="entity_type" value={values.entity_type} onChange={setField} isInvalid={!!errors.entity_type}>
          <option value="">--SELECT--</option>
          {ENTITY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </Form.Select>
        <Form.Control.Feedback type="invalid">{errors.entity_type}</Form.Control.Feedback>
      </Form.Group>
    </Col>
    <Col md={6}>
      <Form.Group>
        <Form.Label>Exact Legal Name <Required /></Form.Label>
        <Form.Control name="exact_legal_name" value={values.exact_legal_name} onChange={setField} isInvalid={!!errors.exact_legal_name} />
        <Form.Control.Feedback type="invalid">{errors.exact_legal_name}</Form.Control.Feedback>
      </Form.Group>
    </Col>
    <Col md={6}>
      <Form.Group>
        <Form.Label>Doing Business As</Form.Label>
        <Form.Control name="doing_business_as" value={values.doing_business_as} onChange={setField} />
      </Form.Group>
    </Col>
    <Col md={6}>
      <Form.Group>
        <Form.Label>DBA Name</Form.Label>
        <Form.Control name="dba_name" value={values.dba_name} onChange={setField} />
      </Form.Group>
    </Col>
    <Col md={6}>
      <Form.Group>
        <Form.Label>Tax ID</Form.Label>
        <Form.Control name="tax_id" value={values.tax_id} onChange={setField} />
      </Form.Group>
    </Col>
    <Col md={6}>
      <Form.Group>
        <Form.Label>Street Address 1 <Required /></Form.Label>
        <Form.Control name="address1" value={values.address1} onChange={setField} isInvalid={!!errors.address1} />
        <Form.Control.Feedback type="invalid">{errors.address1}</Form.Control.Feedback>
      </Form.Group>
    </Col>
    <Col md={6}>
      <Form.Group>
        <Form.Label>Street Address 2</Form.Label>
        <Form.Control name="address2" value={values.address2} onChange={setField} />
      </Form.Group>
    </Col>
    <Col md={4}>
      <Form.Group>
        <Form.Label>City/Island/State <Required /></Form.Label>
        <Form.Select name="city" value={values.city} onChange={setField} isInvalid={!!errors.city}>
          <option value="">--SELECT--</option>
          {BAHAMAS_ISLANDS.map((island) => <option key={island} value={island}>{island}</option>)}
        </Form.Select>
        <Form.Control.Feedback type="invalid">{errors.city}</Form.Control.Feedback>
      </Form.Group>
    </Col>
    <Col md={4}>
      <Form.Group>
        <Form.Label>PO Box</Form.Label>
        <Form.Control name="postalcode" value={values.postalcode} onChange={setField} />
      </Form.Group>
    </Col>
    <Col md={4}>
      <Form.Group>
        <Form.Label>Country</Form.Label>
        <Form.Control name="country" value={values.country} onChange={setField} />
      </Form.Group>
    </Col>
    <Col md={6}>
      <Form.Group>
        <Form.Label>Merchant Short Code</Form.Label>
        <Form.Control name="short_code" value={values.short_code} onChange={setField} placeholder="Only applicable for Biller and Charitable Institution merchants" />
      </Form.Group>
    </Col>
    <Col md={6}>
      <Form.Group>
        <Form.Label>Business License Number</Form.Label>
        <Form.Control name="business_license_number" value={values.business_license_number} onChange={setField} />
      </Form.Group>
    </Col>
    <Col md={4}>
      <Form.Group>
        <Form.Label>Billing Street Address</Form.Label>
        <Form.Control name="billing_address" value={values.billing_address} onChange={setField} />
      </Form.Group>
    </Col>
    <Col md={4}>
      <Form.Group>
        <Form.Label>Billing City/Island</Form.Label>
        <Form.Select name="billing_city" value={values.billing_city} onChange={setField}>
          <option value="">--SELECT--</option>
          {BAHAMAS_ISLANDS.map((island) => <option key={island} value={island}>{island}</option>)}
        </Form.Select>
      </Form.Group>
    </Col>
    <Col md={4}>
      <Form.Group>
        <Form.Label>Billing PO Box</Form.Label>
        <Form.Control name="billing_postalcode" value={values.billing_postalcode} onChange={setField} />
      </Form.Group>
    </Col>
    <Col md={4}>
      <Form.Group>
        <Form.Label>Phone Number</Form.Label>
        <Form.Control name="contactphone" value={values.contactphone} onChange={onPhoneChange} onBlur={onPhoneBlur} isInvalid={!!errors.contactphone} placeholder="242-123-4567" maxLength={12} />
        <Form.Control.Feedback type="invalid">{errors.contactphone}</Form.Control.Feedback>
      </Form.Group>
    </Col>
    <Col md={4}>
      <Form.Group>
        <Form.Label>Mobile Number <Required /></Form.Label>
        <Form.Control name="contactmobile" value={values.contactmobile} onChange={onPhoneChange} onBlur={onPhoneBlur} isInvalid={!!errors.contactmobile} placeholder="242-123-4567" maxLength={12} />
        <Form.Control.Feedback type="invalid">{errors.contactmobile}</Form.Control.Feedback>
      </Form.Group>
    </Col>
    <Col md={4}>
      <Form.Group>
        <Form.Label>FAX Number</Form.Label>
        <Form.Control name="contactfax" value={values.contactfax} onChange={onPhoneChange} onBlur={onPhoneBlur} isInvalid={!!errors.contactfax} placeholder="242-123-4567" maxLength={12} />
        <Form.Control.Feedback type="invalid">{errors.contactfax}</Form.Control.Feedback>
      </Form.Group>
    </Col>
    <Col md={6}>
      <Form.Group>
        <Form.Label>e-mail Address <Required /></Form.Label>
        <Form.Control type="email" name="contactemail" value={values.contactemail} onChange={setField} isInvalid={!!errors.contactemail} placeholder="name@example.com" />
        <Form.Control.Feedback type="invalid">{errors.contactemail}</Form.Control.Feedback>
      </Form.Group>
    </Col>
    <Col md={6}>
      <Form.Group>
        <Form.Label>Primary Contact <Required /></Form.Label>
        <Form.Control name="contactname" value={values.contactname} onChange={setField} isInvalid={!!errors.contactname} />
        <Form.Control.Feedback type="invalid">{errors.contactname}</Form.Control.Feedback>
      </Form.Group>
    </Col>
    <Col md={6}>
      <Form.Group>
        <Form.Label>Default Merchant Username {!isEdit && <Required />}</Form.Label>
        <Form.Control
          name="username"
          value={values.username}
          onChange={(e) => { setField(e); onUsernameChange(e.target.value) }}
          isInvalid={!!errors.username}
          readOnly={isEdit}
          plaintext={isEdit}
        />
        <Form.Control.Feedback type="invalid">{errors.username}</Form.Control.Feedback>
        {!isEdit && usernameStatus === 'checking' && <div className="small text-muted">Checking availability…</div>}
        {!isEdit && usernameStatus === 'available' && <div className="small text-success">Available</div>}
        {!isEdit && usernameStatus === 'taken' && !errors.username && <div className="small text-danger">Username is already taken.</div>}
      </Form.Group>
    </Col>
    <Col md={6}>
      <Form.Group>
        <Form.Label>
          Password{' '}
          {!isEdit && <Required />}
          {isEdit && <span className="text-muted small">(leave blank to keep current)</span>}
        </Form.Label>
        <Form.Control type="password" name="password" value={values.password} onChange={setField} isInvalid={!!errors.password} />
        <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
        <div className="small text-muted">At least 1 letter, 1 number, 6-20 characters.</div>
      </Form.Group>
    </Col>
  </Row>
)

export const StepBusiness = (props) => {
  const { nextStep } = useWizard()
  return (
    <div className="pt-4">
      <BusinessFields {...props} />
      <div className="d-flex justify-content-end mt-4">
        <Button variant="primary" onClick={() => { if (props.validateStep('business')) nextStep() }}>
          Next: Fees & Revenue Share <Icon icon="arrow-right" className="ms-1" />
        </Button>
      </div>
    </div>
  )
}
