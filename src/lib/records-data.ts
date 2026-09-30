// Server-only access to the vendored datasets, in the record model's terms.
// Never import this from a client component: it pulls in every record.
import type { Journal } from './types'
import { ALL_JOURNALS, DISCOVERED_JOURNALS, getCoreCollection, getCuratedNonCoreJournals } from './data'
import { BENCHMARK_JOURNALS } from './benchmark-journals'

/** Journals that get a statically generated record page (Core and other curated). */
export function getStaticRecordJournals(): Journal[] {
  return [...getCoreCollection(), ...getCuratedNonCoreJournals(), ...BENCHMARK_JOURNALS]
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
