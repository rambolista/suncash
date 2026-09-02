import { Button, Modal, Table } from 'react-bootstrap'
import Icon from '@/components/wrappers/Icon'
import LoadingState from '@/components/LoadingState'

const money = (value) => `$${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const VALUE_COLUMNS = new Set(['value'])

/** Shared detail panel for the three Replenish Reports "View" actions (Meter / Add Cash / Clear Acceptor). */
const ReplenishDetailModal = ({ show, onHide, title, loading, date, columns, rows, totals, exporting, onExport, canExport = true }) => (
  <Modal show={show} onHide={onHide} centered size="lg">
    <Modal.Header closeButton>
      <Modal.Title>{title}</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      {loading ? <LoadingState /> : (
        <>
          {date && <div className="text-muted small mb-3">Replenish Date: <span className="fw-semibold">{date}</span></div>}
          <div className="table-responsive">
            <Table bordered hover className="align-middle mb-0">
              <thead className="thead-sm text-uppercase fs-xxs">
                <tr>
                  {columns.map((col) => <th key={col.key} className="text-center">{col.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan={columns.length} className="text-center text-muted py-4">No records found</td></tr>
                ) : (
                  <>
                    {rows.map((row, idx) => (
                      // eslint-disable-next-line react/no-array-index-key
                      <tr key={idx}>
                        {columns.map((col) => (
                          <td key={col.key} className="text-center">
                            {VALUE_COLUMNS.has(col.key) ? money(row[col.key]) : (row[col.key] ?? '—')}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {totals && (
                      <tr className="table-active fw-bold">
                        {columns.map((col, idx) => (
                          // eslint-disable-next-line react/no-array-index-key
                          <td key={col.key} className="text-center">
                            {idx === 0 ? 'Total' : (VALUE_COLUMNS.has(col.key) ? money(totals[col.key]) : (totals[col.key] ?? ''))}
                          </td>
                        ))}
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </Table>
          </div>
        </>
      )}
    </Modal.Body>
    <Modal.Footer>
      {canExport && (
        <>
          <Button variant="outline-secondary" disabled={exporting !== '' || rows.length === 0} onClick={() => onExport('pdf')}>
            <Icon icon="file-type-pdf" className="me-1" /> {exporting === 'pdf' ? 'Exporting...' : 'Export to PDF'}
          </Button>
          <Button variant="outline-success" disabled={exporting !== '' || rows.length === 0} onClick={() => onExport('csv')}>
            <Icon icon="file-type-xls" className="me-1" /> {exporting === 'csv' ? 'Exporting...' : 'Export to Excel'}
          </Button>
        </>
      )}
      <Button variant="secondary" onClick={onHide}>Back</Button>
    </Modal.Footer>
  </Modal>
)

export default ReplenishDetailModal
