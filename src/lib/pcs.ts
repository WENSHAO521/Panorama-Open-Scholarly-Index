import raw from './pcs.json'

// PCS (POSI Citation Score, posi-data's PCS-1.0-SPEC.md) — a real,
// Crossref-based 4-year citation-performance indicator, synced from
// posi-data-delivery's collections/pcs.json (see scripts/sync-corpus.mjs).
// This is the only PCS figure shown anywhere on the site — the earlier
// 200-article-capped Crossref preview in src/lib/citation-stats.ts was
// retired once this real, uncapped PCS-1.0 pipeline shipped for all
// journals (2026-08-14). Every field below is passed through unmodified
// from posi-data's schema/metric.schema.json-declared PCS subset; see
// PCS-1.0-SPEC.md § 9 for field definitions.
export interface PcsEntry {
  journal_id: string
  metric_year: number
  pcs: number | null
  pcs_window_start_year: number | null
  pcs_window_end_year: number | null
  pcs_eligible_items: number | null
  pcs_items_with_citation_data: number | null
  pcs_coverage: number | null
  pcs_source: 'crossref' | null
  pcs_source_retrieved_at: string | null
  pcs_methodology_version: string | null
}

const PCS_RECORDS = raw as PcsEntry[]

const BY_JOURNAL_ID: Record<string, PcsEntry> = Object.fromEntries(
  PCS_RECORDS.map(r => [r.journal_id, r])
)

/** All synced PCS records — 4320 as of the pcs-etl-v1-global1024-2026 run's
 * 2026-08-14 Phase 2 expansion (31 Core Collection + the full 4289-journal
 * Global Benchmark, up from Phase 1's 993-journal curated-only seed),
 * including pcs: null entries. See that audit's README for the Phase
 * 1/Phase 2 history — the directory name was kept even though scope grew,
 * to avoid breaking already-published links to it. */
export function getAllPcsEntries(): PcsEntry[] {
  return PCS_RECORDS
}

/** Look up a journal's PCS entry by its posi-data posi_id (e.g. "POSI-J-023605"). */
export function getPcsEntry(posiId: string | null | undefined): PcsEntry | null {
  if (!posiId) return null
  return BY_JOURNAL_ID[posiId] ?? null
}
