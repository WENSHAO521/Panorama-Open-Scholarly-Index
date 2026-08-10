import { PDFDocument, StandardFonts, rgb, type PDFFont } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import QRCode from 'qrcode'
import type { Journal } from './types'
import { RELEASE_ID, verificationCode } from './release'

// Automated Core Collection inclusion certificate — one PDF per Core
// Collection journal, generated at build time (see
// src/app/api/certificate/[code]/pdf/route.ts's generateStaticParams).
// Deliberately NOT a quality/accreditation claim: it certifies inclusion
// only, the same "record vs. endorsement" distinction drawn everywhere
// else on the platform (see /core-collection, /about). No code path here
// accepts a manually-supplied certificate field — everything is read
// directly from the journal record.

const POSI_RED = rgb(0.8, 0, 0) // #cc0000
const POSI_BLACK = rgb(0.067, 0.067, 0.067) // #111111
const POSI_GRAY = rgb(0.4, 0.4, 0.4)
const POSI_LIGHT_GRAY = rgb(0.6, 0.6, 0.6)
// Tier accent — deliberately distinct from POSI_RED (the fixed brand
// wordmark color, unchanged either way) so the two certificate kinds are
// unmistakable even at a glance, not just readable in the fine print.
const DIAMOND = rgb(0.10, 0.45, 0.75) // Core Collection
const GOLD = rgb(0.72, 0.53, 0.05)    // Candidate

const SITE_ORIGIN = 'https://posi.panorama-sg.com'

// pdf-lib's built-in StandardFonts only encode WinAnsi (~Latin-1) — a small
// number of Core Collection journals (e.g. 人文学刊) have CJK-only titles
// that crash the standard-font text-measurement/drawing calls outright.
// Rather than bundling a full CJK font (Noto Sans SC alone is 10MB+, and
// pdf-lib embeds the whole font file, not just used glyphs, so that cost
// would be paid on every one of the ~30 Core Collection certificates), we
// fetch a per-journal glyph subset from Google Fonts' CSS API (?text=...
// returns only the requested characters) at build time — each subset is a
// few KB, and a failed/slow fetch falls back to dropping the non-encodable
// characters rather than failing the whole static export.
function containsNonWinAnsi(text: string): boolean {
  return /[^\x00-\xFF]/.test(text)
}

async function fetchCjkSubsetFont(text: string, timeoutMs = 8000): Promise<ArrayBuffer | null> {
  const chars = [...new Set([...text].filter(c => containsNonWinAnsi(c)))].join('')
  if (!chars) return null
  try {
    const cssRes = await fetch(
      `https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@700&text=${encodeURIComponent(chars)}&display=swap`,
      { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(timeoutMs) }
    )
    if (!cssRes.ok) return null
    const css = await cssRes.text()
    const match = css.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/)
    if (!match) return null
    const fontRes = await fetch(match[1], { signal: AbortSignal.timeout(timeoutMs) })
    if (!fontRes.ok) return null
    return fontRes.arrayBuffer()
  } catch {
    return null
  }
}

function winAnsiSafe(text: string): string {
  return [...text].filter(c => !containsNonWinAnsi(c)).join('') || text
}

function issnLine(journal: Journal): string {
  if (journal.issn_print && journal.issn_online) return `pISSN ${journal.issn_print}  ·  eISSN ${journal.issn_online}`
  if (journal.issn_online) return `eISSN ${journal.issn_online}`
  if (journal.issn_print) return `pISSN ${journal.issn_print}`
  return 'ISSN not registered'
}

export async function generateCertificatePdf(journal: Journal): Promise<Uint8Array> {
  const isCandidate = journal.collection_status === 'candidate'
  const accentColor = isCandidate ? GOLD : DIAMOND

  const doc = await PDFDocument.create()
  doc.registerFontkit(fontkit)
  doc.setProducer('POSI Certificate Generator')
  doc.setSubject(isCandidate ? 'POSI Candidate Journal Record' : 'Certificate of POSI Core Collection Inclusion')
  // pdf-lib's setTitle also runs text through WinAnsi encoding — guard it
  // the same way as any other CJK-unsafe text drawn on the page.
  doc.setTitle(`POSI ${isCandidate ? 'Candidate Record' : 'Core Collection Certificate'} - ${winAnsiSafe(journal.title)}`)

  const page = doc.addPage([842, 595]) // A4 landscape, points
  const { width, height } = page.getSize()

  const helvetica = await doc.embedFont(StandardFonts.Helvetica)
  const helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold)

  // Title needs a CJK-capable font only if it actually contains non-Latin1
  // characters (see fetchCjkSubsetFont's header comment).
  let titleFont: PDFFont = helveticaBold
  let titleText = journal.title
  if (containsNonWinAnsi(journal.title)) {
    const subsetBytes = await fetchCjkSubsetFont(journal.title)
    if (subsetBytes) {
      titleFont = await doc.embedFont(subsetBytes, { subset: true })
    } else {
      titleText = winAnsiSafe(journal.title)
    }
  }

  // Outer border — thin black rule, DIN/Bauhaus framing consistent with the site
  const margin = 28
  page.drawRectangle({
    x: margin, y: margin,
    width: width - margin * 2, height: height - margin * 2,
    borderColor: POSI_BLACK, borderWidth: 1.5,
  })
  // Accent rule directly inside the border — tier color (diamond/gold), not
  // brand red, so a Core Collection certificate and a Candidate record are
  // visually distinguishable at a glance, before reading any text.
  page.drawRectangle({
    x: margin + 6, y: margin + 6,
    width: width - (margin + 6) * 2, height: height - (margin + 6) * 2,
    borderColor: accentColor, borderWidth: 1.5,
  })

  let y = height - 90

  // Wordmark
  page.drawText('POSI', {
    x: margin + 40, y, size: 46, font: helveticaBold, color: POSI_RED,
  })
  page.drawText('PANORAMA OPEN SCHOLARLY INDEX', {
    x: margin + 40, y: y - 20, size: 9, font: helvetica, color: POSI_GRAY,
  })

  // Certificate label, right-aligned
  const certLabel = isCandidate ? 'CANDIDATE JOURNAL RECORD — NOT CORE COLLECTION' : 'CERTIFICATE OF CORE COLLECTION INCLUSION'
  const certLabelSize = 12
  const certLabelWidth = helveticaBold.widthOfTextAtSize(certLabel, certLabelSize)
  page.drawText(certLabel, {
    x: width - margin - 40 - certLabelWidth, y: y - 4, size: certLabelSize, font: helveticaBold, color: POSI_BLACK,
  })

  // Tier stamp — a colored tag naming the tier explicitly, not just the
  // border color, so it survives black-and-white printing/screenshots too.
  const tierLabel = isCandidate ? 'CANDIDATE' : 'CORE COLLECTION'
  const tierSize = 10
  const tierPaddingX = 10
  const tierWidth = helveticaBold.widthOfTextAtSize(tierLabel, tierSize) + tierPaddingX * 2
  page.drawRectangle({
    x: width - margin - 40 - tierWidth, y: y - 26, width: tierWidth, height: 16,
    color: accentColor,
  })
  page.drawText(tierLabel, {
    x: width - margin - 40 - tierWidth + tierPaddingX, y: y - 22, size: tierSize, font: helveticaBold, color: rgb(1, 1, 1),
  })

  y -= 90

  // Journal title
  const titleSize = 22
  const maxTitleWidth = width - (margin + 40) * 2
  const titleLines = wrapText(titleText, titleFont, titleSize, maxTitleWidth)
  for (const line of titleLines) {
    page.drawText(line, { x: margin + 40, y, size: titleSize, font: titleFont, color: POSI_BLACK })
    y -= titleSize + 6
  }

  y -= 8
  page.drawText(journal.publisher, { x: margin + 40, y, size: 12, font: helvetica, color: POSI_GRAY })
  y -= 34

  // Fact grid
  const facts: [string, string][] = [
    ['POSI Journal Code', journal.journal_code.toUpperCase()],
    ['ISSN', issnLine(journal)],
    ['ISSN Registration', journal.registration_country || '—'],
    ['Country', journal.country || '—'],
    ['Coverage Since', journal.created_at ? journal.created_at.slice(0, 10) : '—'],
  ]
  const colWidth = (width - (margin + 40) * 2) / 2
  facts.forEach(([label, value], i) => {
    const col = i % 2
    const row = Math.floor(i / 2)
    const fx = margin + 40 + col * colWidth
    const fy = y - row * 34
    page.drawText(label.toUpperCase(), { x: fx, y: fy, size: 8, font: helveticaBold, color: POSI_LIGHT_GRAY })
    page.drawText(value, { x: fx, y: fy - 14, size: 11, font: helvetica, color: POSI_BLACK })
  })
  y -= 34 * Math.ceil(facts.length / 2) + 20

  // Statement
  const issueDate = new Date().toISOString().slice(0, 10)
  const statement = isCandidate
    ? `This documents that the above journal was admitted to the POSI Core Collection on ${journal.created_at ? journal.created_at.slice(0, 10) : issueDate}, but a subsequent PQF re-review found it below the eligibility bar for continued Core Collection membership — it is currently a candidate record, not a Core Collection member, pending re-review. This is not a certification of any kind and should not be represented as one. Verify this record and its current status at the URL below.`
    : `This certifies that the above journal was included in the POSI Core Collection as of ${journal.created_at ? journal.created_at.slice(0, 10) : issueDate}, having met POSI's published editorial selection criteria (PQF). Inclusion reflects transparency, metadata quality, and technical discoverability at the time of assessment — it is not a certification of scientific quality, peer review rigor, citation impact, or accreditation, and is not affiliated with Web of Science, Scopus, or DOAJ. Verify this record and its current status at the URL below.`
  const stmtLines = wrapText(statement, helvetica, 9.5, width - (margin + 40) * 2)
  for (const line of stmtLines) {
    page.drawText(line, { x: margin + 40, y, size: 9.5, font: helvetica, color: POSI_GRAY })
    y -= 14
  }

  // QR code + verification URL, bottom-left
  const verifyUrl = `${SITE_ORIGIN}/verify?code=${journal.journal_code}`
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 0, width: 200 })
  const qrPng = await doc.embedPng(qrDataUrl)
  const qrSize = 64
  page.drawImage(qrPng, { x: margin + 40, y: margin + 30, width: qrSize, height: qrSize })
  page.drawText('Verify at', { x: margin + 40 + qrSize + 10, y: margin + 30 + qrSize - 22, size: 8, font: helvetica, color: POSI_LIGHT_GRAY })
  page.drawText(verifyUrl, { x: margin + 40 + qrSize + 10, y: margin + 30 + qrSize - 34, size: 10, font: helveticaBold, color: POSI_BLACK })

  // Issue date + release + verification code, bottom-right
  const issueLabel = `Issued ${issueDate}  ·  Automatically generated — not manually signed`
  const issueSize = 8
  const issueWidth = helvetica.widthOfTextAtSize(issueLabel, issueSize)
  page.drawText(issueLabel, { x: width - margin - 40 - issueWidth, y: margin + 34, size: issueSize, font: helvetica, color: POSI_LIGHT_GRAY })
  const codeLabel = `${RELEASE_ID}  ·  ${verificationCode(journal.journal_code)}`
  const codeWidth = helvetica.widthOfTextAtSize(codeLabel, issueSize)
  page.drawText(codeLabel, { x: width - margin - 40 - codeWidth, y: margin + 34 - 11, size: issueSize, font: helvetica, color: POSI_LIGHT_GRAY })

  return doc.save()
}

function wrapText(text: string, font: import('pdf-lib').PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && current) {
      lines.push(current)
      current = word
    } else {
      current = candidate
    }
  }
  if (current) lines.push(current)
  return lines
}
