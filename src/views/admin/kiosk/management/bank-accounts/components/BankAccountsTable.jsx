import DT from 'datatables.net-bs5'
import DataTable from 'datatables.net-react'
import 'datatables.net-responsive'
import { useMemo, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { FormControl } from 'react-bootstrap'
import { bindColumnSearchInputs } from '@/views/admin/apps/access-management/utils/dataTableColumnSearch'
import { bindSortLabels } from '@/views/admin/apps/access-management/utils/dataTableSortLabels'
import { paginationIcons } from '@/views/admin/apps/access-management/utils/paginationIcons'
import ActionButton from '@/views/admin/merchants/components/ActionButton'
import { escapeHtml, formatDateTime } from '../../components/format'

DataTable.use(DT)

const textCol = (key) => ({ data: key, render: (value) => escapeHtml(value || '—') })

const columns = [
  { data: 'create_date', render: (value, type) => (type === 'display' ? formatDateTime(value) : value || '') },
  textCol('created_by'),
  textCol('branch_name'),
  textCol('bank_name'),
  textCol('bank_branch_name'),
  textCol('account_name'),
  textCol('account_number_masked'),
  { data: 'update_date', render: (value, type) => (type === 'display' ? formatDateTime(value) : value || '') },
  textCol('updated_by'),
  {
    data: 'id',
    orderable: false,
    searchable: false,
    width: '90px',
    className: 'text-nowrap action-cell',
    render: (id) => `<div class="kiosk-bank-action-slot" data-id="${id}"></div>`,
  },
]

const headers = ['Creation Date', 'Created By', 'Branch Name', 'Bank Name', 'Bank Branch', 'Account Name', 'Account No', 'Last Update Date', 'Update By', 'Action']

const BankAccountsTable = ({ data, canEdit, canDelete, onEdit, onDelete }) => {
  const handlers = useRef({ onEdit, onDelete })
  handlers.current = { onEdit, onDelete }

  const rowMap = useMemo(() => {
    const map = {}
    data.forEach((item) => { map[item.id] = item })
    return map
  }, [data])

  const createdRow = useMemo(() => (row, rowData) => {
    const item = rowMap[rowData.id] ?? rowData
    const slot = row.querySelector('.kiosk-bank-action-slot')
    if (!slot) return
    const root = slot.__actionRoot || createRoot(slot)
    slot.__actionRoot = root

    root.render(
      <>
        {canEdit && <ActionButton label="Edit" icon="edit" onClick={() => handlers.current.onEdit(item)} />}
        {canDelete && <ActionButton label="Delete" icon="trash" iconClassName="text-danger" onClick={() => handlers.current.onDelete(item)} />}
      </>,
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowMap, canEdit, canDelete])

  const options = useMemo(() => ({
    responsive: true,
    pageLength: 25,
    orderCellsTop: true,
    order: [[0, 'desc']],
    columnDefs: [{ targets: '_all', orderSequence: ['asc', 'desc', ''] }],
    initComplete: function () {
      bindColumnSearchInputs(this.api())
      bindSortLabels(this.api())
      const container = this.api().table().container()
      container.style.marginTop = '0'
      const controlsRow = container.querySelector(':scope > .row')
      controlsRow?.classList.add('mb-3')
    },
    language: { paginate: paginationIcons },
    createdRow,
  }), [createdRow])

  return (
    <DataTable data={data} columns={columns} options={options} className="table dt-responsive align-middle mb-0 w-100">
      <thead className="thead-sm text-uppercase fs-xxs">
        <tr>
          {headers.map((header) => <th key={header}>{header}</th>)}
        </tr>
        <tr className="column-search-input-bar">
          {headers.map((header, index) => (
            <th key={header}>
              {header !== 'Action' && <FormControl size="sm" type="text" placeholder={header} className="bg-light-subtle border-light" data-col-index={index} />}
            </th>
          ))}
        </tr>
      </thead>
    </DataTable>
  )
}

export default BankAccountsTable
