// Server-only access to the vendored datasets, in the record model's terms.
// Never import this from a client component: it pulls in every record.
import type { Journal } from './types'
import { ALL_JOURNALS, DISCOVERED_JOURNALS, getCoreCollection, getCandidateJournals } from './data'
import { BENCHMARK_JOURNALS } from './benchmark-journals'
import { collectionOf } from './records'

/** Journals that get a statically generated record page (Core, Candidate, Benchmark). */
export function getStaticRecordJournals(): Journal[] {
  return [...getCoreCollection(), ...getCandidateJournals(), ...BENCHMARK_JOURNALS]
}

/** Every record, any collection. */
export function getAllRecords(): Journal[] {
  const seen = new Set<string>()
  const out: Journal[] = []
  for (const j of [...getStaticRecordJournals(), ...DISCOVERED_JOURNALS]) {
    if (seen.has(j.id)) continue
    seen.add(j.id)
    out.push(j)
  }
  return out
}

export function findRecord(code: string): Journal | undefined {
  return ALL_JOURNALS.find(j => j.journal_code === code) ?? BENCHMARK_JOURNALS.find(j => j.journal_code === code)
}


export interface PublisherRow {
  /** publisher name as registered */
  name: string
  /** journals in POSI */
  n: number
  core: number
  benchmark: number
  discovered: number
  /** open-access journals */
  oa: number
  /** DOAJ-listed journals */
  doaj: number
  /** registered articles across its journals */
  articles: number
}

/** Publishers aggregated from every record. Records without a publisher are left out. */
export function getPublishers(): PublisherRow[] {
  const m = new Map<string, PublisherRow>()
  for (const j of getAllRecords()) {
    const name = (j.publisher || '').trim()
    if (!name) continue
    const r = m.get(name) ?? { name, n: 0, core: 0, benchmark: 0, discovered: 0, oa: 0, doaj: 0, articles: 0 }
    const k = collectionOf(j)
    r.n++
    if (k === 'core' || k === 'candidate') r.core++
    else if (k === 'benchmark') r.benchmark++
    else r.discovered++
    if (j.open_access) r.oa++
    if (j.doaj_status === 'listed') r.doaj++
    r.articles += j.article_count || 0
    m.set(name, r)
  }
  return [...m.values()].sort((a, b) => b.n - a.n || a.name.localeCompare(b.name))
}
