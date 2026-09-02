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

  container.querySelectorAll('thead tr.column-search-input-bar th select[data-col-index]').forEach((select) => {
    const columnIndex = Number(select.getAttribute('data-col-index'))

    select.addEventListener('click', stopPropagation)
    select.addEventListener('change', function onChange() {
      if (api.column(columnIndex).search() !== this.value) {
        api.column(columnIndex).search(this.value).draw()
      }
    })
  })
}
