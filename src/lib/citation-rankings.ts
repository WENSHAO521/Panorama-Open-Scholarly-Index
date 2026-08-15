import raw from './citation-rankings.json'

// Real Citation Q (PJR-SPEC.md § 8), synced from posi-data-delivery's
// collections/citation-rankings.json. Core Collection journal_ids only —
// the ranking peer pool used to reach MIN_CATEGORY_SIZE=20 includes real-
// PCI Global Benchmark journals, but only Core Collection's own rank is
// ever published/displayed (Global Benchmark is an external validation
// corpus, never assigned a displayed Citation Rank/Percentile/Quartile —
// see posi-data's pjr-seed-corpus-global993-2026 audit). Tiny scope right
// now (2 records): every other Core Collection journal either has no real
// PCI yet, or its PSC category hasn't reached the size threshold.
export interface CitationRankingEntry {
  journal_id: string
  category_code: string
  metric_year: number
  rank: number | null
  rank_mid: number | null
  category_size: number
  percentile: number | null
  quartile: 'Q1' | 'Q2' | 'Q3' | 'Q4' | null
  ranking_method: 'pci_midrank' | 'unavailable'
  tied_with: string[]
  methodology_version: string
}

const RANKING_RECORDS = raw as CitationRankingEntry[]

const BY_JOURNAL_ID: Record<string, CitationRankingEntry> = Object.fromEntries(
  RANKING_RECORDS.map(r => [r.journal_id, r])
)

/** Look up a Core Collection journal's real Citation Q by its posi_id — null if not yet ranked. */
export function getCitationRanking(posiId: string | null | undefined): CitationRankingEntry | null {
  if (!posiId) return null
  const entry = BY_JOURNAL_ID[posiId]
  return entry && entry.ranking_method !== 'unavailable' ? entry : null
}
