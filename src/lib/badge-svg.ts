import type { Journal, PqfScore } from './types'

// Colors are literal (not CSS vars) — these SVGs are embedded on third-party
// journal websites that don't load POSI's stylesheet.
const GRADE_COLOR: Record<string, string> = {
  'A+': '#1F7A4D', A: '#1F7A4D',
  'B+': '#111111', B: '#111111',
  C: '#B7791F',
  D: '#666666', E: '#666666',
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function pqfScore(journal: Journal): PqfScore | null {
  return journal.pqf ?? journal.ojqf ?? journal.auto_pqf ?? null
}

function pqfGrade(journal: Journal): string | null {
  return pqfScore(journal)?.grade ?? null
}

// The 3-square POSI mark, reused across every variant at whatever size/
// position a given badge needs. `primary` is black (or white on dark
// backgrounds) for the two non-red squares; the top-right square is always
// brand red — that's the fixed logo mark, unrelated to grade color.
function mark(x: number, y: number, size: number, primary: string): string {
  return `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${primary}"/><rect x="${x + size}" y="${y}" width="${size}" height="${size}" fill="#E30613"/><rect x="${x}" y="${y + size}" width="${size}" height="${size}" fill="${primary}"/>`
}

export function badgeStandardSvg(journal: Journal): string {
  const grade = pqfGrade(journal)
  const title = esc(journal.short_title || journal.title)
  const gradeColor = grade ? (GRADE_COLOR[grade] ?? '#666666') : '#666666'
  return `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="64" viewBox="0 0 220 64" role="img" aria-label="POSI Verified — ${title}">
  <rect x="0.5" y="0.5" width="219" height="63" fill="#ffffff" stroke="#c4c4c4"/>
  ${mark(12, 12, 14, '#111111')}
  <text x="52" y="24" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="12" letter-spacing="0.4" fill="#111111">POSI VERIFIED</text>
  <text x="52" y="39" font-family="Arial, Helvetica, sans-serif" font-weight="500" font-size="9" fill="#666666">${title}</text>
  ${grade ? `<rect x="52" y="45" width="28" height="14" fill="${gradeColor}"/><text x="66" y="55" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="10" fill="#ffffff" text-anchor="middle">${esc(grade)}</text>` : ''}
</svg>`
}

export function badgeDarkSvg(journal: Journal): string {
  const grade = pqfGrade(journal)
  const title = esc(journal.short_title || journal.title)
  const gradeColor = grade ? (GRADE_COLOR[grade] ?? '#999999') : '#999999'
  return `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="64" viewBox="0 0 220 64" role="img" aria-label="POSI Verified — ${title}">
  <rect x="0.5" y="0.5" width="219" height="63" fill="#111111" stroke="#333333"/>
  ${mark(12, 12, 14, '#ffffff')}
  <text x="52" y="24" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="12" letter-spacing="0.4" fill="#ffffff">POSI VERIFIED</text>
  <text x="52" y="39" font-family="Arial, Helvetica, sans-serif" font-weight="500" font-size="9" fill="#aaaaaa">${title}</text>
  ${grade ? `<rect x="52" y="45" width="28" height="14" fill="${gradeColor}"/><text x="66" y="55" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="10" fill="#ffffff" text-anchor="middle">${esc(grade)}</text>` : ''}
</svg>`
}

export function badgeCompactSvg(journal: Journal): string {
  // A circle only has full width at its exact vertical center — text placed
  // anywhere else (like a second line below the logo mark) hits a shrinking
  // chord width and can overflow the ring. An ellipse (wider than tall) keeps
  // most of its width across a much larger vertical band, so both text lines
  // sit comfortably inside it with room to spare. Grade is conveyed by the
  // ring color rather than appended text, for the same reason.
  const grade = pqfGrade(journal)
  const title = esc(journal.short_title || journal.title)
  const ringColor = grade ? (GRADE_COLOR[grade] ?? '#E30613') : '#E30613'
  return `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="90" viewBox="0 0 140 90" role="img" aria-label="POSI Verified — ${title}${grade ? ` — PQF ${esc(grade)}` : ''}">
  <ellipse cx="70" cy="45" rx="68" ry="43" fill="#ffffff" stroke="#111111" stroke-width="2"/>
  <ellipse cx="70" cy="45" rx="59" ry="36" fill="none" stroke="${ringColor}" stroke-width="1.5"/>
  ${mark(58, 22, 10, '#111111')}
  <text x="70" y="63" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="13" letter-spacing="0.5" text-anchor="middle" fill="#111111">POSI</text>
  <text x="70" y="75" font-family="Arial, Helvetica, sans-serif" font-weight="600" font-size="7" letter-spacing="0.8" text-anchor="middle" fill="#666666">VERIFIED</text>
</svg>`
}

// Tiny inline pill — for reference lists, footers, anywhere a 220px-wide card
// doesn't fit. No logo mark (illegible at this scale); grade is a small color
// chip instead.
export function badgeMicroSvg(journal: Journal): string {
  const grade = pqfGrade(journal)
  const title = esc(journal.short_title || journal.title)
  const gradeColor = grade ? (GRADE_COLOR[grade] ?? '#666666') : '#666666'
  return `<svg xmlns="http://www.w3.org/2000/svg" width="130" height="20" viewBox="0 0 130 20" role="img" aria-label="POSI Verified — ${title}">
  <rect x="0.5" y="0.5" width="129" height="19" rx="3" fill="#ffffff" stroke="#c4c4c4"/>
  <rect x="6" y="5" width="6" height="6" fill="#111111"/>
  <rect x="13" y="5" width="6" height="6" fill="#E30613"/>
  <text x="24" y="14" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="8" letter-spacing="0.3" fill="#111111">POSI VERIFIED</text>
  ${grade ? `<rect x="104" y="4" width="20" height="12" rx="2" fill="${gradeColor}"/><text x="114" y="13" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="8" fill="#ffffff" text-anchor="middle">${esc(grade)}</text>` : ''}
</svg>`
}

// Icon-only, favicon-scale badge (40x40) — logo mark plus a small grade-
// colored corner dot. A letter inside a 10px dot isn't legible, so the grade
// itself is conveyed via aria-label only, same principle as the compact
// seal's ring color: color/position carries the signal, not cramped text.
export function badgeIconSvg(journal: Journal): string {
  const grade = pqfGrade(journal)
  const title = esc(journal.short_title || journal.title)
  const dotColor = grade ? (GRADE_COLOR[grade] ?? '#E30613') : '#cccccc'
  return `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40" role="img" aria-label="POSI Verified — ${title}${grade ? ` — PQF ${esc(grade)}` : ''}">
  <rect x="0.5" y="0.5" width="39" height="39" fill="#ffffff" stroke="#c4c4c4"/>
  ${mark(9, 9, 8, '#111111')}
  <circle cx="32" cy="32" r="5" fill="${dotColor}" stroke="#ffffff" stroke-width="1.5"/>
</svg>`
}

// Vertical/stacked orientation — for sidebars and narrow columns.
export function badgeVerticalSvg(journal: Journal): string {
  const grade = pqfGrade(journal)
  const title = esc(journal.short_title || journal.title)
  const gradeColor = grade ? (GRADE_COLOR[grade] ?? '#666666') : '#666666'
  return `<svg xmlns="http://www.w3.org/2000/svg" width="90" height="140" viewBox="0 0 90 140" role="img" aria-label="POSI Verified — ${title}">
  <rect x="0.5" y="0.5" width="89" height="139" fill="#ffffff" stroke="#c4c4c4"/>
  ${mark(33, 18, 12, '#111111')}
  <text x="45" y="58" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="14" letter-spacing="0.5" text-anchor="middle" fill="#111111">POSI</text>
  <text x="45" y="70" font-family="Arial, Helvetica, sans-serif" font-weight="600" font-size="7" letter-spacing="0.8" text-anchor="middle" fill="#666666">VERIFIED</text>
  <text x="45" y="87" font-family="Arial, Helvetica, sans-serif" font-weight="500" font-size="8" text-anchor="middle" fill="#666666">${title}</text>
  ${grade ? `<rect x="31" y="98" width="28" height="18" fill="${gradeColor}"/><text x="45" y="111" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="12" fill="#ffffff" text-anchor="middle">${esc(grade)}</text>` : ''}
</svg>`
}

// Wide banner strip — for site headers/footers with room for the full
// journal title rather than the short_title the narrower variants use.
export function badgeBannerSvg(journal: Journal): string {
  const grade = pqfGrade(journal)
  const title = esc(journal.title)
  const gradeColor = grade ? (GRADE_COLOR[grade] ?? '#666666') : '#666666'
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="48" viewBox="0 0 400 48" role="img" aria-label="POSI Verified — ${title}">
  <rect x="0.5" y="0.5" width="399" height="47" fill="#ffffff" stroke="#c4c4c4"/>
  ${mark(14, 14, 10, '#111111')}
  <text x="46" y="21" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="11" letter-spacing="0.4" fill="#111111">POSI VERIFIED</text>
  <text x="46" y="35" font-family="Arial, Helvetica, sans-serif" font-weight="500" font-size="10" fill="#666666">${title}</text>
  ${grade ? `<rect x="352" y="14" width="34" height="20" fill="${gradeColor}"/><text x="369" y="28" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="12" fill="#ffffff" text-anchor="middle">${esc(grade)}</text>` : ''}
</svg>`
}

// Single-color variant for print/grayscale contexts — no red accent, and the
// grade box stays black/white regardless of grade (color-coding the grade is
// exactly what "monochrome" opts out of; the letter itself still shows).
export function badgeMonoSvg(journal: Journal): string {
  const grade = pqfGrade(journal)
  const title = esc(journal.short_title || journal.title)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="64" viewBox="0 0 220 64" role="img" aria-label="POSI Verified — ${title}">
  <rect x="0.5" y="0.5" width="219" height="63" fill="#ffffff" stroke="#111111" stroke-width="1.5"/>
  <rect x="12" y="12" width="14" height="14" fill="#111111"/>
  <rect x="28" y="12" width="14" height="14" fill="#111111" fill-opacity="0.5"/>
  <rect x="12" y="28" width="14" height="14" fill="#111111"/>
  <text x="52" y="24" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="12" letter-spacing="0.4" fill="#111111">POSI VERIFIED</text>
  <text x="52" y="39" font-family="Arial, Helvetica, sans-serif" font-weight="500" font-size="9" fill="#444444">${title}</text>
  ${grade ? `<rect x="52" y="45" width="28" height="14" fill="#111111"/><text x="66" y="55" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="10" fill="#ffffff" text-anchor="middle">${esc(grade)}</text>` : ''}
</svg>`
}

// Detailed card — adds the PQF total and 6 subfactor scores below the grade,
// using only data already on the Journal record (no extra live fetch at
// build time, unlike a PCI-based variant would need).
export function badgeDetailedSvg(journal: Journal): string {
  const score = pqfScore(journal)
  const title = esc(journal.short_title || journal.title)
  const gradeColor = score ? (GRADE_COLOR[score.grade] ?? '#666666') : '#666666'
  const subfactorLine = score
    ? `JTF ${score.subfactors.jtf} &#183; MQF ${score.subfactors.mqf} &#183; EGF ${score.subfactors.egf} &#183; TDF ${score.subfactors.tdf} &#183; CVF ${score.subfactors.cvf} &#183; RIF ${score.subfactors.rif}`
    : 'PQF assessment pending'
  return `<svg xmlns="http://www.w3.org/2000/svg" width="260" height="100" viewBox="0 0 260 100" role="img" aria-label="POSI Verified — ${title}">
  <rect x="0.5" y="0.5" width="259" height="99" fill="#ffffff" stroke="#c4c4c4"/>
  ${mark(14, 14, 10, '#111111')}
  <text x="44" y="21" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="11" letter-spacing="0.4" fill="#111111">POSI VERIFIED</text>
  <text x="44" y="35" font-family="Arial, Helvetica, sans-serif" font-weight="500" font-size="9" fill="#666666">${title}</text>
  ${score ? `<rect x="44" y="43" width="26" height="16" fill="${gradeColor}"/><text x="57" y="55" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="11" fill="#ffffff" text-anchor="middle">${esc(score.grade)}</text><text x="78" y="55" font-family="Arial, Helvetica, sans-serif" font-weight="600" font-size="9" fill="#111111">${score.total}/100</text>` : ''}
  <text x="14" y="78" font-family="Arial, Helvetica, sans-serif" font-size="7.5" fill="#666666">${subfactorLine}</text>
  <text x="14" y="92" font-family="Arial, Helvetica, sans-serif" font-size="6" fill="#999999">posi.panorama-sg.com</text>
</svg>`
}
