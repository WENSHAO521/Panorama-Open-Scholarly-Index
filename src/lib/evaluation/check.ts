// Build-time invariants for the Citation Ranking edition and AJR ratings
// (POSI-EVAL-1.0-SPEC.md § 17), the website's copy of posi-engine's
// citation-ranking-check.mjs. src/lib/rankings.ts runs it when it loads the
// edition and fails the build on any problem, so an inconsistent edition
// can never be published.

import {
  CITATION_RANKING_STATUSES, RANKING_THRESHOLDS, calculateCitationQuartile, calculatePOSIZone, getAJRRating,
} from './rules.ts'

export interface EditionRecordLike {
  journal_id: string
  pnci: number | null
  ranking_category_id: string | null
  citation_rank: number | null
  citation_rank_total: number | null
  citation_percentile: number | null
  citation_quartile: string | null
  posi_zone: number | null
  zone_status: string
  citation_ranking_status: string
}

export function validateCitationEdition(records: EditionRecordLike[]): string[] {
  const problems: string[] = []
  const ties = new Map<string, EditionRecordLike>()
  for (const r of records) {
    const id = r.journal_id
    if (!(CITATION_RANKING_STATUSES as string[]).includes(r.citation_ranking_status)) problems.push(`${id}: unknown status ${r.citation_ranking_status}`)
    if (r.citation_quartile != null && !['Q1', 'Q2', 'Q3', 'Q4'].includes(r.citation_quartile)) problems.push(`${id}: invalid quartile ${r.citation_quartile}`)
    const official = r.citation_ranking_status === 'official'
    if (official) {
      for (const k of ['pnci', 'ranking_category_id', 'citation_rank', 'citation_percentile', 'citation_quartile'] as const) {
        if (r[k] == null) problems.push(`${id}: official ranking without ${k}`)
      }
      if ((r.citation_rank_total ?? 0) >= RANKING_THRESHOLDS.categoryOfficialZone && (r.posi_zone == null || r.zone_status !== 'official')) {
        problems.push(`${id}: category of ${r.citation_rank_total} without an official zone`)
      }
    }
    if (!official && r.citation_ranking_status !== 'provisional' && (r.citation_rank != null || r.citation_quartile != null || r.posi_zone != null)) {
      problems.push(`${id}: ${r.citation_ranking_status} journal carries a rank, quartile or zone`)
    }
    if (r.citation_percentile != null) {
      if (r.citation_quartile !== calculateCitationQuartile(r.citation_percentile)) problems.push(`${id}: quartile ${r.citation_quartile} disagrees with percentile ${r.citation_percentile}`)
      if (r.posi_zone != null && r.posi_zone !== calculatePOSIZone(r.citation_percentile)) problems.push(`${id}: zone ${r.posi_zone} disagrees with percentile ${r.citation_percentile}`)
    }
    if (r.citation_rank != null) {
      const key = `${r.ranking_category_id}|${r.pnci}`
      const prev = ties.get(key)
      if (prev && (prev.citation_rank !== r.citation_rank || prev.citation_percentile !== r.citation_percentile)) problems.push(`${id}: tied PNCI with ${prev.journal_id} but a different rank`)
      ties.set(key, r)
    }
  }
  return problems
}

/** Every published AJR score has the rating of its score; a stored rating must agree. */
export function validateAjrRatings(rows: { id: string; score: number | null; storedRating?: string | null }[]): string[] {
  const problems: string[] = []
  for (const r of rows) {
    if (r.score == null) continue
    const rating = getAJRRating(r.score)
    if (!rating) problems.push(`${r.id}: AJR score ${r.score} has no valid rating`)
    else if (r.storedRating != null && r.storedRating !== rating) problems.push(`${r.id}: stored AJR rating ${r.storedRating} != ${rating}`)
  }
  return problems
}
