/**
 * Opens the browser's native print dialog for a receipt, via a hidden
 * iframe — mirrors legacy admin's exact `printReceiptHtml()` mechanism
 * (Kiosk > Reprint Receipt / Reprint Replenishment Receipt), which is
 * genuinely all "printing" ever meant there: no PDF, no server round trip
 * beyond fetching the receipt data itself.
 */
export const printReceiptHtml = (htmlContent, title = 'Receipt') => {
  const iframe = document.createElement('iframe')
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;'
  document.body.appendChild(iframe)

  const doc = iframe.contentWindow.document
  doc.open()
  doc.write(`<!DOCTYPE html><html><head><title>${title}</title></head><body>${htmlContent}</body></html>`)
  doc.close()

  iframe.onload = () => {
    iframe.contentWindow.focus()
    iframe.contentWindow.print()
  }
  iframe.contentWindow.onafterprint = () => {
    document.body.removeChild(iframe)
  }
}
