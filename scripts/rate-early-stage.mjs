#!/usr/bin/env node
/**
 * rate-early-stage.mjs
 *
 * Computes POSI Early-Stage Journal Ratings for the Core Collection
 * (PSG_JOURNALS + INDEXED_JOURNALS + SHIHARR_JOURNALS + OTHER_INDEXED_JOURNALS
 * in data.ts) — the manually-curated "admitted" set, as opposed to the
 * unreviewed DISCOVERED_JOURNALS pool auto-pqf.mjs scores separately.
 *
 * This is a distinct methodology from PQF, not a PQF variant — see
 * posi-data's EARLY-STAGE-RATING-SPEC.md. Only 5 of the spec's 7 dimensions
 * are automated here (65 of 100 points): Scholarly Content (reading actual
 * article samples) and Scholarly Reach & Diversity (needs judgment, not a
 * keyword count) are deliberately left "pending_review" rather than
 * approximated — see the spec's own caution against shallow proxies for
 * those two. No P-Q1-P-Q4 quartile is computed: that needs a same-cohort
 * peer group within a PSC category, and PSC classification hasn't run yet.
 *
 * DOAJ listing status is not read anywhere in this file's scoring — same
 * "external metadata, zero weight" rule as everywhere else in POSI (see
 * EARLY-STAGE-RATING-SPEC.md § 5).
 *
 * Usage:
 *   node scripts/rate-early-stage.mjs                 # dry run — print ratings
 *   node scripts/rate-early-stage.mjs --write         # inject early_stage_rating into data.ts
 *   node scripts/rate-early-stage.mjs --limit 5       # only process the first N (testing)
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

const DATA_PATH = resolve('src/lib/data.ts')
const WRITE = process.argv.includes('--write')
const LIMIT = (() => {
  const i = process.argv.indexOf('--limit')
  return i !== -1 ? parseInt(process.argv[i + 1], 10) : null
})()

const UA = 'POSI-EarlyStageRating/0.1 (+https://posi.panorama-sg.com; posi@panoramagroup.org)'
const CONCURRENCY = 4
const DELAY_MS = 500

const RATING_CUTOFF = new Date()
const EARLY_STAGE_WINDOW_MONTHS = 36
const MIN_OPERATING_MONTHS = 6
const MIN_ARTICLES = 10

// ─── Low-level fetch helpers (duplicated from auto-pqf.mjs — scripts in this
// repo don't share fetch logic across files by convention, see that file's
// header) ─────────────────────────────────────────────────────────────────

async function fetchText(url, timeoutMs = 10000) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(timeoutMs), redirect: 'follow' })
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  }
}

function hasAny(text, patterns) {
  if (!text) return false
  const lower = text.toLowerCase()
  return patterns.some(p => lower.includes(p))
}

async function crawlJournalSite(websiteUrl) {
  if (!websiteUrl) return null
  const home = await fetchText(websiteUrl)
  if (!home) return null
  return {
    aimScope: hasAny(home, ['aim and scope', 'aims and scope', 'about the journal', 'journal focus', 'focus and scope']),
    peerReview: hasAny(home, ['peer review', 'peer-review', 'peer reviewed', 'double-blind', 'single-blind', 'double blind review']),
    editorialBoard: hasAny(home, ['editorial board', 'editorial team', 'board of editors']),
    apc: hasAny(home, ['article processing charge', 'apc', 'publication fee', 'processing fee']),
    waiver: hasAny(home, ['waiver', 'fee waiver', 'fee discount', 'no charge']),
    openAccess: hasAny(home, ['open access']),
    license: hasAny(home, ['creative commons', 'cc by', 'copyright notice']),
    ethics: hasAny(home, ['publication ethics', 'committee on publication ethics', 'cope guidelines']),
    corrections: hasAny(home, ['retraction', 'correction policy', 'errata']),
    plagiarism: hasAny(home, ['plagiarism', 'similarity check', 'turnitin', 'ithenticate', 'similarity index']),
    dataAvailability: hasAny(home, ['data availability', 'data sharing', 'data accessibility']),
    frequencyStated: hasAny(home, ['monthly', 'bimonthly', 'quarterly', 'biannual', 'annual', 'issues per year', 'continuous publication', 'rolling publication']),
  }
}

async function checkSitemap(websiteUrl) {
  if (!websiteUrl) return false
  const base = websiteUrl.replace(/\/+$/, '')
  const xml = await fetchText(`${base}/sitemap.xml`, 8000)
  return !!xml && (xml.includes('<urlset') || xml.includes('<sitemapindex'))
}

async function checkRobots(websiteUrl) {
  if (!websiteUrl) return false
  const base = websiteUrl.replace(/\/+$/, '')
  const txt = await fetchText(`${base}/robots.txt`, 8000)
  if (txt == null) return false
  return !/^\s*disallow:\s*\/\s*$/im.test(txt)
}

async function checkDoiResolves(doi) {
  if (!doi) return false
  try {
    const res = await fetch(`https://doi.org/${encodeURIComponent(doi)}`, {
      method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(8000),
    })
    return res.ok
  } catch {
    return false
  }
}

async function fetchOpenAlexStats(issn) {
  try {
    const params = new URLSearchParams({ filter: `issn:${issn}`, select: 'summary_stats', mailto: 'posi@panoramagroup.org' })
    const res = await fetch(`https://api.openalex.org/sources?${params.toString()}`, {
      headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.results?.[0] ? true : null
  } catch {
    return null
  }
}

// Earliest Crossref-registered work for this ISSN — used as a proxy for
// "first published" since journal launch date isn't tracked as its own field.
async function fetchEarliestWork(issn) {
  try {
    const params = new URLSearchParams({
      rows: '1', sort: 'published', order: 'asc',
      select: 'DOI,published-print,published-online,created',
      mailto: 'posi@panoramagroup.org',
    })
    const res = await fetch(`https://api.crossref.org/journals/${issn}/works?${params.toString()}`, {
      headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return null
    const data = await res.json()
    const item = data.message?.items?.[0]
    if (!item) return null
    const dateParts = item['published-print']?.['date-parts']?.[0]
      ?? item['published-online']?.['date-parts']?.[0]
      ?? item.created?.['date-parts']?.[0]
    if (!dateParts) return null
    const [y, m = 1, d = 1] = dateParts
    return new Date(Date.UTC(y, m - 1, d)).toISOString().slice(0, 10)
  } catch {
    return null
  }
}

async function fetchSampleDoi(issn) {
  try {
    const res = await fetch(`https://api.crossref.org/journals/${issn}/works?rows=1&select=DOI&mailto=posi@panoramagroup.org`, {
      headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.message?.items?.[0]?.DOI ?? null
  } catch {
    return null
  }
}

function monthsBetween(fromIso, toDate) {
  const from = new Date(fromIso)
  return (toDate.getFullYear() - from.getFullYear()) * 12 + (toDate.getMonth() - from.getMonth())
}

// ─── Scoring — 5 automatable dimensions, 65 of 100 points ──────────────────

function clamp(v, max) { return Math.max(0, Math.min(v, max)) }

function scoreEditorialGovernance(site) {
  // Editorial Governance & Peer Review /20
  if (!site) return 0
  let s = 0
  if (site.editorialBoard) s += 8
  if (site.peerReview) s += 8
  if (site.aimScope) s += 4
  return clamp(s, 20)
}

function scoreResearchIntegrity(site) {
  // Research Integrity & Publication Ethics /15
  if (!site) return 0
  let s = 0
  if (site.corrections) s += 3
  if (site.plagiarism) s += 3
  if (site.dataAvailability) s += 3
  if (site.ethics) s += 3
  if (site.editorialBoard) s += 3   // authorship/COI oversight assumed only if a governing board is disclosed
  return clamp(s, 15)
}

function scoreInfrastructure(sitemapOk, robotsOk, openAlexFound, doiResolves) {
  // Metadata & Digital Publishing Infrastructure /15
  let s = 0
  if (sitemapOk) s += 4
  if (robotsOk) s += 3
  if (openAlexFound) s += 4
  if (doiResolves) s += 4
  return clamp(s, 15)
}

function scorePublishingStability(site, articleCount, monthsSinceLaunch, doiResolves) {
  // Publishing Stability & Operational Performance /10
  let s = 0
  if (site?.frequencyStated) s += 3
  if (monthsSinceLaunch != null && monthsSinceLaunch > 0 && articleCount >= monthsSinceLaunch / 2) s += 4
  if (doiResolves) s += 3
  return clamp(s, 10)
}

function scoreTransparency(site) {
  // Openness, Data & Transparency /5
  if (!site) return 0
  let s = 0
  if (site.openAccess) s += 2
  if (site.license) s += 2
  if (site.apc || site.waiver) s += 1
  return clamp(s, 5)
}

function computeEligibility({ firstPublished, monthsSinceLaunch, articleCount, site }) {
  if (!firstPublished) return 'unknown'
  if (monthsSinceLaunch > EARLY_STAGE_WINDOW_MONTHS) return 'graduated'
  const meetsBar =
    monthsSinceLaunch >= MIN_OPERATING_MONTHS &&
    articleCount >= MIN_ARTICLES &&
    !!site?.peerReview &&
    !!site?.editorialBoard &&
    !!site?.ethics
  return meetsBar ? 'rated' : 'not_yet_rateable'
}

async function rateJournal(journal) {
  const issn = journal.issnOnline ?? journal.issnPrint
  if (!issn) {
    return { id: journal.id, rating: { eligibility: 'unknown', first_published: null, months_since_launch: null, automated_subfactors: null, automated_total: null } }
  }

  const [site, sitemapOk, robotsOk, openAlexFound, sampleDoi, firstPublished] = await Promise.all([
    crawlJournalSite(journal.website_url),
    checkSitemap(journal.website_url),
    checkRobots(journal.website_url),
    fetchOpenAlexStats(issn),
    fetchSampleDoi(issn),
    fetchEarliestWork(issn),
  ])
  const doiResolves = await checkDoiResolves(sampleDoi)

  const monthsSinceLaunch = firstPublished ? monthsBetween(firstPublished, RATING_CUTOFF) : null
  const eligibility = computeEligibility({ firstPublished, monthsSinceLaunch, articleCount: journal.article_count, site })

  if (eligibility !== 'rated') {
    return {
      id: journal.id,
      rating: { eligibility, first_published: firstPublished, months_since_launch: monthsSinceLaunch, automated_subfactors: null, automated_total: null },
    }
  }

  const egf = scoreEditorialGovernance(site)
  const rif = scoreResearchIntegrity(site)
  const inf = scoreInfrastructure(sitemapOk, robotsOk, openAlexFound, doiResolves)
  const pub = scorePublishingStability(site, journal.article_count, monthsSinceLaunch, doiResolves)
  const trn = scoreTransparency(site)
  const automated_total = egf + rif + inf + pub + trn

  return {
    id: journal.id,
    rating: {
      eligibility, first_published: firstPublished, months_since_launch: monthsSinceLaunch,
      automated_subfactors: { egf, rif, inf, pub, trn }, automated_total,
    },
  }
}

// ─── Parse the Core Collection arrays from data.ts ─────────────────────────

const CORE_ARRAYS = ['PSG_JOURNALS', 'INDEXED_JOURNALS', 'SHIHARR_JOURNALS', 'OTHER_INDEXED_JOURNALS']

function parseCoreCollection(src) {
  const journals = []
  for (const arrayName of CORE_ARRAYS) {
    const startMarker = `export const ${arrayName}: Journal[] = [`
    const start = src.indexOf(startMarker)
    if (start === -1) continue
    // Matching bracket scan — data.ts blocks are plain object literals, no nested arrays deep enough to confuse this within one journal record's top level.
    let depth = 0, i = start + startMarker.length - 1, end = -1
    for (; i < src.length; i++) {
      if (src[i] === '[') depth++
      else if (src[i] === ']') { depth--; if (depth === 0) { end = i; break } }
    }
    if (end === -1) continue
    const section = src.slice(start, end)
    const lines = section.split('\n')
    let current = null
    const flush = () => { if (current?.id) journals.push(current) }
    for (const line of lines) {
      const idM = /id:\s*'([^']+)'/.exec(line)
      if (idM) { flush(); current = { id: idM[1], code: null, issnOnline: null, issnPrint: null, websiteUrl: null, articleCount: 0 }; continue }
      if (!current) continue
      const codeM = /journal_code:\s*'([^']+)'/.exec(line); if (codeM) { current.code = codeM[1]; continue }
      const ionM = /issn_online:\s*["']([^"']+)["']/.exec(line); if (ionM) { current.issnOnline = ionM[1]; continue }
      const ipM = /issn_print:\s*["']([^"']+)["']/.exec(line); if (ipM) { current.issnPrint = ipM[1]; continue }
      const wsM = /website_url:\s*["']([^"']+)["']/.exec(line); if (wsM) { current.websiteUrl = wsM[1]; continue }
      const acM = /article_count:\s*(\d+)/.exec(line); if (acM) { current.articleCount = parseInt(acM[1], 10); continue }
    }
    flush()
  }
  return journals.map(j => ({ id: j.id, website_url: j.websiteUrl, issnOnline: j.issnOnline, issnPrint: j.issnPrint, article_count: j.articleCount }))
}

// ─── Write early_stage_rating into data.ts ─────────────────────────────────

function injectRating(src, id, rating) {
  const idIdx = src.indexOf(`id: '${id}'`)
  if (idIdx === -1) return src
  const blockEnd = src.indexOf('created_at:', idIdx)
  if (blockEnd === -1) return src

  const subfactorsLit = rating.automated_subfactors
    ? `{ egf: ${rating.automated_subfactors.egf}, rif: ${rating.automated_subfactors.rif}, inf: ${rating.automated_subfactors.inf}, pub: ${rating.automated_subfactors.pub}, trn: ${rating.automated_subfactors.trn} }`
    : 'null'
  const line = `  early_stage_rating: { eligibility: '${rating.eligibility}', first_published: ${rating.first_published ? `'${rating.first_published}'` : 'null'}, months_since_launch: ${rating.months_since_launch ?? 'null'}, automated_subfactors: ${subfactorsLit}, automated_total: ${rating.automated_total ?? 'null'}, content_status: 'pending_review', reach_status: 'pending_review', provisional_quartile: null, rated_at: '${new Date().toISOString().slice(0, 10)}', version: 'EARLY-STAGE-AUTO-0.1' },\n`

  const blockContent = src.slice(idIdx, blockEnd)
  if (blockContent.includes('early_stage_rating:')) {
    const existingIdx = src.indexOf('early_stage_rating:', idIdx)
    if (existingIdx < blockEnd) {
      const lineEnd = src.indexOf('\n', existingIdx)
      return src.slice(0, existingIdx) + line.trim() + src.slice(lineEnd)
    }
  }
  return src.slice(0, blockEnd) + line + '  ' + src.slice(blockEnd)
}

// ─── Batch runner ───────────────────────────────────────────────────────────

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function runBatch(items, fn, concurrency) {
  const results = []
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency)
    results.push(...await Promise.all(batch.map(fn)))
    if (i + concurrency < items.length) await sleep(DELAY_MS)
  }
  return results
}

async function main() {
  const src = readFileSync(DATA_PATH, 'utf-8')
  const all = parseCoreCollection(src)
  const journals = LIMIT ? all.slice(0, LIMIT) : all
  console.log(`Found ${all.length} Core Collection journals${LIMIT ? ` — processing first ${journals.length}` : ''}\n`)

  const results = await runBatch(journals, rateJournal, CONCURRENCY)

  const counts = { rated: 0, not_yet_rateable: 0, graduated: 0, unknown: 0 }
  for (const r of results) counts[r.rating.eligibility]++
  console.log('Eligibility breakdown:', counts)

  if (WRITE) {
    let out = src
    for (const r of results) out = injectRating(out, r.id, r.rating)
    writeFileSync(DATA_PATH, out, 'utf-8')
    console.log(`\nWrote early_stage_rating for ${results.length} journals to ${DATA_PATH}`)
  } else {
    console.log('\nDry run (pass --write to persist):')
    for (const r of results) console.log(`  ${r.id}: ${r.rating.eligibility}${r.rating.automated_total != null ? ` — ${r.rating.automated_total}/65` : ''}`)
  }
}

main().catch(err => { console.error(err); process.exit(1) })
