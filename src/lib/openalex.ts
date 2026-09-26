// Browser-side client for the OpenAlex works API (CC0 data, open CORS).
// POSI has no backend: publication search and publication pages call
// OpenAlex directly from the visitor's browser.

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

async function get<T>(u: string, signal?: AbortSignal): Promise<T> {
  const r = await fetch(u, { signal })
  if (!r.ok) throw new Error(`OpenAlex ${r.status}`)
  return r.json()
}

export async function searchWorks(qy: WorkQuery, signal?: AbortSignal): Promise<WorkPage> {
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
  const key = /^10\./.test(id) ? `doi:${id}` : id.replace('https://openalex.org/', '')
  return get<Work>(url(`/works/${encodeURIComponent(key)}`, { select: SELECT }), signal)
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
  if (src.id) return `/source/?id=${src.id.replace('https://openalex.org/', '')}`
  if (src.issn_l) return `/source/?issn=${src.issn_l}`
  return null
}
