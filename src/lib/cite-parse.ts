// Pure parsers for the batch citation converter (/cite/, "Batch" mode): pull DOIs
// and reference entries out of pasted text, BibTeX, RIS, CSL JSON or plain
// reference lists. No network access and no runtime imports, so it is testable
// with `node --test`.

export interface RefPerson { given?: string; family?: string; name?: string }

export type InputFormat = 'bibtex' | 'ris' | 'csl' | 'text'

export interface RefEntry {
  /** The original text of the entry, kept for error reporting. */
  raw: string
  source: InputFormat
  doi?: string
  title?: string
  authors: RefPerson[]
  journal?: string
  year?: string
  volume?: string
  issue?: string
  pages?: string
}

export const MAX_BATCH = 1000

const DOI_RE = /10\.\d{4,9}\/[^\s"<>]+/g

/** Strips the punctuation that surrounds a DOI in running text, e.g. "(doi:10.1/x)." */
function cleanDoi(d: string): string {
  let s = d
  for (;;) {
    const t = s.replace(/[.,;:'\]}]+$/, '').replace(/\)$/, m => (s.includes('(') ? m : ''))
    if (t === s) return s
    s = t
  }
}

export function extractDois(text: string): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const m of text.matchAll(DOI_RE)) {
    const doi = cleanDoi(m[0])
    const key = doi.toLowerCase()
    if (doi.length > 7 && !seen.has(key)) { seen.add(key); out.push(doi) }
  }
  return out
}

export function detectFormat(text: string): InputFormat {
  const t = text.trim()
  if (/^[[{]/.test(t)) {
    try { JSON.parse(t); return 'csl' } catch { /* not JSON */ }
  }
  if (/^\s*@\w+\s*[{(]/m.test(t)) return 'bibtex'
  if (/^TY {2}- /m.test(t)) return 'ris'
  return 'text'
}

// ── People ─────────────────────────────────────────────────────────────────

export function parsePerson(s: string): RefPerson {
  const t = s.trim().replace(/\s+/g, ' ')
  if (!t) return {}
  const i = t.indexOf(',')
  if (i > -1) return { family: t.slice(0, i).trim(), given: t.slice(i + 1).trim() || undefined }
  const parts = t.split(' ')
  if (parts.length === 1) return { name: t, family: t }
  return { given: parts.slice(0, -1).join(' '), family: parts[parts.length - 1] }
}

// ── BibTeX ─────────────────────────────────────────────────────────────────

function unlatex(v: string): string {
  return v
    .replace(/\\([&%_#$])/g, '$1')
    .replace(/--+/g, '-')
    .replace(/[{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function parseBibtex(text: string): RefEntry[] {
  const entries: RefEntry[] = []
  const re = /@(\w+)\s*([{(])/g
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    const type = m[1].toLowerCase()
    const start = m.index
    let i = re.lastIndex
    if (type === 'comment' || type === 'string' || type === 'preamble') continue
    // citation key
    const comma = text.indexOf(',', i)
    if (comma < 0) break
    i = comma + 1
    const fields: Record<string, string> = {}
    for (;;) {
      while (i < text.length && /[\s,]/.test(text[i])) i++
      if (i >= text.length || text[i] === '}' || text[i] === ')') { i++; break }
      const nameM = /^[\w-]+/.exec(text.slice(i, i + 40))
      if (!nameM) { i++; continue }
      const name = nameM[0].toLowerCase()
      i += nameM[0].length
      while (i < text.length && /\s/.test(text[i])) i++
      if (text[i] !== '=') continue
      i++
      while (i < text.length && /\s/.test(text[i])) i++
      let value = ''
      if (text[i] === '{') {
        let depth = 0
        const s = i
        for (; i < text.length; i++) {
          if (text[i] === '{') depth++
          else if (text[i] === '}' && --depth === 0) { i++; break }
        }
        value = text.slice(s + 1, i - 1)
      } else if (text[i] === '"') {
        const s = ++i
        while (i < text.length && !(text[i] === '"' && text[i - 1] !== '\\')) i++
        value = text.slice(s, i++)
      } else {
        const s = i
        while (i < text.length && !/[,}]/.test(text[i])) i++
        value = text.slice(s, i).trim()
      }
      fields[name] = value
    }
    re.lastIndex = i
    const raw = text.slice(start, i)
    const f = (k: string) => (fields[k] ? unlatex(fields[k]) : undefined)
    const doi = f('doi') ?? extractDois(raw)[0]
    entries.push({
      raw, source: 'bibtex',
      doi: doi ? cleanDoi(doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')) : undefined,
      title: f('title'),
      authors: (fields.author ?? '').split(/\s+and\s+/i).map(a => parsePerson(unlatex(a))).filter(p => p.family || p.name),
      journal: f('journal') ?? f('journaltitle') ?? f('booktitle'),
      year: f('year') ?? f('date')?.match(/\d{4}/)?.[0],
      volume: f('volume'),
      issue: f('number') ?? f('issue'),
      pages: f('pages'),
    })
  }
  return entries
}

// ── RIS ────────────────────────────────────────────────────────────────────

export function parseRis(text: string): RefEntry[] {
  const entries: RefEntry[] = []
  let cur: Record<string, string[]> = {}
  let raw: string[] = []
  const flush = () => {
    if (Object.keys(cur).length) {
      const one = (...tags: string[]) => tags.map(t => cur[t]?.[0]).find(Boolean)
      const doi = one('DO') ?? extractDois(raw.join('\n'))[0]
      const pages = one('SP') ? (cur.EP?.[0] ? `${one('SP')}-${cur.EP[0]}` : one('SP')) : undefined
      entries.push({
        raw: raw.join('\n'), source: 'ris',
        doi: doi ? cleanDoi(doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')) : undefined,
        title: one('TI', 'T1'),
        authors: [...(cur.AU ?? []), ...(cur.A1 ?? [])].map(parsePerson),
        journal: one('JO', 'JF', 'T2', 'JA'),
        year: one('PY', 'Y1', 'DA')?.match(/\d{4}/)?.[0],
        volume: one('VL'),
        issue: one('IS'),
        pages,
      })
    }
    cur = {}; raw = []
  }
  for (const line of text.split(/\r?\n/)) {
    const m = /^([A-Z][A-Z0-9]) {2}-\s?(.*)$/.exec(line)
    if (!m) { if (line.trim() && raw.length) raw.push(line); continue }
    if (m[1] === 'ER') { flush(); continue }
    raw.push(line)
    ;(cur[m[1]] ??= []).push(m[2].trim())
  }
  flush()
  return entries
}

// ── CSL JSON ───────────────────────────────────────────────────────────────

interface CslItem {
  title?: string
  author?: { given?: string; family?: string; literal?: string }[]
  'container-title'?: string
  issued?: { 'date-parts'?: (number | string)[][] }
  volume?: string | number
  issue?: string | number
  page?: string
  DOI?: string
}

export function parseCslJson(text: string): RefEntry[] {
  let data: unknown
  try { data = JSON.parse(text) } catch { return [] }
  const items: CslItem[] = Array.isArray(data) ? data : [data as CslItem]
  return items.filter(it => it && typeof it === 'object').map(it => ({
    raw: JSON.stringify(it),
    source: 'csl' as const,
    doi: it.DOI ? cleanDoi(it.DOI) : undefined,
    title: it.title,
    authors: (it.author ?? []).map(a => a.literal ? { name: a.literal } : { given: a.given, family: a.family }),
    journal: it['container-title'],
    year: it.issued?.['date-parts']?.[0]?.[0] != null ? String(it.issued['date-parts'][0][0]) : undefined,
    volume: it.volume != null ? String(it.volume) : undefined,
    issue: it.issue != null ? String(it.issue) : undefined,
    pages: it.page,
  }))
}

// ── Plain text ─────────────────────────────────────────────────────────────

const PG = String.raw`([A-Za-z]?\d+(?:\s*[-–—]\s*[A-Za-z]?\d+)?)`

function splitAuthors(s: string, style: 'apa' | 'initials' | 'plain'): RefPerson[] {
  const clean = s.replace(/\bet al\.?/i, '').replace(/等\.?$/, '').trim()
  let parts: string[]
  if (style === 'apa') parts = clean.split(/(?<=\.),\s*(?:&\s*)?|\s*&\s*/)
  else if (style === 'initials') parts = clean.split(/\s*,\s*/)          // AMA / Vancouver: "Smith J, Lee HK"
  else parts = clean.split(/\s*(?:;|,\s*and\s+|\s+and\s+|,\s+(?=[A-Z]\w+ [A-Z]))\s*/)
  return parts.map(p => p.trim()).filter(Boolean).map(p => {
    const m = style === 'initials' ? /^(.+?)\s+([A-Z]{1,4})$/.exec(p) : null
    return m ? { family: m[1], given: m[2].split('').join('. ') + '.' } : parsePerson(p)
  })
}

/**
 * Best-effort field extraction from a formatted reference (APA, AMA/Vancouver, GB/T 7714,
 * MLA/Chicago). Used only as a fallback when the reference cannot be found online, so the
 * result is always shown as unverified.
 */
export function parseReferenceText(raw: string): Partial<RefEntry> | null {
  const t = raw.replace(DOI_RE, ' ').replace(/\b(doi|https?:\/\/\S*)\s*:?/gi, ' ').replace(/\s+/g, ' ').trim()
  let m: RegExpExecArray | null
  const out = (authors: RefPerson[], title: string, journal: string, year: string, volume?: string, issue?: string, pages?: string) =>
    ({ authors, title: title.trim(), journal: journal.trim(), year, volume, issue, pages: pages?.replace(/\s+/g, '') })

  // GB/T 7714: Authors. Title[J]. Journal, 2020, 12(3): 45-63.
  if ((m = new RegExp(String.raw`^(.+?)\.\s*(.+?)\[J\]\.\s*(.+?),\s*((?:19|20)\d{2}),\s*(\d+)?(?:\((\d+)\))?\s*:\s*${PG}`).exec(t)))
    return out(splitAuthors(m[1], 'plain'), m[2], m[3], m[4], m[5], m[6], m[7])
  // APA: Smith, J. A., & Lee, H. (2020). Title. Journal, 12(3), 45-63.
  if ((m = new RegExp(String.raw`^(.+?)\s*\(((?:19|20)\d{2})[a-z]?\)\.\s*(.+?)\.\s+(.+?),\s*(\d+)(?:\((\d+)\))?(?:,\s*${PG})?`).exec(t)))
    return out(splitAuthors(m[1], 'apa'), m[3], m[4], m[2], m[5], m[6], m[7])
  // AMA / Vancouver: Smith J, Lee HK. Title. Journal. 2020;12(3):45-63.
  if ((m = new RegExp(String.raw`^(.+?)\.\s+(.+?)\.\s+(.+?)\.?\s*((?:19|20)\d{2})[^;:]*;\s*(\d+)?\s*(?:\((\d+)\))?\s*:\s*${PG}`).exec(t)))
    return out(splitAuthors(m[1], 'initials'), m[2], m[3], m[4], m[5], m[6], m[7])
  // Chicago author-date / PSG: Last, First, and First Last. 2020. "Title." Journal 12, no. 3: 45-63.
  if ((m = new RegExp(String.raw`^(.+?)\.\s*((?:19|20)\d{2})[a-z]?\.\s*["“](.+?)[.,]?["”]\s*(.+?)\s+(\d+)(?:,\s*no\.\s*(\d+))?\s*(?:\(\d{4}\))?\s*:\s*${PG}`).exec(t)))
    return out(splitAuthors(m[1], 'plain'), m[3], m[4], m[2], m[5], m[6], m[7])
  // MLA: Last, First. "Title." Journal 12, no. 3 (2020): 45-63.  or  ... vol. 12, no. 3, 2020, pp. 45-63.
  if ((m = /^(.+?)\.\s*["“](.+?)[.,]?["”]\s*(.+?)(?:,?\s*vol\.\s*(\d+))?(?:,\s*|\s+)(?:(\d+),\s*)?(?:no\. (\d+))?[^\d]*?((?:19|20)\d{2})/.exec(t))) {
    const pages = /(?:pp?\.\s*|:\s*)([A-Za-z]?\d+(?:\s*[-–—]\s*[A-Za-z]?\d+)?)/.exec(t)?.[1]
    return out(splitAuthors(m[1], 'plain'), m[2], m[3].replace(/[\s,]+\d*$/, ''), m[7], m[4] ?? m[5], m[6], pages)
  }
  return null
}

/** One entry per paragraph if the text has blank lines, otherwise one per line. */
export function parsePlainText(text: string): RefEntry[] {
  const norm = text.replace(/\r\n?/g, '\n').trim()
  const blocks = /\n\s*\n/.test(norm)
    ? norm.split(/\n\s*\n/).map(b => b.replace(/\s*\n\s*/g, ' '))
    : norm.split('\n')
  return blocks
    .map(b => b.replace(/^\s*(\[\d+\]|\(?\d+[.)])\s*/, '').trim())
    .filter(Boolean)
    .map(raw => ({ raw, source: 'text' as const, doi: extractDois(raw)[0], authors: [], ...parseReferenceText(raw) }))
}

export function parseInput(text: string): { format: InputFormat; entries: RefEntry[] } {
  const format = detectFormat(text)
  const entries =
    format === 'bibtex' ? parseBibtex(text)
    : format === 'ris' ? parseRis(text)
    : format === 'csl' ? parseCslJson(text)
    : parsePlainText(text)
  // A repeated DOI is converted once.
  const seen = new Set<string>()
  const unique = entries.filter(e => {
    if (!e.doi) return true
    const k = e.doi.toLowerCase()
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
  return { format, entries: unique }
}

// ── Matching ───────────────────────────────────────────────────────────────

function words(s: string): string[] {
  return s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').split(/[^\p{L}\p{N}]+/u).filter(Boolean)
}

/** True when nearly every word of `title` appears in `text`; guards against wrong search hits. */
export function titleMatches(text: string, title: string): boolean {
  const t = words(title)
  if (t.length < 2) return false
  const have = new Set(words(text))
  return t.filter(w => have.has(w)).length / t.length >= 0.85
}

/** The text sent to the Crossref bibliographic search for an entry without a DOI. */
export function searchQuery(e: RefEntry): string {
  if (e.title && e.source !== 'text') {
    return [e.title, e.authors[0]?.family ?? e.authors[0]?.name, e.journal, e.year].filter(Boolean).join(' ')
  }
  return e.raw.replace(DOI_RE, ' ').replace(/https?:\/\/\S+/g, ' ').replace(/\s+/g, ' ').trim()
}
