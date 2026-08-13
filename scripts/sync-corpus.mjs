#!/usr/bin/env node
/**
 * sync-corpus.mjs
 *
 * Refreshes this repo's vendored corpus snapshot from posi-data's corpus/
 * (see that repo's corpus/README.md) at a pinned commit — deliberate, not
 * automatic on every build, so this repo's git history only grows when a
 * sync is actually intended.
 *
 * src/lib/core-collection.json — full file, statically imported (small,
 * ~30 real journals, safe to bundle at build time).
 *
 * global-benchmark.json is split in two, because it no longer fits the
 * "small enough to statically import" assumption once the 2026-08
 * Elsevier/Frontiers bulk publisher-catalog expansion landed (1000 ->
 * 4289 records). Baking all of it into every page that touches
 * BENCHMARK_JOURNALS produced multi-MB static HTML pages and broke a live
 * Cloudflare Pages deployment ("Failed to publish assets") once enough
 * pages started rendering rows from it — see git history around
 * 2026-08-13 for the incident.
 *   - src/lib/global-benchmark.json  — CURATED subset only (no
 *     `source_note` — the original hand-selected validation seed, ~1000
 *     records). Statically imported as before; small enough to be safe.
 *   - public/data/global-benchmark-publisher-catalog.json — the bulk
 *     publisher-catalog expansion (`source_note` is set). NOT imported by
 *     any module — Next.js copies it into the static export as a plain
 *     asset, untouched, with zero build-time processing cost. Pages that
 *     need this data fetch it client-side at runtime
 *     (src/lib/publisher-catalog-client.ts) instead of having it baked
 *     into every page's HTML/hydration payload.
 *
 * Usage:
 *   node scripts/sync-corpus.mjs <commit-sha>
 *   node scripts/sync-corpus.mjs af68b73f3f582afe903a558e25f33a7f7881bbc6
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { resolve } from 'path'

const commit = process.argv[2]
if (!commit) {
  console.error('Usage: node scripts/sync-corpus.mjs <posi-data-commit-sha>')
  process.exit(1)
}

const UA = 'POSI-CorpusSync/0.1 (+https://posi.panorama-sg.com; posi@panoramagroup.org)'

async function fetchJson(file) {
  const url = `https://raw.githubusercontent.com/WENSHAO521/posi-data/${commit}/corpus/${file}`
  console.log(`Fetching ${url} ...`)
  const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30000) })
  if (!res.ok) throw new Error(`Failed to fetch ${file}: HTTP ${res.status}`)
  const text = await res.text()
  return JSON.parse(text) // fail fast on malformed JSON rather than writing it
}

async function main() {
  const coreCollection = await fetchJson('core-collection.json')
  writeFileSync(resolve('src/lib/core-collection.json'), JSON.stringify(coreCollection, null, 2) + '\n', 'utf-8')
  console.log(`  Wrote src/lib/core-collection.json (${coreCollection.length} records)`)

  const globalBenchmark = await fetchJson('global-benchmark.json')
  const curated = globalBenchmark.filter(j => !j.source_note)
  const publisherCatalog = globalBenchmark.filter(j => !!j.source_note)

  writeFileSync(resolve('src/lib/global-benchmark.json'), JSON.stringify(curated, null, 2) + '\n', 'utf-8')
  console.log(`  Wrote src/lib/global-benchmark.json — curated only (${curated.length} records, statically bundled)`)

  const dataDir = resolve('public/data')
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true })
  writeFileSync(resolve(dataDir, 'global-benchmark-publisher-catalog.json'), JSON.stringify(publisherCatalog), 'utf-8')
  console.log(`  Wrote public/data/global-benchmark-publisher-catalog.json — publisher-catalog expansion (${publisherCatalog.length} records, fetched client-side, NOT bundled)`)

  // Tiny, safe-to-bundle companion so build-time pages can show an accurate
  // total count (e.g. stat cards) without importing the full multi-MB file.
  // mature_evidence/not_yet_mature reflect citation_preview.history_evidence
  // only (real, checkable OpenAlex activity evidence >=5 years back) — NOT a
  // ranking split. citation_preview is diagnostic-only (rank/percentile/
  // quartile always null, status always "diagnostic_only"); see posi-data's
  // audits/migrations/citation-preview-correction-2026/ for why the earlier
  // mature_ranked/mature_unclassified split (tied to a withdrawn Citation Q
  // ranking) was removed.
  const meta = {
    count: publisherCatalog.length,
    mature_evidence: publisherCatalog.filter(j => j.citation_preview?.history_evidence?.has_activity_5y_ago === true).length,
    not_yet_mature: publisherCatalog.filter(j => j.citation_preview?.history_evidence?.has_activity_5y_ago === false).length,
    generated_at: new Date().toISOString(),
  }
  writeFileSync(resolve('src/lib/publisher-catalog-meta.json'), JSON.stringify(meta, null, 2) + '\n', 'utf-8')
  console.log(`  Wrote src/lib/publisher-catalog-meta.json — counts only, statically bundled (${JSON.stringify(meta)})`)

  console.log(`\nSynced to posi-data@${commit.slice(0, 7)}. Review the diff, then commit.`)
}

main().catch(err => { console.error(err); process.exit(1) })
