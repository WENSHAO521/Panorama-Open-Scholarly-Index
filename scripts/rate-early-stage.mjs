#!/usr/bin/env node
/**
 * rate-early-stage.mjs
 *
 * Computes POSI Early-Stage Journal Ratings for the Core Collection
 * (PSG_JOURNALS + INDEXED_JOURNALS + SHIHARR_JOURNALS + OTHER_INDEXED_JOURNALS
 * in data.ts) — the manually-curated "admitted" set, as opposed to the
 * unreviewed DISCOVERED_JOURNALS pool auto-pqf.mjs scores separately.
 *
 * Fully automated 100-point methodology — see posi-data's
 * EARLY-STAGE-RATING-SPEC.md (v0.2). No code path in this file accepts a
 * manually-supplied score, percentile, or quartile: every point is computed
 * from crawled site evidence or Crossref-registered article metadata. If a
 * rating looks wrong, the fix is to correct the underlying evidence (a
 * missed policy page, a stale Crossref record) and re-run this script — not
 * to hand-edit the injected early_stage_rating field in data.ts.
 *
 * DOAJ listing status is not read anywhere in this file's scoring — same
 * "external metadata, zero weight" rule as everywhere else in POSI (see
 * EARLY-STAGE-RATING-SPEC.md § 5).
 *
 * No P-Q1-P-Q4 quartile is computed: that needs a same-cohort peer group
 * within a PSC category, and PSC classification hasn't run on any journal
 * yet (see spec status note).
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

const UA = 'POSI-EarlyStageRating/0.2 (+https://posi.panorama-sg.com; posi@panoramagroup.org)'
const CONCURRENCY = 4
const DELAY_MS = 500
const ARTICLE_SAMPLE_SIZE = 10

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

function extractDate(w) {
  const dp = w['published-print']?.['date-parts']?.[0]
    ?? w['published-online']?.['date-parts']?.[0]
    ?? w.created?.['date-parts']?.[0]
  if (!dp) return null
  const [y, m = 1, d = 1] = dp
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

// Up to N most recent Crossref-registered works, mapped to just the fields
// §4.1/§4.2's scoring functions need. This is the real, published output —
// not a policy page — that the Scholarly Output Quality Signals and
// Scholarly Reach & Concentration dimensions are computed from.
async function fetchArticleSample(issn, n = ARTICLE_SAMPLE_SIZE) {
  try {
    const params = new URLSearchParams({
      rows: String(n), sort: 'published', order: 'desc',
      select: 'DOI,title,abstract,references-count,author,license,published-print,published-online,created',
      mailto: 'posi@panoramagroup.org',
    })
    const res = await fetch(`https://api.crossref.org/journals/${issn}/works?${params.toString()}`, {
      headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(12000),
    })
    if (!res.ok) return []
    const data = await res.json()
    return (data.message?.items ?? []).map(w => ({
      doi: w.DOI ?? null,
      title: (Array.isArray(w.title) ? w.title[0] : w.title) ?? '',
      hasAbstract: !!w.abstract,
      // Crossref's /journals/{issn}/works select whitelist (and the response
      // field itself) uses "references-count" (plural) — not the
      // "reference-count" (singular) field used by the /works/{doi} single-
      // record endpoint. Confirmed directly against a 400 validation error
      // before fixing; verify against Crossref's docs again if this ever
      // starts silently returning 0s.
      referenceCount: w['references-count'] ?? 0,
      authors: (w.author ?? []).map(a => ({
        affiliation: a.affiliation?.[0]?.name ?? null,
        orcid: a.ORCID ?? null,
      })),
      hasLicense: Array.isArray(w.license) && w.license.length > 0,
      publishedDate: extractDate(w),
    }))
  } catch {
    return []
  }
}

function monthsBetween(fromIso, toDate) {
  const from = new Date(fromIso)
  return (toDate.getFullYear() - from.getFullYear()) * 12 + (toDate.getMonth() - from.getMonth())
}

// ─── Scoring — 7 dimensions, fully automated, 100 points total ─────────────

function clamp(v, max) { return Math.max(0, Math.min(v, max)) }

function scoreEditorialGovernance(site) {
  // Editorial Governance & Peer Review /15
  if (!site) return 0
  let s = 0
  if (site.editorialBoard) s += 6
  if (site.peerReview) s += 6
  if (site.aimScope) s += 3
  return clamp(s, 15)
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
  // Publishing Stability & Operational Performance /15
  let s = 0
  if (site?.frequencyStated) s += 4
  if (monthsSinceLaunch != null && monthsSinceLaunch > 0 && articleCount >= monthsSinceLaunch / 2) s += 7
  if (doiResolves) s += 4
  return clamp(s, 15)
}

function scoreTransparency(site) {
  // Openness, Data & Transparency /10
  if (!site) return 0
  let s = 0
  if (site.openAccess) s += 4
  if (site.license) s += 4
  if (site.apc || site.waiver) s += 2
  return clamp(s, 10)
}

function normalizeForDup(s) {
  return (s ?? '').toLowerCase().replace(/[^a-z0-9一-鿿]+/g, ' ').trim()
}

function scoreOutputSignals(articles) {
  // Scholarly Output Quality Signals /20 — see EARLY-STAGE-RATING-SPEC.md §4.1.
  // Computed from real sampled articles, not policy pages: structural
  // completeness, reference integrity, and publication-pattern anomalies.
  // Not a claim of verifying scientific correctness — a check for the
  // structural hallmarks of real, individually-reviewed scholarship.
  if (articles.length === 0) return 0

  let completenessSum = 0
  for (const a of articles) {
    const fields = [
      a.hasAbstract,
      a.referenceCount > 0,
      a.authors.some(x => x.affiliation),
      a.authors.some(x => x.orcid),
      a.hasLicense,
    ]
    completenessSum += fields.filter(Boolean).length / fields.length
  }
  const completeness = (completenessSum / articles.length) * 10

  const avgRefs = articles.reduce((s, a) => s + a.referenceCount, 0) / articles.length
  const refScore = avgRefs >= 15 ? 5 : avgRefs >= 8 ? 3 : avgRefs >= 1 ? 1 : 0

  let patternScore = 5
  const normTitles = articles.map(a => normalizeForDup(a.title))
  let dupFound = false
  for (let i = 0; i < normTitles.length && !dupFound; i++) {
    for (let j = i + 1; j < normTitles.length; j++) {
      if (normTitles[i] && normTitles[i] === normTitles[j]) { dupFound = true; break }
    }
  }
  if (dupFound) patternScore -= 2

  const authorCounts = new Map()
  for (const a of articles) {
    for (const au of a.authors) {
      const key = au.orcid ?? au.affiliation
      if (!key) continue
      authorCounts.set(key, (authorCounts.get(key) ?? 0) + 1)
    }
  }
  const maxAuthorShare = authorCounts.size > 0 ? Math.max(...authorCounts.values()) / articles.length : 0
  if (maxAuthorShare > 0.6) patternScore -= 2

  const dates = articles.map(a => a.publishedDate).filter(Boolean)
  if (dates.length >= 5 && new Set(dates).size === 1) patternScore -= 2

  return clamp(Math.round(completeness + refScore + clamp(patternScore, 5)), 20)
}

function normalizeAffiliation(s) {
  return s.toLowerCase().replace(/[^a-z0-9一-鿿]+/g, ' ').trim()
}

function scoreReachConcentration(articles) {
  // Scholarly Reach & Concentration /10 — see EARLY-STAGE-RATING-SPEC.md §4.2.
  // Deliberately NOT a nationality/diversity metric — flags over-reliance on
  // a single institution via a coarse, string-based affiliation match.
  const totalAuthors = articles.reduce((s, a) => s + a.authors.length, 0)
  const affiliations = articles.flatMap(a => a.authors.map(au => au.affiliation).filter(Boolean))
  // Sparse affiliation metadata is a completeness problem (already scored
  // elsewhere), not evidence of concentration — neutral default here.
  if (totalAuthors === 0 || affiliations.length / totalAuthors < 0.3) return 5

  const normalized = affiliations.map(normalizeAffiliation)
  const counts = new Map()
  for (const n of normalized) counts.set(n, (counts.get(n) ?? 0) + 1)
  const maxShare = Math.max(...counts.values()) / normalized.length
  const uniqueRatio = counts.size / normalized.length

  let s = 0
  s += maxShare <= 0.4 ? 6 : maxShare <= 0.6 ? 4 : maxShare <= 0.8 ? 2 : 0
  s += uniqueRatio >= 0.6 ? 4 : uniqueRatio >= 0.3 ? 2 : 0
  return clamp(s, 10)
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
    return { id: journal.id, rating: { eligibility: 'unknown', first_published: null, months_since_launch: null, subfactors: null, total: null } }
  }

  const [site, sitemapOk, robotsOk, openAlexFound, firstPublished, articles] = await Promise.all([
    crawlJournalSite(journal.website_url),
    checkSitemap(journal.website_url),
    checkRobots(journal.website_url),
    fetchOpenAlexStats(issn),
    fetchEarliestWork(issn),
    fetchArticleSample(issn),
  ])
  const doiResolves = await checkDoiResolves(articles[0]?.doi ?? null)

  const monthsSinceLaunch = firstPublished ? monthsBetween(firstPublished, RATING_CUTOFF) : null
  const eligibility = computeEligibility({ firstPublished, monthsSinceLaunch, articleCount: journal.article_count, site })

  if (eligibility !== 'rated') {
    return {
      id: journal.id,
      rating: { eligibility, first_published: firstPublished, months_since_launch: monthsSinceLaunch, subfactors: null, total: null },
    }
  }

  const egf = scoreEditorialGovernance(site)
  const rif = scoreResearchIntegrity(site)
  const inf = scoreInfrastructure(sitemapOk, robotsOk, openAlexFound, doiResolves)
  const pub = scorePublishingStability(site, journal.article_count, monthsSinceLaunch, doiResolves)
  const soc = scoreOutputSignals(articles)
  const rdc = scoreReachConcentration(articles)
  const trn = scoreTransparency(site)
  const total = egf + rif + inf + pub + soc + rdc + trn

  return {
    id: journal.id,
    rating: {
      eligibility, first_published: firstPublished, months_since_launch: monthsSinceLaunch,
      subfactors: { egf, rif, inf, pub, soc, rdc, trn }, total,
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
// Machine-generated field — same "do not hand-edit, correct evidence and
// re-run" discipline as discovered-journals.ts. There is deliberately no
// code path here (or anywhere in this script) that accepts a manually-
// supplied score, percentile, or quartile as input — see spec §5.

function injectRating(src, id, rating) {
  const idIdx = src.indexOf(`id: '${id}'`)
  if (idIdx === -1) return src
  const blockEnd = src.indexOf('created_at:', idIdx)
  if (blockEnd === -1) return src

  const subfactorsLit = rating.subfactors
    ? `{ egf: ${rating.subfactors.egf}, rif: ${rating.subfactors.rif}, inf: ${rating.subfactors.inf}, pub: ${rating.subfactors.pub}, soc: ${rating.subfactors.soc}, rdc: ${rating.subfactors.rdc}, trn: ${rating.subfactors.trn} }`
    : 'null'
  const line = `  early_stage_rating: { eligibility: '${rating.eligibility}', first_published: ${rating.first_published ? `'${rating.first_published}'` : 'null'}, months_since_launch: ${rating.months_since_launch ?? 'null'}, subfactors: ${subfactorsLit}, total: ${rating.total ?? 'null'}, provisional_quartile: null, rated_at: '${new Date().toISOString().slice(0, 10)}', version: 'EARLY-STAGE-AUTO-0.2' },\n`

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
    for (const r of results) console.log(`  ${r.id}: ${r.rating.eligibility}${r.rating.total != null ? ` — ${r.rating.total}/100` : ''}`)
  }
}

main().catch(err => { console.error(err); process.exit(1) })
