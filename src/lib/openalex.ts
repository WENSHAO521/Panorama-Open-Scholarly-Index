// Browser-side client for the OpenAlex works API (CC0 data, open CORS).
// Publication search and publication pages call OpenAlex from the visitor's
// browser. Busy responses (429, 5xx) are retried once or twice, honouring
// Retry-After; if OpenAlex still does not answer, search and publication
// pages fall back to Crossref (see crossref* below). Answers are cached for
// the browser session so back/forward and repeat queries cost nothing.

const API = 'https://api.openalex.org'
const MAILTO = 'posi@panorama-sg.com'

const SELECT = [
  'id', 'doi', 'title', 'publication_date', 'publication_year', 'type', 'language',
  'open_access', 'cited_by_count', 'authorships', 'primary_location', 'biblio',
  'is_retracted', 'abstract_inverted_index', 'referenced_works_count', 'primary_topic', 'keywords',
].join(',')

export interface WorkSource {
  id: string
  display_name: string
  issn_l: string | null
  issn: string[] | null
  host_organization_name: string | null
  type: string | null
}

export interface Work {
  id: string
  doi: string | null
  title: string | null
  publication_date: string | null
  publication_year: number | null
  type: string | null
  language: string | null
  open_access: { is_oa: boolean; oa_status: string; oa_url: string | null }
  cited_by_count: number
  referenced_works_count?: number
  is_retracted?: boolean
  authorships: {
    author: { id: string; display_name: string; orcid: string | null }
    institutions: { id: string; display_name: string; country_code: string | null }[]
  }[]
  primary_location: { source: WorkSource | null; landing_page_url: string | null; pdf_url: string | null; license: string | null } | null
  biblio: { volume: string | null; issue: string | null; first_page: string | null; last_page: string | null }
  abstract_inverted_index?: Record<string, number[]> | null
  primary_topic?: { display_name: string; field?: { display_name: string } } | null
  keywords?: { display_name: string }[]
}

export type SortKey = 'relevance' | 'newest' | 'cited'

export interface WorkQuery {
  q: string
  page: number
  perPage: number
  sort: SortKey
  from?: string
  to?: string
  type?: string[]
  oa?: boolean
  issn?: string
}

export interface WorkPage {
  count: number
  results: Work[]
  /** set when OpenAlex was unavailable and Crossref answered instead */
  via?: 'crossref'
}

export interface Facet { key: string; label: string; count: number }

function filters(qy: WorkQuery): string {
  const f: string[] = []
  if (qy.from) f.push(`from_publication_date:${qy.from}`)
  if (qy.to) f.push(`to_publication_date:${qy.to}`)
  if (qy.type?.length) f.push(`type:${qy.type.join('|')}`)
  if (qy.oa) f.push('is_oa:true')
  if (qy.issn) f.push(`primary_location.source.issn:${qy.issn}`)
  return f.join(',')
}

function url(path: string, params: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') sp.set(k, String(v))
  sp.set('mailto', MAILTO)
  return `${API}${path}?${sp}`
}

export class RegistryError extends Error {
  constructor(readonly service: string, readonly status: number) {
    super(`${service} ${status || 'unreachable'}`)
  }
  get busy() { return this.status === 0 || this.status === 429 || this.status >= 500 }
}

const CACHE_TTL = 10 * 60 * 1000
function cacheGet<T>(u: string): T | null {
  try {
    const raw = sessionStorage.getItem(`oa:${u}`)
    if (!raw) return null
    const { t, v } = JSON.parse(raw)
    return Date.now() - t < CACHE_TTL ? v : null
  } catch { return null }
}
function cacheSet(u: string, v: unknown) {
  try { sessionStorage.setItem(`oa:${u}`, JSON.stringify({ t: Date.now(), v })) } catch { /* quota or disabled */ }
}

const wait = (ms: number, signal?: AbortSignal) => new Promise<void>((res, rej) => {
  const t = setTimeout(res, ms)
  signal?.addEventListener('abort', () => { clearTimeout(t); rej(new DOMException('Aborted', 'AbortError')) }, { once: true })
})

// A long Retry-After means the visitor's daily budget is spent: skip the
// service for the rest of the session instead of waiting on it.
const BLOCK_KEY = (service: string) => `blocked:${service}`
function blockedUntil(service: string): number {
  try { return Number(sessionStorage.getItem(BLOCK_KEY(service))) || 0 } catch { return 0 }
}
function block(service: string, seconds: number) {
  try { sessionStorage.setItem(BLOCK_KEY(service), String(Date.now() + seconds * 1000)) } catch { /* disabled */ }
}

/** GET with session cache and up to two short retries on busy responses. */
async function fetchJson<T>(u: string, service: string, signal?: AbortSignal): Promise<T> {
  const hit = cacheGet<T>(u)
  if (hit) return hit
  if (blockedUntil(service) > Date.now()) throw new RegistryError(service, 429)
  for (let attempt = 0; ; attempt++) {
    let status = 0
    let retryAfter = 0
    try {
      const r = await fetch(u, { signal })
      if (r.ok) { const v = await r.json(); cacheSet(u, v); return v }
      status = r.status
      retryAfter = Number(r.headers.get('Retry-After')) || 0
    } catch (e) {
      if ((e as Error).name === 'AbortError') throw e
    }
    const err = new RegistryError(service, status)
    if (status === 429 && retryAfter > 30) { block(service, retryAfter); throw err }
    if (!err.busy || attempt >= 2) throw err
    const ms = retryAfter ? Math.min(retryAfter * 1000, 8000) : 800 * 2 ** attempt + Math.random() * 400
    await wait(ms, signal)
  }
}

function get<T>(u: string, signal?: AbortSignal): Promise<T> {
  return fetchJson<T>(u, 'OpenAlex', signal)
}

// Crossref fallback. Crossref has no abstracts index, topics or OA status,
// so fallback results are thinner, and the page says where they came from.

const CROSSREF = 'https://api.crossref.org'

interface CrItem {
  DOI: string
  title?: string[]
  type?: string
  'container-title'?: string[]
  ISSN?: string[]
  publisher?: string
  issued?: { 'date-parts'?: (number | null)[][] }
  author?: { given?: string; family?: string; name?: string; ORCID?: string; affiliation?: { name: string }[] }[]
  'is-referenced-by-count'?: number
  'references-count'?: number
  volume?: string
  issue?: string
  page?: string
  abstract?: string
  license?: { URL: string }[]
  URL?: string
  language?: string
}

const CR_TYPE: Record<string, string> = {
  'journal-article': 'article', 'proceedings-article': 'article', 'book-chapter': 'book-chapter', book: 'book',
  'posted-content': 'preprint', dataset: 'dataset', 'peer-review': 'peer-review', dissertation: 'dissertation',
  'reference-entry': 'reference-entry', report: 'report', standard: 'standard', component: 'other',
}

function crToWork(m: CrItem): Work {
  const parts = m.issued?.['date-parts']?.[0] ?? []
  const [y, mo, d] = parts
  const date = y ? [y, mo, d].filter(Boolean).map((n, i) => (i ? String(n).padStart(2, '0') : String(n))).join('-') : null
  const [first, last] = (m.page ?? '').split(/[-–]/)
  const abstract = m.abstract ? m.abstract.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : ''
  const inv: Record<string, number[]> = {}
  abstract.split(' ').forEach((w, i) => { if (w) (inv[w] ??= []).push(i) })
  const issn = m.ISSN ?? []
  return {
    id: m.DOI,
    doi: `https://doi.org/${m.DOI}`,
    title: m.title?.[0] ?? null,
    publication_date: date,
    publication_year: y ?? null,
    type: CR_TYPE[m.type ?? ''] ?? m.type ?? null,
    language: m.language ?? null,
    open_access: { is_oa: false, oa_status: 'unknown', oa_url: null },
    cited_by_count: m['is-referenced-by-count'] ?? 0,
    referenced_works_count: m['references-count'],
    authorships: (m.author ?? []).map(a => ({
      author: { id: '', display_name: a.name ?? [a.given, a.family].filter(Boolean).join(' '), orcid: a.ORCID ?? null },
      institutions: (a.affiliation ?? []).map(x => ({ id: '', display_name: x.name, country_code: null })),
    })),
    primary_location: {
      source: m['container-title']?.[0]
        ? { id: issn[0] ?? '', display_name: m['container-title'][0], issn_l: issn[0] ?? null, issn, host_organization_name: m.publisher ?? null, type: 'journal' }
        : null,
      landing_page_url: m.URL ?? null, pdf_url: null, license: m.license?.[0]?.URL ?? null,
    },
    biblio: { volume: m.volume ?? null, issue: m.issue ?? null, first_page: first || null, last_page: last || null },
    abstract_inverted_index: abstract ? inv : null,
  }
}

function crUrl(path: string, params: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') sp.set(k, String(v))
  sp.set('mailto', MAILTO)
  return `${CROSSREF}${path}?${sp}`
}

async function crossrefSearch(qy: WorkQuery, signal?: AbortSignal): Promise<WorkPage> {
  const f: string[] = []
  if (qy.from) f.push(`from-pub-date:${qy.from}`)
  if (qy.to) f.push(`until-pub-date:${qy.to}`)
  if (qy.issn) f.push(`issn:${qy.issn}`)
  if (qy.type?.length === 1 && qy.type[0] === 'article') f.push('type:journal-article')
  const sort = qy.sort === 'cited' ? 'is-referenced-by-count' : qy.sort === 'newest' || !qy.q ? 'published' : undefined
  const j = await fetchJson<{ message: { 'total-results': number; items: CrItem[] } }>(crUrl('/works', {
    'query.bibliographic': qy.q || undefined,
    filter: f.join(',') || undefined,
    sort, order: sort ? 'desc' : undefined,
    rows: qy.perPage,
    offset: Math.min((qy.page - 1) * qy.perPage, 9000),
  }), 'Crossref', signal)
  return { count: j.message['total-results'], results: j.message.items.map(crToWork), via: 'crossref' }
}

export async function searchWorks(qy: WorkQuery, signal?: AbortSignal): Promise<WorkPage> {
  try {
    return await openalexSearch(qy, signal)
  } catch (e) {
    if (e instanceof RegistryError && e.busy) return crossrefSearch(qy, signal)
    throw e
  }
}

async function openalexSearch(qy: WorkQuery, signal?: AbortSignal): Promise<WorkPage> {
  const sort = qy.sort === 'newest' ? 'publication_date:desc' : qy.sort === 'cited' ? 'cited_by_count:desc' : qy.q ? 'relevance_score:desc' : 'publication_date:desc'
  const j = await get<{ meta: { count: number }; results: Work[] }>(url('/works', {
    search: qy.q || undefined,
    filter: filters(qy) || undefined,
    sort,
    page: qy.page,
    per_page: qy.perPage,
    select: SELECT,
  }), signal)
  return { count: j.meta.count, results: j.results }
}

/** Counts per work type for the current query (one extra request). */
export async function typeFacets(qy: WorkQuery, signal?: AbortSignal): Promise<Facet[]> {
  const j = await get<{ group_by: { key: string; key_display_name: string; count: number }[] }>(url('/works', {
    search: qy.q || undefined,
    filter: filters({ ...qy, type: undefined }) || undefined,
    group_by: 'type',
    per_page: 20,
  }), signal)
  return j.group_by.map(g => ({ key: g.key.replace('https://openalex.org/types/', ''), label: g.key_display_name, count: g.count }))
}

export async function getWork(id: string, signal?: AbortSignal): Promise<Work> {
  const doi = /^10\./.test(id)
  const key = doi ? `doi:${id}` : id.replace('https://openalex.org/', '')
  try {
    return await get<Work>(url(`/works/${encodeURIComponent(key)}`, { select: SELECT }), signal)
  } catch (e) {
    // A DOI can still be resolved through Crossref while OpenAlex is busy.
    if (!doi || !(e instanceof RegistryError) || !e.busy) throw e
    const j = await fetchJson<{ message: CrItem }>(crUrl(`/works/${encodeURIComponent(id)}`, {}), 'Crossref', signal)
    return crToWork(j.message)
  }
}

export async function getTotalWorks(signal?: AbortSignal): Promise<number> {
  const j = await get<{ meta: { count: number } }>(url('/works', { per_page: 1, select: 'id' }), signal)
  return j.meta.count
}

export function abstractOf(w: Work): string | null {
  const inv = w.abstract_inverted_index
  if (!inv) return null
  const words: string[] = []
  for (const [word, positions] of Object.entries(inv)) for (const p of positions) words[p] = word
  const text = words.filter(Boolean).join(' ').trim()
  return text || null
}

export function shortId(w: Pick<Work, 'id'>): string {
  return w.id.replace('https://openalex.org/', '')
}

export function doiOf(w: Pick<Work, 'doi'>): string | null {
  return w.doi ? w.doi.replace(/^https?:\/\/doi\.org\//, '') : null
}

export function pages(w: Work): string | null {
  const { first_page: a, last_page: b } = w.biblio ?? {}
  return a ? (b && b !== a ? `${a}-${b}` : a) : null
}

export const TYPE_LABEL: Record<string, string> = {
  article: 'Article', review: 'Review', preprint: 'Preprint', 'book-chapter': 'Book chapter', book: 'Book',
  dataset: 'Dataset', dissertation: 'Dissertation', editorial: 'Editorial', letter: 'Letter', erratum: 'Erratum',
  'conference-paper': 'Conference paper', paratext: 'Paratext', report: 'Report', other: 'Other', 'peer-review': 'Peer review', libguides: 'Guide',
  standard: 'Standard', retraction: 'Retraction', 'supplementary-materials': 'Supplementary', grant: 'Grant',
}

// ── Export formats ─────────────────────────────────────────────

function authorsList(w: Work) { return w.authorships.map(a => a.author.display_name) }

export function toBibtex(w: Work): string {
  const first = authorsList(w)[0]?.split(' ').pop()?.replace(/[^A-Za-z]/g, '') || 'anon'
  const key = `${first}${w.publication_year ?? ''}${shortId(w).slice(-4)}`
  const f: [string, string | null | undefined][] = [
    ['title', w.title], ['author', authorsList(w).join(' and ')], ['journal', w.primary_location?.source?.display_name],
    ['year', w.publication_year?.toString()], ['volume', w.biblio?.volume], ['number', w.biblio?.issue],
    ['pages', pages(w)?.replace('-', '--')], ['doi', doiOf(w)], ['url', w.doi ?? w.id],
  ]
  return `@article{${key},\n${f.filter(([, v]) => v).map(([k, v]) => `  ${k} = {${v}}`).join(',\n')}\n}`
}

export function toRis(w: Work): string {
  const lines = ['TY  - JOUR']
  if (w.title) lines.push(`TI  - ${w.title}`)
  for (const a of authorsList(w)) lines.push(`AU  - ${a}`)
  if (w.primary_location?.source?.display_name) lines.push(`JO  - ${w.primary_location.source.display_name}`)
  if (w.publication_year) lines.push(`PY  - ${w.publication_year}`)
  if (w.biblio?.volume) lines.push(`VL  - ${w.biblio.volume}`)
  if (w.biblio?.issue) lines.push(`IS  - ${w.biblio.issue}`)
  if (w.biblio?.first_page) lines.push(`SP  - ${w.biblio.first_page}`)
  if (w.biblio?.last_page) lines.push(`EP  - ${w.biblio.last_page}`)
  if (doiOf(w)) lines.push(`DO  - ${doiOf(w)}`)
  lines.push('ER  - ')
  return lines.join('\n')
}

export function toCsvRows(ws: Work[]): string {
  const cell = (v: unknown) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s }
  const head = 'openalex_id,doi,title,authors,source,issn_l,publisher,date,type,open_access,cited_by'
  return [head, ...ws.map(w => [
    shortId(w), doiOf(w), w.title, authorsList(w).join('; '), w.primary_location?.source?.display_name,
    w.primary_location?.source?.issn_l, w.primary_location?.source?.host_organization_name,
    w.publication_date, w.type, w.open_access?.is_oa, w.cited_by_count,
  ].map(cell).join(','))].join('\n')
}

export function download(name: string, body: string, type: string) {
  const u = URL.createObjectURL(new Blob([body], { type }))
  const a = document.createElement('a')
  a.href = u; a.download = name; a.click()
  setTimeout(() => URL.revokeObjectURL(u), 1000)
}

// ── Sources (journals) ─────────────────────────────────────────

export interface Source {
  id: string
  display_name: string
  issn_l: string | null
  issn: string[] | null
  host_organization_name: string | null
  works_count: number
  cited_by_count: number
  summary_stats?: { '2yr_mean_citedness': number | null; h_index: number | null; i10_index: number | null }
  is_oa: boolean
  is_in_doaj: boolean
  homepage_url: string | null
  country_code: string | null
  apc_usd: number | null
  type: string
  first_publication_year: number | null
  last_publication_year: number | null
  alternate_titles?: string[]
  topics?: { display_name: string; count: number; field?: { display_name: string } }[]
  counts_by_year?: { year: number; works_count: number; cited_by_count: number }[]
}

const SOURCE_SELECT = [
  'id', 'display_name', 'issn_l', 'issn', 'host_organization_name', 'works_count', 'cited_by_count', 'summary_stats',
  'is_oa', 'is_in_doaj', 'homepage_url', 'country_code', 'apc_usd', 'type', 'first_publication_year',
  'last_publication_year', 'alternate_titles', 'topics', 'counts_by_year',
].join(',')

export async function searchSources(q: string, perPage = 10, signal?: AbortSignal): Promise<{ count: number; results: Source[] }> {
  const issn = q.trim().match(/^\d{4}-?\d{3}[\dXx]$/)
  const j = await get<{ meta: { count: number }; results: Source[] }>(url('/sources', {
    search: issn ? undefined : q,
    filter: issn ? `type:journal,issn:${q.trim().toUpperCase().replace(/^(\d{4})(\d{3}[\dX])$/, '$1-$2')}` : 'type:journal',
    per_page: perPage,
    select: SOURCE_SELECT,
  }), signal)
  return { count: j.meta.count, results: j.results }
}

/** Look a journal up by OpenAlex id (S…) or by ISSN. */
export async function getSource(key: string, signal?: AbortSignal): Promise<Source | null> {
  const k = key.trim()
  if (/^S\d+$/i.test(k)) return get<Source>(url(`/sources/${k.toUpperCase()}`, { select: SOURCE_SELECT }), signal)
  const j = await get<{ results: Source[] }>(url('/sources', { filter: `issn:${k.toUpperCase()}`, per_page: 1, select: SOURCE_SELECT }), signal)
  return j.results[0] ?? null
}

export async function getTotalJournals(signal?: AbortSignal): Promise<number> {
  const j = await get<{ meta: { count: number } }>(url('/sources', { filter: 'type:journal', per_page: 1, select: 'id' }), signal)
  return j.meta.count
}

export function sourceId(s: Pick<Source, 'id'>): string {
  return s.id.replace('https://openalex.org/', '')
}

/** Link target for a journal: the curated POSI record when there is one, else the indexed-journal page. */
export function sourceHref(src: { id?: string | null; issn_l?: string | null } | null | undefined, curated?: string | null): string | null {
  if (curated) return curated
  if (!src) return null
  if (src.id) return `/journal/?id=${src.id.replace('https://openalex.org/', '')}`
  if (src.issn_l) return `/journal/?issn=${src.issn_l}`
  return null
}
