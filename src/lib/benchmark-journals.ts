// Canonical source: posi-data's corpus/global-benchmark.json (see that
// repo's corpus/README.md). This file is a vendored snapshot, synced
// deliberately via scripts/sync-corpus.mjs - moved out of this file's old
// ~19,000-line TypeScript-literal form specifically so re-discovery/
// re-rating runs stop growing *this* repo's git history on every pass.
//
// External benchmark corpus for validating AJR-1.0 against internationally
// established journals - NOT part of the POSI Core Collection, NOT a
// candidate for POSI admission, NOT counted in Indexed/Metric Eligible
// stats. Selected purely from OpenAlex's own open signals (is_core,
// citation activity, type:journal) - no Web of Science or Scopus data
// used anywhere in this file or its generation. See
// scripts/discover-benchmark-journals.mjs's header for the full rationale.
//
// As of 2026-08-13, this file holds ONLY the original curated validation
// seed (~1000 records) - sync-corpus.mjs pulls that from posi-data-
// delivery's collections/benchmark-curated.json. The 2026-08 Elsevier/
// Frontiers bulk publisher-catalog expansion (~3300 records) is never
// vendored into this repo at all: it's fetched client-side directly from
// data.posi.panorama-sg.com (see publisher-catalog-client.ts). Baking all
// ~4300 records into every page that touched BENCHMARK_JOURNALS produced
// multi-MB static HTML and broke a live Cloudflare Pages deployment; even
// after that was fixed, the file was still a same-origin static asset
// copied into this repo's own deployment on every sync - moving it to a
// dedicated external data layer (posi-data-delivery) removes it from this
// repo's deployment surface entirely. See git history around 2026-08-13.
import type { Journal } from './types'
import globalBenchmarkRaw from './global-benchmark.json'

// Since 2026-09-30 these journals are ordinary indexed journals, not a
// separate collection: each record is presented exactly like any other
// curated record (collection_status "discovered", collection "curated").
// The source file still carries the old benchmark identity, so it is
// normalized here: the "bench-" code prefix (and "j-bench-" id prefix) is
// dropped - public/_redirects sends the old /journal/bench-*/ URLs on - and
// the is_external_benchmark flag is removed.
function asIndexed(j: Journal): Journal {
  const out: Journal = {
    ...j,
    id: j.id.replace(/^j-bench-/, 'j-'),
    journal_code: j.journal_code.replace(/^bench-/, ''),
    collection_status: j.collection_status ?? 'discovered',
  }
  delete out.is_external_benchmark
  return out
}

export const BENCHMARK_JOURNALS: Journal[] = (globalBenchmarkRaw as Journal[]).map(asIndexed)

// Kept for backward compatibility with existing call sites - every record
// in this file is already curated-only (source_note is never set here),
// so this is now just an alias, not a real filter.
export const CURATED_BENCHMARK_JOURNALS: Journal[] = BENCHMARK_JOURNALS.filter(j => !j.source_note)
