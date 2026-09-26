// Indexing certificates (论文收录检索证明), issued and verified entirely in
// the browser.
//
// What "indexed" means here: the DOI is registered with Crossref under an
// ISSN that belongs to a journal in the POSI Core Collection at the current
// data snapshot. Core Candidates, Global Benchmark and Discovered journals
// are not indexed by POSI and never certified (see /coverage/policy/).
//
// There is no server and no signing key, so a certificate does not carry
// authority by itself. Its code is a SHA-256 digest of the issue date, data
// snapshot and DOI list: it shows that the certificate's content has not
// been altered. Verification then re-checks every fact against Crossref and
// the live index, so a certificate for a paper that is not indexed cannot
// pass, whoever produced it.

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

export type ItemStatus = 'indexed' | 'candidate' | 'not_core' | 'not_found' | 'invalid' | 'error'

export interface CertItem {
  input: string
  doi: string | null
  status: ItemStatus
  work: CrossrefWork | null
  journal: IndexRecord | null
  accession: string | null
}

export const STATUS_TEXT: Record<ItemStatus, { en: string; zh: string; ok: boolean }> = {
  indexed: { en: 'Indexed in POSI Core Collection', zh: '被 POSI 核心合集收录', ok: true },
  candidate: { en: 'Journal is a Core Candidate under re-review; not certified', zh: '期刊处于复审候选状态，暂不出具证明', ok: false },
  not_core: { en: 'Journal is not in the POSI Core Collection', zh: '期刊不在 POSI 核心合集内', ok: false },
  not_found: { en: 'DOI not found in Crossref', zh: 'Crossref 中未找到该 DOI', ok: false },
  invalid: { en: 'Not a valid DOI', zh: '不是有效的 DOI', ok: false },
  error: { en: 'Crossref did not answer; try again', zh: 'Crossref 暂无响应，请重试', ok: false },
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

/** Stable per-article accession number: POSI-A-<journal number>-<8 hex of the DOI digest>. */
export async function accessionOf(posiId: string, doi: string): Promise<string> {
  const num = posiId.replace(/^POSI-J-/, '')
  return `POSI-A-${num}-${(await sha256Hex(doi.toLowerCase())).slice(0, 8).toUpperCase()}`
}

/** Certificate number: PC-XXXX-XXXX-XXXX from issue date, snapshot and sorted DOIs. */
export async function certificateCode(issued: string, snapshot: string, dois: string[]): Promise<string> {
  const payload = ['POSI-CERT-1', issued, snapshot, ...[...dois].map(d => d.toLowerCase()).sort()].join('|')
  const h = (await sha256Hex(payload)).slice(0, 12).toUpperCase()
  return `PC-${h.slice(0, 4)}-${h.slice(4, 8)}-${h.slice(8, 12)}`
}

export function verifyPath(code: string, issued: string, snapshot: string, dois: string[]): string {
  const sp = new URLSearchParams({ c: code, d: issued, s: snapshot, doi: dois.join(',') })
  return `/certificate/verify/?${sp}`
}

let coreIndex: Promise<IndexRecord[]> | null = null
function loadCore(): Promise<IndexRecord[]> {
  if (!coreIndex) coreIndex = fetch('/data/index/core.json').then(r => { if (!r.ok) throw new Error('index'); return r.json() })
  return coreIndex
}

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
  const base: CertItem = { input, doi, status: 'invalid', work: null, journal: null, accession: null }
  if (!doi) return base
  try {
    const [core, w] = await Promise.all([loadCore(), crossrefWork(doi, signal)])
    if (w === 'not_found') return { ...base, status: 'not_found' }
    const issns = new Set(w.issn.map(i => i.toUpperCase()))
    const journal = core.find(r => r.i.some(i => issns.has(i.toUpperCase()))) ?? null
    if (!journal) return { ...base, status: 'not_core', work: w }
    if (journal.k !== 'core' || !journal.id) return { ...base, status: 'candidate', work: w, journal }
    return { ...base, status: 'indexed', work: w, journal, accession: await accessionOf(journal.id, doi) }
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
