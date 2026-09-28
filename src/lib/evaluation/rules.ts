// POSI Journal Evaluation Architecture 1.0 (posi-data POSI-EVAL-1.0-SPEC.md):
// every threshold and label rule the website applies, in one module. The
// numbers mirror posi-engine src/evaluation.mjs, which computes the published
// editions; this module labels those results, validates them at build time
// (./check.ts) and derives an AJR Rating or PQF status from a score. Pages
// never hard-code a threshold. Pure and dependency-free, so it is safe in
// client components and runs under `node --test`.
//
// Five layers, never mixed:
//   PQF                Core Collection eligibility, not a ranking
//   AJR                AJR Score + AJR Rating (A+ … D), never a quartile
//   PCI / PNCI / PCS   citation indicators
//   Citation Ranking   rank, percentile, Citation Quartile (C-Q1 … C-Q4), from PNCI
//   POSI Zones         Zone 1–4, from the same PNCI percentile

export const EVALUATION_VERSION = 'POSI-EVAL-1.0'
export const CITATION_RANK_VERSION = 'CITATION-RANK-1.0'
export const PNCI_MODEL_VERSION = 'PNCI-1.0'
export const ZONES_VERSION = 'POSI-ZONES-2.0'
export const AJR_RATING_VERSION = 'AJR-RATING-1.0'

const isNum = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x)

// ---------------------------------------------------------------------------
// PQF: Core Collection eligibility
// ---------------------------------------------------------------------------

export type PqfStatus = 'eligible' | 'review_required' | 'insufficient_evidence' | 'not_eligible'

export const PQF_STATUS_LABEL: Record<PqfStatus, string> = {
  eligible: 'Eligible',
  review_required: 'Review Required',
  insufficient_evidence: 'Insufficient Evidence',
  not_eligible: 'Not Eligible',
}

/** Score bands, lower bound inclusive. */
export const PQF_STATUS_BANDS: [PqfStatus, number][] = [['eligible', 70], ['review_required', 50], ['insufficient_evidence', 40], ['not_eligible', 0]]

export function getPQFStatus(score: number | null | undefined): PqfStatus | null {
  if (!isNum(score)) return null
  return PQF_STATUS_BANDS.find(([, min]) => score >= min)?.[0] ?? 'not_eligible'
}

export const PQF_DISCLAIMER = 'PQF is an eligibility and quality-framework assessment. It is not a citation ranking metric and does not determine Citation Quartiles or POSI Zones.'

// ---------------------------------------------------------------------------
// AJR: lifecycle rating
// ---------------------------------------------------------------------------

export type AjrRating = 'A+' | 'A' | 'A−' | 'B+' | 'B' | 'B−' | 'C+' | 'C' | 'D'
export type AjrModel = 'Observation' | 'AJR-E' | 'AJR-M'
export type LifecycleStage = 'observation' | 'early_stage' | 'mature' | 'unknown'

/** Lower bound (inclusive) of each rating, scores 0–100. */
export const AJR_RATING_SCALE: [AjrRating, number][] = [
  ['A+', 90], ['A', 85], ['A−', 80], ['B+', 75], ['B', 70], ['B−', 65], ['C+', 60], ['C', 50], ['D', 0],
]

/** The one AJR rating function: from the unrounded score, never from a legacy quartile. */
export function getAJRRating(score: number | null | undefined): AjrRating | null {
  if (!isNum(score) || score < 0 || score > 100) return null
  return AJR_RATING_SCALE.find(([, min]) => score >= min)?.[0] ?? null
}
export const calculateAJRRating = getAJRRating

/** Upper bound shown next to each rating in the scale table. */
export function ajrRatingRange(r: AjrRating): string {
  const i = AJR_RATING_SCALE.findIndex(([x]) => x === r)
  const lo = AJR_RATING_SCALE[i][1]
  const hi = i === 0 ? 100 : AJR_RATING_SCALE[i - 1][1] - 0.01
  return `${lo.toFixed(2)}–${hi.toFixed(2)}`
}

export const AJR_MODEL_NAME: Record<AjrModel, string> = {
  Observation: 'Observation period',
  'AJR-E': 'Early-stage Journal Rating',
  'AJR-M': 'Mature Journal Rating',
}

export function getAJRModel(stage: LifecycleStage | null | undefined): AjrModel | null {
  if (stage === 'observation') return 'Observation'
  if (stage === 'early_stage') return 'AJR-E'
  if (stage === 'mature') return 'AJR-M'
  return null
}

export function getLifecycleStage(months: number | null | undefined): LifecycleStage {
  if (!isNum(months) || months < 0) return 'unknown'
  if (months < 12) return 'observation'
  if (months < 60) return 'early_stage'
  return 'mature'
}

export const AJR_DISCLAIMER = 'AJR Ratings are absolute lifecycle ratings. They are not citation quartiles and should not be interpreted as relative subject rankings.'

// ---------------------------------------------------------------------------
// Citation ranking: mid-rank, percentile, Citation Quartile, POSI Zone
// ---------------------------------------------------------------------------

export type CitationQuartile = 'Q1' | 'Q2' | 'Q3' | 'Q4'
export type PosiZone = 1 | 2 | 3 | 4

/** PNCI values closer than this are the same value for ranking. */
export const TIE_EPSILON = 1e-9

export function calculateMidRank(rStart: number, rEnd: number): number {
  return (rStart + rEnd) / 2
}

/** 100 × (N − r_mid + 0.5) / N, clamped to 0–100; full precision. */
export function calculatePercentile(rMid: number, n: number): number | null {
  if (!isNum(rMid) || !isNum(n) || n <= 0) return null
  return Math.min(100, Math.max(0, (100 * (n - rMid + 0.5)) / n))
}

export function calculateCitationQuartile(percentile: number | null | undefined): CitationQuartile | null {
  if (!isNum(percentile)) return null
  if (percentile >= 75) return 'Q1'
  if (percentile >= 50) return 'Q2'
  if (percentile >= 25) return 'Q3'
  return 'Q4'
}

export function calculatePOSIZone(percentile: number | null | undefined): PosiZone | null {
  if (!isNum(percentile)) return null
  if (percentile >= 95) return 1
  if (percentile >= 80) return 2
  if (percentile >= 50) return 3
  return 4
}

export interface TiedRank { rank: number; rankMid: number; percentile: number; quartile: CitationQuartile; zone: PosiZone; tiedWith: string[] }

/** Descending, shared ties (1, 2, 2, 4); order among tied journals never depends on anything but the value. */
export function rankWithTies(entries: { id: string; value: number }[]): Map<string, TiedRank> {
  const n = entries.length
  const sorted = [...entries].sort((a, b) => b.value - a.value)
  const out = new Map<string, TiedRank>()
  let i = 0
  while (i < n) {
    let j = i
    while (j < n && Math.abs(sorted[j].value - sorted[i].value) <= TIE_EPSILON) j++
    const rankMid = calculateMidRank(i + 1, j)
    const percentile = calculatePercentile(rankMid, n)!
    const ids = sorted.slice(i, j).map(e => e.id)
    for (const id of ids) {
      out.set(id, { rank: i + 1, rankMid, percentile, quartile: calculateCitationQuartile(percentile)!, zone: calculatePOSIZone(percentile)!, tiedWith: ids.filter(x => x !== id) })
    }
    i = j
  }
  return out
}

// ---------------------------------------------------------------------------
// Minimum data requirements and ranking status
// ---------------------------------------------------------------------------

export const RANKING_THRESHOLDS = {
  officialItems: 20,
  provisionalItems: 10,
  officialPublicationYears: 2,
  minCoverage: 0.9,
  categoryOfficialZone: 50,
  categoryProvisionalZone: 30,
  categoryQuartile: 20,
} as const

export type CitationRankingStatus =
  | 'official' | 'provisional' | 'insufficient_items' | 'insufficient_category'
  | 'incomplete_coverage' | 'observation' | 'not_available'

export const CITATION_RANKING_STATUSES: CitationRankingStatus[] = [
  'official', 'provisional', 'insufficient_items', 'insufficient_category', 'incomplete_coverage', 'observation', 'not_available',
]

export type ZoneStatus = 'official' | 'provisional' | 'not_assigned'

export interface RankingInput {
  pnci?: number | null
  eligibleItems?: number | null
  publicationYears?: number | null
  coverage?: number | null
  lifecycleStage?: LifecycleStage | null
  hasCategory?: boolean
  categorySize?: number | null
}

export function getJournalRankingEligibility(j: RankingInput): { status: CitationRankingStatus; reason: string | null } {
  const items = j.eligibleItems ?? 0
  if (!isNum(j.pnci) && items === 0) return { status: j.lifecycleStage === 'observation' ? 'observation' : 'not_available', reason: 'no_eligible_items' }
  if (!isNum(j.coverage) || j.coverage < RANKING_THRESHOLDS.minCoverage) return { status: 'incomplete_coverage', reason: 'citation_coverage_below_90' }
  if (items < RANKING_THRESHOLDS.provisionalItems) return { status: j.lifecycleStage === 'observation' ? 'observation' : 'insufficient_items', reason: 'fewer_than_10_items' }
  if (!isNum(j.pnci)) return { status: 'not_available', reason: 'no_pnci' }
  if (j.hasCategory === false) return { status: 'not_available', reason: 'no_rankable_category' }
  if (items < RANKING_THRESHOLDS.officialItems) return { status: 'provisional', reason: 'fewer_than_20_items' }
  if ((j.publicationYears ?? 0) < RANKING_THRESHOLDS.officialPublicationYears) return { status: 'provisional', reason: 'fewer_than_2_publication_years' }
  return { status: 'official', reason: null }
}

/** The single ranking-status rule (journal-level eligibility + category size N). */
export function getCitationRankingStatus(j: RankingInput): { status: CitationRankingStatus; reason: string | null } {
  const base = getJournalRankingEligibility(j)
  if (base.status !== 'official' && base.status !== 'provisional') return base
  if (!isNum(j.categorySize) || j.categorySize < RANKING_THRESHOLDS.categoryQuartile) return { status: 'insufficient_category', reason: 'category_below_20' }
  return base
}

/** What a journal may publish for its status and category size. */
export function getRankingOutputs(status: CitationRankingStatus, categorySize: number | null | undefined): { rank: boolean; quartile: boolean; zone: 'official' | 'provisional' | null } {
  if (status !== 'official' && status !== 'provisional') return { rank: false, quartile: false, zone: null }
  if (!isNum(categorySize) || categorySize < RANKING_THRESHOLDS.categoryQuartile) return { rank: false, quartile: false, zone: null }
  if (status === 'provisional') return { rank: true, quartile: true, zone: null }
  if (categorySize >= RANKING_THRESHOLDS.categoryOfficialZone) return { rank: true, quartile: true, zone: 'official' }
  if (categorySize >= RANKING_THRESHOLDS.categoryProvisionalZone) return { rank: true, quartile: true, zone: 'provisional' }
  return { rank: true, quartile: true, zone: null }
}

export const RANKING_BASIS = 'Citation Quartiles and POSI Zones are based on PNCI-derived percentiles within eligible PSC categories.'
export const PCS_DISCLAIMER = 'PCS is a supplementary citation indicator and does not determine the official POSI Citation Rank, Citation Percentile, Citation Quartile, or POSI Zone.'
export const QUARTILE_TOOLTIP = 'POSI Citation Quartile, based on PNCI percentile within the journal’s PSC category.'
