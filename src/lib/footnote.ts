// Footnote citations in Chicago notes-bibliography style (Chicago Manual of Style, 17th ed., ch. 14):
// a full note for the first time a work is cited and a short note for every later citation.
// Footnote software numbers the notes itself, so the text carries no note number.
// Pure so it can be tested with `node --test`.

import { cleanTitle, spaceInitials, splitName } from './cite-text.ts'
import { PLAIN, type PsgFmt, type PsgPerson } from './psg.ts'

export interface FootnotePair { full: string; short: string }

const text = (s: string | null | undefined) => (s ?? '').trim()

function parts(p: PsgPerson): { given: string; family: string } | null {
  const s = text(p.family) || text(p.given) ? { given: text(p.given), family: text(p.family) } : splitName(p.name)
  if (s) return { given: spaceInitials(s.given), family: s.family }
  return text(p.name) ? { given: '', family: text(p.name) } : null
}

/** Notes give names in natural order: "Helen K. Lee". */
function natural(p: { given: string; family: string }): string {
  return [p.given, p.family].filter(Boolean).join(' ')
}

/** One to three authors are all named; four or more are "First Author et al." (CMOS 14.76). */
function noteAuthors(people: PsgPerson[], name: (p: { given: string; family: string }) => string): string {
  const ps = people.map(parts).filter((p): p is { given: string; family: string } => !!p)
  if (!ps.length) return ''
  if (ps.length === 1) return name(ps[0])
  if (ps.length === 2) return `${name(ps[0])} and ${name(ps[1])}`
  if (ps.length === 3) return `${name(ps[0])}, ${name(ps[1])}, and ${name(ps[2])}`
  return `${name(ps[0])} et al.`
}

/** Short-note title: the main title (before any subtitle), cut to its first four words. */
function shortTitle(title: string): string {
  const main = cleanTitle(title.split(/:\s/)[0])
  const words = main.split(/\s+/)
  return words.length > 4 ? cleanTitle(words.slice(0, 4).join(' ')) : main
}

/** “Title,” with the comma inside the quotes, unless the title ends in "?" or "!", which stands for it. */
function quotedTitle(title: string, f: PsgFmt, after: ',' | '.' | ''): string {
  const t = cleanTitle(title) || 'Untitled'
  return `“${f.esc(t)}${/[?!.]$/.test(t) ? '' : after}”`
}

function pageRange(p: string | null | undefined): string {
  const m = /^([A-Za-z]?\d+)\s*[-–—]+\s*([A-Za-z]?\d+)$/.exec(text(p))
  return m ? `${m[1]}–${m[2]}` : text(p)
}

function doiUrl(doi: string | null | undefined): string {
  const d = text(doi).replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
  return d ? `https://doi.org/${d}` : ''
}

const lead = (who: string, f: PsgFmt) => (who ? `${f.esc(who)}, ` : '')
const stop = (s: string) => (/[.?!]$/.test(s) ? s : `${s}.`)

function short(people: PsgPerson[], title: string, f: PsgFmt, italic: boolean): string {
  const who = noteAuthors(people, p => p.family || p.given)
  const st = shortTitle(title) || 'Untitled'
  return italic ? stop(`${lead(who, f)}${f.em(f.esc(st))}`) : `${lead(who, f)}${quotedTitle(st, f, '.')}`
}

export interface FootnoteArticleInput {
  authors: PsgPerson[]
  year?: string | number | null
  title: string
  journal?: string | null
  volume?: string | null
  issue?: string | null
  pages?: string | null
  doi?: string | null
}

/** Helen K. Lee and Ming Wang, “Title,” Journal 12, no. 2 (2024): 45–63, https://doi.org/…. */
export function footnoteArticle(a: FootnoteArticleInput, f: PsgFmt = PLAIN): FootnotePair {
  let n = `${lead(noteAuthors(a.authors, natural), f)}${quotedTitle(a.title, f, ',')}`
  const journal = text(a.journal), vol = text(a.volume), iss = text(a.issue), pages = pageRange(a.pages)
  if (journal) n += ` ${f.em(f.esc(journal))}`
  if (vol)     n += ` ${f.esc(vol)}`
  if (iss)     n += `, no. ${f.esc(iss)}`
  n += ` (${a.year || 'n.d.'})`
  if (pages)   n += `: ${f.esc(pages)}`
  const url = doiUrl(a.doi)
  if (url)     n += `, ${url}`
  return { full: `${n}.`, short: short(a.authors, a.title, f, false) }
}

export interface FootnoteDatasetInput {
  authors: PsgPerson[]
  year?: string | number | null
  title: string
  /** "data set" or "source code" */
  kind: string
  publisher?: string | null
  doi?: string | null
}

/** Name, Title (Repository, 2024), data set, https://doi.org/…. */
export function footnoteDataset(d: FootnoteDatasetInput, f: PsgFmt = PLAIN): FootnotePair {
  const pub = text(d.publisher)
  let n = `${lead(noteAuthors(d.authors, natural), f)}${f.em(f.esc(cleanTitle(d.title) || 'Untitled'))}`
  n += ` (${pub ? `${f.esc(pub)}, ` : ''}${d.year || 'n.d.'}), ${f.esc(d.kind.toLowerCase())}`
  const url = doiUrl(d.doi)
  if (url) n += `, ${url}`
  return { full: `${n}.`, short: short(d.authors, d.title, f, true) }
}

export interface FootnoteBookInput {
  authors: PsgPerson[]
  year?: string | null
  title: string
  subtitle?: string | null
  edition?: string | null
  place?: string | null
  publisher?: string | null
}

/** Name, Title: Subtitle, 2nd ed. (Place: Publisher, 2024). */
export function footnoteBook(b: FootnoteBookInput, f: PsgFmt = PLAIN): FootnotePair {
  const title = [cleanTitle(b.title) || 'Untitled', cleanTitle(b.subtitle)].filter(Boolean).join(': ')
  let n = `${lead(noteAuthors(b.authors, natural), f)}${f.em(f.esc(title))}`
  if (text(b.edition)) n += `, ${f.esc(text(b.edition))} ed.`
  const place = text(b.place), pub = text(b.publisher)
  const imprint = [pub ? `${place ? `${f.esc(place)}: ` : ''}${f.esc(pub)}` : '', b.year || 'n.d.'].filter(Boolean).join(', ')
  n += ` (${imprint})`
  return { full: `${n}.`, short: short(b.authors, b.title, f, true) }
}

export interface FootnoteWebInput {
  /** A person as "Last, First", or an organisation */
  author: string
  isOrg?: boolean
  title: string
  siteName?: string | null
  /** "March 3, 2024" when the page is dated */
  published?: string | null
  accessDate?: string | null
  url?: string | null
}

/** John Smith, “Page Title,” Site Name, March 3, 2024, https://…. (undated pages give "accessed …" instead) */
export function footnoteWebpage(w: FootnoteWebInput, f: PsgFmt = PLAIN): FootnotePair {
  const name = text(w.author)
  const person = w.isOrg ? null : splitName(name)
  const who = person ? natural(person) : name
  let n = `${lead(who, f)}${quotedTitle(w.title, f, ',')}`
  if (text(w.siteName)) n += ` ${f.esc(text(w.siteName))},`
  if (text(w.published)) n += ` ${f.esc(text(w.published))},`
  else if (text(w.accessDate)) n += ` accessed ${f.esc(text(w.accessDate))},`
  if (text(w.url)) n += ` ${text(w.url)}`
  n = n.replace(/,$/, '')
  const cited = person ? person.family : name
  return { full: `${n}.`, short: `${lead(cited, f)}${quotedTitle(shortTitle(w.title) || 'Untitled', f, '.')}` }
}
