import DT from 'datatables.net-bs5'
import DataTable from 'datatables.net-react'
import 'datatables.net-responsive'
import { useMemo } from 'react'
import { baseDataTableOptions, initTableSearchAndSort } from '@/views/admin/apps/access-management/utils/dataTableOptions'

DataTable.use(DT)

/** Shared DataTable shell for every Float Management list — column search/sort bindings and pagination icons, matching MerchantsTable/GeoPromoTable. */
const FloatDataTable = ({ data, columns, createdRow, children }) => {
  const options = useMemo(() => ({
    ...baseDataTableOptions,
    columnDefs: [{ targets: '_all', orderSequence: ['asc', 'desc', ''] }],
    initComplete: function () {
      initTableSearchAndSort(this.api())
    },
    createdRow,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [createdRow])

  return (
    <div className="table-responsive">
    <DataTable data={data} columns={columns} options={options} className="table dt-responsive align-middle mb-0 w-100">
      {children}
    </DataTable>
    </div>
  )
}

export default FloatDataTable
