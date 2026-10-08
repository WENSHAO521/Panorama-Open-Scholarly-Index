// Metadata lookups for the citation generator (/cite/), in the visitor's
// browser: DOIs via Crossref (OpenAlex as a fallback), books by ISBN via
// Open Library, Crossref and Google Books. All of these allow cross-origin requests.

import type { Article } from './types'

const CROSSREF = 'https://api.crossref.org'
const OPENALEX = 'https://api.openalex.org'
const MAILTO = 'posi@panorama-sg.com'

interface CrossrefAuthor {
  given?: string
  family?: string
  ORCID?: string
  sequence?: string
  affiliation?: { name: string; id?: { id: string; 'id-type': string }[] }[]
}

interface CrossrefWork {
  DOI: string
  title: string | string[]
  'container-title': string | string[]
  ISSN?: string[]
  author?: CrossrefAuthor[]
  abstract?: string
  license?: { URL: string }[]
  link?: { URL: string; 'content-type': string }[]
  resource?: { primary?: { URL: string } }
  volume?: string
  issue?: string
  page?: string
  type?: string
  'reference-count'?: number
  'is-referenced-by-count'?: number
  'published-online'?: { 'date-parts': number[][] }
  issued?: { 'date-parts': number[][] }
  created?: { 'date-time': string }
  deposited?: { 'date-time': string }
}

/** fetch that waits and retries on 429/503 (Crossref rate limits), up to 3 times. */
async function fetchRetry(url: string, timeoutMs: number): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) })
    if ((res.status !== 429 && res.status !== 503) || attempt >= 3) return res
    const wait = Number(res.headers.get('retry-after')) || 0
    await new Promise(r => setTimeout(r, Math.min(Math.max(wait * 1000, 1000 * 2 ** attempt), 8000)))
  }
}

function stripJats(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function reconstructAbstract(idx: Record<string, number[]> | null | undefined): string | null {
  if (!idx) return null
  const words: string[] = []
  for (const [word, positions] of Object.entries(idx)) {
    for (const pos of positions) words[pos] = word
  }
  return words.filter(Boolean).join(' ') || null
}

function calcMqs(item: CrossrefWork): number {
  let score = 0
  if (item.DOI) score += 20
  if (item.abstract) score += 20
  if (item.author?.some(a => !!a.ORCID)) score += 15
  if (item.author?.some(a => a.affiliation?.some(af => af.id?.length))) score += 15
  if ((item['reference-count'] ?? 0) > 0) score += 15
  if (item.license?.length) score += 10
  score += 5 // all PSG articles are OA
  return Math.min(score, 100)
}

function parseLicense(item: CrossrefWork): string | null {
  const url = item.license?.[0]?.URL
  if (!url) return null
  if (url.includes('/by/')) return 'CC BY 4.0'
  if (url.includes('/by-nc/')) return 'CC BY-NC 4.0'
  if (url.includes('/by-nc-nd/')) return 'CC BY-NC-ND 4.0'
  if (url.includes('/by-sa/')) return 'CC BY-SA 4.0'
  return url
}

function mapCrossrefWork(item: CrossrefWork): Article {

  const rawTitle = item.title
  const title = Array.isArray(rawTitle) ? rawTitle[0] : (rawTitle ?? '')

  const rawJt = item['container-title']
  const journalTitle = Array.isArray(rawJt) ? rawJt[0] : (rawJt ?? '')

  const dateParts = (item['published-online'] ?? item.issued)?.['date-parts']?.[0] ?? []
  const year = dateParts[0] ?? new Date().getFullYear()
  const pubDate =
    dateParts.length >= 3
      ? `${dateParts[0]}-${String(dateParts[1]).padStart(2, '0')}-${String(dateParts[2]).padStart(2, '0')}`
      : dateParts[0]
        ? String(dateParts[0])
        : null

  const pageStr = item.page ?? ''
  const dash = pageStr.indexOf('-')
  const firstPage = dash > -1 ? pageStr.slice(0, dash) : pageStr || null
  const lastPage = dash > -1 ? pageStr.slice(dash + 1) : null

  return {
    id: item.DOI,
    doi: item.DOI,
    title,
    subtitle: null,
    journal_id: '',
    journal_title: journalTitle,
    journal_code: '',
    volume: item.volume ?? null,
    issue: item.issue ?? null,
    first_page: firstPage,
    last_page: lastPage,
    publication_year: year,
    publication_date: pubDate,
    article_type: item.type === 'journal-article' ? 'Research Article' : (item.type ?? 'Article'),
    language: 'English',
    abstract: item.abstract ? stripJats(item.abstract) : null,
    keywords: [],
    license: parseLicense(item),
    pdf_url: item.link?.find(l => l['content-type'] === 'application/pdf')?.URL ?? null,
    html_url: item.resource?.primary?.URL ?? null,
    openalex_work_id: null,
    crossref_status: 'verified',
    cited_by_count: item['is-referenced-by-count'] ?? 0,
    reference_count: item['reference-count'] ?? 0,
    is_retracted: false,
    metadata_quality_score: calcMqs(item),
    authors: (item.author ?? []).map((a, i) => ({
      id: a.ORCID ?? `${item.DOI}-au-${i}`,
      display_name: [a.given, a.family].filter(Boolean).join(' '),
      given_name: a.given ?? null,
      family_name: a.family ?? null,
      orcid: a.ORCID ? a.ORCID.replace('https://orcid.org/', '') : null,
      openalex_author_id: null,
      country: null,
      institution: a.affiliation?.[0]?.name ?? null,
      is_corresponding: a.sequence === 'first',
      author_order: i + 1,
    })),
    created_at: item.created?.['date-time'] ?? '',
    updated_at: item.deposited?.['date-time'] ?? '',
  }
}

export async function crossrefGetWork(doi: string): Promise<Article | null> {
  try {
    const res = await fetchRetry(`${CROSSREF}/works/${encodeURIComponent(doi)}?mailto=${MAILTO}`, 15000)
    if (!res.ok) return null
    const data = await res.json()
    return mapCrossrefWork(data.message)
  } catch {
    return null
  }
}

const DOI_CHUNK = 40

/**
 * Many DOIs at once: Crossref filters `doi:a,doi:b,...`, DOI_CHUNK per request, a few requests in
 * parallel. Returns a map keyed by lower-case DOI; DOIs Crossref does not return are simply absent.
 */
export async function crossrefGetWorks(
  dois: string[],
  onChunk?: (found: number) => void,
): Promise<Map<string, Article>> {
  const out = new Map<string, Article>()
  const usable = dois.filter(d => !d.includes(','))
  const chunks: string[][] = []
  for (let i = 0; i < usable.length; i += DOI_CHUNK) chunks.push(usable.slice(i, i + DOI_CHUNK))
  let next = 0
  async function worker() {
    while (next < chunks.length) {
      const chunk = chunks[next++]
      try {
        const filter = chunk.map(d => `doi:${encodeURIComponent(d)}`).join(',')
        const res = await fetchRetry(`${CROSSREF}/works?filter=${filter}&rows=${chunk.length}&mailto=${MAILTO}`, 30000)
        if (res.ok) {
          const items = ((await res.json()) as { message?: { items?: CrossrefWork[] } }).message?.items ?? []
          for (const it of items) out.set(it.DOI.toLowerCase(), mapCrossrefWork(it))
        }
      } catch { /* these DOIs are retried one by one by the caller */ }
      onChunk?.(out.size)
    }
  }
  await Promise.all(Array.from({ length: Math.min(3, chunks.length) }, worker))
  return out
}

/** Best Crossref match for a free-text reference (no DOI known). The caller must verify the hit. */
export async function crossrefSearch(query: string): Promise<Article | null> {
  try {
    const res = await fetchRetry(`${CROSSREF}/works?query.bibliographic=${encodeURIComponent(query.slice(0, 500))}&rows=1&mailto=${MAILTO}`, 20000)
    if (!res.ok) return null
    const item = ((await res.json()) as { message?: { items?: CrossrefWork[] } }).message?.items?.[0]
    return item ? mapCrossrefWork(item) : null
  } catch {
    return null
  }
}

/** Top Crossref matches for a title / author / keyword query, for the user to pick from. */
export async function crossrefSearchMany(query: string, rows = 6): Promise<Article[]> {
  try {
    const res = await fetchRetry(`${CROSSREF}/works?query.bibliographic=${encodeURIComponent(query.slice(0, 500))}&rows=${rows}&mailto=${MAILTO}`, 20000)
    if (!res.ok) return []
    const items = ((await res.json()) as { message?: { items?: CrossrefWork[] } }).message?.items ?? []
    return items.map(mapCrossrefWork).filter(a => a.title)
  } catch {
    return []
  }
}

interface OpenAlexWork {
  id: string
  doi: string | null
  title: string | null
  publication_year: number | null
  publication_date: string | null
  type: string | null
  language: string | null
  is_retracted: boolean
  cited_by_count: number
  referenced_works_count: number
  abstract_inverted_index: Record<string, number[]> | null
  biblio: { volume?: string; issue?: string; first_page?: string; last_page?: string } | null
  primary_location: {
    source?: { display_name?: string; issn_l?: string; issn?: string[] } | null
    landing_page_url?: string | null
  } | null
  open_access: { oa_url?: string | null; oa_status?: string } | null
  authorships: Array<{
    author: { id?: string; display_name?: string; orcid?: string | null } | null
    institutions: Array<{ display_name?: string }> | null
    countries: string[] | null
    is_corresponding: boolean
  }>
  keywords: Array<{ display_name: string }> | null
}

function mapOpenAlexWork(work: OpenAlexWork): Article {
  const rawDoi = work.doi?.replace('https://doi.org/', '') ?? ''
  const abstract = reconstructAbstract(work.abstract_inverted_index)

  let mqs = 20
  if (rawDoi)   mqs += 20
  if (abstract) mqs += 20
  if (work.authorships?.some(a => a.author?.orcid)) mqs += 15
  if (work.authorships?.some(a => (a.institutions ?? []).length > 0)) mqs += 10
  if ((work.referenced_works_count ?? 0) > 0) mqs += 10
  if (work.open_access?.oa_url) mqs += 5

  return {
    id: rawDoi || work.id,
    doi: rawDoi,
    title: work.title ?? '',
    subtitle: null,
    journal_id: '',
    journal_title: work.primary_location?.source?.display_name ?? '',
    journal_code: '',
    volume: work.biblio?.volume ?? null,
    issue: work.biblio?.issue ?? null,
    first_page: work.biblio?.first_page ?? null,
    last_page: work.biblio?.last_page ?? null,
    publication_year: work.publication_year ?? new Date().getFullYear(),
    publication_date: work.publication_date ?? null,
    article_type: work.type === 'article' ? 'Research Article' : (work.type ?? 'Article'),
    language: work.language ?? 'English',
    abstract,
    keywords: (work.keywords ?? []).map(k => k.display_name),
    license: work.open_access?.oa_status === 'gold' || work.open_access?.oa_status === 'diamond'
      ? 'Open Access' : null,
    pdf_url: work.open_access?.oa_url ?? null,
    html_url: work.primary_location?.landing_page_url ?? null,
    openalex_work_id: work.id,
    crossref_status: rawDoi ? 'registered' : null,
    cited_by_count: work.cited_by_count ?? 0,
    reference_count: work.referenced_works_count ?? 0,
    is_retracted: work.is_retracted ?? false,
    metadata_quality_score: Math.min(mqs, 100),
    authors: (work.authorships ?? []).map((a, i) => ({
      id: a.author?.id ?? `${work.id}-au-${i}`,
      display_name: a.author?.display_name ?? '',
      given_name: null,
      family_name: null,
      orcid: a.author?.orcid?.replace('https://orcid.org/', '') ?? null,
      openalex_author_id: a.author?.id ?? null,
      country: a.countries?.[0] ?? null,
      institution: a.institutions?.[0]?.display_name ?? null,
      is_corresponding: a.is_corresponding ?? i === 0,
      author_order: i + 1,
    })),
    created_at: work.publication_date ?? '',
    updated_at: work.publication_date ?? '',
  }
}

const OA_SELECT = [
  'id', 'doi', 'title', 'publication_year', 'publication_date', 'type', 'language',
  'is_retracted', 'cited_by_count', 'referenced_works_count', 'abstract_inverted_index',
  'biblio', 'primary_location', 'open_access', 'authorships', 'keywords',
].join(',')


/** Full Article from OpenAlex, used when Crossref has no record for the DOI. */
export async function openAlexGetArticle(doi: string): Promise<Article | null> {
  try {
    const params = new URLSearchParams({ select: OA_SELECT, mailto: MAILTO })
    const res = await fetch(`${OPENALEX}/works/https://doi.org/${encodeURIComponent(doi)}?${params}`, { signal: AbortSignal.timeout(15000) })
    if (!res.ok) return null
    return mapOpenAlexWork(await res.json())
  } catch {
    return null
  }
}

export interface BookInfo {
  title: string
  subtitle?: string
  authors: string[]
  year: string | null
  publisher: string | null
  place: string | null
  isbn: string
  source?: string
}

// Open Library edition record (/isbn/<isbn>.json): edition-level title,
// publisher, date and place. Author names need one request per author key.
async function fetchBookOl(clean: string): Promise<BookInfo | null> {
  try {
    const res = await fetch(`https://openlibrary.org/isbn/${clean}.json`, { signal: AbortSignal.timeout(10000) })
    if (!res.ok) return null
    const ed = await res.json() as {
      title?: string; subtitle?: string; publishers?: string[]; publish_date?: string
      publish_places?: string[]; authors?: { key: string }[]; by_statement?: string
    }
    if (!ed.title) return null
    const authors = (await Promise.all((ed.authors ?? []).slice(0, 8).map(async a => {
      try {
        const r = await fetch(`https://openlibrary.org${a.key}.json`, { signal: AbortSignal.timeout(8000) })
        return r.ok ? ((await r.json()) as { name?: string }).name ?? null : null
      } catch { return null }
    }))).filter((n): n is string => !!n)
    // Many edition records carry no author keys; the search index has names per work.
    if (!authors.length) {
      try {
        const r = await fetch(`https://openlibrary.org/search.json?isbn=${clean}&fields=author_name`, { signal: AbortSignal.timeout(8000) })
        if (r.ok) authors.push(...(((await r.json()) as { docs?: { author_name?: string[] }[] }).docs?.[0]?.author_name ?? []).slice(0, 8))
      } catch { /* keep by_statement fallback */ }
    }
    return {
      title: ed.title,
      subtitle: ed.subtitle,
      authors: authors.length ? authors : ed.by_statement ? [ed.by_statement.replace(/^by\s+/i, '').replace(/\.$/, '')] : [],
      year: ed.publish_date?.match(/\d{4}/)?.[0] ?? null,
      publisher: ed.publishers?.[0] ?? null,
      place: ed.publish_places?.[0] ?? null,
      isbn: clean,
      source: 'Open Library',
    }
  } catch {
    return null
  }
}

// Crossref: scholarly books and monographs registered with an ISBN.
async function fetchBookCrossref(clean: string): Promise<BookInfo | null> {
  try {
    const res = await fetch(`${CROSSREF}/works?filter=isbn:${clean}&rows=1&mailto=${MAILTO}`, { signal: AbortSignal.timeout(10000) })
    if (!res.ok) return null
    const item = ((await res.json()) as { message?: { items?: Array<{
      title?: string[]; subtitle?: string[]; author?: { given?: string; family?: string; name?: string }[]
      editor?: { given?: string; family?: string }[]; publisher?: string; 'publisher-location'?: string
      issued?: { 'date-parts'?: number[][] }
    }> } }).message?.items?.[0]
    if (!item?.title?.[0]) return null
    const people: { given?: string; family?: string; name?: string }[] = item.author?.length ? item.author : item.editor ?? []
    return {
      title: item.title[0],
      subtitle: item.subtitle?.[0],
      authors: people.map(a => a.name ?? [a.given, a.family].filter(Boolean).join(' ')).filter(n => n.length > 0),
      year: item.issued?.['date-parts']?.[0]?.[0] ? String(item.issued['date-parts'][0][0]) : null,
      publisher: item.publisher ?? null,
      place: item['publisher-location'] ?? null,
      isbn: clean,
      source: 'Crossref',
    }
  } catch {
    return null
  }
}

async function fetchBookGoogle(clean: string): Promise<BookInfo | null> {
  try {
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${encodeURIComponent(clean)}`, { signal: AbortSignal.timeout(10000) })
    if (!res.ok) return null
    const data = await res.json() as {
      totalItems?: number
      items?: Array<{ volumeInfo: { title?: string; subtitle?: string; authors?: string[]; publisher?: string; publishedDate?: string; industryIdentifiers?: Array<{ type: string; identifier: string }> } }>
    }
    const v = data.items?.[0]?.volumeInfo
    if (!v?.title) return null
    return {
      title: v.title,
      subtitle: v.subtitle,
      authors: v.authors ?? [],
      year: v.publishedDate?.match(/\d{4}/)?.[0] ?? null,
      publisher: v.publisher ?? null,
      place: null,
      isbn: v.industryIdentifiers?.find(i => i.type === 'ISBN_13')?.identifier ?? clean,
      source: 'Google Books',
    }
  } catch {
    return null
  }
}

/** Book metadata by ISBN: Open Library, then Crossref, then Google Books. */
export async function fetchBookByIsbn(isbn: string): Promise<BookInfo | null> {
  const clean = isbn.replace(/[-\s]/g, '')
  const [ol, cr] = await Promise.all([fetchBookOl(clean), fetchBookCrossref(clean)])
  if (ol?.title && ol.authors.length) return ol
  if (cr?.title && cr.authors.length) return cr
  const google = await fetchBookGoogle(clean)
  if (google?.title) return google
  return ol ?? cr
}
