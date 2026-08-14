#!/usr/bin/env node
/**
 * sync-corpus.mjs
 *
 * Refreshes this repo's small, statically-bundled corpus files from
 * data.posi.panorama-sg.com (posi-data-delivery — see that repo's README)
 * — deliberate, not automatic on every build, so this repo's git history
 * only grows when a sync is actually intended. Always reads current.json
 * first, then follows its manifest pointer, rather than hardcoding a
 * snapshot id — matching posi-data-delivery's own documented consumption
 * pattern.
 *
 * Only pulls small collections:
 *   - src/lib/core-collection.json  — full file, statically imported
 *     (small, ~30 real journals, safe to bundle at build time).
 *   - src/lib/global-benchmark.json — the curated Global Benchmark seed
 *     only (posi-data-delivery's collections/benchmark-curated.json,
 *     already split server-side — no client-side source_note filtering
 *     needed here anymore). Small enough to bundle safely.
 *   - src/lib/pcs.json — PCS (POSI Citation Score, PCS-1.0-SPEC.md)
 *     per-journal records, one entry per journal_id including pcs: null
 *     entries. ~1024 small flat records, safe to bundle. Written through
 *     unmodified — see src/lib/pcs.ts for the typed loader.
 *
 * Does NOT pull collections/publisher-catalog.json (~5MB) — that file is
 * fetched directly from data.posi.panorama-sg.com at runtime by
 * src/lib/publisher-catalog-client.ts, never vendored into this repo or
 * its Cloudflare Pages deployment at all. Baking the full publisher-
 * catalog expansion into this repo (first as static HTML, then even as a
 * same-origin static asset copied on every sync) produced multi-MB static
 * pages that broke a live Cloudflare Pages deployment ("Failed to publish
 * assets") — see git history around 2026-08-13 for the incident, and
 * posi-data-delivery's README for why a dedicated external data layer
 * replaces vendoring entirely rather than just moving the fetch to
 * runtime within the same deployment.
 *
 * Usage:
 *   node scripts/sync-corpus.mjs
 */

import { writeFileSync } from 'fs'
import { resolve } from 'path'

// Duplicated in src/lib/publisher-catalog-client.ts (kept as a plain
// literal in each rather than a shared cross-boundary import — this is a
// standalone Node script, not part of the Next.js app, and importing from
// src/ here would tie the script's module resolution to the app's
// bundler config for no real benefit at only two call sites).
const POSI_DATA_BASE = 'https://data.posi.panorama-sg.com'

const UA = 'POSI-CorpusSync/0.2 (+https://posi.panorama-sg.com; posi@panoramagroup.org)'

async function fetchJson(url) {
  console.log(`Fetching ${url} ...`)
  const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30000) })
  if (!res.ok) throw new Error(`Failed to fetch ${url}: HTTP ${res.status}`)
  const text = await res.text()
  return JSON.parse(text) // fail fast on malformed JSON rather than writing it
}

async function main() {
  const current = await fetchJson(`${POSI_DATA_BASE}/current.json`)
  console.log(`current.json -> snapshot ${current.snapshot} (is_official_release: ${current.is_official_release})`)
  const manifest = await fetchJson(`${POSI_DATA_BASE}${current.manifest}`)
  const snapshotDir = current.manifest.replace(/\/manifest\.json$/, '')

  const coreCollection = await fetchJson(`${POSI_DATA_BASE}${snapshotDir}/collections/core-collection.json`)
  writeFileSync(resolve('src/lib/core-collection.json'), JSON.stringify(coreCollection, null, 2) + '\n', 'utf-8')
  console.log(`  Wrote src/lib/core-collection.json (${coreCollection.length} records)`)

  const curated = await fetchJson(`${POSI_DATA_BASE}${snapshotDir}/collections/benchmark-curated.json`)
  writeFileSync(resolve('src/lib/global-benchmark.json'), JSON.stringify(curated, null, 2) + '\n', 'utf-8')
  console.log(`  Wrote src/lib/global-benchmark.json — curated only (${curated.length} records, statically bundled)`)

  // Optional: older snapshots (before posi-data#22) have no collections/
  // pcs.json at all. Don't fail the whole sync over that — warn and leave
  // the existing src/lib/pcs.json untouched so a partial/older delivery
  // snapshot can't silently wipe real PCS data already synced.
  try {
    const pcs = await fetchJson(`${POSI_DATA_BASE}${snapshotDir}/collections/pcs.json`)
    writeFileSync(resolve('src/lib/pcs.json'), JSON.stringify(pcs, null, 2) + '\n', 'utf-8')
    const computed = pcs.filter(r => r.pcs != null).length
    console.log(`  Wrote src/lib/pcs.json (${pcs.length} records, ${computed} with a computed pcs value)`)
  } catch (err) {
    console.warn(`  Skipped src/lib/pcs.json — ${err.message}`)
  }

  // Tiny, safe-to-bundle companion so build-time pages can show an accurate
  // publisher-catalog total count (e.g. stat cards) without importing the
  // full multi-MB collection. mature_evidence/not_yet_mature reflect
  // citation_preview.history_evidence only (real, checkable OpenAlex
  // activity evidence >=5 years back) — NOT a ranking split.
  // citation_preview is diagnostic-only (rank/percentile/quartile always
  // null, status always "diagnostic_only"); see posi-data's audits/
  // migrations/citation-preview-correction-2026/ for why the earlier
  // mature_ranked/mature_unclassified split (tied to a withdrawn Citation
  // Q ranking) was removed. Fetched here (not derived from manifest counts)
  // so this stays correct even if the manifest's own count fields lag.
  const publisherCatalog = await fetchJson(`${POSI_DATA_BASE}${snapshotDir}/collections/publisher-catalog.json`)
  const meta = {
    count: publisherCatalog.length,
    mature_evidence: publisherCatalog.filter(j => j.citation_preview?.history_evidence?.has_activity_5y_ago === true).length,
    not_yet_mature: publisherCatalog.filter(j => j.citation_preview?.history_evidence?.has_activity_5y_ago === false).length,
    snapshot: current.snapshot,
    generated_at: new Date().toISOString(),
  }
  writeFileSync(resolve('src/lib/publisher-catalog-meta.json'), JSON.stringify(meta, null, 2) + '\n', 'utf-8')
  console.log(`  Wrote src/lib/publisher-catalog-meta.json — counts only, statically bundled (${JSON.stringify(meta)})`)

  console.log(`\nSynced to posi-data-delivery snapshot ${current.snapshot} (posi-data@${manifest.data_commit.slice(0, 7)}). Review the diff, then commit.`)
}

main().catch(err => { console.error(err); process.exit(1) })
