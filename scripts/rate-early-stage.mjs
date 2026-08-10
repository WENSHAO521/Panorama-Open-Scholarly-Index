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
 * No E-Q1-E-Q4 quartile is computed: that needs a same-cohort peer group
 * within a PSC category, and PSC classification hasn't been wired into
 * ranking yet (see AJR-SPEC.md § 5 and spec status note).
 *
 * Operates directly on a corpus JSON file (Journal[]) — src/lib's vendored
 * core-collection.json/global-benchmark.json by default, or any other path
 * via --file (e.g. a posi-data checkout's corpus/core-collection.json, to
 * update the authoritative copy directly rather than this repo's vendored
 * snapshot). If you write to a posi-data checkout, commit + push there, then
 * run this repo's scripts/sync-corpus.mjs to pull the update back.
 *
 * Usage:
 *   node scripts/rate-early-stage.mjs                                     # dry run — Core Collection
 *   node scripts/rate-early-stage.mjs --write                             # inject early_stage_rating
 *   node scripts/rate-early-stage.mjs --file src/lib/global-benchmark.json --write
 *   node scripts/rate-early-stage.mjs --limit 5                           # only process first N (testing)
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

const WRITE = process.argv.includes('--write')
const LIMIT = (() => {
  const i = process.argv.indexOf('--limit')
  return i !== -1 ? parseInt(process.argv[i + 1], 10) : null
})()
// --file lets this same script rate global-benchmark.json as well as the
// default core-collection.json — same methodology, same scoring functions,
// just a different corpus file. See scripts/discover-benchmark-journals.mjs
// for what the benchmark file is.
const DATA_PATH = resolve((() => {
  const i = process.argv.indexOf('--file')
  return i !== -1 ? process.argv[i + 1] : 'src/lib/core-collection.json'
})())

const UA = 'POSI-EarlyStageRating/0.2 (+https://posi.panorama-sg.com; posi@panoramagroup.org)'
const CONCURRENCY = 4
const DELAY_MS = 500
const ARTICLE_SAMPLE_SIZE = 10

const RATING_CUTOFF = new Date()
// AJR-SPEC.md § 1's three-stage lifecycle model (posi-engine's
// lifecycle.mjs is the authoritative version of this boundary logic going
// forward — mirrored here until this script is wired to actually import
// from posi-engine, see AJR-SPEC.md § 10). Supersedes the old two-way
// rated/rated_mature split (a single 36-month boundary, no distinct
// "too young to evaluate" stage).
const OBSERVATION_MAX_MONTHS = 11   // 0-11mo: too early to evaluate at all
const EARLY_STAGE_MAX_MONTHS = 59   // 12-59mo: early_stage; 60mo+: mature
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

// English-only keyword matching silently failed every Chinese-language
// journal (several Core Collection titles, e.g. 人文学刊) even when the
// policy content was plainly present — verified directly: 编辑委员会
// ("Editorial Board") and 同行评审 ("peer review") appear right on the
// homepage of a journal this crawler was scoring as if neither existed.
// Each criterion below now checks both languages.
function extractSignals(html) {
  return {
    aimScope: hasAny(html, ['aim and scope', 'aims and scope', 'about the journal', 'journal focus', 'focus and scope', '宗旨', '办刊宗旨', '期刊简介', '关于本刊']),
    peerReview: hasAny(html, ['peer review', 'peer-review', 'peer reviewed', 'double-blind', 'single-blind', 'double blind review', '同行评审', '同行评议', '双盲评审', '盲审']),
    editorialBoard: hasAny(html, ['editorial board', 'editorial team', 'board of editors', 'editorial masthead', '编辑委员会', '编委会']),
    apc: hasAny(html, ['article processing charge', 'apc', 'publication fee', 'processing fee', '版面费', '发表费', '审稿费']),
    waiver: hasAny(html, ['waiver', 'fee waiver', 'fee discount', 'no charge', '费用减免', '费用豁免']),
    openAccess: hasAny(html, ['open access', '开放获取', '开放存取']),
    license: hasAny(html, ['creative commons', 'cc by', 'copyright notice', '知识共享', '版权声明']),
    ethics: hasAny(html, ['ethics', 'research integrity', 'code of conduct', '伦理', '科研诚信', '学术规范', '学术不端']),
    corrections: hasAny(html, ['retraction', 'correction policy', 'errata', '勘误', '撤稿', '更正声明']),
    plagiarism: hasAny(html, ['plagiarism', 'similarity check', 'turnitin', 'ithenticate', 'similarity index', '抄袭', '查重', '相似度检测', '剽窃']),
    dataAvailability: hasAny(html, ['data availability', 'data sharing', 'data accessibility', '数据可用性', '数据共享']),
    frequencyStated: hasAny(html, ['monthly', 'bimonthly', 'quarterly', 'biannual', 'annual', 'issues per year', 'continuous publication', 'rolling publication', '季刊', '月刊', '双月刊', '半年刊', '年刊', '连续出版']),
  }
}

// Large traditional-publisher platforms (Elsevier, Wiley, ACS, APS, IOP,
// OUP, ...) put policy content on dedicated subpages rather than the
// journal homepage — a homepage-only crawl systematically misread this as
// "no ethics policy"/"no editorial board" for journals that plainly have
// both, which a benchmark run against established journals (Nature, etc.)
// surfaced directly. OA-native platforms (Frontiers, most small/POSI
// journals) tend to put everything on the homepage already, so this only
// fires — and only spends the extra fetches — when the homepage alone
// left a gap.
//
// The /about/* paths are OJS's own default "About the Journal" submenu —
// verified directly against two different Core Collection OJS
// installations, which used two different slugs for the same page
// (editorialTeam vs editorialMasthead) confirming both are needed, not
// just one.
const POLICY_SUBPATHS = [
  '/about', '/for-authors', '/editorial-policies', '/ethics',
  '/about/editorialTeam', '/about/editorialMasthead', '/about/submissions', '/apc',
]

// Returns { signals, resolved }. resolved=false means the homepage itself
// couldn't be fetched at all (HTTP 403, timeout, DNS failure, ...) — every
// one of extractSignals()'s 12 criteria is then unknown/unresolved, not
// "confirmed absent". This distinction is what Evidence Coverage (see
// AJR-SPEC.md §6) is built from: "Not Yet Rateable" on a blocked site means
// POSI's crawl was blocked, not that the journal lacks real governance.
async function crawlJournalSite(websiteUrl) {
  if (!websiteUrl) return { signals: null, resolved: false }
  const home = await fetchText(websiteUrl)
  if (!home) return { signals: null, resolved: false }
  const signals = extractSignals(home)

  const stillMissing = !signals.peerReview || !signals.editorialBoard || !signals.ethics
  if (!stillMissing) return { signals, resolved: true }

  const base = websiteUrl.replace(/\/+$/, '')
  const subpages = await Promise.all(
    POLICY_SUBPATHS.map(p => fetchText(`${base}${p}`, 8000))
  )
  for (const html of subpages) {
    if (!html) continue
    const found = extractSignals(html)
    for (const key of Object.keys(signals)) {
      if (!signals[key] && found[key]) signals[key] = true
    }
  }
  return { signals, resolved: true }
}

// Both return { ok, resolved } — resolved=false when the fetch itself
// failed (blocked/timeout/etc.), distinct from a successful fetch that
// simply didn't find the expected content. See crawlJournalSite's header
// comment for why this distinction matters (Evidence Coverage, AJR-SPEC §6).
async function checkSitemap(websiteUrl) {
  if (!websiteUrl) return { ok: false, resolved: false }
  const base = websiteUrl.replace(/\/+$/, '')
  const xml = await fetchText(`${base}/sitemap.xml`, 8000)
  if (xml == null) return { ok: false, resolved: false }
  return { ok: xml.includes('<urlset') || xml.includes('<sitemapindex'), resolved: true }
}

async function checkRobots(websiteUrl) {
  if (!websiteUrl) return { ok: false, resolved: false }
  const base = websiteUrl.replace(/\/+$/, '')
  const txt = await fetchText(`${base}/robots.txt`, 8000)
  if (txt == null) return { ok: false, resolved: false }
  return { ok: !/^\s*disallow:\s*\/\s*$/im.test(txt), resolved: true }
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
  // Singleton lookup (/sources/issn:{issn}), not the filtered list endpoint
  // (/sources?filter=issn:...) — the filter/list form is metered against
  // OpenAlex's daily request budget and this script exhausted it earlier by
  // using that form here; singleton lookups are free. Same lesson already
  // applied correctly in posi-engine's openalex-enrich.mjs — this was a
  // regression specific to this newer script.
  try {
    const params = new URLSearchParams({ select: 'id,summary_stats,topics', mailto: 'posi@panoramagroup.org' })
    const res = await fetch(`https://api.openalex.org/sources/issn:${issn}?${params.toString()}`, {
      headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data?.id ? true : null
  } catch {
    return null
  }
}

// Earliest Crossref-registered work for this ISSN — used as a proxy for
// "first published" since journal launch date isn't tracked as its own field.
// A journal's first-publication date drives eligibility itself (see
// computeEligibility below) — a transient Crossref failure here doesn't
// just lose a few points, it silently downgrades the whole journal to
// 'unknown', which reads as "we don't know anything about this journal"
// rather than "one API call hiccupped". Verified directly against live
// Crossref data multiple times this run: journals scored 'unknown' had
// real, resolvable Crossref records seconds later. Worth one retry before
// giving up.
async function fetchEarliestWork(issn, attempt = 0) {
  try {
    const params = new URLSearchParams({
      rows: '1', sort: 'published', order: 'asc',
      select: 'DOI,published-print,published-online,created',
      mailto: 'posi@panoramagroup.org',
    })
    const res = await fetch(`https://api.crossref.org/journals/${issn}/works?${params.toString()}`, {
      headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) {
      if (attempt < 2) { await sleep(1000 * (attempt + 1)); return fetchEarliestWork(issn, attempt + 1) }
      return null
    }
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
    if (attempt < 2) { await sleep(1000 * (attempt + 1)); return fetchEarliestWork(issn, attempt + 1) }
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

// The AJR score itself (§4's 100-point rubric) applies to any journal that
// clears the minimum evidence bar, regardless of age — a 40-year-old
// journal's editorial governance/integrity/infrastructure evidence is just
// as computable as a new one's. Age decides two things: whether a journal
// is evaluated at all (0-11 months: 'observation', too early to mean
// anything), and which quartile track a score feeds into once it is
// ('early_stage', 12-59 months, eligible for a future E-Q1-E-Q4 once a
// real peer cohort exists; 'mature', 60+ months, whose quartile track is
// Citation Q — PCI-based — not E-Q). Neither status is a judgment about
// quality, only about which evaluation applies.
function computeEligibility({ firstPublished, monthsSinceLaunch, articleCount, site }) {
  if (!firstPublished) return 'unknown'
  if (monthsSinceLaunch <= OBSERVATION_MAX_MONTHS) return 'observation'
  const meetsBar =
    articleCount >= MIN_ARTICLES &&
    !!site?.peerReview &&
    !!site?.editorialBoard &&
    !!site?.ethics
  if (!meetsBar) return 'not_yet_rateable'
  return monthsSinceLaunch <= EARLY_STAGE_MAX_MONTHS ? 'early_stage' : 'mature'
}

// Evidence Coverage (AJR-SPEC.md §6) = resolved evidence weight / applicable
// evidence weight x 100. Scoped to the crawl-based criteria where "resolved"
// vs "blocked" is cleanly instrumentable: extractSignals()'s 12 site-content
// checks (all resolved together, since they all come from the same
// home+subpage fetches) plus sitemap.xml and robots.txt (2 more, each
// independently fetched). DOI-resolves/OpenAlex-found are deliberately
// excluded — a 404-shaped "not found" and a genuine block aren't
// distinguishable in checkDoiResolves/fetchOpenAlexStats today, so folding
// them in would silently overstate coverage rather than measure it honestly.
const EVIDENCE_COVERAGE_CRITERIA = 14 // 12 site-content signals + sitemap + robots

function computeEvidenceCoverage({ siteResolved, sitemapResolved, robotsResolved }) {
  const resolved = (siteResolved ? 12 : 0) + (sitemapResolved ? 1 : 0) + (robotsResolved ? 1 : 0)
  return Math.round((resolved / EVIDENCE_COVERAGE_CRITERIA) * 100)
}

async function rateJournal(journal) {
  const issn = journal.issnOnline ?? journal.issnPrint
  if (!issn) {
    return { id: journal.id, rating: { eligibility: 'unknown', first_published: null, months_since_launch: null, subfactors: null, total: null, evidence_coverage: null } }
  }

  const [crawlResult, sitemapResult, robotsResult, openAlexFound, firstPublished, articles] = await Promise.all([
    crawlJournalSite(journal.website_url),
    checkSitemap(journal.website_url),
    checkRobots(journal.website_url),
    fetchOpenAlexStats(issn),
    fetchEarliestWork(issn),
    fetchArticleSample(issn),
  ])
  const { signals: site, resolved: siteResolved } = crawlResult
  const { ok: sitemapOk, resolved: sitemapResolved } = sitemapResult
  const { ok: robotsOk, resolved: robotsResolved } = robotsResult
  const doiResolves = await checkDoiResolves(articles[0]?.doi ?? null)
  const evidenceCoverage = computeEvidenceCoverage({ siteResolved, sitemapResolved, robotsResolved })

  const monthsSinceLaunch = firstPublished ? monthsBetween(firstPublished, RATING_CUTOFF) : null
  const eligibility = computeEligibility({ firstPublished, monthsSinceLaunch, articleCount: journal.article_count, site })

  if (eligibility !== 'early_stage' && eligibility !== 'mature') {
    return {
      id: journal.id,
      rating: { eligibility, first_published: firstPublished, months_since_launch: monthsSinceLaunch, subfactors: null, total: null, evidence_coverage: evidenceCoverage },
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
      subfactors: { egf, rif, inf, pub, soc, rdc, trn }, total, evidence_coverage: evidenceCoverage,
    },
  }
}

// ─── Load journals from the corpus JSON file ────────────────────────────────

function toRateTarget(j) {
  return {
    id: j.id,
    website_url: j.website_url ?? null,
    issnOnline: j.issn_online ?? null,
    issnPrint: j.issn_print ?? null,
    article_count: j.article_count ?? 0,
  }
}

// ─── Apply early_stage_rating onto the in-memory corpus array ──────────────
// Machine-generated field — same "do not hand-edit, correct evidence and
// re-run" discipline as discovered-journals.ts. There is deliberately no
// code path here (or anywhere in this script) that accepts a manually-
// supplied score, percentile, or quartile as input — see spec §5.

// NOTE: always re-run scripts/rank-lifecycle.mjs after this script — every
// re-run of this script resets provisional_quartile to null (this script
// doesn't know about PSC cohorts), so a stale quartile from a previous
// rank-lifecycle.mjs run would otherwise survive un-refreshed instead of
// being recomputed against the new ratings.
function applyRating(journals, id, rating) {
  const idx = journals.findIndex(j => j.id === id)
  if (idx === -1) return
  journals[idx] = {
    ...journals[idx],
    early_stage_rating: {
      eligibility: rating.eligibility,
      first_published: rating.first_published,
      months_since_launch: rating.months_since_launch,
      subfactors: rating.subfactors,
      total: rating.total,
      evidence_coverage: rating.evidence_coverage,
      provisional_quartile: null,
      rated_at: new Date().toISOString().slice(0, 10),
      version: 'AJR-E-1.0',
    },
  }
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
  const journals = JSON.parse(readFileSync(DATA_PATH, 'utf-8'))
  const all = journals.map(toRateTarget)
  const targets = LIMIT ? all.slice(0, LIMIT) : all
  console.log(`Found ${all.length} journals in ${DATA_PATH}${LIMIT ? ` — processing first ${targets.length}` : ''}\n`)

  const results = await runBatch(targets, rateJournal, CONCURRENCY)

  const counts = { observation: 0, early_stage: 0, mature: 0, not_yet_rateable: 0, unknown: 0 }
  for (const r of results) counts[r.rating.eligibility]++
  console.log('Eligibility breakdown:', counts)

  if (WRITE) {
    for (const r of results) applyRating(journals, r.id, r.rating)
    writeFileSync(DATA_PATH, JSON.stringify(journals, null, 2) + '\n', 'utf-8')
    console.log(`\nWrote early_stage_rating for ${results.length} journals to ${DATA_PATH}`)
  } else {
    console.log('\nDry run (pass --write to persist):')
    for (const r of results) console.log(`  ${r.id}: ${r.rating.eligibility}${r.rating.total != null ? ` — ${r.rating.total}/100` : ''} (evidence coverage: ${r.rating.evidence_coverage ?? 'n/a'}%)`)
  }
}

main().catch(err => { console.error(err); process.exit(1) })
