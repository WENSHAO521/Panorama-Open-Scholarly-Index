#!/usr/bin/env node
/**
 * discover-benchmark-journals.mjs
 *
 * Selects a diverse benchmark corpus of internationally established
 * journals for validating the AJR (Automated Journal Rating) methodology
 * against journals everyone already agrees are excellent — the opposite
 * failure mode of only ever testing AJR on POSI's own new journals.
 *
 * Deliberately does NOT use Web of Science (SCIE/SSCI/AHCI/ESCI) or Scopus
 * membership as a selection signal: neither is available through any open,
 * freely-redistributable API (OpenAlex's own work- and source-level schemas
 * were checked directly — `works.indexed_in` only lists arxiv/crossref/
 * pubmed/etc, and `sources` has no is_indexed_in_scopus/WoS field at all),
 * and building POSI's own benchmark corpus on top of proprietary compiled
 * lists would undercut the exact "no licensed WoS/Scopus data" principle
 * the benchmark is meant to demonstrate. Selection is instead based
 * entirely on OpenAlex's own open signals:
 *   - is_core: true (OpenAlex's own curated-core journal flag)
 *   - summary_stats.2yr_mean_citedness > 1 (real, sustained citation activity)
 *   - type: journal
 * ...then bucketed across OpenAlex's 4 top-level topic domains (Physical
 * Sciences, Life Sciences, Social Sciences, Health Sciences) and capped per
 * domain, so the benchmark isn't skewed toward whichever field happens to
 * have the largest mega-journals by raw works_count.
 *
 * Output is a separate BENCHMARK_JOURNALS array (own file, own
 * is_external_benchmark flag) — never merged into Core Collection, never
 * counted in Indexed/Metric Eligible stats, not a candidate for POSI
 * admission. It exists purely as an AJR-1.0 validation/reference set.
 *
 * Usage:
 *   node scripts/discover-benchmark-journals.mjs --write [--per-domain 50]
 */

import { writeFileSync } from 'fs'
import { resolve } from 'path'

const OUT_PATH = resolve('src/lib/benchmark-journals.ts')
const WRITE = process.argv.includes('--write')
const PER_DOMAIN = (() => {
  const i = process.argv.indexOf('--per-domain')
  return i !== -1 ? parseInt(process.argv[i + 1], 10) : 50
})()

const UA = 'POSI-BenchmarkDiscovery/0.1 (+https://posi.panorama-sg.com; posi@panoramagroup.org)'
const DOMAINS = ['Physical Sciences', 'Life Sciences', 'Social Sciences', 'Health Sciences']

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40)
}

async function fetchPage(cursor) {
  const params = new URLSearchParams({
    filter: 'type:journal,is_core:true,summary_stats.2yr_mean_citedness:>1',
    sort: 'works_count:desc',
    per_page: '200',
    cursor,
    select: 'id,display_name,issn_l,issn,host_organization_name,homepage_url,country_code,works_count,is_oa,topics',
    mailto: 'posi@panoramagroup.org',
  })
  const res = await fetch(`https://api.openalex.org/sources?${params.toString()}`, {
    headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new Error(`OpenAlex sources fetch failed: HTTP ${res.status}`)
  return res.json()
}

async function collectCandidates(maxPages = 10) {
  const all = []
  let cursor = '*'
  for (let page = 0; page < maxPages; page++) {
    const data = await fetchPage(cursor)
    all.push(...(data.results ?? []))
    cursor = data.meta?.next_cursor
    if (!cursor) break
    await new Promise(r => setTimeout(r, 300))
  }
  return all
}

function toJournal(source, index) {
  const issnOnline = source.issn_l ?? source.issn?.[0] ?? null
  const code = `bench-${slugify(source.display_name)}-${String(index).padStart(4, '0')}`
  const now = new Date().toISOString()
  return {
    id: `j-${code}`,
    journal_code: code,
    title: source.display_name,
    short_title: source.display_name.length > 40 ? source.display_name.slice(0, 37) + '...' : source.display_name,
    issn_print: null,
    issn_online: issnOnline,
    publisher: source.host_organization_name ?? 'Unknown',
    country: source.country_code ?? 'Unknown',
    language: 'English',
    frequency: '',
    open_access: !!source.is_oa,
    license: '',
    peer_review_type: '',
    website_url: source.homepage_url ?? '',
    cover_image_url: null,
    oai_base_url: null,
    registration_country: null,
    doaj_status: null,
    openalex_source_id: source.id ? source.id.replace('https://openalex.org/', '') : null,
    is_external_benchmark: true,
    metadata_quality_score: 0,
    transparency_score: 0,
    indexing_readiness: 'Internal Review',
    article_count: source.works_count ?? 0,
    created_at: now,
    updated_at: now,
  }
}

// Serializes a Journal object as a TS object literal matching data.ts's
// existing style (unquoted keys, single-quoted strings) — NOT JSON.stringify
// (double-quoted), which rate-early-stage.mjs's regex-based parser (shared
// across this codebase's data files, see its parseCoreCollection) can't
// read.
function tsLiteral(v) {
  if (v === null) return 'null'
  if (typeof v === 'boolean' || typeof v === 'number') return String(v)
  if (typeof v === 'string') return `'${v.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
  throw new Error(`Unsupported value type for TS literal: ${typeof v}`)
}

function serializeJournal(j) {
  return Object.entries(j).map(([k, v]) => `    ${k}: ${tsLiteral(v)},`).join('\n')
}

async function main() {
  console.log('Fetching candidate pool from OpenAlex (is_core=true, 2yr_mean_citedness>1, type=journal)...')
  const candidates = await collectCandidates()
  console.log(`Fetched ${candidates.length} candidates.`)

  const byDomain = new Map(DOMAINS.map(d => [d, []]))
  byDomain.set('Other', [])
  for (const c of candidates) {
    const domain = c.topics?.[0]?.domain?.display_name
    const bucket = byDomain.has(domain) ? domain : 'Other'
    byDomain.get(bucket).push(c)
  }

  const selected = []
  for (const [domain, list] of byDomain) {
    const take = list.slice(0, PER_DOMAIN)
    console.log(`  ${domain}: ${list.length} candidates, selecting ${take.length}`)
    selected.push(...take)
  }

  // De-dupe by ISSN-L / OpenAlex ID (a journal could theoretically appear
  // under more than one bucket if its top topic is ambiguous)
  const seen = new Set()
  const deduped = selected.filter(s => {
    const key = s.issn_l ?? s.id
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  console.log(`\nTotal selected (deduped): ${deduped.length}`)

  const journals = deduped.map(toJournal)

  if (!WRITE) {
    console.log('\nDry run (pass --write to persist). Sample:')
    for (const j of journals.slice(0, 10)) console.log(`  ${j.journal_code}: ${j.title} (${j.publisher})`)
    return
  }

  const lines = journals.map(j => `  {\n${serializeJournal(j)}\n  },`).join('\n')
  const out = `// Auto-generated by scripts/discover-benchmark-journals.mjs — do not edit manually.
// Rerun the script to refresh; correct upstream evidence (OpenAlex records,
// site URLs) rather than hand-editing entries here.
//
// External benchmark corpus for validating AJR-1.0 against internationally
// established journals — NOT part of the POSI Core Collection, NOT a
// candidate for POSI admission, NOT counted in Indexed/Metric Eligible
// stats. Selected purely from OpenAlex's own open signals (is_core,
// citation activity, type:journal) — no Web of Science or Scopus data
// used anywhere in this file or its generation. See
// scripts/discover-benchmark-journals.mjs's header for the full rationale.
import type { Journal } from './types'

export const BENCHMARK_JOURNALS: Journal[] = [
${lines}
]
`
  writeFileSync(OUT_PATH, out, 'utf-8')
  console.log(`Wrote ${journals.length} benchmark journals to ${OUT_PATH}`)
}

main().catch(err => { console.error(err); process.exit(1) })
