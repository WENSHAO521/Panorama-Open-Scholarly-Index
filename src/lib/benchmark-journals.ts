// Canonical source: posi-data's corpus/global-benchmark.json (see that
// repo's corpus/README.md). This file is a vendored snapshot, synced
// deliberately via scripts/sync-corpus.mjs — moved out of this file's old
// ~19,000-line TypeScript-literal form specifically so re-discovery/
// re-rating runs stop growing *this* repo's git history on every pass.
//
// External benchmark corpus for validating AJR-1.0 against internationally
// established journals — NOT part of the POSI Core Collection, NOT a
// candidate for POSI admission, NOT counted in Indexed/Metric Eligible
// stats. Selected purely from OpenAlex's own open signals (is_core,
// citation activity, type:journal) — no Web of Science or Scopus data
// used anywhere in this file or its generation. See
// scripts/discover-benchmark-journals.mjs's header for the full rationale.
import type { Journal } from './types'
import globalBenchmarkRaw from './global-benchmark.json'

export const BENCHMARK_JOURNALS: Journal[] = globalBenchmarkRaw as Journal[]

// The original ~1000-journal curated validation seed (hand-selected via
// OpenAlex is_core/citation-activity/topic-domain-balance signals — see
// this file's header). `source_note` is only ever set by a later bulk
// publisher-catalog ingestion (2026-08: Elsevier jnlactive.csv, Frontiers
// title list), so its absence is what distinguishes the original curated
// set from that expansion — see PUBLISHER_CATALOG_JOURNALS below and
// posi-data's AJR-SPEC.md §14 ("Global Benchmark membership is not
// ranking eligibility"): the expansion set exists to validate the
// pipeline against large-scale real publisher data, not as a claim that
// every record in it is individually an "internationally established"
// journal.
export const CURATED_BENCHMARK_JOURNALS: Journal[] = BENCHMARK_JOURNALS.filter(j => !j.source_note)

// Bulk-ingested from a full publisher active-journal export, not
// individually vetted. Never rated (early_stage_rating is always null on
// these), never counted toward "internationally established" framing.
export const PUBLISHER_CATALOG_JOURNALS: Journal[] = BENCHMARK_JOURNALS.filter(j => !!j.source_note)

// Three-way split of PUBLISHER_CATALOG_JOURNALS by citation_rating (see
// posi-data's audits/migrations/benchmark-citation-q-2026/ for how this
// was computed — a provisional PSC classification + lifecycle bucket +
// Citation Q ranking, deliberately NOT a full evidence-based AJR-M score).

// Mature (>=5yr OpenAlex-visible publishing history), PSC-classified at
// high confidence, AND in a same-category cohort of >=20 — the only
// group that gets an actual Citation Q quartile. Sorted best-percentile-first.
export const MATURE_RANKED_BENCHMARK_JOURNALS: Journal[] = PUBLISHER_CATALOG_JOURNALS
  .filter(j => j.citation_rating?.lifecycle_bucket === 'mature' && j.citation_rating?.citation_q?.ranking_method === 'pci_midrank')
  .sort((a, b) => (b.citation_rating!.citation_q!.percentile ?? 0) - (a.citation_rating!.citation_q!.percentile ?? 0))

// Mature, but either PSC-unclassified/low-confidence, or classified into
// a category with fewer than 20 same-category peers to rank against —
// shown, but never given a quartile (there's nothing to rank it against).
export const MATURE_UNCLASSIFIED_BENCHMARK_JOURNALS: Journal[] = PUBLISHER_CATALOG_JOURNALS
  .filter(j => j.citation_rating?.lifecycle_bucket === 'mature' && j.citation_rating?.citation_q?.ranking_method !== 'pci_midrank')

// Not yet 5 years of OpenAlex-visible publishing history — these belong
// conceptually with Early-Stage, not Mature. See ratings/early-stage's
// benchmark section.
export const NOT_YET_MATURE_BENCHMARK_JOURNALS: Journal[] = PUBLISHER_CATALOG_JOURNALS
  .filter(j => j.citation_rating?.lifecycle_bucket === 'not_yet_mature')
