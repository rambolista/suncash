export const bindColumnSearchInputs = (api) => {
  const container = api.table().container()
  const stopPropagation = (event) => event.stopPropagation()

  container.querySelectorAll('thead tr.column-search-input-bar th').forEach((th) => {
    th.addEventListener('click', stopPropagation)
  })

  container.querySelectorAll('thead tr.column-search-input-bar th input[data-col-index]').forEach((input) => {
    const columnIndex = Number(input.getAttribute('data-col-index'))

    input.addEventListener('click', stopPropagation)
    input.addEventListener('keyup', function onKeyUp() {
      if (api.column(columnIndex).search() !== this.value) {
        api.column(columnIndex).search(this.value).draw()
      }
    })
  })

  const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  container.querySelectorAll('thead tr.column-search-input-bar th select[data-col-index]').forEach((select) => {
    const columnIndex = Number(select.getAttribute('data-col-index'))

    select.addEventListener('click', stopPropagation)
    select.addEventListener('change', function onChange() {
      // Dropdown options are exact values, not free-text fragments — anchor
      // the regex so e.g. picking "Kiosk-GA-1" doesn't also match "Kiosk-GA-10".
      const term = this.value ? `^${escapeRegex(this.value)}$` : ''
      if (api.column(columnIndex).search() !== term) {
        api.column(columnIndex).search(term, true, false).draw()
      }
    })
  })
}
