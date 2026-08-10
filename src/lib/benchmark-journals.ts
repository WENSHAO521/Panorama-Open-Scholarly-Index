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
