// Browser-side client for the OpenAlex works API (CC0 data, open CORS).
// Publication search and publication pages call OpenAlex from the visitor's
// browser. Busy responses (429, 5xx) are retried once or twice, honouring
// Retry-After; if OpenAlex still does not answer, search and publication
// pages fall back to Crossref, then DataCite, then Zenodo (see below). Search asks Crossref, DataCite and Zenodo
// alongside OpenAlex and mixes in their records that OpenAlex does not hold, and a DOI typed into search is looked up. Answers are cached for
// the browser session so back/forward and repeat queries cost nothing.

import {
  RegistryError, dataciteSearch, zenodoSearch, recordByDoi, isZenodoDoi, registrationAgency, registriesFor, invertedIndex, holderOf,
  type GetJson, type RegistryRecord, type RecordQuery,
} from './registries'
import type { ProviderErrorKind } from './scholarly-api/errors'
import { mergeRepositories } from './repository-merge'
import { extractDoi } from './utils'
import { plausibleYear } from './cite-text'
import { getJournalProfile } from './journal-profile'

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
    /** `given` / `family` only from Crossref; OpenAlex gives a display name alone */
    author: { id: string; display_name: string; orcid: string | null; given?: string; family?: string }
    institutions: { id: string; display_name: string; country_code: string | null }[]
  }[]
  primary_location: { source: WorkSource | null; landing_page_url: string | null; pdf_url: string | null; license: string | null } | null
  biblio: { volume: string | null; issue: string | null; first_page: string | null; last_page: string | null }
  abstract_inverted_index?: Record<string, number[]> | null
  primary_topic?: { display_name: string; field?: { display_name: string } } | null
  keywords?: { display_name: string }[]
  /** the record came from this registry, searched alongside OpenAlex, which does not hold it */
  registry?: 'Crossref' | 'DataCite' | 'Zenodo'
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
  /** why OpenAlex could not answer, when `via` is set */
  viaWhy?: ProviderErrorKind
  /** how many of the results came from Crossref, DataCite or Zenodo, mixed into the page (see repository-merge.ts) */
  repositories?: number
  /** per registry searched, how many of the page's records it supplied; `failed` when it did not answer */
  sources?: { source: RegistrySource; n: number; total?: number; failed?: boolean }[]
  /** a journal's listing: the journal's article count as the journal directory shows it, and where it comes from */
  journalCount?: number
  journalBasis?: 'openalex' | 'crossref'
}

export type Fallback = 'crossref' | 'datacite' | 'zenodo'

export interface Facet { key: string; label: string; count: number }

/**
 * OpenAlex filters for the query. A journal's listing is filtered to the journal's OpenAlex source when it is known,
 * the same source whose works count the journal directory shows; an ISSN can also match a duplicate source record.
 */
function filters(qy: WorkQuery, source?: string): string {
  const f: string[] = []
  if (qy.from) f.push(`from_publication_date:${qy.from}`)
  if (qy.to) f.push(`to_publication_date:${qy.to}`)
  if (qy.type?.length) f.push(`type:${qy.type.join('|')}`)
  if (qy.oa) f.push('is_oa:true')
  if (source) f.push(`primary_location.source.id:${source}`)
  else if (qy.issn) f.push(`primary_location.source.issn:${qy.issn}`)
  return f.join(',')
}

function url(path: string, params: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') sp.set(k, String(v))
  sp.set('mailto', MAILTO)
  return `${API}${path}?${sp}`
}

export { RegistryError }

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
/** When OpenAlex is skipped until (ms since epoch), or 0: the visitor's daily request budget is spent. */
export function openalexBlockedUntil(): number {
  const t = blockedUntil('OpenAlex')
  return t > Date.now() ? t : 0
}
function block(service: string, seconds: number) {
  try { sessionStorage.setItem(BLOCK_KEY(service), String(Date.now() + seconds * 1000)) } catch { /* disabled */ }
}

const TIMEOUT_MS = 12000
const inflight = new Map<string, Promise<unknown>>()

/** One attempt with a time limit. A caller's abort wins over the timeout and is rethrown as AbortError. */
async function fetchOnce(u: string, signal?: AbortSignal): Promise<Response> {
  const ctrl = new AbortController()
  let timedOut = false
  const timer = setTimeout(() => { timedOut = true; ctrl.abort() }, TIMEOUT_MS)
  const onAbort = () => ctrl.abort()
  signal?.addEventListener('abort', onAbort, { once: true })
  try { return await fetch(u, { signal: ctrl.signal }) } catch (e) {
    if (timedOut && !signal?.aborted) throw new RegistryError('', 0, true)
    throw e
  } finally { clearTimeout(timer); signal?.removeEventListener('abort', onAbort) }
}

/** GET with session cache, one shared request per URL, a time limit, and up to two short retries on busy responses. */
function fetchJson<T>(u: string, service: string, signal?: AbortSignal): Promise<T> {
  const hit = cacheGet<T>(u)
  if (hit) return Promise.resolve(hit)
  // Identical requests in flight share one network call; a caller that aborts only abandons its own wait.
  let p = inflight.get(u) as Promise<T> | undefined
  if (!p) {
    p = fetchJsonUncached<T>(u, service).finally(() => inflight.delete(u))
    inflight.set(u, p)
  }
  if (!signal) return p
  return new Promise<T>((res, rej) => {
    if (signal.aborted) return rej(new DOMException('Aborted', 'AbortError'))
    signal.addEventListener('abort', () => rej(new DOMException('Aborted', 'AbortError')), { once: true })
    p.then(res, rej)
  })
}

async function fetchJsonUncached<T>(u: string, service: string): Promise<T> {
  if (blockedUntil(service) > Date.now()) throw new RegistryError(service, 429)
  for (let attempt = 0; ; attempt++) {
    let status = 0
    let retryAfter = 0
    let timedOut = false
    try {
      const r = await fetchOnce(u)
      if (r.ok) { const v = await r.json(); cacheSet(u, v); return v }
      status = r.status
      // OpenAlex states the seconds to its midnight-UTC reset in X-RateLimit-Reset.
      retryAfter = Number(r.headers.get('Retry-After')) || (status === 429 ? Number(r.headers.get('X-RateLimit-Reset')) || 0 : 0)
    } catch (e) {
      timedOut = e instanceof RegistryError && e.timedOut
    }
    const err = new RegistryError(service, status, timedOut)
    if (status === 429 && retryAfter > 30) { block(service, retryAfter); throw err }
    if (!err.busy || attempt >= 2) throw err
    const ms = retryAfter ? Math.min(retryAfter * 1000, 8000) : 800 * 2 ** attempt + Math.random() * 400
    await wait(ms)
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
  const type = CR_TYPE[m.type ?? ''] ?? m.type ?? null
  return {
    id: m.DOI,
    doi: `https://doi.org/${m.DOI}`,
    title: m.title?.[0] ?? null,
    publication_date: date,
    publication_year: y ?? null,
    type,
    language: m.language ?? null,
    open_access: { is_oa: false, oa_status: 'unknown', oa_url: null },
    cited_by_count: m['is-referenced-by-count'] ?? 0,
    referenced_works_count: m['references-count'],
    authorships: (m.author ?? []).map(a => ({
      author: { id: '', display_name: a.name ?? [a.given, a.family].filter(Boolean).join(' '), orcid: a.ORCID ?? null, given: a.given, family: a.family },
      institutions: (a.affiliation ?? []).map(x => ({ id: '', display_name: x.name, country_code: null })),
    })),
    primary_location: {
      // A data set or software is held by its publisher (the repository); a containing title is not its publisher.
      source: (type === 'dataset' || type === 'software') && m.publisher
        ? { id: '', display_name: m.publisher, issn_l: null, issn: null, host_organization_name: m.publisher, type: 'repository' }
        : m['container-title']?.[0]
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
  // Crossref ORs repeated filters of one name. A type Crossref has no counterpart for (editorial, review, ...) cannot be
  // asked for; when no requested type has one, Crossref has nothing to add.
  if (qy.type?.length) {
    const types = Object.entries(CR_TYPE).filter(([, v]) => qy.type!.includes(v)).map(([k]) => k)
    if (!types.length) return { count: 0, results: [], via: 'crossref' }
    f.push(...types.map(t => `type:${t}`))
  }
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

// ---- DataCite and Zenodo fallbacks (adapters in registries.ts) ----

const getJson: GetJson = (u, service, signal) => fetchJson<unknown>(u, service, signal)

function recordToWork(r: RegistryRecord): Work {
  const src = holderOf(r) || (r.source === 'zenodo' ? 'Zenodo' : 'DataCite')
  return {
    id: r.doi,
    doi: r.doi ? `https://doi.org/${r.doi}` : null,
    title: r.title,
    publication_date: r.date,
    publication_year: r.year,
    type: r.kind,
    language: r.language,
    open_access: { is_oa: r.openAccess, oa_status: r.openAccess ? (r.source === 'zenodo' ? 'green' : 'unknown') : 'unknown', oa_url: r.openAccess ? r.url : null },
    cited_by_count: r.citations,
    referenced_works_count: r.references || undefined,
    authorships: r.creators.map(c => ({
      author: { id: '', display_name: c.name, orcid: c.orcid ? `https://orcid.org/${c.orcid}` : null },
      institutions: c.affiliations.map(display_name => ({ id: '', display_name, country_code: null })),
    })),
    primary_location: {
      source: { id: '', display_name: src, issn_l: r.issn[0] ?? null, issn: r.issn.length ? r.issn : null, host_organization_name: r.publisher, type: r.container.title || r.issn.length ? 'journal' : 'repository' },
      landing_page_url: r.url, pdf_url: r.pdfUrl, license: r.licenseUrl ?? r.license,
    },
    biblio: { volume: r.container.volume, issue: r.container.issue, first_page: r.container.firstPage, last_page: r.container.lastPage },
    abstract_inverted_index: invertedIndex(r.abstract),
    keywords: r.keywords.map(display_name => ({ display_name })),
    registry: r.source === 'zenodo' || isZenodoDoi(r.doi) ? 'Zenodo' : 'DataCite',
  }
}

const toRecordQuery = (qy: WorkQuery): RecordQuery => ({ ...qy })

async function dataciteWorks(qy: WorkQuery, signal?: AbortSignal): Promise<WorkPage> {
  const p = await dataciteSearch(toRecordQuery(qy), getJson, signal)
  return { count: p.count, results: p.records.map(recordToWork), via: 'datacite' }
}

async function zenodoWorks(qy: WorkQuery, signal?: AbortSignal): Promise<WorkPage> {
  const p = await zenodoSearch(toRecordQuery(qy), getJson, signal)
  return { count: p.count, results: p.records.map(recordToWork), via: 'zenodo' }
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

/** Records asked for per registry and page in a text search, mixed into it (see repository-merge.ts). */
const EXTRA_PER_PAGE = 5
/** How long a page that OpenAlex has answered waits for each other registry before showing without it. */
const EXTRA_WAIT_MS = 2500
/** A journal's listing waits longer: for a journal OpenAlex does not list, Crossref or DataCite is the main source. */
const JOURNAL_EXTRA_WAIT_MS = 8000

export type RegistrySource = 'OpenAlex' | 'Crossref' | 'DataCite' | 'Zenodo'

interface Extras {
  /** one list per registry asked, in the order their records take turns on the page */
  lists: Work[][]
  /** each registry's total for the query, in the order of `asked` (0 when it did not answer) */
  totals: number[]
  journal: boolean
  /** registries that were asked and did not answer in time */
  failed: RegistrySource[]
  asked: RegistrySource[]
}

/**
 * Crossref's, DataCite's and Zenodo's records for the same page, searched alongside OpenAlex, each list filtered to
 * what the page's filters allow (none of them can apply every filter itself). A text search asks each for a few
 * records. A journal's listing (ISSN) asks Crossref and DataCite for a full page of the journal's records: Crossref
 * has a publisher's deposits the day they are made, OpenAlex days to weeks later, and journals that register DOIs
 * with DataCite (Zenodo included) are missing from Crossref and often from OpenAlex. Zenodo's own search has no ISSN
 * field, but its DOIs are registered with DataCite, so DataCite's answer covers them. A listing without search words
 * or ISSN would only show the newest deposits, so none is asked then. A registry that fails or is slow adds nothing.
 * `skip` leaves out the registry that already answers the page itself (OpenAlex fell back to it).
 */
function registryWorks(qy: WorkQuery, signal?: AbortSignal, skip?: RegistrySource): Promise<Extras> {
  const keep = (w: Work) => (!qy.type?.length || (!!w.type && qy.type.includes(w.type))) && (!qy.oa || w.open_access.is_oa)
  const asCrossref = (w: Work): Work => ({ ...w, registry: 'Crossref' })
  const timeout = qy.issn ? JOURNAL_EXTRA_WAIT_MS : EXTRA_WAIT_MS
  type Ask = { name: RegistrySource; run: () => Promise<WorkPage>; map: (w: Work) => Work }
  const same = (w: Work) => w
  let asks: Ask[]
  if (qy.issn) {
    // Repositories type many journal deposits as data sets or "other"; filed under a journal's ISSN they are its articles.
    const asArticle = (w: Work): Work => (!w.type || w.type === 'dataset' || w.type === 'other' || w.type === 'text' ? { ...w, type: 'article' } : w)
    asks = [
      { name: 'Crossref', run: () => crossrefSearch(qy, signal), map: asCrossref },
      { name: 'DataCite', run: () => dataciteWorks(qy, signal), map: asArticle },
    ]
  } else if (qy.q.trim()) {
    const rq = { ...qy, perPage: EXTRA_PER_PAGE }
    asks = [
      { name: 'Crossref', run: () => crossrefSearch(rq, signal), map: asCrossref },
      { name: 'Zenodo', run: () => zenodoWorks(rq, signal), map: same },
      { name: 'DataCite', run: () => dataciteWorks(rq, signal), map: same },
    ]
  } else return Promise.resolve({ lists: [], totals: [], journal: false, failed: [], asked: [] })
  // Crossref has no open access flag, so an open-access-only page cannot use it.
  asks = asks.filter(a => a.name !== skip && !(qy.oa && a.name === 'Crossref'))
  const failed: RegistrySource[] = []
  const one = ({ name, run, map }: Ask) => Promise.race([
    run().then(p => ({ count: p.count, results: p.results.map(map).filter(keep) })),
    wait(timeout, signal).then(() => { throw new RegistryError(name, 0, true) }),
  ]).catch(e => {
    if ((e as Error).name === 'AbortError') throw e
    failed.push(name)
    return { count: 0, results: [] as Work[] }
  })
  return Promise.all(asks.map(one)).then(pages => ({
    lists: pages.map(p => p.results),
    totals: pages.map(p => p.count),
    journal: !!qy.issn,
    failed,
    asked: asks.map(a => a.name),
  }))
}

const doiKey = (doi: string | null | undefined) => doi?.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').toLowerCase() || null

/**
 * Which of these DOIs OpenAlex holds (within the journal, for a journal's listing): one cheap filter request per 50
 * DOIs. A record another registry returned that OpenAlex also holds belongs on whichever OpenAlex page ranks it,
 * so it is not added a second time. Null when OpenAlex could not be asked; the records are then added unchecked.
 */
async function openalexHas(dois: string[], source: string | undefined, issn: string | undefined, signal?: AbortSignal): Promise<Set<string> | null> {
  // "|" and "," separate values in an OpenAlex filter; a DOI containing one cannot be asked for.
  const ask = [...new Set(dois.filter(d => !/[|,]/.test(d)))]
  if (!ask.length) return new Set()
  const scope = source ? `,primary_location.source.id:${source}` : issn ? `,primary_location.source.issn:${issn}` : ''
  try {
    const chunks: string[][] = []
    for (let i = 0; i < ask.length; i += 50) chunks.push(ask.slice(i, i + 50))
    const pages = await Promise.all(chunks.map(c => get<{ results: { doi: string | null }[] }>(url('/works', {
      filter: `doi:${c.join('|')}${scope}`, select: 'doi', per_page: 50,
    }), signal)))
    return new Set(pages.flatMap(p => p.results.map(r => doiKey(r.doi)).filter((d): d is string => !!d)))
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e
    return null
  }
}

/**
 * Per registry, how many of the page's records it supplied, which registries did not answer, and for a journal's
 * listing each registry's total for the journal (a text search's totals are not comparable: Crossref matches
 * almost any word somewhere in its metadata).
 */
function sourcesOf(results: Work[], base: RegistrySource, baseCount: number, extras: Extras): WorkPage['sources'] {
  const n = (s: RegistrySource) => results.filter(w => (w.registry ?? base) === s).length
  const total = (s: RegistrySource) => !extras.journal ? undefined : s === base ? baseCount : extras.failed.includes(s) ? undefined : extras.totals[extras.asked.indexOf(s)]
  const names = [base, ...extras.asked.filter(s => s !== base)]
  // A journal's Zenodo deposits come through DataCite's answer.
  if (extras.journal && names.includes('DataCite') && !names.includes('Zenodo')) names.push('Zenodo')
  return names.map(s => ({ source: s, n: n(s), total: s === 'Zenodo' && extras.journal ? undefined : total(s), failed: extras.failed.includes(s) || undefined }))
}

async function withRegistries(page: WorkPage, extras: Extras, base: RegistrySource, qy: WorkQuery, source: string | undefined, signal?: AbortSignal): Promise<WorkPage> {
  let lists = extras.lists
  const onPage = new Set(page.results.map(w => doiKey(w.doi)).filter(Boolean))
  const candidates = lists.flat().map(w => doiKey(w.doi)).filter((d): d is string => !!d && !onPage.has(d))
  if (base === 'OpenAlex' && candidates.length) {
    const held = await openalexHas(candidates, source, qy.issn, signal)
    if (held) lists = lists.map(l => l.filter(w => !held.has(doiKey(w.doi) ?? '')))
  }
  const { results, added } = mergeRepositories(page.results, lists, qy.sort, extras.journal ? Infinity : undefined)
  // A journal's listing pages through whichever registry holds the most of its records.
  const count = extras.journal ? Math.max(page.count, ...extras.totals) : page.count
  return { ...page, count, results, repositories: added || undefined, sources: sourcesOf(results, base, page.count, extras) }
}

/** The OpenAlex source a journal's listing is filtered to, and the journal's article count in the journal directory. */
async function journalOf(issn: string | undefined, signal?: AbortSignal): Promise<{ source?: string; count?: number; basis?: 'openalex' | 'crossref' }> {
  if (!issn) return {}
  const p = await getJournalProfile(issn, signal).catch(e => { if ((e as Error).name === 'AbortError') throw e; return null })
  if (!p) return {}
  // The directory shows the daily OpenAlex works count, or the Crossref DOI count for a journal OpenAlex does not list.
  const count = p.w ?? p.cr
  return { source: p.oid, count, basis: p.w != null ? 'openalex' : p.cr != null ? 'crossref' : undefined }
}

export async function searchWorks(qy: WorkQuery, signal?: AbortSignal): Promise<WorkPage> {
  // A DOI is looked up, not searched for: getWork asks the registry that holds it when OpenAlex does not have it.
  const doi = extractDoi(qy.q)
  if (doi) {
    try {
      const w = await getWork(doi, signal)
      const shown = qy.page === 1 && (!qy.type?.length || (!!w.type && qy.type.includes(w.type))) && (!qy.oa || w.open_access.is_oa)
      return { count: shown ? 1 : 0, results: shown ? [w] : [] }
    } catch (e) {
      if (e instanceof RegistryError && e.status === 404) return { count: 0, results: [] }
      throw e
    }
  }
  const journal = await journalOf(qy.issn, signal)
  const extras = registryWorks(qy, signal)
  try {
    const page = await openalexSearch(qy, journal.source, signal)
    return { ...(await withRegistries(page, await extras, 'OpenAlex', qy, journal.source, signal)), journalCount: journal.count, journalBasis: journal.basis }
  } catch (e) {
    if (e instanceof RegistryError && e.busy) {
      try {
        const base = await crossrefSearch(qy, signal)
        const rest = await registryWorks(qy, signal, 'Crossref')
        return { ...(await withRegistries(base, rest, 'Crossref', qy, journal.source, signal)), viaWhy: e.kind, journalCount: journal.count, journalBasis: journal.basis }
      } catch (ce) {
        if ((ce as Error).name === 'AbortError') throw ce
        // Zenodo's search has no ISSN field; DataCite's answers a journal's listing.
        const attempts = qy.issn ? [() => dataciteWorks(qy, signal)] : [() => dataciteWorks(qy, signal), () => zenodoWorks(qy, signal)]
        return { ...(await firstAnswer(attempts, e)), viaWhy: e.kind, journalCount: journal.count, journalBasis: journal.basis }
      }
    }
    throw e
  }
}

async function openalexSearch(qy: WorkQuery, source: string | undefined, signal?: AbortSignal): Promise<WorkPage> {
  const sort = qy.sort === 'newest' ? 'publication_date:desc' : qy.sort === 'cited' ? 'cited_by_count:desc' : qy.q ? 'relevance_score:desc' : 'publication_date:desc'
  const j = await get<{ meta: { count: number }; results: Work[] }>(url('/works', {
    search: qy.q || undefined,
    filter: filters(qy, source) || undefined,
    sort,
    page: qy.page,
    per_page: qy.perPage,
    select: SELECT,
  }), signal)
  return { count: j.meta.count, results: j.results }
}

/** Counts per work type for the current query (one extra request). */
export async function typeFacets(qy: WorkQuery, signal?: AbortSignal): Promise<Facet[]> {
  const { source } = await journalOf(qy.issn, signal)
  const j = await get<{ group_by: { key: string; key_display_name: string; count: number }[] }>(url('/works', {
    search: qy.q || undefined,
    filter: filters({ ...qy, type: undefined }, source) || undefined,
    group_by: 'type',
    per_page: 20,
  }), signal)
  return j.group_by.map(g => ({ key: g.key.replace('https://openalex.org/types/', ''), label: g.key_display_name, count: g.count }))
}

export async function getWork(id: string, signal?: AbortSignal): Promise<Work> {
  const doi = /^10\./.test(id)
  const key = doi ? `doi:${id}` : id.replace('https://openalex.org/', '')
  let w: Work
  try {
    w = await get<Work>(url(`/works/${encodeURIComponent(key)}`, { select: SELECT }), signal)
  } catch (e) {
    // A DOI can still be resolved through its registry while OpenAlex is busy, or when OpenAlex has not
    // indexed it yet (new Zenodo and other repository DOIs often are not). Other IDs have no fallback.
    if (!doi || !(e instanceof RegistryError) || !(e.busy || e.status === 404)) throw e
    // Ask doi.org which agency registered the DOI and query only that registry; if doi.org does not
    // answer, try every registry in turn.
    const agency = await registrationAgency(id, getJson, signal)
    const attempts = registriesFor(id, agency).map(reg => () => reg === 'Crossref'
      ? fetchJson<{ message: CrItem }>(crUrl(`/works/${encodeURIComponent(id)}`, {}), 'Crossref', signal).then(j => crToWork(j.message))
      : recordByDoi(reg, id, getJson, signal).then(recordToWork))
    return firstAnswer(attempts, e)
  }
  const d = doi ? id : doiOf(w)
  return d && w.publication_year != null && !plausibleYear(w.publication_year) ? withCrossrefYear(w, d, signal) : w
}

/**
 * OpenAlex sometimes carries an impossible year ("2203" for a 2003 article). Take the date Crossref
 * registered for the DOI instead; when that is no better, drop the year so citations read "n.d.".
 */
async function withCrossrefYear(w: Work, doi: string, signal?: AbortSignal): Promise<Work> {
  try {
    const cr = crToWork((await fetchJson<{ message: CrItem }>(crUrl(`/works/${encodeURIComponent(doi)}`, {}), 'Crossref', signal)).message)
    if (plausibleYear(cr.publication_year)) return { ...w, publication_year: cr.publication_year, publication_date: cr.publication_date }
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e
  }
  return { ...w, publication_year: null, publication_date: null }
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

/** Data sets and software (mostly from DataCite / Zenodo) are exported as such, not as journal articles. */
export function resourceOf(w: Work): { bibtex: string; ris: string; apa: string } | null {
  if (w.type === 'dataset') return { bibtex: 'misc', ris: 'DATA', apa: 'Data set' }
  if (w.type === 'software') return { bibtex: 'misc', ris: 'COMP', apa: 'Computer software' }
  return null
}

export function toBibtex(w: Work): string {
  const first = authorsList(w)[0]?.split(' ').pop()?.replace(/[^A-Za-z]/g, '') || 'anon'
  const key = `${first}${w.publication_year ?? ''}${shortId(w).slice(-4)}`
  const f: [string, string | null | undefined][] = [
    ['title', w.title], ['author', authorsList(w).join(' and ')], [resourceOf(w) ? 'publisher' : 'journal', w.primary_location?.source?.display_name],
    ['year', w.publication_year?.toString()], ['volume', w.biblio?.volume], ['number', w.biblio?.issue],
    ['pages', pages(w)?.replace('-', '--')], ['doi', doiOf(w)], ['url', w.doi ?? w.id],
  ]
  return `@${resourceOf(w)?.bibtex ?? 'article'}{${key},\n${f.filter(([, v]) => v).map(([k, v]) => `  ${k} = {${v}}`).join(',\n')}\n}`
}

export function toRis(w: Work): string {
  const lines = [`TY  - ${resourceOf(w)?.ris ?? 'JOUR'}`]
  if (w.title) lines.push(`TI  - ${w.title}`)
  for (const a of authorsList(w)) lines.push(`AU  - ${a}`)
  if (w.primary_location?.source?.display_name) lines.push(`${resourceOf(w) ? 'PB' : 'JO'}  - ${w.primary_location.source.display_name}`)
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
