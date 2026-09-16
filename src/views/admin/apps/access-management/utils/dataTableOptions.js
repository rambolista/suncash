import { paginationIcons } from './paginationIcons'
import { bindColumnSearchInputs } from './dataTableColumnSearch'
import { bindSortLabels } from './dataTableSortLabels'

/** The options every DataTable instance in the admin sets identically. */
export const baseDataTableOptions = {
  responsive: false,
  orderCellsTop: true,
  language: { paginate: paginationIcons },
}

export const initTableSearchAndSort = (api) => {
  bindColumnSearchInputs(api)
  bindSortLabels(api)
}

/**
 * Some tables render their filter controls directly above the table (no
 * page heading in between), which leaves extra top margin/spacing that
 * needs trimming once DataTables finishes its own layout.
 */
export const resetDataTableContainerSpacing = (api) => {
  const container = api.table().container()
  container.style.marginTop = '0'
  const controlsRow = container.querySelector(':scope > .row')
  controlsRow?.classList.add('mb-3')
}
