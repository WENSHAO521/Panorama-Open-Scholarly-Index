import type { AlternateTitle } from './types'

/** Text of an alternate title, plain or typed. */
export function alternateTitleText(a: AlternateTitle): string {
  return typeof a === 'string' ? a : a.title
}

let languageNames: Intl.DisplayNames | null = null
function languageName(tag: string): string {
  try {
    languageNames ??= new Intl.DisplayNames(['en'], { type: 'language' })
    return languageNames.of(tag) ?? tag
  } catch {
    return tag
  }
}

/** An alternate title with what kind of title it is, e.g. "建筑与环境研究 (Chinese title)". */
export function alternateTitleLabel(a: AlternateTitle): string {
  if (typeof a === 'string' || a.type === 'variant') return alternateTitleText(a)
  const kind =
    a.type === 'former' ? `former title${a.until ? `, until ${a.until}` : ''}` :
    a.type === 'translation' ? (a.lang ? `${languageName(a.lang)} title` : 'translated title') :
    'abbreviation'
  return `${a.title} (${kind})`
}
