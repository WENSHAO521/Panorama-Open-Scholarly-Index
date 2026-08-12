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
//
// As of 2026-08-13, this file holds ONLY the original curated validation
// seed (~1000 records) — sync-corpus.mjs filters out the 2026-08
// Elsevier/Frontiers bulk publisher-catalog expansion (~3300 records)
// into public/data/global-benchmark-publisher-catalog.json instead, fetched
// client-side (see publisher-catalog-client.ts) rather than statically
// bundled. Baking all ~4300 records into every page that touched
// BENCHMARK_JOURNALS produced multi-MB static HTML and broke a live
// Cloudflare Pages deployment — see git history around 2026-08-13.
import type { Journal } from './types'
import globalBenchmarkRaw from './global-benchmark.json'

export const BENCHMARK_JOURNALS: Journal[] = globalBenchmarkRaw as Journal[]

// Kept for backward compatibility with existing call sites — every record
// in this file is already curated-only (source_note is never set here),
// so this is now just an alias, not a real filter.
export const CURATED_BENCHMARK_JOURNALS: Journal[] = BENCHMARK_JOURNALS.filter(j => !j.source_note)
