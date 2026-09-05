import DT from 'datatables.net-bs5'
import DataTable from 'datatables.net-react'
import 'datatables.net-responsive'
import { useMemo } from 'react'
import { bindColumnSearchInputs } from '@/views/admin/apps/access-management/utils/dataTableColumnSearch'
import { bindSortLabels } from '@/views/admin/apps/access-management/utils/dataTableSortLabels'
import { paginationIcons } from '@/views/admin/apps/access-management/utils/paginationIcons'
import DataTableColumnSearchRow from '@/views/admin/apps/access-management/utils/DataTableColumnSearchRow'
import { escapeHtml, money } from './format'

DataTable.use(DT)

const textCol = (key) => ({ data: key, render: (value) => escapeHtml(value || '—') })
const moneyCol = (key) => ({ data: key, render: (value) => escapeHtml(money(value)) })
// Cash-Out / Partner Deposits / Partner Withdrawals / Net Settlement stay signed per-row
// (matching legacy's red-negative styling) — only the footer totals are shown as absolute values.
const signedMoneyCol = (key) => ({
  data: key,
  render: (value, type) => (type === 'display'
    ? `<span class="${Number(value) < 0 ? 'text-danger' : ''}">${escapeHtml(money(value))}</span>`
    : Number(value)),
})

const columns = [
  textCol('partner'),
  textCol('kiosk'),
  textCol('location'),
  textCol('island'),
  moneyCol('cash_collected'),
  signedMoneyCol('cash_dispensed'),
  signedMoneyCol('partner_deposits'),
  signedMoneyCol('partner_withdrawals'),
  moneyCol('total_fees'),
  moneyCol('total_vat'),
  moneyCol('commission'),
  signedMoneyCol('net_settlement'),
]

const headers = [
  'Partner', 'Kiosk', 'Location', 'Island', 'Total Cash-In', 'Total Cash-Out',
  'Partner Deposits', 'Partner Withdrawals', 'Total Fees', 'Total VAT', 'Commission', 'Net Settlement',
]

// Partner / Kiosk / Location / Island are filtered via a dropdown of the values actually present, not free text.
const DROPDOWN_COLUMNS = { 0: 'partner', 1: 'kiosk', 2: 'location', 3: 'island' }

const PartnerSettlementReportTable = ({ data }) => {
  const options = useMemo(() => ({
    responsive: true,
    pageLength: 25,
    orderCellsTop: true,
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
  }), [])

  return (
    <DataTable data={data} columns={columns} options={options} className="table dt-responsive align-middle mb-0 w-100">
      <thead className="thead-sm text-uppercase fs-xxs">
        <tr>
          {headers.map((header) => <th key={header}>{header}</th>)}
        </tr>
        <DataTableColumnSearchRow headers={headers} columns={columns} data={data} dropdownColumns={DROPDOWN_COLUMNS} />
      </thead>
    </DataTable>
  )
}

export default PartnerSettlementReportTable
