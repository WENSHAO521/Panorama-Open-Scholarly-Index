// Certificate of indexing as a downloadable A4 PDF, made in the browser from
// the rendered certificate so it matches the page exactly (including QR code
// and non-Latin titles). Long certificates break between table rows; every
// continuation page repeats the certificate header (and the table's column
// headings while the table continues), and each page is numbered.

const A4 = { w: 595.28, h: 841.89 } // points
const SHEET_PX = 794 // CSS width of the certificate sheet
const SCALE = 2.5 // render resolution

export async function downloadCertificatePdf(
  source: HTMLElement,
  meta: { code: string; issued: string; subject?: string; fileName?: string; singlePage?: boolean },
) {
  const subject = meta.subject ?? 'Certificate of indexing'
  const [{ toCanvas }, { PDFDocument, PDFString, StandardFonts, rgb }] = await Promise.all([import('html-to-image'), import('pdf-lib')])

  // Lay out a copy at A4 width, off screen, whatever the viewport.
  const host = document.createElement('div')
  host.style.cssText = `position:fixed;left:-10000px;top:0;width:${SHEET_PX}px;background:#fff;`
  const sheet = source.cloneNode(true) as HTMLElement
  sheet.style.maxWidth = `${SHEET_PX}px`
  sheet.style.width = `${SHEET_PX}px`
  sheet.style.margin = '0'
  sheet.style.boxShadow = 'none'
  sheet.style.borderRadius = '0'
  // At least one full A4 page, so a short certificate keeps its footer at the bottom.
  sheet.style.minHeight = `${Math.floor(SHEET_PX * (A4.h / A4.w))}px`
  host.appendChild(sheet)
  document.body.appendChild(host)

  try {
    const top = sheet.getBoundingClientRect().top
    const heightPx = sheet.scrollHeight
    // Safe page breaks: between table rows, after the note under the table
    // (the last row and the note stay together) and after the footer.
    const tableEl = sheet.querySelector('table')
    const rows = [...sheet.querySelectorAll('tbody tr')].slice(0, -1)
    const breaks = [...rows, tableEl?.nextElementSibling ?? tableEl, sheet.querySelector('footer')]
      .filter((el): el is Element => !!el)
      .map(el => el.getBoundingClientRect().bottom - top)
      .sort((a, b) => a - b)
    // The parts repeated on continuation pages, in sheet coordinates.
    const box = (sel: string) => {
      const r = sheet.querySelector(sel)?.getBoundingClientRect()
      return r ? { top: r.top - top, bottom: r.bottom - top } : null
    }
    const header = box('header')
    // Verification links (QR code and address) stay clickable in the PDF.
    const links = [...sheet.querySelectorAll<HTMLAnchorElement>('a[data-verify-link]')].map(a => {
      const r = a.getBoundingClientRect()
      return { href: a.href, x: r.left - sheet.getBoundingClientRect().left, top: r.top - top, bottom: r.bottom - top, w: r.width }
    })
    // The heading row's dark rule sits on its lower edge; take it whole.
    const th = box('thead')
    const thead = th ? { top: th.top, bottom: th.bottom + 1.5 } : null
    const table = box('table')

    const canvas = await toCanvas(sheet, {
      pixelRatio: SCALE, backgroundColor: '#ffffff', width: SHEET_PX, height: heightPx, cacheBust: true,
    })

    const pdf = await PDFDocument.create()
    pdf.setTitle(`${subject} ${meta.code}`)
    pdf.setAuthor('Panorama Open Scholarly Index, Panorama Scholarly Group Ltd.')
    pdf.setSubject(subject)
    pdf.setCreationDate(new Date(`${meta.issued}T00:00:00Z`))

    const pagePx = SHEET_PX * (A4.h / A4.w)
    // A few pixels past the page (borders, rounding) are squeezed onto it
    // rather than starting a near-empty page.
    const SLACK = 24
    // Space kept free at the foot of every page of a multi-page certificate, for the page number.
    const FOOT = 56
    const GAP = 22

    // Plan the pages: where each one's content starts and ends, and what it repeats above it.
    type Plan = { start: number; end: number; lead: number; withHead: boolean }
    const plans: Plan[] = []
    // A one-page certificate that runs slightly long is scaled down onto its page rather than split.
    if (meta.singlePage || heightPx <= pagePx + SLACK) {
      plans.push({ start: 0, end: heightPx, lead: 0, withHead: false })
    } else {
      let start = 0
      while (start < heightPx - 1) {
        const first = !plans.length
        const withHead = !first && !!thead && !!table && start >= thead.bottom - 1 && start < table.bottom - 1
        const lead = first || !header ? 0 : header.bottom + GAP + (withHead && thead ? thead.bottom - thead.top : 0)
        const budget = pagePx - (first ? 0 : lead) - FOOT
        let end = Math.min(start + budget, heightPx)
        if (heightPx - end <= SLACK) end = heightPx
        if (end < heightPx) {
          const fit = breaks.filter(b => b > start + 40 && b <= end)
          if (fit.length) end = fit[fit.length - 1]
        }
        plans.push({ start, end, lead: first ? 0 : lead, withHead })
        start = end
      }
    }

    const px = (v: number) => Math.round(v * SCALE)
    const font = await pdf.embedFont(StandardFonts.Helvetica)
    for (const [i, p] of plans.entries()) {
      const contentH = p.end - p.start
      const sliceH = Math.max(pagePx, p.lead + contentH + (plans.length > 1 ? FOOT : 0))
      const slice = document.createElement('canvas')
      slice.width = canvas.width
      slice.height = px(sliceH)
      const ctx = slice.getContext('2d')!
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, slice.width, slice.height)
      if (p.lead && header) {
        // The certificate header, at the same place as on the first page.
        ctx.drawImage(canvas, 0, px(0), canvas.width, px(header.bottom), 0, 0, canvas.width, px(header.bottom))
        if (p.withHead && thead) {
          const h = thead.bottom - thead.top
          ctx.drawImage(canvas, 0, px(thead.top), canvas.width, px(h), 0, px(header.bottom + GAP), canvas.width, px(h))
        }
      }
      ctx.drawImage(canvas, 0, px(p.start), canvas.width, px(contentH), 0, px(p.lead), canvas.width, px(contentH))

      const jpg = await pdf.embedJpg(slice.toDataURL('image/jpeg', 0.92))
      const page = pdf.addPage([A4.w, A4.h])
      // A slightly taller slice is scaled down evenly (never stretched) and centred.
      const k = Math.min(1, pagePx / sliceH)
      const w = A4.w * k
      page.drawImage(jpg, { x: (A4.w - w) / 2, y: 0, width: w, height: A4.h })

      // Page coordinates: 1 sheet px = pt points, drawn from the top of the page.
      const pt = (A4.w * k) / SHEET_PX
      const x0 = (A4.w - w) / 2
      for (const l of links) {
        if (l.top < p.start || l.bottom > p.end) continue
        const yTop = A4.h - (p.lead + l.top - p.start) * pt
        const yBottom = A4.h - (p.lead + l.bottom - p.start) * pt
        const annot = pdf.context.register(pdf.context.obj({
          Type: 'Annot', Subtype: 'Link', Border: [0, 0, 0],
          Rect: [x0 + l.x * pt, yBottom, x0 + (l.x + l.w) * pt, yTop],
          A: { Type: 'Action', S: 'URI', URI: PDFString.of(l.href) },
        }))
        page.node.addAnnot(annot)
      }

      if (plans.length > 1) {
        const size = 7.5
        const grey = rgb(0.45, 0.48, 0.5)
        const margin = 70 * (A4.w / SHEET_PX) // the certificate sheet's side margin
        const label = `Page ${i + 1} of ${plans.length}`
        page.drawText(`Certificate No. ${meta.code}`, { x: margin, y: 22, size, font, color: grey })
        page.drawText(label, { x: A4.w - margin - font.widthOfTextAtSize(label, size), y: 22, size, font, color: grey })
      }
    }

    const bytes = await pdf.save()
    const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/pdf' }))
    const a = document.createElement('a')
    a.href = url
    a.download = meta.fileName ?? `POSI-certificate-${meta.code}.pdf`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
  } finally {
    host.remove()
  }
}
