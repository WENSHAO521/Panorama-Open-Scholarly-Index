import raw from './citation-stats.json'
import type { OpenAlexSourceStats, CrossrefCitationScore } from './api'

// Precomputed snapshot — see scripts/fetch-citation-stats.mjs. Both
// /citation-reports and /journal/[code] read from this single file so
// their PCI/PCS figures for the same journal can never diverge, unlike
// the old approach of each page fetching OpenAlex/Crossref live at build
// time (see that script's header comment for the bug this replaced).
export interface CitationStatsEntry {
  issn: string
  stats: OpenAlexSourceStats | null
  pcs: CrossrefCitationScore | null
  fetched_at: string
}

const CITATION_STATS = raw as Record<string, CitationStatsEntry>

export function getCitationStats(journalCode: string): CitationStatsEntry | null {
  return CITATION_STATS[journalCode] ?? null
}
