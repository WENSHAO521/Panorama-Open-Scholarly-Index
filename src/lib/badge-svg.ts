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
  const title = esc(journal.short_title || journal.title)
  const color = ajr ? ajrColor(ajr.total) : '#666666'
  return `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="64" viewBox="0 0 220 64" role="img" aria-label="POSI Verified — ${title}${ajr ? ` — AJR ${ajr.total}/100` : ''}">
  <rect x="0.5" y="0.5" width="219" height="63" fill="#ffffff" stroke="#c4c4c4"/>
  ${mark(12, 12, 14, '#111111')}
  <text x="52" y="24" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="12" letter-spacing="0.4" fill="#111111">POSI VERIFIED</text>
  <text x="52" y="39" font-family="Arial, Helvetica, sans-serif" font-weight="500" font-size="9" fill="#666666">${title}</text>
  ${ajr ? `<rect x="52" y="45" width="40" height="14" fill="${color}"/><text x="72" y="55" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="9" fill="#ffffff" text-anchor="middle">AJR ${ajr.total}</text>` : ''}
</svg>`
}

export function badgeDarkSvg(journal: Journal): string {
  const ajr = ajrDisplay(journal)
  const title = esc(journal.short_title || journal.title)
  const color = ajr ? ajrColor(ajr.total) : '#999999'
  return `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="64" viewBox="0 0 220 64" role="img" aria-label="POSI Verified — ${title}${ajr ? ` — AJR ${ajr.total}/100` : ''}">
  <rect x="0.5" y="0.5" width="219" height="63" fill="#111111" stroke="#333333"/>
  ${mark(12, 12, 14, '#ffffff')}
  <text x="52" y="24" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="12" letter-spacing="0.4" fill="#ffffff">POSI VERIFIED</text>
  <text x="52" y="39" font-family="Arial, Helvetica, sans-serif" font-weight="500" font-size="9" fill="#aaaaaa">${title}</text>
  ${ajr ? `<rect x="52" y="45" width="40" height="14" fill="${color}"/><text x="72" y="55" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="9" fill="#ffffff" text-anchor="middle">AJR ${ajr.total}</text>` : ''}
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
  const title = esc(journal.short_title || journal.title)
  const ringColor = ajr ? ajrColor(ajr.total) : '#E30613'
  return `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="90" viewBox="0 0 140 90" role="img" aria-label="POSI Verified — ${title}${ajr ? ` — AJR ${ajr.total}/100` : ''}">
  <ellipse cx="70" cy="45" rx="68" ry="43" fill="#ffffff" stroke="#111111" stroke-width="2"/>
  <ellipse cx="70" cy="45" rx="59" ry="36" fill="none" stroke="${ringColor}" stroke-width="1.5"/>
  ${mark(58, 22, 10, '#111111')}
  <text x="70" y="63" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="13" letter-spacing="0.5" text-anchor="middle" fill="#111111">POSI</text>
  <text x="70" y="75" font-family="Arial, Helvetica, sans-serif" font-weight="600" font-size="7" letter-spacing="0.8" text-anchor="middle" fill="#666666">VERIFIED</text>
</svg>`
}

// Tiny inline pill — for reference lists, footers, anywhere a 220px-wide card
// doesn't fit. No logo mark (illegible at this scale); score is a small color
// chip instead.
export function badgeMicroSvg(journal: Journal): string {
  const ajr = ajrDisplay(journal)
  const title = esc(journal.short_title || journal.title)
  const color = ajr ? ajrColor(ajr.total) : '#666666'
  return `<svg xmlns="http://www.w3.org/2000/svg" width="130" height="20" viewBox="0 0 130 20" role="img" aria-label="POSI Verified — ${title}${ajr ? ` — AJR ${ajr.total}/100` : ''}">
  <rect x="0.5" y="0.5" width="129" height="19" rx="3" fill="#ffffff" stroke="#c4c4c4"/>
  ${mark(6, 3, 6, '#111111')}
  <text x="24" y="14" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="8" letter-spacing="0.3" fill="#111111">POSI VERIFIED</text>
  ${ajr ? `<rect x="98" y="4" width="26" height="12" rx="2" fill="${color}"/><text x="111" y="13" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="7" fill="#ffffff" text-anchor="middle">${ajr.total}</text>` : ''}
</svg>`
}

// Icon-only, favicon-scale badge (40x40) — logo mark plus a small score-
// colored corner dot. A number inside a 10px dot isn't legible, so the score
// itself is conveyed via aria-label only, same principle as the compact
// seal's ring color: color/position carries the signal, not cramped text.
export function badgeIconSvg(journal: Journal): string {
  const ajr = ajrDisplay(journal)
  const title = esc(journal.short_title || journal.title)
  const dotColor = ajr ? ajrColor(ajr.total) : '#cccccc'
  return `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40" role="img" aria-label="POSI Verified — ${title}${ajr ? ` — AJR ${ajr.total}/100` : ''}">
  <rect x="0.5" y="0.5" width="39" height="39" fill="#ffffff" stroke="#c4c4c4"/>
  ${mark(9, 9, 7, '#111111')}
  <circle cx="32" cy="32" r="5" fill="${dotColor}" stroke="#ffffff" stroke-width="1.5"/>
</svg>`
}

// Vertical/stacked orientation — for sidebars and narrow columns.
export function badgeVerticalSvg(journal: Journal): string {
  const ajr = ajrDisplay(journal)
  const title = esc(journal.short_title || journal.title)
  const color = ajr ? ajrColor(ajr.total) : '#666666'
  return `<svg xmlns="http://www.w3.org/2000/svg" width="90" height="140" viewBox="0 0 90 140" role="img" aria-label="POSI Verified — ${title}${ajr ? ` — AJR ${ajr.total}/100` : ''}">
  <rect x="0.5" y="0.5" width="89" height="139" fill="#ffffff" stroke="#c4c4c4"/>
  ${mark(32, 18, 12, '#111111')}
  <text x="45" y="58" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="14" letter-spacing="0.5" text-anchor="middle" fill="#111111">POSI</text>
  <text x="45" y="70" font-family="Arial, Helvetica, sans-serif" font-weight="600" font-size="7" letter-spacing="0.8" text-anchor="middle" fill="#666666">VERIFIED</text>
  <text x="45" y="87" font-family="Arial, Helvetica, sans-serif" font-weight="500" font-size="8" text-anchor="middle" fill="#666666">${title}</text>
  ${ajr ? `<rect x="25" y="98" width="40" height="18" fill="${color}"/><text x="45" y="111" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="10" fill="#ffffff" text-anchor="middle">AJR ${ajr.total}</text>` : ''}
</svg>`
}

// Wide banner strip — for site headers/footers with room for the full
// journal title rather than the short_title the narrower variants use.
export function badgeBannerSvg(journal: Journal): string {
  const ajr = ajrDisplay(journal)
  const title = esc(journal.title)
  const color = ajr ? ajrColor(ajr.total) : '#666666'
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="48" viewBox="0 0 400 48" role="img" aria-label="POSI Verified — ${title}${ajr ? ` — AJR ${ajr.total}/100` : ''}">
  <rect x="0.5" y="0.5" width="399" height="47" fill="#ffffff" stroke="#c4c4c4"/>
  ${mark(14, 14, 10, '#111111')}
  <text x="46" y="21" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="11" letter-spacing="0.4" fill="#111111">POSI VERIFIED</text>
  <text x="46" y="35" font-family="Arial, Helvetica, sans-serif" font-weight="500" font-size="10" fill="#666666">${title}</text>
  ${ajr ? `<rect x="346" y="14" width="40" height="20" fill="${color}"/><text x="366" y="28" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="11" fill="#ffffff" text-anchor="middle">AJR ${ajr.total}</text>` : ''}
</svg>`
}

// Single-color variant for print/grayscale contexts — no red accent, and the
// score box stays black/white regardless of score (color-coding the score is
// exactly what "monochrome" opts out of; the number itself still shows).
export function badgeMonoSvg(journal: Journal): string {
  const ajr = ajrDisplay(journal)
  const title = esc(journal.short_title || journal.title)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="64" viewBox="0 0 220 64" role="img" aria-label="POSI Verified — ${title}${ajr ? ` — AJR ${ajr.total}/100` : ''}">
  <rect x="0.5" y="0.5" width="219" height="63" fill="#ffffff" stroke="#111111" stroke-width="1.5"/>
  <rect x="12" y="12" width="14" height="14" fill="#111111"/>
  <rect x="29.5" y="12" width="14" height="14" fill="#111111" fill-opacity="0.5"/>
  <rect x="12" y="29.5" width="14" height="14" fill="#111111"/>
  <rect x="29.5" y="29.5" width="14" height="4.67" fill="#111111"/>
  <text x="52" y="24" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="12" letter-spacing="0.4" fill="#111111">POSI VERIFIED</text>
  <text x="52" y="39" font-family="Arial, Helvetica, sans-serif" font-weight="500" font-size="9" fill="#444444">${title}</text>
  ${ajr ? `<rect x="52" y="45" width="40" height="14" fill="#111111"/><text x="72" y="55" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="9" fill="#ffffff" text-anchor="middle">AJR ${ajr.total}</text>` : ''}
</svg>`
}

// Detailed card — adds the AJR total and 7 subfactor scores below the score
// chip, using only data already on the Journal record (no extra live fetch
// at build time, unlike a PCI-based variant would need).
export function badgeDetailedSvg(journal: Journal): string {
  const ajr = ajrDisplay(journal)
  const title = esc(journal.short_title || journal.title)
  const color = ajr ? ajrColor(ajr.total) : '#666666'
  const subfactorLine = ajr?.subfactors
    ? `EGF ${ajr.subfactors.egf} &#183; RIF ${ajr.subfactors.rif} &#183; INF ${ajr.subfactors.inf} &#183; PUB ${ajr.subfactors.pub} &#183; SOC ${ajr.subfactors.soc} &#183; RDC ${ajr.subfactors.rdc} &#183; TRN ${ajr.subfactors.trn}`
    : 'AJR assessment pending'
  return `<svg xmlns="http://www.w3.org/2000/svg" width="260" height="100" viewBox="0 0 260 100" role="img" aria-label="POSI Verified — ${title}${ajr ? ` — AJR ${ajr.total}/100` : ''}">
  <rect x="0.5" y="0.5" width="259" height="99" fill="#ffffff" stroke="#c4c4c4"/>
  ${mark(14, 14, 10, '#111111')}
  <text x="44" y="21" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="11" letter-spacing="0.4" fill="#111111">POSI VERIFIED</text>
  <text x="44" y="35" font-family="Arial, Helvetica, sans-serif" font-weight="500" font-size="9" fill="#666666">${title}</text>
  ${ajr ? `<rect x="44" y="43" width="34" height="16" fill="${color}"/><text x="61" y="55" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="9" fill="#ffffff" text-anchor="middle">AJR</text><text x="84" y="55" font-family="Arial, Helvetica, sans-serif" font-weight="600" font-size="9" fill="#111111">${ajr.total}/100</text>` : ''}
  <text x="14" y="78" font-family="Arial, Helvetica, sans-serif" font-size="7.5" fill="#666666">${subfactorLine}</text>
  <text x="14" y="92" font-family="Arial, Helvetica, sans-serif" font-size="6" fill="#999999">posi.panorama-sg.com</text>
</svg>`
}
