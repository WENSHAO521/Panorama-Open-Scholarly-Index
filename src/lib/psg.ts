// PSG Author-Date format (see /psg-format/): the one place its layout rules live.
// Used by the article citation formatter, the batch converter and the manual
// entry / ISBN / webpage builders in the citation generator.
// Pure and import-free so it can be tested with `node --test`.

export interface PsgPerson { family?: string | null; given?: string | null; name?: string | null }

/** How inline pieces are rendered: plain text by default, HTML (italics, escaping) for the page. */
export interface PsgFmt { em: (s: string) => string; esc: (s: string) => string }
export const PLAIN: PsgFmt = { em: s => s, esc: s => s }

const text = (s: string | null | undefined) => (s ?? '').trim()

/** "Last, First" - used for the first author of a reference. */
function inverted(p: PsgPerson): string {
  return p.family && p.given ? `${p.family}, ${p.given}` : text(p.name) || text(p.family) || text(p.given)
}
/** "First Last" - used for every author after the first. */
function natural(p: PsgPerson): string {
  return p.family && p.given ? `${p.given} ${p.family}` : text(p.name) || text(p.family) || text(p.given)
}
function surname(p: PsgPerson): string {
  return text(p.family) || text(p.name).split(/\s+/).pop() || text(p.given)
}

/** All authors named: "A, B, and C"; first inverted, the rest in natural order, "and" never "&". */
export function psgAuthors(people: PsgPerson[]): string {
  const ps = people.filter(p => inverted(p))
  if (!ps.length) return ''
  if (ps.length === 1) return inverted(ps[0])
  return [inverted(ps[0]), ...ps.slice(1, -1).map(natural)].join(', ') + ', and ' + natural(ps[ps.length - 1])
}

/** In-text citation: (Smith 2024), (Smith and Lee 2024), (Smith, Lee, and Wang 2024), (Smith et al. 2024). */
export function psgInText(people: PsgPerson[], year: string | number | null | undefined): string {
  const s = people.filter(p => inverted(p)).map(surname)
  const y = year || 'n.d.'
  if (s.length === 0) return `(${y})`
  if (s.length === 1) return `(${s[0]} ${y})`
  if (s.length === 2) return `(${s[0]} and ${s[1]} ${y})`
  if (s.length === 3) return `(${s[0]}, ${s[1]}, and ${s[2]} ${y})`
  return `(${s[0]} et al. ${y})`
}

/** Adds a closing full stop unless the text already ends in one, e.g. after initials. */
function endStop(t: string): string {
  return /[.?!]$/.test(t) ? t : `${t}.`
}

/** Article title in typographic quotes with the closing stop inside. */
function quoted(title: string, f: PsgFmt): string {
  return `“${f.esc(endStop(text(title) || 'Untitled'))}”`
}

function doiUrl(doi: string | null | undefined): string {
  const d = text(doi).replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
  return d ? `https://doi.org/${d}` : ''
}

export interface PsgArticleInput {
  authors: PsgPerson[]
  year?: string | number | null
  title: string
  journal?: string | null
  volume?: string | null
  issue?: string | null
  /** "45-63" or a single page / article number */
  pages?: string | null
  doi?: string | null
}

/** Last, First, and First Last. Year. “Title.” Journal Vol, no. Issue: Pages. https://doi.org/… */
export function psgArticle(a: PsgArticleInput, f: PsgFmt = PLAIN): string {
  const auth = psgAuthors(a.authors)
  let ref = auth ? `${f.esc(endStop(auth))} ` : ''
  ref += `${a.year || 'n.d.'}. ${quoted(a.title, f)}`
  const journal = text(a.journal), vol = text(a.volume), iss = text(a.issue), pages = text(a.pages)
  if (journal) ref += ` ${f.em(f.esc(journal))}`
  if (vol)     ref += ` ${f.esc(vol)}`
  if (iss)     ref += `, no. ${f.esc(iss)}`
  if (pages)   ref += `: ${f.esc(pages)}`
  if (journal || vol || iss || pages) ref += '.'
  const url = doiUrl(a.doi)
  if (url) ref += ` ${url}`  // no full stop after a DOI or URL
  return ref
}

export interface PsgBookInput {
  authors: PsgPerson[]
  year?: string | null
  title: string
  subtitle?: string | null
  edition?: string | null
  place?: string | null
  publisher?: string | null
}

/** Last, First. Year. Book Title: Subtitle. Place: Publisher. */
export function psgBook(b: PsgBookInput, f: PsgFmt = PLAIN): string {
  const auth = psgAuthors(b.authors)
  const title = [text(b.title) || 'Untitled', text(b.subtitle)].filter(Boolean).join(': ')
  let ref = auth ? `${f.esc(endStop(auth))} ` : ''
  ref += `${b.year || 'n.d.'}. ${f.em(f.esc(endStop(title)))}`
  if (text(b.edition)) ref += ` ${f.esc(text(b.edition))} ed.`
  const place = text(b.place), pub = text(b.publisher)
  if (pub) ref += ` ${place ? `${f.esc(place)}: ` : ''}${f.esc(endStop(pub))}`
  return ref
}

export interface PsgWebInput {
  author: string
  year?: string | null
  title: string
  accessDate?: string | null
  url?: string | null
}

/** Author or Organisation. Year. “Page Title.” Accessed Month D, YYYY. https://… */
export function psgWebpage(w: PsgWebInput, f: PsgFmt = PLAIN): string {
  let ref = `${f.esc(endStop(text(w.author) || 'Author'))} ${w.year || 'n.d.'}. ${quoted(w.title, f)}`
  if (text(w.accessDate)) ref += ` Accessed ${f.esc(endStop(text(w.accessDate)))}`
  if (text(w.url)) ref += ` ${text(w.url)}`
  return ref
}
