// Browser-side client for the OpenAlex works API (CC0 data, open CORS).
// Publication search and publication pages call OpenAlex from the visitor's
// browser. Busy responses (429, 5xx) are retried once or twice, honouring
// Retry-After; if OpenAlex still does not answer, search and publication
// pages fall back to Crossref, then DataCite, then Zenodo (see below). Answers are cached for
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
  /** set when OpenAlex was unavailable and another registry answered instead */
  via?: Fallback
}

export type Fallback = 'crossref' | 'datacite' | 'zenodo'

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

// ---- DataCite fallback: Zenodo, figshare, Dryad, arXiv, OSF, institutional repositories ----

const DATACITE = 'https://api.datacite.org'

interface DcAttrs {
  doi: string
  titles?: { title?: string }[]
  creators?: { name?: string; givenName?: string; familyName?: string
    affiliation?: (string | { name?: string })[]
    nameIdentifiers?: { nameIdentifier?: string; nameIdentifierScheme?: string }[] }[]
  publisher?: string | { name?: string } | null
  publicationYear?: number | null
  descriptions?: { description?: string; descriptionType?: string }[]
  subjects?: { subject?: string }[]
  rightsList?: { rights?: string; rightsUri?: string; rightsIdentifier?: string }[]
  types?: { resourceTypeGeneral?: string }
  container?: { title?: string; volume?: string; issue?: string; firstPage?: string; lastPage?: string }
  relatedIdentifiers?: { relatedIdentifierType?: string; relatedIdentifier?: string; relationType?: string }[]
  language?: string | null
  url?: string | null
  citationCount?: number
  referenceCount?: number
  published?: string
}

const DC_TYPE: Record<string, string> = {
  JournalArticle: 'article', ConferencePaper: 'article', Preprint: 'preprint', Dataset: 'dataset', Book: 'book',
  BookChapter: 'book-chapter', Dissertation: 'dissertation', Report: 'report', Software: 'software',
  PeerReview: 'peer-review', Standard: 'standard',
}

const plain = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

function invertedIndex(text: string): Record<string, number[]> | null {
  const inv: Record<string, number[]> = {}
  text.split(' ').forEach((w, i) => { if (w) (inv[w] ??= []).push(i) })
  return text ? inv : null
}

function dcToWork(a: DcAttrs): Work {
  const abs = a.descriptions?.find(d => d.descriptionType === 'Abstract') ?? a.descriptions?.[0]
  const license = a.rightsList?.[0]
  const year = a.publicationYear ?? null
  const pdfLike = /\.pdf($|\?)/i.test(a.url ?? '')
  const free = !!license && /creativecommons|cc0|cc-|open/i.test(`${license.rightsUri ?? ''} ${license.rightsIdentifier ?? ''} ${license.rights ?? ''}`)
  const publisher = typeof a.publisher === 'string' ? a.publisher : a.publisher?.name ?? null
  return {
    id: a.doi,
    doi: `https://doi.org/${a.doi}`,
    title: a.titles?.[0]?.title ?? null,
    publication_date: a.published ?? (year ? String(year) : null),
    publication_year: year,
    type: DC_TYPE[a.types?.resourceTypeGeneral ?? ''] ?? (a.types?.resourceTypeGeneral ? a.types.resourceTypeGeneral.toLowerCase() : null),
    language: a.language ?? null,
    open_access: { is_oa: free, oa_status: 'unknown', oa_url: free ? a.url ?? null : null },
    cited_by_count: a.citationCount ?? 0,
    referenced_works_count: a.referenceCount,
    authorships: (a.creators ?? []).map(c => {
      const orcid = c.nameIdentifiers?.find(n => /orcid/i.test(`${n.nameIdentifierScheme} ${n.nameIdentifier}`))?.nameIdentifier
      return {
        author: {
          id: '',
          display_name: c.name ?? [c.givenName, c.familyName].filter(Boolean).join(' '),
          orcid: orcid ? (orcid.startsWith('http') ? orcid : `https://orcid.org/${orcid}`) : null,
        },
        institutions: (c.affiliation ?? []).map(x => (typeof x === 'string' ? x : x.name ?? '')).filter(Boolean)
          .map(name => ({ id: '', display_name: name, country_code: null })),
      }
    }),
    primary_location: {
      source: { id: '', display_name: a.container?.title || publisher || 'DataCite', issn_l: null, issn: null, host_organization_name: publisher, type: a.container?.title ? 'journal' : 'repository' },
      landing_page_url: a.url ?? null, pdf_url: pdfLike ? a.url ?? null : null, license: license?.rightsUri ?? license?.rights ?? null,
    },
    biblio: { volume: a.container?.volume ?? null, issue: a.container?.issue ?? null, first_page: a.container?.firstPage ?? null, last_page: a.container?.lastPage ?? null },
    abstract_inverted_index: abs?.description ? invertedIndex(plain(abs.description)) : null,
    keywords: (a.subjects ?? []).map(x => x.subject ?? '').filter(Boolean).map(display_name => ({ display_name })),
  }
}

function dcUrl(path: string, params: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') sp.set(k, String(v))
  return `${DATACITE}${path}?${sp}`
}

async function dataciteSearch(qy: WorkQuery, signal?: AbortSignal): Promise<WorkPage> {
  const clauses: string[] = []
  if (qy.q) clauses.push(`(${qy.q.replace(/[\\\[\]{}()^~:"/!]/g, ' ').trim() || '*'})`)
  if (qy.from || qy.to) clauses.push(`publicationYear:[${qy.from?.slice(0, 4) || '*'} TO ${qy.to?.slice(0, 4) || '*'}]`)
  if (qy.type?.length) {
    const general = Object.entries(DC_TYPE).filter(([, v]) => qy.type!.includes(v)).map(([k]) => k)
    if (general.length) clauses.push(`types.resourceTypeGeneral:(${general.join(' OR ')})`)
  }
  const sort = qy.sort === 'cited' ? '-citation' : qy.sort === 'newest' || !qy.q ? '-created' : undefined
  const j = await fetchJson<{ meta: { total: number }; data: { attributes: DcAttrs }[] }>(dcUrl('/dois', {
    query: clauses.join(' AND ') || undefined,
    sort,
    'page[size]': qy.perPage,
    'page[number]': qy.page,
    // Records without a title (placeholders, versions without metadata) are of no use in a result list.
    'has-title': 'true',
  }), 'DataCite', signal)
  return { count: j.meta.total, results: j.data.map(d => dcToWork(d.attributes)), via: 'datacite' }
}

async function dataciteGet(doi: string, signal?: AbortSignal): Promise<Work> {
  const j = await fetchJson<{ data: { attributes: DcAttrs } }>(dcUrl(`/dois/${encodeURIComponent(doi)}`, {}), 'DataCite', signal)
  return dcToWork(j.data.attributes)
}

// ---- Zenodo fallback: Zenodo's own records (anonymous page size is capped at 25) ----

const ZENODO = 'https://zenodo.org/api'

interface ZenRecord {
  id: number | string
  doi?: string
  stats?: { views?: number }
  links?: { self_html?: string }
  files?: { key?: string; links?: { self?: string } }[]
  metadata: {
    title?: string
    description?: string
    publication_date?: string
    resource_type?: { type?: string; subtype?: string }
    creators?: { name?: string; orcid?: string; affiliation?: string }[]
    keywords?: string[]
    license?: { id?: string }
    access_right?: string
    language?: string
    journal?: { title?: string; volume?: string; issue?: string; pages?: string }
  }
}

function zenToWork(r: ZenRecord): Work {
  const m = r.metadata
  const doi = r.doi ?? ''
  const date = m.publication_date ?? null
  const [first, last] = (m.journal?.pages ?? '').split(/[-–]/)
  const open = m.access_right === 'open'
  const rt = m.resource_type
  const landing = r.links?.self_html ?? `https://zenodo.org/records/${r.id}`
  return {
    id: doi || String(r.id),
    doi: doi ? `https://doi.org/${doi}` : null,
    title: m.title ?? null,
    publication_date: date,
    publication_year: date ? Number(date.slice(0, 4)) || null : null,
    type: rt?.type === 'publication' ? (rt.subtype === 'article' ? 'article' : rt.subtype === 'preprint' ? 'preprint' : rt.subtype === 'book' ? 'book' : rt.subtype === 'section' ? 'book-chapter' : rt.subtype === 'report' ? 'report' : rt.subtype === 'thesis' ? 'dissertation' : 'other')
      : rt?.type === 'dataset' ? 'dataset' : rt?.type === 'software' ? 'software' : rt?.type ?? null,
    language: m.language ?? null,
    open_access: { is_oa: open, oa_status: open ? 'green' : 'closed', oa_url: open ? landing : null },
    cited_by_count: 0,
    authorships: (m.creators ?? []).map(c => ({
      author: {
        id: '',
        display_name: c.name?.includes(',') ? c.name.split(',').reverse().map(x => x.trim()).join(' ') : c.name ?? '',
        orcid: c.orcid ? `https://orcid.org/${c.orcid}` : null,
      },
      institutions: (c.affiliation ? c.affiliation.split('|') : []).map(x => x.trim()).filter(Boolean)
        .map(display_name => ({ id: '', display_name, country_code: null })),
    })),
    primary_location: {
      source: { id: '', display_name: m.journal?.title ?? 'Zenodo', issn_l: null, issn: null, host_organization_name: 'Zenodo', type: m.journal?.title ? 'journal' : 'repository' },
      landing_page_url: landing,
      pdf_url: open ? r.files?.find(f => /\.pdf$/i.test(f.key ?? ''))?.links?.self ?? null : null,
      license: m.license?.id ?? null,
    },
    biblio: { volume: m.journal?.volume ?? null, issue: m.journal?.issue ?? null, first_page: first || null, last_page: last || null },
    abstract_inverted_index: m.description ? invertedIndex(plain(m.description)) : null,
    keywords: (m.keywords ?? []).map(display_name => ({ display_name })),
  }
}

async function zenodoSearch(qy: WorkQuery, signal?: AbortSignal): Promise<WorkPage> {
  const q = [qy.q, ...(qy.from || qy.to ? [`publication_date:[${qy.from || '*'} TO ${qy.to || '*'}]`] : [])].filter(Boolean).join(' AND ')
  const size = Math.min(qy.perPage, 25)
  const sp = new URLSearchParams({ size: String(size), page: String(qy.page), sort: qy.sort === 'relevance' && qy.q ? 'bestmatch' : 'mostrecent' })
  if (q) sp.set('q', q)
  if (qy.oa) sp.set('access_right', 'open')
  const j = await fetchJson<{ hits: { total: number; hits: ZenRecord[] } }>(`${ZENODO}/records?${sp}`, 'Zenodo', signal)
  return { count: j.hits.total, results: j.hits.hits.map(zenToWork), via: 'zenodo' }
}

async function zenodoGet(doi: string, signal?: AbortSignal): Promise<Work> {
  const id = doi.match(/^10\.\d+\/zenodo\.(\d+)$/i)?.[1]
  if (!id) throw new RegistryError('Zenodo', 404)
  return zenToWork(await fetchJson<ZenRecord>(`${ZENODO}/records/${id}`, 'Zenodo', signal))
}

/**
 * Registries tried in turn when OpenAlex cannot answer. A busy or unreachable registry moves on to the
 * next; if every one fails, the first error is thrown so the page reports the real cause.
 */
async function firstAnswer<T>(attempts: (() => Promise<T>)[], first: unknown): Promise<T> {
  let err = first
  for (const run of attempts) {
    try { return await run() } catch (e) {
      if ((e as Error).name === 'AbortError') throw e
      if (!(e instanceof RegistryError)) throw e
      if (!(err instanceof RegistryError) || err.busy === false) err = e
    }
  }
  throw err
}

export async function searchWorks(qy: WorkQuery, signal?: AbortSignal): Promise<WorkPage> {
  try {
    return await openalexSearch(qy, signal)
  } catch (e) {
    if (e instanceof RegistryError && e.busy) {
      return firstAnswer([() => crossrefSearch(qy, signal), () => dataciteSearch(qy, signal), () => zenodoSearch(qy, signal)], e)
    }
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
    // A DOI can still be resolved through the registries while OpenAlex is busy, or when OpenAlex has
    // not indexed it yet (new Zenodo and other repository DOIs often are not). Other IDs have no fallback.
    if (!doi || !(e instanceof RegistryError) || !(e.busy || e.status === 404)) throw e
    return firstAnswer([
      async () => crToWork((await fetchJson<{ message: CrItem }>(crUrl(`/works/${encodeURIComponent(id)}`, {}), 'Crossref', signal)).message),
      () => dataciteGet(id, signal),
      () => zenodoGet(id, signal),
    ], e)
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
