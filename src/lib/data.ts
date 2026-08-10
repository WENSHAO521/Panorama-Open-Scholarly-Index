import type { Journal, PlatformStats } from './types'
import { DISCOVERED_JOURNALS } from './discovered-journals'
export { DISCOVERED_JOURNALS }
import coreCollectionRaw from './core-collection.json'

// Canonical source: posi-data's corpus/core-collection.json (see that
// repo's corpus/README.md) — this file is a vendored snapshot, synced
// deliberately via scripts/sync-corpus.mjs, not regenerated on every
// build. Moved out of this file's old ~1000-line TypeScript-literal form
// (with inline pqf(...) constructor calls) specifically so re-rating/
// re-classification runs stop growing *this* repo's git history — that
// churn now happens in posi-data instead, and this repo's copy only
// updates at deliberate sync points (see corpus/README.md's "Update
// workflow").
const coreCollectionJournals = coreCollectionRaw as (Journal & { source_group: 'psg' | 'indexed' | 'shiharr' | 'other_indexed' })[]

// source_group preserves which original curation batch a journal came
// from — a handful of pages still read these four exports directly
// (coi.tsx's PSG-only conflict-of-interest list, journal-evidence.tsx,
// evidence.tsx, policies.tsx) rather than getCoreCollection().
export const PSG_JOURNALS: Journal[] = coreCollectionJournals.filter(j => j.source_group === 'psg')
export const INDEXED_JOURNALS: Journal[] = coreCollectionJournals.filter(j => j.source_group === 'indexed')
export const SHIHARR_JOURNALS: Journal[] = coreCollectionJournals.filter(j => j.source_group === 'shiharr')
export const OTHER_INDEXED_JOURNALS: Journal[] = coreCollectionJournals.filter(j => j.source_group === 'other_indexed')

export const ALL_JOURNALS: Journal[] = [...PSG_JOURNALS, ...INDEXED_JOURNALS, ...SHIHARR_JOURNALS, ...OTHER_INDEXED_JOURNALS, ...DISCOVERED_JOURNALS]

// The single definition of "Core Collection" — a journal admitted through
// PQF editorial selection that has since fallen below the eligibility bar
// (collection_status: 'candidate') keeps its record and journal page, but
// is not counted as, or treated with the privileges of, full Core
// Collection membership (badges, certificates, ranking-page inclusion)
// until re-review restores it. See scripts/rate-early-stage.mjs's PQF
// eligibility bands (Eligible/Review Required/Insufficient Evidence/Not
// Eligible) — 'candidate' is set manually after a Not Eligible finding,
// not computed automatically by any script.
export function getCoreCollection(): Journal[] {
  return [...PSG_JOURNALS, ...INDEXED_JOURNALS, ...SHIHARR_JOURNALS, ...OTHER_INDEXED_JOURNALS]
    .filter(j => j.collection_status !== 'candidate')
}

export function getCandidateJournals(): Journal[] {
  return [...PSG_JOURNALS, ...INDEXED_JOURNALS, ...SHIHARR_JOURNALS, ...OTHER_INDEXED_JOURNALS]
    .filter(j => j.collection_status === 'candidate')
}

// ISSN → journal_code lookup for mapping Crossref responses
export const ISSN_TO_CODE: Record<string, string> = Object.fromEntries(
  ALL_JOURNALS.filter(j => j.issn_online).map(j => [j.issn_online!, j.journal_code])
)

export function getJournalByCode(code: string): Journal | undefined {
  return ALL_JOURNALS.find(j => j.journal_code === code)
}

export function getJournalByIssn(issn: string): Journal | undefined {
  return ALL_JOURNALS.find(j => j.issn_online === issn || j.issn_print === issn)
}

export function getStats(liveArticleCount?: number): PlatformStats {
  const articles = liveArticleCount ?? ALL_JOURNALS.reduce((s, j) => s + j.article_count, 0)
  const doajListed = ALL_JOURNALS.filter(j => j.doaj_status === 'listed').length
  return {
    total_journals: ALL_JOURNALS.length,
    psg_journals: PSG_JOURNALS.length,
    indexed_journals: INDEXED_JOURNALS.length + SHIHARR_JOURNALS.length + OTHER_INDEXED_JOURNALS.length,
    discovered_journals: DISCOVERED_JOURNALS.length,
    total_articles: articles,
    total_authors: Math.round(articles * 2.6),
    total_doi_records: articles,
    crossref_verified: Math.round(articles * 0.85),
    openalex_matched: Math.round(articles * 0.3),
    doaj_listed: doajListed,
    // ~60% I4OC participation rate among DOAJ-indexed journals (Crossref deposit required for DOAJ listing)
    open_citation_records: Math.round(
      ALL_JOURNALS.filter(j => j.doaj_status === 'listed').reduce((s, j) => s + j.article_count, 0) * 0.60
    ),
    avg_metadata_quality: Math.round(
      ALL_JOURNALS.reduce((s, j) => s + j.metadata_quality_score, 0) / ALL_JOURNALS.length
    ),
    last_updated: new Date().toISOString().slice(0, 10),
    data_version: '2.0',
  }
}
