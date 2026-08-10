#!/usr/bin/env node
/**
 * fetch-citation-stats.mjs
 *
 * Precomputes OpenAlex 2-yr mean citedness (PCI preview) + Crossref PCS
 * (mean citations/article, trailing 4-yr window) for every journal in
 * core-collection.json and writes a single JSON snapshot to
 * src/lib/citation-stats.json.
 *
 * Why this exists: /citation-reports and each /journal/[code] page used to
 * each fetch OpenAlex + Crossref live at build time (see src/lib/api.ts's
 * openAlexGetSourceStats/crossrefGetCitationScore). citation-reports fired
 * one Promise.all across the whole Core Collection (~2 requests x ~25-30
 * journals, all concurrent), which under load could trip its 4s per-request
 * build timeout and fall back to null — while a single journal page's build
 * (2 concurrent requests) usually didn't. Result: the same journal could
 * show a PCS value on its own page but "—" on /citation-reports. Both pages
 * now read the same persisted snapshot instead of racing live APIs against
 * each other.
 *
 * Usage:
 *   node scripts/fetch-citation-stats.mjs                # fetch all, write src/lib/citation-stats.json
 *   node scripts/fetch-citation-stats.mjs --core path.json --out path.json
 *   node scripts/fetch-citation-stats.mjs --concurrency 5
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

function argOr(flag, fallback) {
  const i = process.argv.indexOf(flag)
  return i !== -1 ? process.argv[i + 1] : fallback
}

const CORE_PATH = resolve(argOr('--core', 'src/lib/core-collection.json'))
const OUT_PATH = resolve(argOr('--out', 'src/lib/citation-stats.json'))
const CONCURRENCY = parseInt(argOr('--concurrency', '5'), 10)

const CROSSREF = 'https://api.crossref.org'
const OPENALEX = 'https://api.openalex.org'
const UA = 'POSI/0.1 (mailto:posi@panoramagroup.org)'
const ARTICLE_FILTER = 'type:journal-article'
const PCS_SAMPLE_CAP = 200
const REQUEST_TIMEOUT_MS = 15000

async function openAlexGetSourceStats(issn) {
  try {
    const params = new URLSearchParams({
      filter: `issn:${issn}`,
      select: 'summary_stats,cited_by_count',
      mailto: 'posi@panoramagroup.org',
    })
    const res = await fetch(`${OPENALEX}/sources?${params.toString()}`, {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
    if (!res.ok) return null
    const data = await res.json()
    const source = data.results?.[0]
    if (!source) return null
    return {
      two_yr_mean_citedness: source.summary_stats?.['2yr_mean_citedness'] ?? null,
      h_index: source.summary_stats?.h_index ?? null,
      cited_by_count: source.cited_by_count ?? null,
    }
  } catch {
    return null
  }
}

async function crossrefGetCitationScore(issn) {
  try {
    const currentYear = new Date().getFullYear()
    const fromYear = currentYear - 4
    const toYear = currentYear - 1
    const params = new URLSearchParams({
      filter: `${ARTICLE_FILTER},from-pub-date:${fromYear}-01-01,until-pub-date:${toYear}-12-31`,
      rows: String(PCS_SAMPLE_CAP),
      select: 'DOI,is-referenced-by-count,published',
      mailto: 'posi@panoramagroup.org',
    })
    const res = await fetch(`${CROSSREF}/journals/${issn}/works?${params.toString()}`, {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
    if (!res.ok) return null
    const data = await res.json()
    const items = data.message?.items ?? []
    const total = data.message?.['total-results'] ?? items.length
    const window = `${fromYear}–${toYear}`
    if (items.length === 0) return { ratio: null, window, sampled_articles: 0, total_in_window: total }
    const citedSum = items.reduce((s, it) => s + (it['is-referenced-by-count'] ?? 0), 0)
    return { ratio: citedSum / items.length, window, sampled_articles: items.length, total_in_window: total }
  } catch {
    return null
  }
}

async function runPool(items, concurrency, worker) {
  const results = new Array(items.length)
  let next = 0
  async function runOne() {
    while (next < items.length) {
      const i = next++
      results[i] = await worker(items[i], i)
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, runOne))
  return results
}

async function main() {
  const journals = JSON.parse(readFileSync(CORE_PATH, 'utf-8'))
  const withIssn = journals.filter(j => j.issn_online || j.issn_print)

  console.log(`Fetching citation stats for ${withIssn.length}/${journals.length} journals (concurrency=${CONCURRENCY})...`)

  let resolved = 0
  let failed = 0
  const fetchedAt = new Date().toISOString()

  const entries = await runPool(withIssn, CONCURRENCY, async j => {
    const issn = j.issn_online ?? j.issn_print
    const [stats, pcs] = await Promise.all([
      openAlexGetSourceStats(issn),
      crossrefGetCitationScore(issn),
    ])
    if (stats?.two_yr_mean_citedness != null) resolved++
    else failed++
    return [j.journal_code, { issn, stats, pcs, fetched_at: fetchedAt }]
  })

  const out = Object.fromEntries(entries)
  writeFileSync(OUT_PATH, JSON.stringify(out, null, 2) + '\n', 'utf-8')

  console.log(`Wrote ${OUT_PATH}`)
  console.log(`${resolved} journals with an OpenAlex source record, ${failed} without.`)
}

main()
