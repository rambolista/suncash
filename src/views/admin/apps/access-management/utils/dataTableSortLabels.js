/**
 * The theme's default DataTables sort carets are opacity-0 until hovered/active
 * and even then only reach ~0.6 opacity, which reads as ambiguous. This adds an
 * explicit "Ascending"/"Descending" text badge next to whichever column header
 * is currently sorted, so the direction is never in question.
 */
export const bindSortLabels = (api) => {
  const updateLabels = () => {
    const [sortedColumnIndex, direction] = api.order()[0] ?? []

    api.columns().header().each((th, columnIndex) => {
      const titleEl = th.querySelector('.dt-column-title') || th
      const existingLabel = th.querySelector('.sort-direction-label')
      if (existingLabel) existingLabel.remove()

      if (columnIndex !== sortedColumnIndex || !direction) return

      const label = document.createElement('span')
      label.className = 'sort-direction-label badge bg-primary-subtle text-primary ms-1 fw-normal'
      label.textContent = direction === 'desc' ? 'Descending' : 'Ascending'
      titleEl.after(label)
    })
  }

  // order.dt doesn't fire reliably when cycling through to the "no sort"
  // orderSequence state, so resync on every redraw instead.
  api.on('draw.dt', updateLabels)
  updateLabels()
}
