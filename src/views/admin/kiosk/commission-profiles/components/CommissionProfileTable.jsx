import { Table } from 'react-bootstrap'
import ActionButton from '@/views/admin/merchants/components/ActionButton'
import { money, percent } from './format'

const CommissionProfileTable = ({ rows, canEdit, onEdit }) => (
  <Table responsive hover size="sm" className="align-middle mb-0">
    <thead className="thead-sm text-uppercase fs-xxs table-light">
      <tr>
        <th>Transaction Type</th>
        <th className="text-end">Provider %</th>
        <th className="text-end">Cap Amount</th>
        <th className="text-end">Minimum Amount</th>
        <th className="text-end">Frequency Limit (Days)</th>
        <th className="text-end">Agent %</th>
        <th className="text-end">Suncash %</th>
        <th className="text-end">Owner %</th>
        {canEdit && <th className="text-center" style={{ width: 80 }}>Action</th>}
      </tr>
    </thead>
    <tbody>
      {rows.length === 0 && (
        <tr>
          <td colSpan={canEdit ? 9 : 8} className="text-center text-muted py-4">
            No commission rows found for this profile.
          </td>
        </tr>
      )}
      {rows.map((row) => (
        <tr key={row.id}>
          <td>{row.product_name}</td>
          <td className="text-end">{percent(row.provider_percentage)}</td>
          <td className="text-end">{money(row.cap_amount)}</td>
          <td className="text-end">{money(row.minimum_amount)}</td>
          <td className="text-end">{row.frequency_in_limit_days}</td>
          <td className="text-end">{percent(row.agent_percentage)}</td>
          <td className="text-end">{percent(row.suncash_percentage)}</td>
          <td className="text-end">{percent(row.owner_percentage)}</td>
          {canEdit && (
            <td className="text-center">
              <ActionButton label="Edit" icon="edit" onClick={() => onEdit(row)} />
            </td>
          )}
        </tr>
      ))}
    </tbody>
  </Table>
)

export default CommissionProfileTable
