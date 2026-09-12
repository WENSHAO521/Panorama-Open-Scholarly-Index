// Single composition layer over the repo's existing data primitives
// (data.ts, benchmark-journals.ts, early-stage.ts, release.ts) for the
// handful of derived numbers that were previously either hardcoded
// independently per-page or recomputed with a slightly different
// expression on each page — both of which let numbers drift out of sync
// (e.g. the homepage's old hardcoded PSC category count, and its hero
// prose citing a stale total-records figure). Nothing here is a new data
// source: every export is a pure composition of exports that already
// exist elsewhere in src/lib.

import { getCoreCollection, getStats } from './data'
import { BENCHMARK_JOURNALS } from './benchmark-journals'
import publisherCatalogMeta from './publisher-catalog-meta.json'
import { hasRealEarlyStageScore, isInObservationStage, isInEarlyStageWindow, isMatureStage } from './early-stage'
import pscSnapshot from './psc-v1.0.snapshot.json'

export interface PscCategory {
  code: string
  name: string
  level: 1 | 2 | 3
  parent: string | null
  aliases?: string[]
}

export interface PscTaxonomy {
  version: string
  released: string
  basis: string
  note: string
  categories: PscCategory[]
}

// The single pinned posi-data commit for the PSC taxonomy — bump this
// (deliberately, alongside a matching update to the vendored snapshot) to
// move to a new taxonomy version. subjects/page.tsx imports this same
// constant so its "pinned to <commit>" disclosure line can never drift
// from the commit this module actually fetches.
export const PSC_PINNED_COMMIT = '2f099e80ee1d6ee553fddf0b4bef478f6fc2d889'
const TAXONOMY_URL = `https://raw.githubusercontent.com/WENSHAO521/posi-data/${PSC_PINNED_COMMIT}/taxonomy/psc/v1.0.json`

/**
 * Live-fetches the pinned PSC taxonomy, falling back to the vendored
 * snapshot (same pinned commit) if the fetch fails — mirrors
 * subjects/page.tsx's own fetch-with-fallback so both pages show the same
 * taxonomy without duplicating that logic.
 */
export async function getPscTaxonomy(): Promise<{ taxonomy: PscTaxonomy; usedFallback: boolean }> {
  try {
    const res = await fetch(TAXONOMY_URL, { signal: AbortSignal.timeout(10000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return { taxonomy: await res.json(), usedFallback: false }
  } catch (err) {
    console.warn(`[site-metrics] Live fetch of PSC taxonomy failed (${err instanceof Error ? err.message : err}) — using vendored snapshot at src/lib/psc-v1.0.snapshot.json instead.`)
    return { taxonomy: pscSnapshot as PscTaxonomy, usedFallback: true }
  }
}

export async function getPscCategoryCount(): Promise<number> {
  const { taxonomy } = await getPscTaxonomy()
  return taxonomy.categories.length
}

/**
 * External comparison corpus total: curated seed + bulk publisher-catalog
 * expansion. For a *total*, always prefer this over recomputing
 * `BENCHMARK_JOURNALS.length + publisherCatalogMeta.count` inline.
 *
 * This is NOT a replacement for `BENCHMARK_JOURNALS` itself — pages that
 * need the actual per-journal membership list (e.g. counting Global
 * Benchmark journals by PSC category, as /subjects does) only have real
 * Journal objects for the curated 993-record seed, not the ~3,300-record
 * publisher-catalog bulk expansion (which is fetched client-side and never
 * vendored into this repo — see benchmark-journals.ts). Those pages should
 * keep operating on `BENCHMARK_JOURNALS` directly; this helper is for
 * total-only surfaces (homepage coverage cards, ratings-overview coverage
 * line), not a universal substitute for the list.
 */
export function getGlobalBenchmarkTotal(): number {
  return BENCHMARK_JOURNALS.length + publisherCatalogMeta.count
}

/**
 * Lifecycle-window membership counts, scoped strictly to the Core
 * Collection — never blended with Global Benchmark journals. Mixing those
 * two populations under one unlabeled number is exactly the kind of
 * denominator confusion this module exists to prevent.
 */
export function getCoreCollectionLifecycleCounts() {
  const coreCollection = getCoreCollection()
  return {
    observation: coreCollection.filter(j => isInObservationStage(j.early_stage_rating)).length,
    earlyStage: coreCollection.filter(j => isInEarlyStageWindow(j.early_stage_rating)).length,
    mature: coreCollection.filter(j => isMatureStage(j.early_stage_rating)).length,
  }
}

/** Core Collection journals carrying a real, currently-published AJR-E score (never Mature — see hasRealEarlyStageScore). */
export function getLifecycleRatedCount(): number {
  return getCoreCollection().filter(j => hasRealEarlyStageScore(j.early_stage_rating)).length
}

/** All journal records POSI tracks in any form — Core Collection, curated Global Benchmark, and Discovered. Not a POSI-reviewed figure; see getGlobalBenchmarkTotal/getCoreCollection for reviewed subsets. */
export function getAllTrackedRecordsTotal(): number {
  return getStats().total_journals
}

/**
 * Publisher-catalog bulk-expansion total whose citation_preview evidence
 * rules OUT "mature" (see filterNotYetMature in publisher-catalog-client.ts)
 * — i.e. the "not yet mature" reference population shown on
 * /ratings/early-stage. Wraps publisherCatalogMeta.not_yet_mature so pages
 * stop importing that JSON file directly (the one gap in this module's own
 * "compose, don't re-import raw JSON per-page" convention, found during the
 * Stage 2 audit).
 */
export function getNotYetMatureTotal(): number {
  return publisherCatalogMeta.not_yet_mature
}

/**
 * Publisher-catalog bulk-expansion total whose citation_preview evidence
 * confirms "mature" (see filterMatureEvidence) — the Global Benchmark
 * reference population shown on /ratings/mature. Wraps
 * publisherCatalogMeta.mature_evidence for the same reason as
 * getNotYetMatureTotal above.
 */
export function getMatureEvidenceTotal(): number {
  return publisherCatalogMeta.mature_evidence
}
