import { readFileSync } from 'fs'
import { join } from 'path'
import { PDFDocument, rgb, degrees, type PDFFont, type PDFPage, type RGB } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import QRCode from 'qrcode'
import psc from './psc-v1.0.snapshot.json'
import { SEAL, serratedPath } from './seal'
import type { Journal } from './types'

// Core Collection certificate: one A4 landscape PDF per Core Collection (and
// candidate) journal, generated at build time (see
// src/app/(docs)/api/certificate/[code]/pdf/route.ts). Every field is read
// from the journal record. The QR code opens the journal's live POSI record,
// which is authoritative.
//
// Type: EB Garamond for the certificate's formal wording, IBM Plex Sans for
// data, IBM Plex Mono for the certificate number (all SIL OFL, bundled in
// src/assets/fonts).

const INK = rgb(0.082, 0.098, 0.11)
const MUTED = rgb(0.34, 0.37, 0.39)
const SOFT = rgb(0.55, 0.59, 0.61)
const RULE = rgb(0.8, 0.82, 0.83)
const BRAND_RED = rgb(0.89, 0.024, 0.075)
const TEAL = rgb(0.11, 0.31, 0.561) // #1c4f8f, the site accent
const GOLD = rgb(0.62, 0.45, 0.05)
const SEAL_INK = hex(SEAL.ink)

const SITE_ORIGIN = 'https://posi.panorama-sg.com'
const SIGNATORY = 'Chengwen Song'
const SIGNATURE_INK = rgb(0.106, 0.165, 0.306) // #1b2a4e, as on the certificate of indexing
const PSC_NAME: Record<string, string> = Object.fromEntries(psc.categories.map(c => [c.code, c.name]))
const FONT_DIR = join(process.cwd(), 'src/assets/fonts')

function hex(h: string): RGB {
  const n = parseInt(h.slice(1), 16)
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255)
}

// The bundled fonts cover Latin scripts. CJK titles get a per-title glyph
// subset of Noto Serif SC from Google Fonts at build time (a few KB); if that
// fetch fails, non-Latin characters are dropped rather than failing the build.
function hasCjk(text: string): boolean {
  return /[⺀-鿿가-힯豈-﫿＀-￯]/.test(text)
}

async function fetchCjkSubsetFont(text: string, timeoutMs = 8000): Promise<ArrayBuffer | null> {
  const chars = [...new Set([...text].filter(c => hasCjk(c)))].join('')
  if (!chars) return null
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@600&text=${encodeURIComponent(chars)}`,
      { signal: AbortSignal.timeout(timeoutMs) },
    )
    if (!css.ok) return null
    const match = (await css.text()).match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/)
    if (!match) return null
    const font = await fetch(match[1], { signal: AbortSignal.timeout(timeoutMs) })
    return font.ok ? font.arrayBuffer() : null
  } catch {
    return null
  }
}

function longDate(iso: string): string {
  return new Date(`${iso.slice(0, 10)}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}

function issnText(j: Journal): string {
  const parts = [j.issn_print && `${j.issn_print} (print)`, j.issn_online && `${j.issn_online} (online)`].filter(Boolean)
  return parts.length ? parts.join('   ') : 'Not registered'
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const spaced = /\s/.test(text)
  const tokens = spaced ? text.split(/\s+/) : [...text]
  const lines: string[] = []
  let cur = ''
  for (const t of tokens) {
    const next = cur ? `${cur}${spaced ? ' ' : ''}${t}` : t
    if (cur && font.widthOfTextAtSize(next, size) > maxWidth) { lines.push(cur); cur = t } else cur = next
  }
  if (cur) lines.push(cur)
  return lines
}

function trackedWidth(text: string, font: PDFFont, size: number, tracking: number) {
  return font.widthOfTextAtSize(text, size) + tracking * Math.max(0, [...text].length - 1)
}

function drawTracked(page: PDFPage, text: string, x: number, y: number, size: number, font: PDFFont, color: RGB, tracking: number) {
  for (const ch of text) {
    page.drawText(ch, { x, y, size, font, color })
    x += font.widthOfTextAtSize(ch, size) + tracking
  }
}

function centered(page: PDFPage, text: string, y: number, size: number, font: PDFFont, color: RGB, tracking = 0) {
  const w = trackedWidth(text, font, size, tracking)
  drawTracked(page, text, page.getWidth() / 2 - w / 2, y, size, font, color, tracking)
}

/** The Panorama block mark: three ink blocks, one red block, one bar. */
function mark(page: PDFPage, x: number, y: number, s: number) {
  const b = s * 0.44
  const g = s * 0.12
  page.drawRectangle({ x, y: y + b + g, width: b, height: b, color: INK })
  page.drawRectangle({ x: x + b + g, y: y + b + g, width: b, height: b, color: BRAND_RED })
  page.drawRectangle({ x, y, width: b, height: b, color: INK })
  page.drawRectangle({ x: x + b + g, y: y + b * 0.67, width: b, height: b * 0.33, color: INK })
}

/** Text along a circle. `upper`: clockwise over the top, glyphs outward; otherwise along the bottom, upright. */
function arcText(page: PDFPage, text: string, cx: number, cy: number, r: number, size: number, tracking: number, font: PDFFont, color: RGB, upper: boolean, opacity: number) {
  const chars = [...text]
  const adv = chars.map((ch, i) => font.widthOfTextAtSize(ch, size) + (i < chars.length - 1 ? tracking : 0))
  const total = adv.reduce((a, b) => a + b, 0) / r
  // math angles (y up): top centre is 90 degrees, bottom centre is 270
  let a = upper ? Math.PI / 2 + total / 2 : (3 * Math.PI) / 2 - total / 2
  chars.forEach((ch, i) => {
    const w = font.widthOfTextAtSize(ch, size)
    const mid = upper ? a - (w / 2) / r : a + (w / 2) / r
    const px = cx + r * Math.cos(mid)
    const py = cy + r * Math.sin(mid)
    // direction of travel along the circle
    const dx = upper ? Math.sin(mid) : -Math.sin(mid)
    const dy = upper ? -Math.cos(mid) : Math.cos(mid)
    page.drawText(ch, {
      x: px - dx * (w / 2), y: py - dy * (w / 2), size, font, color, opacity,
      rotate: degrees(((upper ? mid - Math.PI / 2 : mid + Math.PI / 2) * 180) / Math.PI),
    })
    a = upper ? a - adv[i] / r : a + adv[i] / r
  })
}

function seal(page: PDFPage, cx: number, cy: number, R: number, sans: PDFFont, sub: string) {
  const o = SEAL.opacity
  const ink = SEAL_INK
  // drawSvgPath draws SVG coordinates (y down) from the given origin
  page.drawSvgPath(serratedPath(0, 0, R), { x: cx, y: cy, borderColor: ink, borderWidth: R * 0.014, borderOpacity: o })
  for (const [r, w] of [[SEAL.outerRing, 0.022], [SEAL.outerRing2, 0.008], [SEAL.innerRing, 0.014], [SEAL.innerRing2, 0.006]] as const) {
    page.drawCircle({ x: cx, y: cy, size: R * r, borderColor: ink, borderWidth: R * w, borderOpacity: o })
  }
  const size = R * SEAL.textSize
  arcText(page, SEAL.top, cx, cy, R * SEAL.topBaseline, size, R * SEAL.tracking, sans, ink, true, o)
  arcText(page, SEAL.bottom, cx, cy, R * SEAL.bottomBaseline, size, R * SEAL.tracking, sans, ink, false, o)

  const dotR = R * ((SEAL.innerRing + SEAL.outerRing2) / 2)
  for (const deg of [180 + SEAL.dotAngle, 360 - SEAL.dotAngle]) {
    const t = (deg * Math.PI) / 180
    page.drawCircle({ x: cx + dotR * Math.cos(t), y: cy + dotR * Math.sin(t), size: R * 0.026, color: ink, opacity: o })
  }

  const rule = (dy: number) => page.drawLine({ start: { x: cx - R * 0.3, y: cy + dy }, end: { x: cx + R * 0.3, y: cy + dy }, thickness: R * 0.009, color: ink, opacity: o })
  rule(R * 0.24)
  const cs = R * 0.29
  const cw = trackedWidth('POSI', sans, cs, R * 0.015)
  drawTrackedOpacity(page, 'POSI', cx - cw / 2, cy - R * 0.1, cs, sans, ink, R * 0.015, o)
  rule(-R * 0.19)
  const ss = R * 0.095
  const sw = trackedWidth(sub, sans, ss, R * 0.024)
  drawTrackedOpacity(page, sub, cx - sw / 2, cy - R * 0.33, ss, sans, ink, R * 0.024, o)
}

function drawTrackedOpacity(page: PDFPage, text: string, x: number, y: number, size: number, font: PDFFont, color: RGB, tracking: number, opacity: number) {
  for (const ch of text) {
    page.drawText(ch, { x, y, size, font, color, opacity })
    x += font.widthOfTextAtSize(ch, size) + tracking
  }
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
  // pdf-lib's subsetter drops glyphs from EB Garamond, so the serif is embedded whole.
  // Ligatures are off: pdf-lib measures ligature glyphs incorrectly (the "ffi" in "Office").
  const font = (f: string, subset = true) => doc.embedFont(readFileSync(join(FONT_DIR, f)), { subset, features: { liga: false, clig: false } })
  const [serif, serifBold, serifItalic, sans, sansBold, mono, script] = await Promise.all([
    font('EBGaramond-Medium.ttf', false), font('EBGaramond-SemiBold.ttf', false), font('EBGaramond-MediumItalic.ttf', false),
    font('IBMPlexSans-Regular.ttf'), font('IBMPlexSans-SemiBold.ttf'), font('IBMPlexMono-Medium.ttf'),
    font('Allura-Regular.ttf', false),
  ])

  let titleFont: PDFFont = serifBold
  let title = journal.title
  if (hasCjk(title)) {
    const bytes = await fetchCjkSubsetFont(title)
    if (bytes) titleFont = await doc.embedFont(bytes, { subset: true })
    else title = [...title].filter(c => !hasCjk(c)).join('').trim() || code.toUpperCase()
  }

  doc.setTitle(`${certNo} ${title}`)
  doc.setAuthor('Panorama Open Scholarly Index, Panorama Scholarly Group Ltd.')
  doc.setSubject(candidate ? 'Record of Core Collection candidate status' : 'Certificate of Core Collection certification')
  doc.setProducer('Panorama Open Scholarly Index')

  const page = doc.addPage([842, 595]) // A4 landscape
  const W = page.getWidth()
  const H = page.getHeight()
  const L = 66
  const R = W - 66

  // Header
  mark(page, L, H - 90, 27)
  page.drawText('Panorama Open Scholarly Index', { x: L + 38, y: H - 73, size: 13.5, font: serifBold, color: INK })
  page.drawText('Panorama Scholarly Group Ltd.', { x: L + 38, y: H - 88, size: 8.5, font: sans, color: MUTED })
  const meta: [string, string][] = [['Certificate No.', certNo], ['Date of issue', longDate(issued)]]
  meta.forEach(([k, v], i) => {
    const y = H - 72 - i * 14
    const f = i ? sansBold : mono
    const vw = f.widthOfTextAtSize(v, 8.5)
    page.drawText(v, { x: R - vw, y, size: 8.5, font: f, color: INK })
    page.drawText(k, { x: R - vw - 10 - sans.widthOfTextAtSize(k, 8), y, size: 8, font: sans, color: MUTED })
  })
  page.drawLine({ start: { x: L, y: H - 106 }, end: { x: R, y: H - 106 }, thickness: 0.6, color: RULE })

  // Title block
  centered(page, candidate ? 'CORE COLLECTION CANDIDATE' : 'CORE COLLECTION', H - 144, 8.5, sansBold, accent, 2.6)
  centered(page, 'Certificate', H - 188, 46, serifBold, INK, 1)
  centered(page, candidate ? 'Record of Candidate Status' : 'of Core Collection Certification', H - 212, 15, serifItalic, MUTED)

  let size = 30
  let lines = wrap(title, titleFont, size, 640)
  while ((lines.length > 2 || lines.some(l => titleFont.widthOfTextAtSize(l, size) > 640)) && size > 17) {
    size -= 1
    lines = wrap(title, titleFont, size, 640)
  }
  if (lines.length > 1 && size > 25) { size = 25; lines = wrap(title, titleFont, size, 640) }
  const lift = lines.length > 1 ? 10 : 0
  centered(page, 'This is to certify that the journal', H - 254 + lift, 13, serifItalic, MUTED)
  let y = H - 292 + lift
  for (const line of lines.slice(0, 2)) {
    centered(page, line, y, size, titleFont, INK)
    y -= size + 6
  }
  centered(page, journal.publisher || '', y - 2, 10.5, sans, MUTED)
  y -= 32

  const statement = candidate
    ? `was admitted to the Core Collection of the Panorama Open Scholarly Index on ${longDate(since)} and is currently under re-evaluation. It is not certified while this review is in progress.`
    : `has been evaluated under the POSI Quality Framework and is certified in the Core Collection of the Panorama Open Scholarly Index, with effect from ${longDate(since)}.`
  for (const line of wrap(statement, serif, 13.5, 580)) {
    centered(page, line, y, 13.5, serif, INK)
    y -= 18
  }

  // Details row
  const rowTop = 172
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
    drawTracked(page, k.toUpperCase(), x, rowTop - 17, 6.5, sansBold, SOFT, 0.9)
    let vs = 9.5
    while (sans.widthOfTextAtSize(v, vs) > colW - 20 && vs > 6.5) vs -= 0.5
    page.drawText(v, { x, y: rowTop - 32, size: vs, font: sans, color: INK })
  })

  // Verification, bottom left
  const qr = await doc.embedPng(await QRCode.toDataURL(recordUrl, { margin: 0, width: 240, errorCorrectionLevel: 'M' }))
  page.drawImage(qr, { x: L, y: 48, width: 62, height: 62 })
  page.drawText('Verify this certificate', { x: L + 74, y: 96, size: 8.5, font: sansBold, color: INK })
  page.drawText(recordUrl, { x: L + 74, y: 83, size: 8.5, font: sans, color: accent })
  page.drawText('The journal record online shows its current certification status.', { x: L + 74, y: 70, size: 7.5, font: sans, color: MUTED })
  page.drawText('Certification is reviewed at least once a year under the POSI editorial policy.', { x: L + 74, y: 59, size: 7.5, font: sans, color: MUTED })

  // Signature block, bottom right: signed for the Editorial Office, with the seal beside it.
  const lineL = R - 232
  const lineR = R - 58
  page.drawText('For and on behalf of', { x: lineL, y: 110, size: 9.5, font: serifItalic, color: MUTED })
  page.drawText(SIGNATORY, { x: lineL + 2, y: 80, size: 26, font: script, color: SIGNATURE_INK })
  page.drawLine({ start: { x: lineL, y: 75 }, end: { x: lineR, y: 75 }, thickness: 0.6, color: INK })
  page.drawText(SIGNATORY, { x: lineL, y: 62, size: 10.5, font: serifBold, color: INK })
  page.drawText('Authorized Signatory', { x: lineL, y: 52, size: 7.5, font: sans, color: INK })
  page.drawText('Editorial Office, Panorama Open Scholarly Index', { x: lineL, y: 43, size: 7.5, font: sans, color: MUTED })
  seal(page, R - 34, 82, 40, sansBold, candidate ? 'CANDIDATE' : 'CERTIFIED')

  return doc.save()
}
