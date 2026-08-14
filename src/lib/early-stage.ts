// Shared reads over the EarlyStageRating union (see types.ts) — every page
// that renders or counts by lifecycle stage / rating status goes through
// these instead of re-deriving the branch locally, so the two real shapes
// (legacy single `eligibility` field vs AJR-E-1.1's split
// `lifecycle_stage`/`rating_status`) are interpreted the same way
// everywhere. See posi-data's audits/ratings/ajr-e-1.1-rerate-core30-2026/
// README.md for the full methodology this is reading.
//
// Deliberately NOT a single flattened "eligibility" value for the v1.1
// shape — collapsing lifecycle_stage and rating_status back into one field
// would silently re-introduce the exact conflation AJR-E-1.1 was built to
// remove (see types.ts's EarlyStageRatingV1_1 comment). Each helper below
// answers one specific real question instead.

import type { EarlyStageRating, EarlyStageRatingV1_1 } from './types'

export function isEarlyStageV1_1(r: EarlyStageRating | null | undefined): r is EarlyStageRatingV1_1 {
  return !!r && r.version === 'AJR-E-1.1'
}

// True only for the 60+ month "mature" lifecycle stage — used to withhold
// any AJR-E-scored total (AJR-M-1.0-SPEC.md: a mature journal must never be
// scored with the early-stage rubric), for both shapes.
export function isMatureStage(r: EarlyStageRating | null | undefined): boolean {
  if (!r) return false
  return isEarlyStageV1_1(r) ? r.lifecycle_stage === 'mature' : r.eligibility === 'mature'
}

// True when the journal is currently in the 12-59mo Early-Stage lifecycle
// window. NOT the same as "has a real score" for the v1.1 shape (a window
// member can still be rating_status 'not_rateable') — the legacy shape had
// no way to distinguish the two, so 'early_stage' there already implied a
// real score existed.
export function isInEarlyStageWindow(r: EarlyStageRating | null | undefined): boolean {
  if (!r) return false
  return isEarlyStageV1_1(r) ? r.lifecycle_stage === 'early_stage' : r.eligibility === 'early_stage'
}

export function isInObservationStage(r: EarlyStageRating | null | undefined): boolean {
  if (!r) return false
  return isEarlyStageV1_1(r) ? r.lifecycle_stage === 'observation' : r.eligibility === 'observation'
}

// Below the minimum evidence bar — legacy 'not_yet_rateable' eligibility,
// or v1.1 rating_status 'not_rateable' (in-window but failed a
// mandatory-evidence gate; see not_rateable_reason on the v1.1 shape for
// the real, journal-specific reason).
export function isBlockedOrNotRateable(r: EarlyStageRating | null | undefined): boolean {
  if (!r) return false
  return isEarlyStageV1_1(r) ? r.rating_status === 'not_rateable' : r.eligibility === 'not_yet_rateable'
}

export function isUnknownLifecycle(r: EarlyStageRating | null | undefined): boolean {
  if (!r) return false
  return isEarlyStageV1_1(r) ? r.lifecycle_stage === 'unknown' : r.eligibility === 'unknown'
}

// True when a record carries a real, currently-shown AJR-E total — v1.1
// rating_status 'official' or 'provisional' (a provisional score is real
// and displayed, just not ranking-eligible, AJR-SPEC.md § 6), or legacy
// eligibility 'early_stage' (the only legacy state that ever carried a
// real score).
export function hasRealEarlyStageScore(r: EarlyStageRating | null | undefined): boolean {
  if (!r) return false
  return isEarlyStageV1_1(r) ? (r.rating_status === 'official' || r.rating_status === 'provisional') : r.eligibility === 'early_stage'
}

// True only when a record is ranking-eligible today — v1.1 rating_status
// 'official' only (AJR-SPEC.md § 6 explicitly excludes 'provisional' from
// E-Q/M-Q ranking even though its score is shown). Legacy has no such
// distinction, so 'early_stage' is the closest equivalent.
export function isOfficiallyRated(r: EarlyStageRating | null | undefined): boolean {
  if (!r) return false
  return isEarlyStageV1_1(r) ? r.rating_status === 'official' : r.eligibility === 'early_stage'
}

// The real, currently-displayable AJR-E total — null for mature records
// (see isMatureStage), legacy 'observation'/'not_yet_rateable'/'unknown',
// and v1.1 rating_status values other than 'official'/'provisional'. A
// belt-and-suspenders guard on top of the data contract (not_rateable/
// not_applicable records should already carry total: null) so a future
// data inconsistency can never render a fabricated score.
export function earlyStageDisplayTotal(r: EarlyStageRating | null | undefined): number | null {
  if (!r || isMatureStage(r)) return null
  if (isEarlyStageV1_1(r) && r.rating_status !== 'official' && r.rating_status !== 'provisional') return null
  return r.total
}

// The real, ranking-eligible quartile — null unless isOfficiallyRated(r).
// Prefers the v1.1 shape's human-readable quartile_label when present.
export function earlyStageQuartile(r: EarlyStageRating | null | undefined): string | null {
  if (!r || !isOfficiallyRated(r)) return null
  return isEarlyStageV1_1(r) ? (r.quartile_label ?? r.quartile) : r.provisional_quartile
}

// "Lifecycle" meaning lifecycle-window membership — Observation /
// Early-Stage / Mature / Unknown. Legacy's 'not_yet_rateable' isn't a
// lifecycle window at all (an evidence-bar failure that can happen inside
// the Early-Stage window) — kept as its own label for continuity with the
// old single-field display, since the legacy shape has no separate axis to
// pull a truer window value from.
export function earlyStageLifecycleLabel(r: EarlyStageRating | null | undefined): string {
  if (!r) return 'Unknown'
  const stage = isEarlyStageV1_1(r) ? r.lifecycle_stage : (r.eligibility === 'not_yet_rateable' ? null : r.eligibility)
  switch (stage) {
    case 'observation': return 'Observation'
    case 'early_stage': return 'Early-Stage'
    case 'mature': return 'Mature'
    case null: return 'Not Yet Rateable'
    case 'unknown':
    default: return 'Unknown'
  }
}

export interface EarlyStageStatusDisplay {
  label: string
  color: string
  notable: boolean
  title?: string
}

const PENDING_AJR_M_TITLE = 'AJR-M 1.0 methodology is implemented but has not been run against real evidence/citation data yet — no journal has a published M-Q.'
const NOT_YET_RATEABLE_TITLE = 'Below the minimum evidence bar — often because POSI\'s crawl was blocked (HTTP 403) by the site, not necessarily missing governance.'
const PROVISIONAL_TITLE = 'Real AJR-E score, shown, but evidence coverage is below the threshold required for E-Q ranking eligibility (AJR-SPEC.md § 6).'

// A single label/color/notability/title tuple for a one-line lifecycle
// status badge (LifecycleRatingsTable's Status column, and anywhere else a
// journal's rating state needs a compact summary). Each shape is read on
// its own terms, per its own real fields — see the module comment above for
// why this can't be one flat eligibility map once the v1.1 shape splits
// lifecycle_stage from rating_status.
export function earlyStageStatus(r: EarlyStageRating | null | undefined): EarlyStageStatusDisplay {
  if (!r) return { label: 'Unknown', color: 'var(--posi-muted)', notable: false }

  if (!isEarlyStageV1_1(r)) {
    switch (r.eligibility) {
      case 'observation': return { label: 'Observation Stage', color: 'var(--posi-muted)', notable: false }
      case 'early_stage': return { label: 'Evaluated', color: 'var(--posi-success)', notable: true }
      case 'mature': return { label: 'Pending AJR-M', color: 'var(--posi-muted)', notable: false, title: PENDING_AJR_M_TITLE }
      case 'not_yet_rateable': return { label: 'Not Yet Rateable', color: 'var(--posi-warning)', notable: true, title: NOT_YET_RATEABLE_TITLE }
      case 'unknown':
      default: return { label: 'Unknown', color: 'var(--posi-muted)', notable: false }
    }
  }

  if (r.lifecycle_stage === 'mature') {
    return { label: 'Pending AJR-M', color: 'var(--posi-muted)', notable: false, title: PENDING_AJR_M_TITLE }
  }
  switch (r.rating_status) {
    case 'official': return { label: 'Evaluated', color: 'var(--posi-success)', notable: true }
    case 'provisional': return { label: 'Provisional', color: 'var(--posi-warning)', notable: true, title: PROVISIONAL_TITLE }
    case 'not_rateable': return { label: 'Not Rateable', color: 'var(--posi-warning)', notable: true, title: r.not_rateable_reason ?? NOT_YET_RATEABLE_TITLE }
    case 'not_applicable':
    default:
      switch (r.lifecycle_stage) {
        case 'observation': return { label: 'Observation Stage', color: 'var(--posi-muted)', notable: false }
        case 'unknown':
        default: return { label: 'Unknown', color: 'var(--posi-muted)', notable: false }
      }
  }
}
