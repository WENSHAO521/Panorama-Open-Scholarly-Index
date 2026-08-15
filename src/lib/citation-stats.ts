import raw from './citation-stats.json'
import type { OpenAlexSourceStats } from './api'

// Precomputed snapshot — see scripts/fetch-citation-stats.mjs. Both
// /citation-reports and /journal/[code] read from this single file so
// their PCI figures for the same journal can never diverge, unlike
// the old approach of each page fetching OpenAlex live at build
// time (see that script's header comment for the bug this replaced).
// Real PCS-1.0 data lives separately in src/lib/pcs.ts/pcs.json, sourced
// from posi-data-delivery, not this file.
export interface CitationStatsEntry {
  issn: string
  stats: OpenAlexSourceStats | null
  fetched_at: string
}

const CITATION_STATS = raw as Record<string, CitationStatsEntry>

export function getCitationStats(journalCode: string): CitationStatsEntry | null {
  return CITATION_STATS[journalCode] ?? null
}
