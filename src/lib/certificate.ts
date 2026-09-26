// Indexing certificates, issued and verified entirely in the browser.
//
// What "indexed" means here: POSI indexes every journal with DOIs registered
// at Crossref or a source record in OpenAlex. A publication is indexed when
// Crossref holds its DOI as a journal article with a journal ISSN, or, failing
// that, OpenAlex holds it with a journal as its primary source. The
// certificate also states the journal's POSI tier (Core Collection or
// Indexed).
//
// There is no server and no signing key, so a certificate does not carry
// authority by itself. Its number is a SHA-256 digest of the issue date, data
// snapshot and DOI list: it shows that the content has not been altered.
// Verification re-checks every fact against Crossref, OpenAlex and the live
// index, so a certificate for a publication that is not indexed cannot pass,
// whoever produced it.

import { DATA_CUTOFF } from './release'
import type { IndexRecord } from './records'

export const MAX_DOIS = 20
export const SNAPSHOT = DATA_CUTOFF

export interface CrossrefWork {
  doi: string
  title: string
  authors: string[]
  container: string | null
  issn: string[]
  volume: string | null
  issue: string | null
  page: string | null
  year: number | null
  published: string | null
  type: string | null
  publisher: string | null
  citations: number
}

export type ItemStatus = 'indexed' | 'not_journal' | 'not_found' | 'invalid' | 'error'

export type IndexedVia = 'Crossref' | 'OpenAlex'

export interface CertItem {
  input: string
  doi: string | null
  status: ItemStatus
  work: CrossrefWork | null
  via: IndexedVia | null
  /** curated POSI record for the journal, when there is one */
  journal: IndexRecord | null
  /** 'core' when the journal is in the Core Collection, else 'indexed' */
  tier: 'core' | 'indexed' | null
  accession: string | null
}

export const STATUS_TEXT: Record<ItemStatus, { text: string; ok: boolean }> = {
  indexed: { text: 'Indexed in POSI', ok: true },
  not_journal: { text: 'Not a journal publication (book, dataset, preprint or similar)', ok: false },
  not_found: { text: 'DOI not found in Crossref or OpenAlex', ok: false },
  invalid: { text: 'Not a valid DOI', ok: false },
  error: { text: 'The registries did not answer. Try again.', ok: false },
}

export function normalizeDoi(raw: string): string | null {
  const m = raw.trim().match(/10\.\d{4,9}\/\S+/)
  if (!m) return null
  return m[0].replace(/[.,;)\]]+$/, '').toLowerCase()
}

export function parseDoiList(text: string): string[] {
  return [...new Set(text.split(/[\s,;]+/).map(s => s.trim()).filter(Boolean))]
}

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('')
}

/** Stable per-article accession number derived from the DOI alone: POSI-A-XXXXX-XXXXX. */
export async function accessionOf(doi: string): Promise<string> {
  const h = (await sha256Hex(doi.toLowerCase())).slice(0, 10).toUpperCase()
  return `POSI-A-${h.slice(0, 5)}-${h.slice(5)}`
}

/** Certificate number: PC-XXXX-XXXX-XXXX from issue date, snapshot and sorted DOIs. */
export async function certificateCode(issued: string, snapshot: string, dois: string[]): Promise<string> {
  const payload = ['POSI-CERT-2', issued, snapshot, ...[...dois].map(d => d.toLowerCase()).sort()].join('|')
  const h = (await sha256Hex(payload)).slice(0, 12).toUpperCase()
  return `PC-${h.slice(0, 4)}-${h.slice(4, 8)}-${h.slice(8, 12)}`
}

export function verifyPath(code: string, issued: string, snapshot: string, dois: string[]): string {
  const sp = new URLSearchParams({ c: code, d: issued, s: snapshot, doi: dois.join(',') })
  return `/certificate/verify/?${sp}`
}

let curated: Promise<IndexRecord[]> | null = null
/** Core and Benchmark curated records (small files); used to name the journal's POSI tier. */
function loadCurated(): Promise<IndexRecord[]> {
  if (!curated) {
    curated = Promise.all(['core', 'benchmark'].map(g => fetch(`/data/index/${g}.json`).then(r => (r.ok ? r.json() : []))))
      .then((g: IndexRecord[][]) => g.flat())
      .catch(() => [])
  }
  return curated
}

/** OpenAlex fallback for DOIs Crossref does not hold (e.g. other registration agencies). */
async function openAlexWork(doi: string, signal?: AbortSignal): Promise<CrossrefWork | 'not_found' | 'not_journal'> {
  const r = await fetch(`https://api.openalex.org/works/doi:${encodeURIComponent(doi)}?mailto=posi@panorama-sg.com`, { signal })
  if (r.status === 404) return 'not_found'
  if (!r.ok) throw new Error(`OpenAlex ${r.status}`)
  const w = await r.json()
  const src = w.primary_location?.source
  if (!src || src.type !== 'journal') return 'not_journal'
  const b = w.biblio ?? {}
  return {
    doi, title: w.title ?? '', authors: (w.authorships ?? []).map((a: { author: { display_name: string } }) => a.author.display_name),
    container: src.display_name ?? null, issn: src.issn ?? (src.issn_l ? [src.issn_l] : []),
    volume: b.volume ?? null, issue: b.issue ?? null, page: b.first_page ? (b.last_page && b.last_page !== b.first_page ? `${b.first_page}-${b.last_page}` : b.first_page) : null,
    year: w.publication_year ?? null, published: w.publication_date ?? null, type: 'journal-article',
    publisher: src.host_organization_name ?? null, citations: w.cited_by_count ?? 0,
  }
}

const JOURNAL_TYPES = new Set(['journal-article', 'journal-issue', 'journal-volume', 'journal'])

async function crossrefWork(doi: string, signal?: AbortSignal): Promise<CrossrefWork | 'not_found'> {
  const r = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}?mailto=posi@panorama-sg.com`, { signal })
  if (r.status === 404) return 'not_found'
  if (!r.ok) throw new Error(`Crossref ${r.status}`)
  const m = (await r.json()).message
  const parts: number[] | undefined = (m.published ?? m['published-print'] ?? m['published-online'] ?? m.issued)?.['date-parts']?.[0]
  return {
    doi: String(m.DOI).toLowerCase(),
    title: (m.title?.[0] ?? '').replace(/<[^>]+>/g, ''),
    authors: (m.author ?? []).map((a: { given?: string; family?: string; name?: string }) => a.name ?? [a.given, a.family].filter(Boolean).join(' ')),
    container: m['container-title']?.[0] ?? null,
    issn: m.ISSN ?? [],
    volume: m.volume ?? null,
    issue: m.issue ?? null,
    page: m.page ?? null,
    year: parts?.[0] ?? null,
    published: parts ? parts.map(n => String(n).padStart(2, '0')).join('-') : null,
    type: m.type ?? null,
    publisher: m.publisher ?? null,
    citations: m['is-referenced-by-count'] ?? 0,
  }
}

export async function checkItem(input: string, signal?: AbortSignal): Promise<CertItem> {
  const doi = normalizeDoi(input)
  const base: CertItem = { input, doi, status: 'invalid', work: null, via: null, journal: null, tier: null, accession: null }
  if (!doi) return base
  try {
    const [records, cr] = await Promise.all([loadCurated(), crossrefWork(doi, signal)])
    let work: CrossrefWork | null = null
    let via: IndexedVia | null = null
    if (cr !== 'not_found') {
      if (!JOURNAL_TYPES.has(cr.type ?? '') || !cr.issn.length) return { ...base, status: 'not_journal', work: cr, via: 'Crossref' }
      work = cr; via = 'Crossref'
    } else {
      const oa = await openAlexWork(doi, signal)
      if (oa === 'not_found') return { ...base, status: 'not_found' }
      if (oa === 'not_journal') return { ...base, status: 'not_journal' }
      work = oa; via = 'OpenAlex'
    }
    const issns = new Set(work.issn.map(i => i.toUpperCase()))
    const journal = records.find(r => r.i.some(i => issns.has(i.toUpperCase()))) ?? null
    return {
      ...base, status: 'indexed', work, via, journal,
      tier: journal?.k === 'core' ? 'core' : 'indexed',
      accession: await accessionOf(doi),
    }
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e
    return { ...base, status: 'error' }
  }
}

/** Checks DOIs a few at a time to stay polite to Crossref. */
export async function checkAll(inputs: string[], onItem: (i: number, item: CertItem) => void, signal?: AbortSignal) {
  const queue = inputs.map((v, i) => [i, v] as const)
  const worker = async () => {
    for (let next = queue.shift(); next; next = queue.shift()) onItem(next[0], await checkItem(next[1], signal))
  }
  await Promise.all(Array.from({ length: Math.min(4, inputs.length) }, worker))
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}
