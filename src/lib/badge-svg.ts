import type { Journal } from './types'

// Colors are literal (not CSS vars) — these SVGs are embedded on third-party
// journal websites that don't load POSI's stylesheet.
//
// Badges feature the AJR score, not the PQF letter grade — PQF answers
// "can this journal be indexed," AJR answers "how does it compare," and a
// public verification badge is squarely the second question (same
// reasoning as /pqf dropping its public grade scale, see AJR-SPEC.md §19).
// Bands mirror PQF's old A+/A/B+/B/C/D/E color tiers, just keyed off the
// 0-100 AJR total instead of a letter.
function ajrColor(total: number): string {
  if (total >= 80) return '#1F7A4D'
  if (total >= 60) return '#111111'
  if (total >= 40) return '#B7791F'
  return '#666666'
}

// Candidate journals (see data.ts's collection_status) get their own badges
// too, not just certificates — but a gold tier color and "POSI CANDIDATE"
// label, always overriding score-based color banding (the tier signal
// matters more here than the raw score), so a candidate badge is
// unmistakable from a full Core Collection one even at a glance, same
// diamond/gold distinction the certificate PDFs use.
const CANDIDATE_GOLD = '#B8870A'

function isCandidateJournal(journal: Journal): boolean {
  return journal.collection_status === 'candidate'
}

interface AjrDisplay {
  total: number
  subfactors: { egf: number; rif: number; inf: number; pub: number; soc: number; rdc: number; trn: number } | null
}

// null when the journal hasn't cleared AJR's minimum evidence bar yet
// (observation/not_yet_rateable/unknown) — same "don't show a number that
// doesn't exist" rule the ratings pages already follow, not a badge-specific
// carve-out.
function ajrDisplay(journal: Journal): AjrDisplay | null {
  const r = journal.early_stage_rating
  if (!r || r.total == null) return null
  return { total: r.total, subfactors: r.subfactors }
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// Helvetica-Bold AFM advance widths (1000 units/em). Every chip ("NOT
// VERIFIED", "AJR 83", "CAND.", plain digits) only ever uses uppercase
// letters, digits, spaces, and periods, so this small table is exact for
// every string these badges actually render — no need for a full font
// metrics library just to size a colored box around its own text.
const HELV_BOLD_WIDTHS: Record<string, number> = {
  ' ': 278, '.': 278, '/': 278,
  '0': 556, '1': 556, '2': 556, '3': 556, '4': 556, '5': 556, '6': 556, '7': 556, '8': 556, '9': 556,
  A: 722, B: 722, C: 722, D: 722, E: 667, F: 611, G: 778, H: 722, I: 278, J: 556, K: 722, L: 611,
  M: 833, N: 722, O: 778, P: 667, Q: 778, R: 722, S: 667, T: 611, U: 722, V: 667, W: 944, X: 667, Y: 667, Z: 611,
}

// Real chip text ("NOT VERIFIED" at font-size 9, for example) measures wider
// than the fixed pixel widths this file used to hardcode — that's the "box
// doesn't fully wrap its text" bug. CHIP_SAFETY pads further still, because
// the CSS font-weight used here (800) is heavier than the standard Bold (700)
// metrics in the table above and browsers render it wider via synthetic
// bolding when the font file has no true 800 weight (Arial/Helvetica ship
// 400/700 only).
const CHIP_SAFETY = 1.08
const CHIP_PAD_X = 8

function chipWidth(text: string, fontSize: number): number {
  let units = 0
  for (const ch of text) units += HELV_BOLD_WIDTHS[ch.toUpperCase()] ?? 650
  return Math.ceil((units / 1000) * fontSize * CHIP_SAFETY) + CHIP_PAD_X * 2
}

type ChipAlign = 'left' | 'right' | 'center'

// Renders a filled rect sized to exactly fit `text` (via chipWidth above)
// plus its centered label — replaces the old fixed-width `<rect
// width="60">` + `<text>` pairs, which clipped or left visible slack
// depending on how long the chip's text happened to be.
function chip(opts: {
  edge: number
  align: ChipAlign
  y: number
  height: number
  textY: number
  text: string
  fontSize: number
  fill: string
  textFill?: string
  rx?: number
}): string {
  const { edge, align, y, height, textY, text, fontSize, fill, textFill = '#ffffff', rx } = opts
  const w = chipWidth(text, fontSize)
  const x = align === 'left' ? edge : align === 'right' ? edge - w : edge - w / 2
  const rxAttr = rx ? ` rx="${rx}"` : ''
  return `<rect x="${x}" y="${y}" width="${w}" height="${height}" fill="${fill}"${rxAttr}/><text x="${x + w / 2}" y="${textY}" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="${fontSize}" fill="${textFill}" text-anchor="middle">${text}</text>`
}

// Approximate regular-weight (non-bold) Arial/Helvetica average advance, as
// a fraction of font-size — used only to decide where a title needs an
// ellipsis before it runs into a neighboring chip or past the card's own
// edge. Deliberately a bit generous (assumes slightly wider-than-average
// glyphs) so it truncates a touch early rather than not at all; titles are
// arbitrary journal names, unlike the fixed uppercase chip vocabulary above,
// so an exact metrics table isn't practical.
const AVG_CHAR_WIDTH_FACTOR = 0.54

function truncateToWidth(text: string, maxWidth: number, fontSize: number): string {
  const perChar = fontSize * AVG_CHAR_WIDTH_FACTOR
  if (text.length * perChar <= maxWidth) return text
  const maxChars = Math.max(1, Math.floor(maxWidth / perChar) - 1)
  return `${text.slice(0, maxChars).trimEnd()}…`
}

// The official POSI mark (see public/posi-logo.svg): three squares — black
// top-left, red top-right, black bottom-left — spaced apart (not touching),
// plus a fourth short black stub bottom-right (same width, 1/3 height) that
// gives the mark its distinctive silhouette. The gap is size/4 and the stub
// height is size/3, matching the reference logo's 24px-square/6px-gap/8px-
// stub proportions exactly. `primary` is black (or white on dark
// backgrounds); the top-right square is always brand red regardless of
// score. Bounding box is size*2.25 square (used by callers to leave
// enough clearance before placing text/other elements after the mark).
function mark(x: number, y: number, size: number, primary: string): string {
  const gap = size / 4
  const stub = size / 3
  const x2 = x + size + gap
  const y2 = y + size + gap
  return `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${primary}"/><rect x="${x2}" y="${y}" width="${size}" height="${size}" fill="#E30613"/><rect x="${x}" y="${y2}" width="${size}" height="${size}" fill="${primary}"/><rect x="${x2}" y="${y2}" width="${size}" height="${stub}" fill="${primary}"/>`
}

export function badgeStandardSvg(journal: Journal): string {
  const ajr = ajrDisplay(journal)
  const isCandidate = isCandidateJournal(journal)
  const rawTitle = journal.short_title || journal.title
  const title = esc(truncateToWidth(rawTitle, 156, 9))
  const label = isCandidate ? 'POSI CANDIDATE' : 'POSI VERIFIED'
  const color = isCandidate ? CANDIDATE_GOLD : ajr ? ajrColor(ajr.total) : '#666666'
  const borderColor = isCandidate ? CANDIDATE_GOLD : '#c4c4c4'
  return `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="64" viewBox="0 0 220 64" role="img" aria-label="${label} — ${esc(rawTitle)}${ajr ? ` — AJR ${ajr.total}/100` : ''}">
  <rect x="0.5" y="0.5" width="219" height="63" fill="#ffffff" stroke="${borderColor}" stroke-width="${isCandidate ? 1.5 : 1}"/>
  ${mark(12, 12, 14, '#111111')}
  <text x="52" y="24" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="12" letter-spacing="0.4" fill="#111111">${label}</text>
  <text x="52" y="39" font-family="Arial, Helvetica, sans-serif" font-weight="500" font-size="9" fill="#666666">${title}</text>
  ${isCandidate
    ? chip({ edge: 52, align: 'left', y: 45, height: 14, textY: 55, text: 'NOT VERIFIED', fontSize: 9, fill: color })
    : ajr ? chip({ edge: 52, align: 'left', y: 45, height: 14, textY: 55, text: `AJR ${ajr.total}`, fontSize: 9, fill: color }) : ''}
</svg>`
}

export function badgeDarkSvg(journal: Journal): string {
  const ajr = ajrDisplay(journal)
  const isCandidate = isCandidateJournal(journal)
  const rawTitle = journal.short_title || journal.title
  const title = esc(truncateToWidth(rawTitle, 156, 9))
  const label = isCandidate ? 'POSI CANDIDATE' : 'POSI VERIFIED'
  const color = isCandidate ? CANDIDATE_GOLD : ajr ? ajrColor(ajr.total) : '#999999'
  return `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="64" viewBox="0 0 220 64" role="img" aria-label="${label} — ${esc(rawTitle)}${ajr ? ` — AJR ${ajr.total}/100` : ''}">
  <rect x="0.5" y="0.5" width="219" height="63" fill="#111111" stroke="${isCandidate ? CANDIDATE_GOLD : '#333333'}" stroke-width="${isCandidate ? 1.5 : 1}"/>
  ${mark(12, 12, 14, '#ffffff')}
  <text x="52" y="24" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="12" letter-spacing="0.4" fill="#ffffff">${label}</text>
  <text x="52" y="39" font-family="Arial, Helvetica, sans-serif" font-weight="500" font-size="9" fill="#aaaaaa">${title}</text>
  ${isCandidate
    ? chip({ edge: 52, align: 'left', y: 45, height: 14, textY: 55, text: 'NOT VERIFIED', fontSize: 9, fill: color })
    : ajr ? chip({ edge: 52, align: 'left', y: 45, height: 14, textY: 55, text: `AJR ${ajr.total}`, fontSize: 9, fill: color }) : ''}
</svg>`
}

export function badgeCompactSvg(journal: Journal): string {
  // A circle only has full width at its exact vertical center — text placed
  // anywhere else (like a second line below the logo mark) hits a shrinking
  // chord width and can overflow the ring. An ellipse (wider than tall) keeps
  // most of its width across a much larger vertical band, so both text lines
  // sit comfortably inside it with room to spare. Score is conveyed by the
  // ring color rather than appended text, for the same reason.
  const ajr = ajrDisplay(journal)
  const isCandidate = isCandidateJournal(journal)
  const title = esc(journal.short_title || journal.title)
  const label = isCandidate ? 'POSI CANDIDATE' : 'POSI VERIFIED'
  const secondLine = isCandidate ? 'CANDIDATE' : 'VERIFIED'
  const ringColor = isCandidate ? CANDIDATE_GOLD : ajr ? ajrColor(ajr.total) : '#E30613'
  return `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="90" viewBox="0 0 140 90" role="img" aria-label="${label} — ${title}${ajr ? ` — AJR ${ajr.total}/100` : ''}">
  <ellipse cx="70" cy="45" rx="68" ry="43" fill="#ffffff" stroke="#111111" stroke-width="2"/>
  <ellipse cx="70" cy="45" rx="59" ry="36" fill="none" stroke="${ringColor}" stroke-width="${isCandidate ? 2.5 : 1.5}"/>
  ${mark(58, 22, 10, '#111111')}
  <text x="70" y="63" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="13" letter-spacing="0.5" text-anchor="middle" fill="#111111">POSI</text>
  <text x="70" y="75" font-family="Arial, Helvetica, sans-serif" font-weight="600" font-size="7" letter-spacing="0.8" text-anchor="middle" fill="#666666">${secondLine}</text>
</svg>`
}

// Tiny inline pill — for reference lists, footers, anywhere a 220px-wide card
// doesn't fit. No logo mark (illegible at this scale); score is a small color
// chip instead. "POSI CANDIDATE" doesn't fit next to a chip at this width,
// so the candidate label itself is abbreviated here (only here — every other
// variant has room for the full word).
export function badgeMicroSvg(journal: Journal): string {
  const ajr = ajrDisplay(journal)
  const isCandidate = isCandidateJournal(journal)
  const title = esc(journal.short_title || journal.title)
  const label = isCandidate ? 'POSI CAND.' : 'POSI VERIFIED'
  const color = isCandidate ? CANDIDATE_GOLD : ajr ? ajrColor(ajr.total) : '#666666'
  return `<svg xmlns="http://www.w3.org/2000/svg" width="130" height="20" viewBox="0 0 130 20" role="img" aria-label="${isCandidate ? 'POSI CANDIDATE' : 'POSI VERIFIED'} — ${title}${ajr ? ` — AJR ${ajr.total}/100` : ''}">
  <rect x="0.5" y="0.5" width="129" height="19" rx="3" fill="#ffffff" stroke="${isCandidate ? CANDIDATE_GOLD : '#c4c4c4'}" stroke-width="${isCandidate ? 1.5 : 1}"/>
  ${mark(6, 3, 6, '#111111')}
  <text x="24" y="14" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="8" letter-spacing="0.3" fill="#111111">${label}</text>
  ${isCandidate
    ? chip({ edge: 124, align: 'right', y: 4, height: 12, textY: 13, text: 'CAND.', fontSize: 6, fill: color, rx: 2 })
    : ajr ? chip({ edge: 124, align: 'right', y: 4, height: 12, textY: 13, text: `${ajr.total}`, fontSize: 7, fill: color, rx: 2 }) : ''}
</svg>`
}

// Icon-only, favicon-scale badge (40x40) — logo mark plus a small score-
// colored corner dot. A number inside a 10px dot isn't legible, so the score
// itself is conveyed via aria-label only, same principle as the compact
// seal's ring color: color/position carries the signal, not cramped text.
export function badgeIconSvg(journal: Journal): string {
  const ajr = ajrDisplay(journal)
  const isCandidate = isCandidateJournal(journal)
  const title = esc(journal.short_title || journal.title)
  const label = isCandidate ? 'POSI Candidate' : 'POSI Verified'
  const dotColor = isCandidate ? CANDIDATE_GOLD : ajr ? ajrColor(ajr.total) : '#cccccc'
  return `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40" role="img" aria-label="${label} — ${title}${ajr ? ` — AJR ${ajr.total}/100` : ''}">
  <rect x="0.5" y="0.5" width="39" height="39" fill="#ffffff" stroke="${isCandidate ? CANDIDATE_GOLD : '#c4c4c4'}" stroke-width="${isCandidate ? 1.5 : 1}"/>
  ${mark(9, 9, 7, '#111111')}
  <circle cx="32" cy="32" r="5" fill="${dotColor}" stroke="#ffffff" stroke-width="1.5"/>
</svg>`
}

// Vertical/stacked orientation — for sidebars and narrow columns.
export function badgeVerticalSvg(journal: Journal): string {
  const ajr = ajrDisplay(journal)
  const isCandidate = isCandidateJournal(journal)
  const rawTitle = journal.short_title || journal.title
  const title = esc(truncateToWidth(rawTitle, 70, 8))
  const secondLine = isCandidate ? 'CANDIDATE' : 'VERIFIED'
  const color = isCandidate ? CANDIDATE_GOLD : ajr ? ajrColor(ajr.total) : '#666666'
  return `<svg xmlns="http://www.w3.org/2000/svg" width="90" height="140" viewBox="0 0 90 140" role="img" aria-label="POSI ${isCandidate ? 'Candidate' : 'Verified'} — ${esc(rawTitle)}${ajr ? ` — AJR ${ajr.total}/100` : ''}">
  <rect x="0.5" y="0.5" width="89" height="139" fill="#ffffff" stroke="${isCandidate ? CANDIDATE_GOLD : '#c4c4c4'}" stroke-width="${isCandidate ? 1.5 : 1}"/>
  ${mark(32, 18, 12, '#111111')}
  <text x="45" y="58" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="14" letter-spacing="0.5" text-anchor="middle" fill="#111111">POSI</text>
  <text x="45" y="70" font-family="Arial, Helvetica, sans-serif" font-weight="600" font-size="7" letter-spacing="0.8" text-anchor="middle" fill="#666666">${secondLine}</text>
  <text x="45" y="87" font-family="Arial, Helvetica, sans-serif" font-weight="500" font-size="8" text-anchor="middle" fill="#666666">${title}</text>
  ${isCandidate
    ? chip({ edge: 45, align: 'center', y: 98, height: 18, textY: 111, text: 'NOT VERIFIED', fontSize: 8, fill: color })
    : ajr ? chip({ edge: 45, align: 'center', y: 98, height: 18, textY: 111, text: `AJR ${ajr.total}`, fontSize: 10, fill: color }) : ''}
</svg>`
}

// Wide banner strip — for site headers/footers with room for the full
// journal title rather than the short_title the narrower variants use.
export function badgeBannerSvg(journal: Journal): string {
  const ajr = ajrDisplay(journal)
  const isCandidate = isCandidateJournal(journal)
  const label = isCandidate ? 'POSI CANDIDATE' : 'POSI VERIFIED'
  const color = isCandidate ? CANDIDATE_GOLD : ajr ? ajrColor(ajr.total) : '#666666'
  const chipText = isCandidate ? 'NOT VERIFIED' : ajr ? `AJR ${ajr.total}` : ''
  const chipFontSize = isCandidate ? 9 : 11
  const chipRightEdge = 386
  const chipLeftEdge = chipText ? chipRightEdge - chipWidth(chipText, chipFontSize) : chipRightEdge
  const title = esc(truncateToWidth(journal.title, chipLeftEdge - 46 - 8, 10))
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="48" viewBox="0 0 400 48" role="img" aria-label="${label} — ${esc(journal.title)}${ajr ? ` — AJR ${ajr.total}/100` : ''}">
  <rect x="0.5" y="0.5" width="399" height="47" fill="#ffffff" stroke="${isCandidate ? CANDIDATE_GOLD : '#c4c4c4'}" stroke-width="${isCandidate ? 1.5 : 1}"/>
  ${mark(14, 14, 10, '#111111')}
  <text x="46" y="21" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="11" letter-spacing="0.4" fill="#111111">${label}</text>
  <text x="46" y="35" font-family="Arial, Helvetica, sans-serif" font-weight="500" font-size="10" fill="#666666">${title}</text>
  ${chipText ? chip({ edge: chipRightEdge, align: 'right', y: 14, height: 20, textY: 28, text: chipText, fontSize: chipFontSize, fill: color }) : ''}
</svg>`
}

// Single-color variant for print/grayscale contexts — no red accent, and the
// score box stays black/white regardless of score (color-coding the score is
// exactly what "monochrome" opts out of; the number itself still shows).
// Candidates are the one exception: the "NOT VERIFIED" text itself carries
// the distinction here, since color can't.
export function badgeMonoSvg(journal: Journal): string {
  const ajr = ajrDisplay(journal)
  const isCandidate = isCandidateJournal(journal)
  const rawTitle = journal.short_title || journal.title
  const title = esc(truncateToWidth(rawTitle, 156, 9))
  const label = isCandidate ? 'POSI CANDIDATE' : 'POSI VERIFIED'
  return `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="64" viewBox="0 0 220 64" role="img" aria-label="${label} — ${esc(rawTitle)}${ajr ? ` — AJR ${ajr.total}/100` : ''}">
  <rect x="0.5" y="0.5" width="219" height="63" fill="#ffffff" stroke="#111111" stroke-width="1.5"/>
  <rect x="12" y="12" width="14" height="14" fill="#111111"/>
  <rect x="29.5" y="12" width="14" height="14" fill="#111111" fill-opacity="0.5"/>
  <rect x="12" y="29.5" width="14" height="14" fill="#111111"/>
  <rect x="29.5" y="29.5" width="14" height="4.67" fill="#111111"/>
  <text x="52" y="24" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="12" letter-spacing="0.4" fill="#111111">${label}</text>
  <text x="52" y="39" font-family="Arial, Helvetica, sans-serif" font-weight="500" font-size="9" fill="#444444">${title}</text>
  ${isCandidate
    ? chip({ edge: 52, align: 'left', y: 45, height: 14, textY: 55, text: 'NOT VERIFIED', fontSize: 9, fill: '#111111' })
    : ajr ? chip({ edge: 52, align: 'left', y: 45, height: 14, textY: 55, text: `AJR ${ajr.total}`, fontSize: 9, fill: '#111111' }) : ''}
</svg>`
}

// Detailed card — adds the AJR total and 7 subfactor scores below the score
// chip, using only data already on the Journal record (no extra live fetch
// at build time, unlike a PCI-based variant would need).
export function badgeDetailedSvg(journal: Journal): string {
  const ajr = ajrDisplay(journal)
  const isCandidate = isCandidateJournal(journal)
  const rawTitle = journal.short_title || journal.title
  const title = esc(truncateToWidth(rawTitle, 204, 9))
  const label = isCandidate ? 'POSI CANDIDATE' : 'POSI VERIFIED'
  const color = isCandidate ? CANDIDATE_GOLD : ajr ? ajrColor(ajr.total) : '#666666'
  const rawSubfactorLine = isCandidate
    ? 'Below eligibility bar — pending PQF re-review'
    : ajr?.subfactors
      ? `EGF ${ajr.subfactors.egf} · RIF ${ajr.subfactors.rif} · INF ${ajr.subfactors.inf} · PUB ${ajr.subfactors.pub} · SOC ${ajr.subfactors.soc} · RDC ${ajr.subfactors.rdc} · TRN ${ajr.subfactors.trn}`
      : 'AJR assessment pending'
  const subfactorLine = esc(truncateToWidth(rawSubfactorLine, 234, 7)).replace(/·/g, '&#183;')
  const ajrChipW = ajr ? chipWidth('AJR', 9) : 0
  return `<svg xmlns="http://www.w3.org/2000/svg" width="260" height="100" viewBox="0 0 260 100" role="img" aria-label="${label} — ${esc(rawTitle)}${ajr ? ` — AJR ${ajr.total}/100` : ''}">
  <rect x="0.5" y="0.5" width="259" height="99" fill="#ffffff" stroke="${isCandidate ? CANDIDATE_GOLD : '#c4c4c4'}" stroke-width="${isCandidate ? 1.5 : 1}"/>
  ${mark(14, 14, 10, '#111111')}
  <text x="44" y="21" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="11" letter-spacing="0.4" fill="#111111">${label}</text>
  <text x="44" y="35" font-family="Arial, Helvetica, sans-serif" font-weight="500" font-size="9" fill="#666666">${title}</text>
  ${isCandidate
    ? chip({ edge: 44, align: 'left', y: 43, height: 16, textY: 55, text: 'NOT VERIFIED', fontSize: 9, fill: color })
    : ajr ? `${chip({ edge: 44, align: 'left', y: 43, height: 16, textY: 55, text: 'AJR', fontSize: 9, fill: color })}<text x="${44 + ajrChipW + 8}" y="55" font-family="Arial, Helvetica, sans-serif" font-weight="600" font-size="9" fill="#111111">${ajr.total}/100</text>` : ''}
  <text x="14" y="78" font-family="Arial, Helvetica, sans-serif" font-size="7" fill="#666666">${subfactorLine}</text>
  <text x="14" y="92" font-family="Arial, Helvetica, sans-serif" font-size="6" fill="#999999">posi.panorama-sg.com</text>
</svg>`
}
