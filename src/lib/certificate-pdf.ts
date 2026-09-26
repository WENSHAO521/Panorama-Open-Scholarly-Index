import { PDFDocument, StandardFonts, rgb, degrees, type PDFFont, type PDFPage, type RGB } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import QRCode from 'qrcode'
import psc from './psc-v1.0.snapshot.json'
import type { Journal } from './types'

// Core Collection certification certificate: one A4 landscape PDF per Core
// Collection (and candidate) journal, generated at build time (see
// src/app/(docs)/api/certificate/[code]/pdf/route.ts). Every field is read
// from the journal record; nothing on the certificate is entered by hand.
// The QR code opens the journal's live POSI record, which is authoritative.

const INK = rgb(0.082, 0.098, 0.11)      // #15191c
const MUTED = rgb(0.353, 0.388, 0.408)   // #5a6368
const SOFT = rgb(0.56, 0.6, 0.62)
const RULE = rgb(0.81, 0.835, 0.84)      // #cfd5d6
const RED = rgb(0.89, 0.024, 0.075)      // brand block, #e30613
const TEAL = rgb(0.043, 0.369, 0.4)      // #0b5e66, Core Collection
const GOLD = rgb(0.62, 0.45, 0.05)       // candidate

const SITE_ORIGIN = 'https://posi.panorama-sg.com'
const PSC_NAME: Record<string, string> = Object.fromEntries(psc.categories.map(c => [c.code, c.name]))

// pdf-lib's standard fonts only encode WinAnsi (about Latin-1). CJK journal
// titles get a per-title glyph subset of Noto Sans SC from Google Fonts at
// build time (a few KB each); if that fetch fails, non-Latin characters are
// dropped rather than failing the static export.
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
    const match = (await cssRes.text()).match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/)
    if (!match) return null
    const fontRes = await fetch(match[1], { signal: AbortSignal.timeout(timeoutMs) })
    return fontRes.ok ? fontRes.arrayBuffer() : null
  } catch {
    return null
  }
}

function winAnsiSafe(text: string, fallback: string): string {
  return [...text].filter(c => !containsNonWinAnsi(c)).join('').trim() || fallback
}

function longDate(iso: string): string {
  return new Date(`${iso.slice(0, 10)}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}

function issnText(j: Journal): string {
  const parts = [j.issn_print && `${j.issn_print} (print)`, j.issn_online && `${j.issn_online} (online)`].filter(Boolean)
  return parts.length ? parts.join('   ') : 'Not registered'
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  // Latin text wraps on spaces; CJK text (no spaces) wraps per character.
  const tokens = /\s/.test(text) ? text.split(/\s+/) : [...text]
  const joiner = /\s/.test(text) ? ' ' : ''
  const lines: string[] = []
  let cur = ''
  for (const t of tokens) {
    const next = cur ? `${cur}${joiner}${t}` : t
    if (cur && font.widthOfTextAtSize(next, size) > maxWidth) { lines.push(cur); cur = t } else cur = next
  }
  if (cur) lines.push(cur)
  return lines
}

function centered(page: PDFPage, text: string, y: number, size: number, font: PDFFont, color: RGB, tracking = 0) {
  const w = font.widthOfTextAtSize(text, size) + tracking * Math.max(0, text.length - 1)
  const cx = page.getWidth() / 2
  if (!tracking) {
    page.drawText(text, { x: cx - w / 2, y, size, font, color })
    return
  }
  let x = cx - w / 2
  for (const ch of text) {
    page.drawText(ch, { x, y, size, font, color })
    x += font.widthOfTextAtSize(ch, size) + tracking
  }
}

function tracked(page: PDFPage, text: string, x: number, y: number, size: number, font: PDFFont, color: RGB, tracking: number) {
  for (const ch of text) {
    page.drawText(ch, { x, y, size, font, color })
    x += font.widthOfTextAtSize(ch, size) + tracking
  }
}

/** The Panorama block mark: three ink blocks, one red block, one bar. */
function mark(page: PDFPage, x: number, y: number, s: number) {
  const b = s * 0.44
  const g = s * 0.12
  page.drawRectangle({ x, y: y + b + g, width: b, height: b, color: INK })
  page.drawRectangle({ x: x + b + g, y: y + b + g, width: b, height: b, color: RED })
  page.drawRectangle({ x, y, width: b, height: b, color: INK })
  page.drawRectangle({ x: x + b + g, y: y + b - b * 0.33, width: b, height: b * 0.33, color: INK })
}

/** Circular seal with text set around the ring. */
function seal(page: PDFPage, cx: number, cy: number, r: number, ring: string, centre: string, sub: string, color: RGB, bold: PDFFont, regular: PDFFont) {
  page.drawCircle({ x: cx, y: cy, size: r, borderColor: color, borderWidth: 1.4 })
  page.drawCircle({ x: cx, y: cy, size: r - 4, borderColor: color, borderWidth: 0.5 })
  page.drawCircle({ x: cx, y: cy, size: r - 17, borderColor: color, borderWidth: 0.5 })

  const size = 6.2
  const textR = r - 12
  const chars = [...ring]
  const widths = chars.map(c => bold.widthOfTextAtSize(c, size) + 0.9)
  const total = widths.reduce((a, b) => a + b, 0)
  // Full circle: spread the ring text evenly around 360 degrees, clockwise from the top.
  const scale = (2 * Math.PI * textR) / total
  let angle = Math.PI / 2
  chars.forEach((c, i) => {
    const w = widths[i] * scale
    const mid = angle - (w / 2) / textR
    const half = bold.widthOfTextAtSize(c, size) / 2
    const x = cx + textR * Math.cos(mid) - half * Math.cos(mid - Math.PI / 2)
    const y = cy + textR * Math.sin(mid) - half * Math.sin(mid - Math.PI / 2)
    page.drawText(c, { x, y, size, font: bold, color, rotate: degrees((mid * 180) / Math.PI - 90) })
    angle -= w / textR
  })

  const cw = bold.widthOfTextAtSize(centre, 15)
  page.drawText(centre, { x: cx - cw / 2, y: cy - 1, size: 15, font: bold, color })
  const sw = regular.widthOfTextAtSize(sub, 6.5)
  page.drawText(sub, { x: cx - sw / 2, y: cy - 11, size: 6.5, font: regular, color })
}

export async function generateCertificatePdf(journal: Journal): Promise<Uint8Array> {
  const candidate = journal.collection_status === 'candidate'
  const accent = candidate ? GOLD : TEAL
  const code = journal.journal_code
  const since = journal.created_at ? journal.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10)
  const issued = new Date().toISOString().slice(0, 10)
  const certNo = `POSI-CC-${since.slice(0, 4)}-${code.toUpperCase()}`
  const recordUrl = `${SITE_ORIGIN}/journal/${code}/`

  const doc = await PDFDocument.create()
  doc.registerFontkit(fontkit)
  doc.setProducer('Panorama Open Scholarly Index')
  doc.setAuthor('Panorama Open Scholarly Index, Panorama Scholarly Group Ltd.')
  doc.setSubject(candidate ? 'Record of Core Collection candidate status' : 'Certificate of Core Collection certification')
  doc.setTitle(`${certNo} ${winAnsiSafe(journal.title, code.toUpperCase())}`)

  const page = doc.addPage([842, 595]) // A4 landscape
  const W = page.getWidth()
  const H = page.getHeight()
  const L = 64
  const R = W - 64

  const regular = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)

  let titleFont: PDFFont = bold
  let title = journal.title
  if (containsNonWinAnsi(title)) {
    const bytes = await fetchCjkSubsetFont(title)
    if (bytes) titleFont = await doc.embedFont(bytes, { subset: true })
    else title = winAnsiSafe(title, code.toUpperCase())
  }

  // Frame: ink outer rule, accent hairline inside it.
  page.drawRectangle({ x: 22, y: 22, width: W - 44, height: H - 44, borderColor: INK, borderWidth: 1 })
  page.drawRectangle({ x: 28, y: 28, width: W - 56, height: H - 56, borderColor: accent, borderWidth: 0.6 })
  page.drawRectangle({ x: 28, y: H - 34, width: W - 56, height: 6, color: accent })

  // Header
  mark(page, L, H - 88, 26)
  page.drawText('Panorama Open Scholarly Index', { x: L + 36, y: H - 72, size: 12.5, font: bold, color: INK })
  page.drawText('Panorama Scholarly Group Ltd.', { x: L + 36, y: H - 86, size: 8.5, font: regular, color: MUTED })

  const meta: [string, string][] = [['Certificate No.', certNo], ['Date of issue', longDate(issued)]]
  meta.forEach(([k, v], i) => {
    const y = H - 70 - i * 14
    const vw = bold.widthOfTextAtSize(v, 8.5)
    page.drawText(v, { x: R - vw, y, size: 8.5, font: bold, color: INK })
    const kw = regular.widthOfTextAtSize(k, 8)
    page.drawText(k, { x: R - vw - 10 - kw, y, size: 8, font: regular, color: MUTED })
  })
  page.drawLine({ start: { x: L, y: H - 104 }, end: { x: R, y: H - 104 }, thickness: 0.6, color: RULE })

  // Title block
  centered(page, candidate ? 'CORE COLLECTION CANDIDATE' : 'CORE COLLECTION', H - 146, 9, bold, accent, 2.2)
  centered(page, 'CERTIFICATE', H - 186, 34, bold, INK, 6)
  centered(page, candidate ? 'Record of Candidate Status' : 'of Core Collection Certification', H - 208, 12.5, regular, MUTED)

  let size = 26
  let lines = wrap(title, titleFont, size, 640)
  while ((lines.length > 2 || lines.some(l => titleFont.widthOfTextAtSize(l, size) > 640)) && size > 15) {
    size -= 1
    lines = wrap(title, titleFont, size, 640)
  }
  // A two-line title lifts the block so the statement clears the details row.
  const lift = lines.length > 1 ? 18 : 0
  centered(page, 'This is to certify that the journal', H - 252 + lift, 10.5, regular, MUTED)
  let y = H - 288 + lift
  for (const line of lines.slice(0, 2)) {
    centered(page, line, y, size, titleFont, INK)
    y -= size + 6
  }
  centered(page, winAnsiSafe(journal.publisher || '', ''), y - 2, 11, regular, MUTED)
  y -= 34

  const statement = candidate
    ? `was admitted to the Core Collection of the Panorama Open Scholarly Index on ${longDate(since)} and is currently under re-evaluation. It is not certified while this review is in progress.`
    : `has been evaluated under the POSI Quality Framework and is certified in the Core Collection of the Panorama Open Scholarly Index, with effect from ${longDate(since)}.`
  for (const line of wrap(statement, regular, 11, 560)) {
    centered(page, line, y, 11, regular, INK)
    y -= 16
  }

  // Details row
  const rowTop = 178
  page.drawLine({ start: { x: L, y: rowTop }, end: { x: R, y: rowTop }, thickness: 0.6, color: RULE })
  page.drawLine({ start: { x: L, y: rowTop - 44 }, end: { x: R, y: rowTop - 44 }, thickness: 0.6, color: RULE })
  const cols: [string, string][] = [
    ['ISSN', issnText(journal)],
    ['Subject category', journal.psc_category ? `${journal.psc_category} ${PSC_NAME[journal.psc_category] ?? ''}`.trim() : 'Not yet classified'],
    ['Certified since', longDate(since)],
    ['POSI record', code.toUpperCase()],
  ]
  const colW = (R - L) / cols.length
  cols.forEach(([k, v], i) => {
    const x = L + i * colW + (i ? 14 : 0)
    if (i) page.drawLine({ start: { x: L + i * colW, y: rowTop - 8 }, end: { x: L + i * colW, y: rowTop - 36 }, thickness: 0.5, color: RULE })
    tracked(page, k.toUpperCase(), x, rowTop - 17, 6.5, bold, SOFT, 0.8)
    let vs = 9.5
    while (regular.widthOfTextAtSize(v, vs) > colW - 20 && vs > 6.5) vs -= 0.5
    page.drawText(v, { x, y: rowTop - 32, size: vs, font: regular, color: INK })
  })

  // Verification, bottom left
  const qr = await doc.embedPng(await QRCode.toDataURL(recordUrl, { margin: 0, width: 240, errorCorrectionLevel: 'M' }))
  page.drawImage(qr, { x: L, y: 50, width: 60, height: 60 })
  page.drawText('Verify this certificate', { x: L + 72, y: 96, size: 8.5, font: bold, color: INK })
  page.drawText(recordUrl, { x: L + 72, y: 83, size: 8.5, font: regular, color: accent })
  page.drawText('The journal record online shows its current certification status.', { x: L + 72, y: 70, size: 7.5, font: regular, color: MUTED })
  page.drawText('Certification is reviewed at least once a year under the POSI editorial policy.', { x: L + 72, y: 59, size: 7.5, font: regular, color: MUTED })

  // Issuer and seal, bottom right
  const issuer = 'Editorial Office'
  const org = 'Panorama Open Scholarly Index'
  const ix = R - 118
  page.drawText(issuer, { x: ix - bold.widthOfTextAtSize(issuer, 9), y: 84, size: 9, font: bold, color: INK })
  page.drawText(org, { x: ix - regular.widthOfTextAtSize(org, 8), y: 72, size: 8, font: regular, color: MUTED })
  seal(page, R - 50, 80, 44, 'PANORAMA OPEN SCHOLARLY INDEX  •  CORE COLLECTION  •  ', 'POSI', candidate ? 'CANDIDATE' : 'CERTIFIED', accent, bold, regular)

  return doc.save()
}
