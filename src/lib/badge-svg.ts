import type { Journal } from './types'

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

function pqfGrade(journal: Journal): string | null {
  const official = journal.pqf ?? journal.ojqf ?? null
  return (official ?? journal.auto_pqf ?? null)?.grade ?? null
}

export function badgeStandardSvg(journal: Journal): string {
  const grade = pqfGrade(journal)
  const title = esc(journal.short_title || journal.title)
  const gradeColor = grade ? (GRADE_COLOR[grade] ?? '#666666') : '#666666'
  return `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="64" viewBox="0 0 220 64" role="img" aria-label="POSI Verified — ${title}">
  <rect x="0.5" y="0.5" width="219" height="63" fill="#ffffff" stroke="#c4c4c4"/>
  <rect x="12" y="12" width="14" height="14" fill="#111111"/>
  <rect x="28" y="12" width="14" height="14" fill="#E30613"/>
  <rect x="12" y="28" width="14" height="14" fill="#111111"/>
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
  <rect x="12" y="12" width="14" height="14" fill="#ffffff"/>
  <rect x="28" y="12" width="14" height="14" fill="#E30613"/>
  <rect x="12" y="28" width="14" height="14" fill="#ffffff"/>
  <text x="52" y="24" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="12" letter-spacing="0.4" fill="#ffffff">POSI VERIFIED</text>
  <text x="52" y="39" font-family="Arial, Helvetica, sans-serif" font-weight="500" font-size="9" fill="#aaaaaa">${title}</text>
  ${grade ? `<rect x="52" y="45" width="28" height="14" fill="${gradeColor}"/><text x="66" y="55" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="10" fill="#ffffff" text-anchor="middle">${esc(grade)}</text>` : ''}
</svg>`
}

export function badgeCompactSvg(journal: Journal): string {
  const grade = pqfGrade(journal)
  const title = esc(journal.short_title || journal.title)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="90" height="90" viewBox="0 0 90 90" role="img" aria-label="POSI Indexed — ${title}">
  <circle cx="45" cy="45" r="43" fill="#ffffff" stroke="#111111" stroke-width="2"/>
  <circle cx="45" cy="45" r="36" fill="none" stroke="#E30613" stroke-width="1"/>
  <rect x="33" y="26" width="10" height="10" fill="#111111"/>
  <rect x="47" y="26" width="10" height="10" fill="#E30613"/>
  <rect x="33" y="40" width="10" height="10" fill="#111111"/>
  <text x="45" y="62" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="10" letter-spacing="0.5" text-anchor="middle" fill="#111111">POSI</text>
  <text x="45" y="72" font-family="Arial, Helvetica, sans-serif" font-weight="500" font-size="6" letter-spacing="1.2" text-anchor="middle" fill="#666666">INDEXED${grade ? ` · ${esc(grade)}` : ''}</text>
</svg>`
}
