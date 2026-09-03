import { useMemo } from 'react'
import { FormControl, FormSelect } from 'react-bootstrap'

/**
 * The per-column search row rendered under a DataTable's header. Columns
 * listed in `dropdownColumns` (index -> data key) get a `<select>` of the
 * distinct values actually present in `data`, filtered as an exact match by
 * `bindColumnSearchInputs`; every other searchable column keeps a free-text
 * input. A column whose `columns[index].searchable` is `false` (e.g. an
 * "Action" column) renders no control at all.
 */
const DataTableColumnSearchRow = ({ headers, columns, data, dropdownColumns = {} }) => {
  const dropdownOptions = useMemo(() => {
    const options = {}
    Object.entries(dropdownColumns).forEach(([index, key]) => {
      options[index] = Array.from(new Set(data.map((row) => row[key]).filter(Boolean))).sort((a, b) => a.localeCompare(b))
    })
    return options
  }, [data, dropdownColumns])

  return (
    <tr className="column-search-input-bar">
      {headers.map((header, index) => (
        <th key={header}>
          {columns[index]?.searchable === false ? null : dropdownColumns[index] ? (
            <FormSelect size="sm" className="bg-light-subtle border-light" data-col-index={index} defaultValue="">
              <option value="">{header}</option>
              {dropdownOptions[index].map((value) => <option key={value} value={value}>{value}</option>)}
            </FormSelect>
          ) : (
            <FormControl size="sm" type="text" placeholder={header} className="bg-light-subtle border-light" data-col-index={index} />
          )}
        </th>
      ))}
    </tr>
  )
}

export default DataTableColumnSearchRow
