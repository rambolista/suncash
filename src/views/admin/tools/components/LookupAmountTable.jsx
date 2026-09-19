import DT from 'datatables.net-bs5'
import DataTable from 'datatables.net-react'
import 'datatables.net-responsive'
import { useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import { baseDataTableOptions, initTableSearchAndSort, resetDataTableContainerSpacing } from '@/views/admin/apps/access-management/utils/dataTableOptions'
import DataTableColumnSearchRow from '@/views/admin/apps/access-management/utils/DataTableColumnSearchRow'
import ActionButton from '@/views/admin/merchants/components/ActionButton'
import { escapeHtml } from '@/utils/reportHelpers'
DataTable.use(DT)

/** Shared DataTable for Tools > Transaction Fees / Transaction Limits — both are a fixed lookup list with a single "Edit the amount" action per row. */
const LookupAmountTable = ({ data, columns, canEdit, onEdit }) => {
  const rowMap = useMemo(() => {
    const map = {}
    data.forEach((item) => { map[item.id] = item })
    return map
  }, [data])

  const dtColumns = useMemo(() => {
    const cols = columns.map(({ key, render }) => ({
      data: key,
      render: render ? (value) => escapeHtml(render(value)) : (value) => escapeHtml(value ?? '—'),
    }))

    if (canEdit) {
      cols.push({
        data: 'id',
        orderable: false,
        searchable: false,
        width: '100px',
        className: 'text-nowrap action-cell',
        render: (id) => `<div class="lookup-amount-action-slot" data-id="${id}"></div>`,
      })
    }

    return cols
  }, [columns, canEdit])

  const headers = useMemo(() => [...columns.map((c) => c.label), ...(canEdit ? ['Action'] : [])], [columns, canEdit])

  const createdRow = useMemo(() => (row, rowData) => {
    if (!canEdit) return
    const item = rowMap[rowData.id] ?? rowData
    const slot = row.querySelector('.lookup-amount-action-slot')
    if (!slot) return
    const root = slot.__actionRoot || createRoot(slot)
    slot.__actionRoot = root
    root.render(<ActionButton label="Edit" icon="pencil" onClick={() => onEdit(item)} />)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowMap, canEdit, onEdit])

  const options = useMemo(() => ({
    ...baseDataTableOptions,
    pageLength: 25,
    columnDefs: [{ targets: '_all', orderSequence: ['asc', 'desc', ''] }],
    initComplete: function () {
      initTableSearchAndSort(this.api())
      resetDataTableContainerSpacing(this.api())
    },
    createdRow,
  }), [createdRow])

  return (
    <div className="table-responsive">
      <DataTable data={data} columns={dtColumns} options={options} className="table dt-responsive align-middle mb-0 w-100">
        <thead className="thead-sm text-uppercase fs-xxs">
          <tr>
            {headers.map((header) => <th key={header}>{header}</th>)}
          </tr>
          <DataTableColumnSearchRow headers={headers} columns={dtColumns} data={data} />
        </thead>
      </DataTable>
    </div>
  )
}

export default LookupAmountTable
