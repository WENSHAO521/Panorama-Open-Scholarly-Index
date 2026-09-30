// Assembles a journal's evaluation (POSI-EVAL-1.0-SPEC.md § 16) from the
// data POSI already publishes: PQF and AJR from the journal record, PCI and
// PCS from their collections, the ranking from the Citation Ranking edition.
// It computes nothing new: AJR Rating and PQF status come from rules.ts,
// every ranking field from the edition as published.

import type { Journal } from '../types'
import { isEarlyStageV1_1 } from '../early-stage'
import { collectionOf } from '../records'
import {
  getAJRRating, getPQFStatus, getLifecycleStage, EVALUATION_VERSION,
  type AjrModel, type AjrRating, type CitationQuartile, type CitationRankingStatus, type LifecycleStage, type PosiZone, type PqfStatus, type ZoneStatus,
} from './rules'

/** One record of the Citation Ranking edition (posi-data schema/citation-ranking.schema.json). */
export interface CitationRankingRecord {
  journal_id: string
  metric_year: number
  pnci: number | null
  pnci_model_version: string | null
  pnci_normalization?: string | null
  eligible_citable_items: number | null
  publication_years?: number[]
  citation_coverage: number | null
  median_normalized_citation?: number | null
  top10_share?: number | null
  total_citations?: number | null
  pci?: number | null
  pcs?: number | null
  lifecycle_stage?: LifecycleStage | null
  ranking_category_id: string | null
  ranking_category_name?: string | null
  category_cohort_size?: number | null
  citation_rank: number | null
  citation_rank_mid?: number | null
  citation_rank_total: number | null
  citation_percentile: number | null
  citation_quartile: CitationQuartile | null
  posi_zone: PosiZone | null
  zone_status: ZoneStatus
  citation_ranking_status: CitationRankingStatus
  ranking_status_reason: string | null
  tied_with?: string[]
  ranking_snapshot_date: string
  ranking_methodology_version?: string
  zones_version?: string
  evaluation_version?: string
  title?: string | null
  publisher?: string | null
  issn?: string[]
  open_access?: boolean | null
}

export interface AjrEvaluation {
  model: AjrModel | null
  lifecycle: LifecycleStage
  score: number | null
  rating: AjrRating | null
  /** 'official' | 'provisional' | 'not_rateable' | 'not_applicable' | 'not_rated' */
  status: string
  version: string | null
  monthsSinceLaunch: number | null
  reason: string | null
}

export interface JournalEvaluation {
  pqf: { score: number | null; status: PqfStatus | null; version: string | null; evaluatedAt: string | null }
  ajr: AjrEvaluation
  citations: {
    pci: number | null; pnci: number | null; pnciModel: string | null; pcs: number | null
    eligibleItems: number | null; coverage: number | null; publicationYears: number[]
  }
  ranking: {
    categoryId: string | null; category: string | null; rank: number | null; total: number | null
    percentile: number | null; quartile: CitationQuartile | null; zone: PosiZone | null; zoneStatus: ZoneStatus
    status: CitationRankingStatus; reason: string | null; snapshot: string | null; methodology: string | null
  }
  evaluationVersion: string
}

/** AJR for a journal record. A mature journal is never shown with an AJR-E score. */
export function ajrOf(j: Pick<Journal, 'early_stage_rating'> | null | undefined): AjrEvaluation {
  const r = j?.early_stage_rating ?? null
  const empty = (lifecycle: LifecycleStage, status: string, reason: string | null = null): AjrEvaluation => ({
    model: lifecycle === 'observation' ? 'Observation' : lifecycle === 'early_stage' ? 'AJR-E' : lifecycle === 'mature' ? 'AJR-M' : null,
    lifecycle, score: null, rating: null, status, version: null, monthsSinceLaunch: r?.months_since_launch ?? null, reason,
  })
  if (!r) return empty('unknown', 'not_rated')
  if (isEarlyStageV1_1(r)) {
    const lifecycle: LifecycleStage = r.lifecycle_stage === 'unknown' ? getLifecycleStage(r.months_since_launch) : r.lifecycle_stage
    if (lifecycle === 'mature') return empty('mature', 'not_rated', 'AJR-M has not yet been run for this journal')
    if (lifecycle === 'observation') return empty('observation', 'not_applicable')
    const scored = (r.rating_status === 'official' || r.rating_status === 'provisional') && r.total != null
    if (!scored) return { ...empty(lifecycle, r.rating_status, r.not_rateable_reason), version: r.version }
    return {
      model: 'AJR-E', lifecycle, score: r.total, rating: getAJRRating(r.total), status: r.rating_status,
      version: r.version, monthsSinceLaunch: r.months_since_launch, reason: r.rating_status === 'provisional' ? 'Evidence coverage below the official threshold' : null,
    }
  }
  // Legacy shape (AJR-E-1.0 and earlier).
  const lifecycle: LifecycleStage = r.eligibility === 'observation' || r.eligibility === 'early_stage' || r.eligibility === 'mature'
    ? r.eligibility : getLifecycleStage(r.months_since_launch)
  if (lifecycle === 'mature') return empty('mature', 'not_rated', 'AJR-M has not yet been run for this journal')
  if (r.eligibility === 'early_stage' && r.total != null) {
    return { model: 'AJR-E', lifecycle, score: r.total, rating: getAJRRating(r.total), status: 'official', version: r.version, monthsSinceLaunch: r.months_since_launch, reason: null }
  }
  return { ...empty(lifecycle, r.eligibility === 'not_yet_rateable' ? 'not_rateable' : 'not_applicable'), version: r.version }
}

export function buildJournalEvaluation(input: {
  journal?: Journal | null
  ranking?: CitationRankingRecord | null
  pci?: number | null
  pcs?: number | null
  categoryName?: string | null
}): JournalEvaluation {
  const { journal: j, ranking: r } = input
  const pqf = j?.pqf ?? j?.ojqf ?? null
  // PCI is a Core Collection indicator: no other journal reports one.
  const core = !!j && collectionOf(j) === 'core'
  return {
    pqf: { score: pqf?.total ?? null, status: getPQFStatus(pqf?.total), version: pqf?.version ?? null, evaluatedAt: pqf?.evaluated_at ?? null },
    ajr: ajrOf(j),
    citations: {
      pci: core ? input.pci ?? r?.pci ?? null : null,
      pnci: r?.pnci ?? null,
      pnciModel: r?.pnci_model_version ?? null,
      pcs: input.pcs ?? r?.pcs ?? null,
      eligibleItems: r?.eligible_citable_items ?? null,
      coverage: r?.citation_coverage ?? null,
      publicationYears: r?.publication_years ?? [],
    },
    ranking: {
      categoryId: r?.ranking_category_id ?? null,
      category: input.categoryName ?? r?.ranking_category_name ?? null,
      rank: r?.citation_rank ?? null,
      total: r?.citation_rank_total ?? null,
      percentile: r?.citation_percentile ?? null,
      quartile: r?.citation_quartile ?? null,
      zone: r?.posi_zone ?? null,
      zoneStatus: r?.zone_status ?? 'not_assigned',
      status: r?.citation_ranking_status ?? 'not_available',
      reason: r?.ranking_status_reason ?? null,
      snapshot: r?.ranking_snapshot_date ?? null,
      methodology: r?.ranking_methodology_version ?? null,
    },
    evaluationVersion: EVALUATION_VERSION,
  }
}

/** The evaluation carried by a journal profile shard (JournalProfile.ev), for
 *  the client-side journal page. The shard carries PCI for Core Collection
 *  journals only (scripts/sync-live-data.mjs). */
export function evaluationFromProfile(ev: import('../journal-profile').JournalProfile['ev'], categoryName: string | null): JournalEvaluation {
  const ajr = ev?.ajr
  return {
    pqf: { score: ev?.pqf ?? null, status: getPQFStatus(ev?.pqf), version: null, evaluatedAt: null },
    ajr: ajr
      ? { model: ajr[1] as AjrModel, lifecycle: ajr[1] === 'AJR-M' ? 'mature' : 'early_stage', score: ajr[2], rating: getAJRRating(ajr[2]), status: ajr[3] ?? 'official', version: null, monthsSinceLaunch: null, reason: null }
      : { model: null, lifecycle: 'unknown', score: null, rating: null, status: 'not_rated', version: null, monthsSinceLaunch: null, reason: null },
    citations: {
      pci: ev?.pci ?? null, pnci: ev?.pnci ?? null, pnciModel: ev?.pm ?? null, pcs: ev?.pcs ?? null,
      eligibleItems: ev?.n ?? null, coverage: ev?.cov ?? null, publicationYears: [],
    },
    ranking: {
      categoryId: ev?.cat ?? null, category: categoryName, rank: ev?.r ?? null, total: ev?.rt ?? null,
      percentile: ev?.p ?? null, quartile: ev?.q ?? null, zone: ev?.z ?? null, zoneStatus: ev?.zs ?? 'not_assigned',
      status: ev?.st ?? 'not_available', reason: ev?.why ?? null, snapshot: ev?.snap ?? null, methodology: ev?.st ? 'CITATION-RANK-1.0' : null,
    },
    evaluationVersion: EVALUATION_VERSION,
  }
}
