// Certificate of indexing as a downloadable A4 PDF, made in the browser from
// the rendered certificate so it matches the page exactly (including QR code
// and non-Latin titles). Long certificates break between table rows.

const A4 = { w: 595.28, h: 841.89 } // points
const SHEET_PX = 794 // CSS width of the certificate sheet
const SCALE = 2.5 // render resolution

export async function downloadCertificatePdf(source: HTMLElement, meta: { code: string; issued: string }) {
  const [{ toCanvas }, { PDFDocument }] = await Promise.all([import('html-to-image'), import('pdf-lib')])

  // Lay out a copy at A4 width, off screen, whatever the viewport.
  const host = document.createElement('div')
  host.style.cssText = `position:fixed;left:-10000px;top:0;width:${SHEET_PX}px;background:#fff;`
  const sheet = source.cloneNode(true) as HTMLElement
  sheet.style.maxWidth = `${SHEET_PX}px`
  sheet.style.width = `${SHEET_PX}px`
  sheet.style.margin = '0'
  sheet.style.boxShadow = 'none'
  sheet.style.borderRadius = '0'
  host.appendChild(sheet)
  document.body.appendChild(host)

  try {
    const top = sheet.getBoundingClientRect().top
    const heightPx = sheet.scrollHeight
    // Safe page breaks: the bottom of each table row and of the table itself.
    const breaks = [...sheet.querySelectorAll('tr, table, footer')]
      .map(el => el.getBoundingClientRect().bottom - top)
      .sort((a, b) => a - b)

    const canvas = await toCanvas(sheet, {
      pixelRatio: SCALE, backgroundColor: '#ffffff', width: SHEET_PX, height: heightPx, cacheBust: true,
    })

    const pdf = await PDFDocument.create()
    pdf.setTitle(`Certificate of indexing ${meta.code}`)
    pdf.setAuthor('Panorama Open Scholarly Index, Panorama Scholarly Group Ltd.')
    pdf.setSubject('Certificate of indexing')
    pdf.setCreationDate(new Date(`${meta.issued}T00:00:00Z`))

    const pagePx = SHEET_PX * (A4.h / A4.w)
    let start = 0
    while (start < heightPx - 1) {
      let end = Math.min(start + pagePx, heightPx)
      if (end < heightPx) {
        const fit = breaks.filter(b => b > start + 40 && b <= end)
        if (fit.length) end = fit[fit.length - 1]
      }
      const slice = document.createElement('canvas')
      slice.width = canvas.width
      slice.height = Math.round(pagePx * SCALE)
      const ctx = slice.getContext('2d')!
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, slice.width, slice.height)
      ctx.drawImage(canvas, 0, Math.round(start * SCALE), canvas.width, Math.round((end - start) * SCALE), 0, 0, canvas.width, Math.round((end - start) * SCALE))

      const jpg = await pdf.embedJpg(slice.toDataURL('image/jpeg', 0.92))
      const page = pdf.addPage([A4.w, A4.h])
      page.drawImage(jpg, { x: 0, y: 0, width: A4.w, height: A4.h })
      start = end
    }

    const bytes = await pdf.save()
    const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/pdf' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `POSI-certificate-${meta.code}.pdf`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
  } finally {
    host.remove()
  }
}
