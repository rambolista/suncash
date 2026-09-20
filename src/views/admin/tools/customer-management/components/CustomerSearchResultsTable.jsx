import DT from 'datatables.net-bs5'
import DataTable from 'datatables.net-react'
import 'datatables.net-responsive'
import { useMemo, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { FormControl } from 'react-bootstrap'
import ActionButton from '../../../merchants/components/ActionButton'
import { baseDataTableOptions, initTableSearchAndSort } from '@/views/admin/apps/access-management/utils/dataTableOptions'
import { escapeHtml } from '@/utils/reportHelpers'

DataTable.use(DT)

const textCol = (key) => ({ data: key, render: (value) => escapeHtml(value || '—') })

const headers = ['First Name', 'Last Name', 'Mobile Number', 'Card Number', 'Merchant', 'Actions']

/** The 3 legacy row actions — all open the same detail page, just landing on a different tab. */
const CustomerSearchResultsTable = ({ data, onOpen }) => {
  const handlers = useRef({ onOpen })
  handlers.current = { onOpen }

  const rowMap = useMemo(() => {
    const map = {}
    data.forEach((item) => { map[item.id] = item })
    return map
  }, [data])

  const actionCol = {
    data: 'id',
    orderable: false,
    searchable: false,
    width: '340px',
    className: 'text-nowrap action-cell',
    render: (id) => `<div class="customer-mgmt-action-slot" data-id="${id}"></div>`,
  }

  const columns = useMemo(() => [
    textCol('first_name'),
    textCol('last_name'),
    textCol('mobile_number'),
    textCol('card_number'),
    textCol('merchant'),
    actionCol,
  ], [])

  const createdRow = useMemo(() => (row, rowData) => {
    const item = rowMap[rowData.id] ?? rowData
    const slot = row.querySelector('.customer-mgmt-action-slot')
    if (!slot) return
    const root = slot.__actionRoot || createRoot(slot)
    slot.__actionRoot = root

    root.render(
      <div className="d-flex gap-1">
        <ActionButton label="View Details" icon="eye" onClick={() => handlers.current.onOpen(item, 'details')} />
        <ActionButton label="View ComplianceAdvantage Profile" icon="shield-check" onClick={() => handlers.current.onOpen(item, 'comply')} />
        <ActionButton label="Authenticate User" icon="user-check" onClick={() => handlers.current.onOpen(item, 'authenticate')} />
      </div>,
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowMap])

  const options = useMemo(() => ({
    ...baseDataTableOptions,
    columnDefs: [{ targets: '_all', orderSequence: ['asc', 'desc', ''] }],
    initComplete: function () {
      initTableSearchAndSort(this.api())
    },
    createdRow,
  }), [createdRow])

  return (
    <div className="table-responsive">
      <DataTable data={data} columns={columns} options={options} className="table dt-responsive align-middle mb-0 w-100">
        <thead className="thead-sm text-uppercase fs-xxs">
          <tr>
            {headers.map((header) => <th key={header}>{header}</th>)}
          </tr>
          <tr className="column-search-input-bar">
            {headers.map((header, index) => (
              <th key={header}>
                {header !== 'Actions' && <FormControl size="sm" type="text" placeholder={header} className="bg-light-subtle border-light" data-col-index={index} />}
              </th>
            ))}
          </tr>
        </thead>
      </DataTable>
    </div>
  )
}

export default CustomerSearchResultsTable
