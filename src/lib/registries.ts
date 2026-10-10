// Shared adapters for the DOI registries behind publication search, publication pages and the citation
// generator. Each adapter knows one registry's URLs and field names and returns a neutral
// RegistryRecord; the callers (openalex.ts -> Work, cite-sources.ts -> Article) only convert that record
// into their own shape, so a registry's quirks live in exactly one place.
//
// The transport is injected (GetJson): openalex.ts brings session caching, retries and a rate-limit block,
// cite-sources.ts brings its own retry, and both throw RegistryError on a failed request.
//
// registrationAgency() asks doi.org which agency registered a DOI, so a lookup goes straight to the right
// registry instead of trying them in turn and collecting 404s.

export class RegistryError extends Error {
  constructor(readonly service: string, readonly status: number) {
    super(`${service} ${status || 'unreachable'}`)
  }
  /** Worth trying another registry (or the same one later): unreachable, rate limited or failing. */
  get busy() { return this.status === 0 || this.status === 429 || this.status >= 500 }
}

export type GetJson = (url: string, service: string, signal?: AbortSignal) => Promise<unknown>

export type RegistryName = 'Crossref' | 'DataCite' | 'Zenodo'

export interface RegistryRecord {
  source: 'datacite' | 'zenodo'
  doi: string
  title: string | null
  creators: { name: string; given: string | null; family: string | null; orcid: string | null; affiliations: string[] }[]
  publisher: string | null
  year: number | null
  date: string | null
  /** Neutral work type, the same vocabulary as OpenAlex: article, preprint, dataset, book, ... */
  kind: string | null
  /** The registry's own wording for the type (e.g. "Journal contribution"), for display. */
  kindLabel: string | null
  abstract: string | null
  keywords: string[]
  /** Short label such as "CC BY 4.0", or the registry's own text. */
  license: string | null
  licenseUrl: string | null
  openAccess: boolean
  url: string | null
  pdfUrl: string | null
  container: { title: string | null; volume: string | null; issue: string | null; firstPage: string | null; lastPage: string | null }
  language: string | null
  citations: number
  references: number
}

export interface RecordQuery {
  q: string
  page: number
  perPage: number
  sort: 'relevance' | 'newest' | 'cited'
  from?: string
  to?: string
  /** neutral work types (see RegistryRecord.kind) */
  type?: string[]
  oa?: boolean
}

export interface RecordPage { count: number; records: RegistryRecord[] }

// ---- helpers ----

export function plainText(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

/** word -> positions, the shape OpenAlex uses for abstracts. */
export function invertedIndex(text: string | null | undefined): Record<string, number[]> | null {
  if (!text) return null
  const inv: Record<string, number[]> = {}
  text.split(' ').forEach((w, i) => { if (w) (inv[w] ??= []).push(i) })
  return Object.keys(inv).length ? inv : null
}

const ORCID_URL = /^https?:\/\/orcid\.org\//i

function licenseLabel(url: string | null | undefined, rights: string | null | undefined, id?: string | null): string | null {
  const m = (url ?? '').match(/creativecommons\.org\/licenses\/([a-z-]+)\/([\d.]+)/i)
  if (m) return `CC ${m[1].toUpperCase()} ${m[2]}`
  if (/creativecommons\.org\/publicdomain\/zero/i.test(url ?? '')) return 'CC0 1.0'
  if (id && /^cc-/i.test(id)) {
    const parts = id.toUpperCase().split('-') // CC-BY-4.0
    return `CC ${parts.slice(1, -1).join('-')} ${parts[parts.length - 1]}`
  }
  return rights || id || url || null
}

const OPEN_LICENSE = /creativecommons|cc0|\bcc-|open ?access|public ?domain/i

function pdfLike(url: string | null | undefined): boolean {
  return /\.pdf($|\?)/i.test(url ?? '')
}

// ---- DataCite: Zenodo, figshare, Dryad, arXiv, OSF, institutional repositories, ... ----

const DATACITE = 'https://api.datacite.org'

interface DcAttrs {
  doi: string
  titles?: { title?: string }[]
  creators?: {
    name?: string; givenName?: string; familyName?: string
    affiliation?: (string | { name?: string })[]
    nameIdentifiers?: { nameIdentifier?: string; nameIdentifierScheme?: string }[]
  }[]
  publisher?: string | { name?: string } | null
  publicationYear?: number | null
  descriptions?: { description?: string; descriptionType?: string }[]
  subjects?: { subject?: string }[]
  rightsList?: { rights?: string; rightsUri?: string; rightsIdentifier?: string }[]
  types?: { resourceTypeGeneral?: string; resourceType?: string }
  container?: { title?: string; volume?: string; issue?: string; firstPage?: string; lastPage?: string }
  language?: string | null
  url?: string | null
  citationCount?: number
  referenceCount?: number
  published?: string
}

const DC_KIND: Record<string, string> = {
  JournalArticle: 'article', ConferencePaper: 'article', Preprint: 'preprint', Dataset: 'dataset', Book: 'book',
  BookChapter: 'book-chapter', Dissertation: 'dissertation', Report: 'report', Software: 'software',
  PeerReview: 'peer-review', Standard: 'standard',
}

function fromDataCite(a: DcAttrs): RegistryRecord {
  const abs = a.descriptions?.find(d => d.descriptionType === 'Abstract') ?? a.descriptions?.[0]
  const rights = a.rightsList?.[0]
  const year = a.publicationYear ?? null
  const publisher = typeof a.publisher === 'string' ? a.publisher : a.publisher?.name ?? null
  const general = a.types?.resourceTypeGeneral ?? null
  const open = !!rights && OPEN_LICENSE.test(`${rights.rightsUri ?? ''} ${rights.rightsIdentifier ?? ''} ${rights.rights ?? ''}`)
  return {
    source: 'datacite',
    doi: a.doi,
    title: a.titles?.[0]?.title ?? null,
    creators: (a.creators ?? []).map(c => {
      const orcid = c.nameIdentifiers?.find(n => /orcid/i.test(`${n.nameIdentifierScheme} ${n.nameIdentifier}`))?.nameIdentifier
      return {
        name: c.name ?? [c.givenName, c.familyName].filter(Boolean).join(' '),
        given: c.givenName ?? null,
        family: c.familyName ?? null,
        orcid: orcid ? orcid.replace(ORCID_URL, '') : null,
        affiliations: (c.affiliation ?? []).map(x => (typeof x === 'string' ? x : x.name ?? '')).filter(Boolean),
      }
    }),
    publisher,
    year,
    date: a.published ?? (year ? String(year) : null),
    kind: general ? DC_KIND[general] ?? general.toLowerCase() : null,
    kindLabel: a.types?.resourceType || general,
    abstract: abs?.description ? plainText(abs.description) : null,
    keywords: (a.subjects ?? []).map(s => s.subject ?? '').filter(Boolean),
    license: licenseLabel(rights?.rightsUri, rights?.rights, rights?.rightsIdentifier),
    licenseUrl: rights?.rightsUri ?? null,
    openAccess: open,
    url: a.url ?? null,
    pdfUrl: pdfLike(a.url) ? a.url ?? null : null,
    container: {
      title: a.container?.title || null, volume: a.container?.volume ?? null, issue: a.container?.issue ?? null,
      firstPage: a.container?.firstPage ?? null, lastPage: a.container?.lastPage ?? null,
    },
    language: a.language ?? null,
    citations: a.citationCount ?? 0,
    references: a.referenceCount ?? 0,
  }
}

function dcUrl(path: string, params: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') sp.set(k, String(v))
  return `${DATACITE}${path}?${sp}`
}

export async function dataciteRecord(doi: string, getJson: GetJson, signal?: AbortSignal): Promise<RegistryRecord> {
  const j = await getJson(dcUrl(`/dois/${encodeURIComponent(doi)}`, {}), 'DataCite', signal) as { data?: { attributes?: DcAttrs } }
  if (!j.data?.attributes?.doi) throw new RegistryError('DataCite', 404)
  return fromDataCite(j.data.attributes)
}

export async function dataciteSearch(qy: RecordQuery, getJson: GetJson, signal?: AbortSignal): Promise<RecordPage> {
  const clauses: string[] = []
  const text = qy.q.replace(/[\\[\]{}()^~:"/!]/g, ' ').trim()
  if (text) clauses.push(`(${text})`)
  if (qy.from || qy.to) clauses.push(`publicationYear:[${qy.from?.slice(0, 4) || '*'} TO ${qy.to?.slice(0, 4) || '*'}]`)
  if (qy.type?.length) {
    const general = Object.entries(DC_KIND).filter(([, v]) => qy.type!.includes(v)).map(([k]) => k)
    if (general.length) clauses.push(`types.resourceTypeGeneral:(${general.join(' OR ')})`)
  }
  const sort = qy.sort === 'cited' ? '-citation' : qy.sort === 'newest' || !qy.q ? '-created' : undefined
  const j = await getJson(dcUrl('/dois', {
    query: clauses.join(' AND ') || undefined,
    sort,
    'page[size]': qy.perPage,
    'page[number]': qy.page,
    // Records without a title (placeholders, versions without metadata) are of no use in a result list.
    'has-title': 'true',
  }), 'DataCite', signal) as { meta: { total: number }; data: { attributes: DcAttrs }[] }
  return { count: j.meta.total, records: j.data.map(d => fromDataCite(d.attributes)) }
}

// ---- Zenodo: its own records (richer files and licences; anonymous page size is capped at 25) ----

const ZENODO = 'https://zenodo.org/api'
export const ZENODO_MAX_PAGE = 25

interface ZenRecord {
  id: number | string
  doi?: string
  links?: { self_html?: string }
  files?: { key?: string; links?: { self?: string } }[]
  metadata: {
    title?: string
    description?: string
    publication_date?: string
    resource_type?: { type?: string; subtype?: string; title?: string }
    creators?: { name?: string; orcid?: string; affiliation?: string }[]
    keywords?: string[]
    license?: { id?: string }
    access_right?: string
    language?: string
    journal?: { title?: string; volume?: string; issue?: string; pages?: string }
  }
}

const ZEN_SUBTYPE: Record<string, string> = { article: 'article', preprint: 'preprint', book: 'book', section: 'book-chapter', report: 'report', thesis: 'dissertation' }

function zenodoKind(rt: ZenRecord['metadata']['resource_type']): string | null {
  if (!rt?.type) return null
  if (rt.type === 'publication') return ZEN_SUBTYPE[rt.subtype ?? ''] ?? 'other'
  return rt.type
}

/** Zenodo writes creators as "Family, Given"; affiliations of one creator are joined with "|". */
function zenodoName(raw: string | undefined): { name: string; given: string | null; family: string | null } {
  const name = raw ?? ''
  if (!name.includes(',')) return { name, given: null, family: null }
  const [family, ...rest] = name.split(',')
  const given = rest.join(',').trim()
  return { name: [given, family.trim()].filter(Boolean).join(' '), given: given || null, family: family.trim() || null }
}

function fromZenodo(r: ZenRecord): RegistryRecord {
  const m = r.metadata
  const date = m.publication_date ?? null
  const [first, last] = (m.journal?.pages ?? '').split(/\s*[-–—]+\s*/)
  const open = m.access_right === 'open'
  const landing = r.links?.self_html ?? `https://zenodo.org/records/${r.id}`
  return {
    source: 'zenodo',
    doi: r.doi ?? '',
    title: m.title ?? null,
    creators: (m.creators ?? []).map(c => ({
      ...zenodoName(c.name),
      orcid: c.orcid ?? null,
      affiliations: (c.affiliation ? c.affiliation.split('|') : []).map(x => x.trim()).filter(Boolean),
    })),
    publisher: 'Zenodo',
    year: date ? Number(date.slice(0, 4)) || null : null,
    date,
    kind: zenodoKind(m.resource_type),
    kindLabel: m.resource_type?.title ?? null,
    abstract: m.description ? plainText(m.description) : null,
    keywords: m.keywords ?? [],
    license: licenseLabel(null, null, m.license?.id),
    licenseUrl: null,
    openAccess: open,
    url: landing,
    pdfUrl: open ? r.files?.find(f => /\.pdf$/i.test(f.key ?? ''))?.links?.self ?? null : null,
    container: { title: m.journal?.title ?? null, volume: m.journal?.volume ?? null, issue: m.journal?.issue ?? null, firstPage: first || null, lastPage: last || null },
    language: m.language ?? null,
    citations: 0,
    references: 0,
  }
}

export function isZenodoDoi(doi: string): boolean {
  return /^10\.\d+\/zenodo\.\d+$/i.test(doi)
}

export async function zenodoRecord(doi: string, getJson: GetJson, signal?: AbortSignal): Promise<RegistryRecord> {
  const id = doi.match(/^10\.\d+\/zenodo\.(\d+)$/i)?.[1]
  if (!id) throw new RegistryError('Zenodo', 404)
  return fromZenodo(await getJson(`${ZENODO}/records/${id}`, 'Zenodo', signal) as ZenRecord)
}

export async function zenodoSearch(qy: RecordQuery, getJson: GetJson, signal?: AbortSignal): Promise<RecordPage> {
  const q = [qy.q, ...(qy.from || qy.to ? [`publication_date:[${qy.from || '*'} TO ${qy.to || '*'}]`] : [])].filter(Boolean).join(' AND ')
  const sp = new URLSearchParams({
    size: String(Math.min(qy.perPage, ZENODO_MAX_PAGE)),
    page: String(qy.page),
    sort: qy.sort === 'relevance' && qy.q ? 'bestmatch' : 'mostrecent',
  })
  if (q) sp.set('q', q)
  if (qy.oa) sp.set('access_right', 'open')
  const j = await getJson(`${ZENODO}/records?${sp}`, 'Zenodo', signal) as { hits: { total: number; hits: ZenRecord[] } }
  return { count: j.hits.total, records: j.hits.hits.map(fromZenodo) }
}

// ---- Which agency registered this DOI? ----

/**
 * doi.org's doiRA service. One request can carry many comma-separated DOIs (DOIs that themselves contain a
 * comma must be asked singly). A DOI that does not exist, or an agency this app does not query, maps to the
 * agency's name or null; a failed request leaves the DOI out of the result, which callers treat as "unknown"
 * and answer with the full registry list.
 */
export type Agency = 'Crossref' | 'DataCite' | (string & {}) | null

const agencyCache = new Map<string, Agency>()
const RA_CHUNK = 50

export async function registrationAgencies(dois: string[], getJson: GetJson, signal?: AbortSignal): Promise<Map<string, Agency>> {
  const out = new Map<string, Agency>()
  const todo: string[] = []
  for (const d of new Set(dois)) {
    const key = d.toLowerCase()
    if (agencyCache.has(key)) out.set(key, agencyCache.get(key)!)
    else todo.push(d)
  }
  const batches: string[][] = []
  const single = todo.filter(d => d.includes(','))
  const multi = todo.filter(d => !d.includes(','))
  for (let i = 0; i < multi.length; i += RA_CHUNK) batches.push(multi.slice(i, i + RA_CHUNK))
  for (const d of single) batches.push([d])
  await Promise.all(batches.map(async batch => {
    try {
      const rows = await getJson(`https://doi.org/doiRA/${batch.map(encodeURIComponent).join(',')}`, 'doi.org', signal) as { DOI: string; RA?: string }[]
      for (const row of rows) {
        const agency: Agency = row.RA ?? null // no RA: the DOI does not exist
        if (agency) agencyCache.set(row.DOI.toLowerCase(), agency) // a missing DOI may be registered a minute later
        out.set(row.DOI.toLowerCase(), agency)
      }
    } catch (e) {
      if ((e as Error).name === 'AbortError') throw e
      /* unknown: left out */
    }
  }))
  return out
}

export async function registrationAgency(doi: string, getJson: GetJson, signal?: AbortSignal): Promise<Agency | undefined> {
  return (await registrationAgencies([doi], getJson, signal)).get(doi.toLowerCase())
}

/**
 * Registries to ask for a DOI, best first, given its agency (undefined = could not be determined).
 *  - Crossref DOI: Crossref only.
 *  - DataCite DOI: Zenodo's own record first when it is a Zenodo DOI, then DataCite.
 *  - another agency (mEDRA, JaLC, CNKI, ...) or a DOI that does not exist: none; OpenAlex is the only source.
 *  - unknown: all of them, as a registry-blind cascade.
 */
export function registriesFor(doi: string, agency: Agency | undefined): RegistryName[] {
  if (agency === undefined) return isZenodoDoi(doi) ? ['Crossref', 'Zenodo', 'DataCite'] : ['Crossref', 'DataCite']
  if (agency === 'Crossref') return ['Crossref']
  if (agency === 'DataCite') return isZenodoDoi(doi) ? ['Zenodo', 'DataCite'] : ['DataCite']
  return []
}

export function recordByDoi(registry: 'DataCite' | 'Zenodo', doi: string, getJson: GetJson, signal?: AbortSignal): Promise<RegistryRecord> {
  return registry === 'Zenodo' ? zenodoRecord(doi, getJson, signal) : dataciteRecord(doi, getJson, signal)
}
