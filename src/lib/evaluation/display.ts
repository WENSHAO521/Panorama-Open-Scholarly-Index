// Display labels and number formats for evaluation results. Never shows
// NaN, Infinity, undefined or null: a missing value renders as a word.
// Rounding here is for display only; ranking always used the raw values.

import {
  PQF_STATUS_LABEL, getPQFStatus,
  type CitationQuartile, type CitationRankingStatus, type PosiZone, type ZoneStatus, type PqfStatus,
} from './rules'

export const NOT_AVAILABLE = 'Not available'
export const NOT_YET_RANKED = 'Not yet ranked'

const isNum = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x)

/** PQF, AJR, PCI, PNCI, PCS: at most two decimals. */
export function fmtScore(x: number | null | undefined, fallback = NOT_AVAILABLE): string {
  if (!isNum(x)) return fallback
  return x.toFixed(2)
}

/** PQF: at most two decimals, trailing zeros dropped (82, 82.4, 82.45). */
export function fmtPqf(x: number | null | undefined, fallback = NOT_AVAILABLE): string {
  if (!isNum(x)) return fallback
  return String(Math.round(x * 100) / 100)
}

/** Percentile: one decimal. */
export function fmtPercentile(x: number | null | undefined, fallback = NOT_AVAILABLE): string {
  return isNum(x) ? x.toFixed(1) : fallback
}

/** Coverage stored as a 0–1 fraction: one decimal %. */
export function fmtCoverage(x: number | null | undefined, fallback = NOT_AVAILABLE): string {
  return isNum(x) ? `${(x * 100).toFixed(1)}%` : fallback
}

export function fmtRank(rank: number | null | undefined, total?: number | null): string {
  if (!isNum(rank)) return NOT_YET_RANKED
  return isNum(total) ? `${Math.round(rank)} / ${Math.round(total)}` : String(Math.round(rank))
}

/** Q1 → C-Q1. The only quartile label on the site. */
export function quartileLabel(q: CitationQuartile | string | null | undefined): string | null {
  return q && /^Q[1-4]$/.test(q) ? `C-${q}` : null
}

export const ZONE_SHARE: Record<PosiZone, string> = {
  1: 'Top 5%',
  2: 'Top 5–20%',
  3: 'Top 20–50%',
  4: 'Top 50–100%',
}

export const ZONE_METHOD: Record<PosiZone, string> = {
  1: 'Top 5%',
  2: '5th–20th percentile from the top',
  3: '20th–50th percentile from the top',
  4: 'Lower 50%',
}

export function zoneLabel(z: PosiZone | number | null | undefined): string | null {
  return z === 1 || z === 2 || z === 3 || z === 4 ? `Zone ${z} · ${ZONE_SHARE[z]}` : null
}

export const RANKING_STATUS_LABEL: Record<CitationRankingStatus, string> = {
  official: 'Official',
  provisional: 'Provisional',
  insufficient_items: 'Insufficient data',
  insufficient_category: 'Insufficient Category Size',
  incomplete_coverage: 'Incomplete Citation Coverage',
  observation: 'Observation period',
  not_available: NOT_YET_RANKED,
}

export const RANKING_REASON_TEXT: Record<string, string> = {
  no_eligible_items: 'No eligible citable items in the citation window',
  citation_coverage_below_90: 'Citation data retrieved for fewer than 90% of eligible items',
  fewer_than_10_items: 'Fewer than 10 eligible citable items',
  no_pnci: 'PNCI not yet computed',
  no_rankable_category: 'No high-confidence PSC category (multidisciplinary or provisional classification)',
  fewer_than_20_items: 'Fewer than 20 eligible citable items',
  fewer_than_2_publication_years: 'Eligible items from a single publication year',
  category_below_20: 'Fewer than 20 rankable journals in the PSC category',
}

export function rankingReason(reason: string | null | undefined, items?: number | null): string | null {
  if (!reason) return null
  if ((reason === 'fewer_than_20_items' || reason === 'fewer_than_10_items') && isNum(items)) return `${Math.round(items)} eligible items`
  return RANKING_REASON_TEXT[reason] ?? reason.replace(/_/g, ' ')
}

export const ZONE_STATUS_LABEL: Record<ZoneStatus, string> = {
  official: 'Official',
  provisional: 'Provisional Zone',
  not_assigned: 'No zone',
}

export function pqfStatusLabel(status: PqfStatus | null | undefined): string {
  return status ? PQF_STATUS_LABEL[status] : 'Not assessed'
}

export function pqfStatusOf(score: number | null | undefined): string {
  return pqfStatusLabel(getPQFStatus(score))
}

/** "September 2026" from YYYY-MM-DD. */
export function fmtSnapshot(date: string | null | undefined): string {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return 'Not yet generated'
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' })
}
