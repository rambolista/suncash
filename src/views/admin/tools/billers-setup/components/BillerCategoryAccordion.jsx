import { Accordion, Badge, Form } from 'react-bootstrap'
import BillerAvatar from './BillerAvatar'

const CategorySelectAll = ({ total, checkedCount, disabled, onChange }) => (
  <Form.Check
    type="checkbox"
    className="d-inline-block me-2"
    checked={total > 0 && checkedCount === total}
    disabled={disabled || total === 0}
    ref={(el) => { if (el) el.indeterminate = checkedCount > 0 && checkedCount < total }}
    onClick={(e) => e.stopPropagation()}
    onChange={(e) => onChange(e.target.checked)}
    aria-label="Select all in category"
  />
)

const BillerCategoryAccordion = ({ groups, checkedMap, canEdit, activeKeys, onActiveKeysChange, onToggleOne, onToggleCategory }) => (
  <Accordion activeKey={activeKeys} onSelect={onActiveKeysChange} alwaysOpen>
    {groups.map((group) => {
      const ids = group.billers.map((b) => b.id)
      const checkedCount = ids.filter((id) => checkedMap[id]).length

      return (
        <Accordion.Item eventKey={group.name} key={group.name}>
          <Accordion.Header>
            <div className="d-flex align-items-center flex-grow-1 pe-2">
              <CategorySelectAll
                total={ids.length}
                checkedCount={checkedCount}
                disabled={!canEdit}
                onChange={(checked) => onToggleCategory(ids, checked)}
              />
              <span className="fw-semibold">{group.name}</span>
              <Badge bg="light" text="dark" className="ms-2">{checkedCount}/{ids.length}</Badge>
            </div>
          </Accordion.Header>
          <Accordion.Body className="pt-2">
            <div className="row g-2">
              {group.billers.map((biller) => (
                <div className="col-12 col-md-6 col-xl-4" key={biller.id}>
                  <Form.Check
                    type="checkbox"
                    id={`biller-${biller.id}`}
                    disabled={!canEdit}
                    checked={Boolean(checkedMap[biller.id])}
                    onChange={(e) => onToggleOne(biller.id, e.target.checked)}
                    label={(
                      <span className="d-inline-flex align-items-center gap-2">
                        <BillerAvatar src={biller.profile_pic} />
                        <span>
                          <span className="fw-medium">{biller.suntag_shortcode}</span>
                          <span className="text-muted"> — {biller.dba_name || '—'}</span>
                        </span>
                      </span>
                    )}
                  />
                </div>
              ))}
            </div>
          </Accordion.Body>
        </Accordion.Item>
      )
    })}
  </Accordion>
)

export default BillerCategoryAccordion
