import DT from 'datatables.net-bs5'
import DataTable from 'datatables.net-react'
import 'datatables.net-responsive'
import { useMemo } from 'react'
import { bindColumnSearchInputs } from '@/views/admin/apps/access-management/utils/dataTableColumnSearch'
import { bindSortLabels } from '@/views/admin/apps/access-management/utils/dataTableSortLabels'
import { paginationIcons } from '@/views/admin/apps/access-management/utils/paginationIcons'

DataTable.use(DT)

/** Shared DataTable shell for every Float Management list — column search/sort bindings and pagination icons, matching MerchantsTable/GeoPromoTable. */
const FloatDataTable = ({ data, columns, createdRow, children }) => {
  const options = useMemo(() => ({
    responsive: true,
    orderCellsTop: true,
    columnDefs: [{ targets: '_all', orderSequence: ['asc', 'desc', ''] }],
    initComplete: function () {
      bindColumnSearchInputs(this.api())
      bindSortLabels(this.api())
    },
    language: { paginate: paginationIcons },
    createdRow,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [createdRow])

  return (
    <DataTable data={data} columns={columns} options={options} className="table dt-responsive align-middle mb-0 w-100">
      {children}
    </DataTable>
  )
}

export default FloatDataTable
