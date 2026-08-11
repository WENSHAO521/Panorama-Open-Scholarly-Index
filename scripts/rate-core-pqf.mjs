#!/usr/bin/env node
/**
 * rate-core-pqf.mjs
 *
 * Re-computes PQF scores for the Core Collection (PSG/INDEXED/SHIHARR/
 * OTHER_INDEXED — a JSON corpus file, Journal[]) using the same direct-
 * verification methodology as auto-pqf.mjs (JTF/EGF/RIF from a live site
 * crawl, MQF from a Crossref work sample, TDF from sitemap/robots/DOI
 * checks, CVF from OpenAlex + OpenCitations) — that script only covers
 * DISCOVERED_JOURNALS (a different, TS-literal source file); this is the
 * equivalent for the manually-curated Core Collection, which until now had
 * no repeatable script and was scored by a one-off process. See CRoPT's
 * admission (2026-08) for the manual precedent this generalizes.
 *
 * Operates directly on a corpus JSON file (Journal[]) — src/lib's vendored
 * core-collection.json by default, or any other path via --file (e.g. a
 * posi-data checkout's corpus/core-collection.json, to update the
 * authoritative copy directly). If you write to a posi-data checkout,
 * commit + push there, then run this repo's scripts/sync-corpus.mjs to
 * pull the update back.
 *
 * Writes pqf, metadata_quality_score (= mqf*4), transparency_score (=
 * jtf*4), and indexing_readiness (grade with any '+' dropped, e.g. B+ ->
 * 'B') — the same relationship observed across every existing Core
 * Collection record.
 *
 * Usage:
 *   node scripts/rate-core-pqf.mjs                       # dry run — print old vs new
 *   node scripts/rate-core-pqf.mjs --write                # inject pqf/scores
 *   node scripts/rate-core-pqf.mjs --file <path> --write
 *   node scripts/rate-core-pqf.mjs --only grhas,afs        # only these journal_codes
 *   node scripts/rate-core-pqf.mjs --skip cropt            # exclude these journal_codes
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

const WRITE = process.argv.includes('--write')
const UA = 'POSI/0.1 (mailto:posi@panoramagroup.org)'
const CONCURRENCY = 5
const DELAY_MS = 300

function argList(flag) {
  const i = process.argv.indexOf(flag)
  if (i === -1) return null
  return process.argv[i + 1].split(',').map(s => s.trim()).filter(Boolean)
}

const DATA_PATH = resolve((() => {
  const i = process.argv.indexOf('--file')
  return i !== -1 ? process.argv[i + 1] : 'src/lib/core-collection.json'
})())
const ONLY = argList('--only')
const SKIP = argList('--skip') ?? []

// ─── Website crawl — same evidence categories as auto-pqf.mjs ──────────────

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

// Keyword lists include Chinese equivalents alongside the English ones — a
// meaningful share of the Core Collection (the Shiharr batch in particular)
// publishes in Chinese, and an English-only list silently reads a real,
// fully-documented Chinese-language journal as having no policies at all.
// Also fetches the homepage plus OJS's two conventional policy sub-pages
// (/about, /about/submissions) and merges their text before keyword
// matching. A single-page (homepage-only) crawl badly under-reads stock-OJS
// installs — found while re-rating the corpus: the Shiharr batch's real aim
// & scope / peer review / license / plagiarism-check text all lives on
// /about and /about/submissions, with the homepage itself just a thin
// nav + one-paragraph blurb. PSG's custom theme puts everything on one page
// (see CRoPT), which is why a homepage-only crawl happened to work there —
// it isn't representative of OJS installs generally.
async function crawlJournalSite(websiteUrl) {
  if (!websiteUrl) return null
  const base = websiteUrl.replace(/\/+$/, '')
  const [home, about, submissions] = await Promise.all([
    fetchText(base),
    fetchText(`${base}/about`),
    fetchText(`${base}/about/submissions`),
  ])
  if (!home && !about && !submissions) return null
  const text = [home, about, submissions].filter(Boolean).join(' ')
  return {
    aimScope: hasAny(text, ['aim and scope', 'aims and scope', 'about the journal', 'journal focus', 'focus and scope', '本刊简介', '关于本刊', '期刊简介', '办刊宗旨', '征稿范围', '投稿范围']),
    peerReview: hasAny(text, ['peer review', 'peer-review', 'peer reviewed', 'double-blind', 'single-blind', 'double blind review', '同行评审', '同行评议', '同行审阅', '双盲评审', '双盲评议', '匿名评审', '专家评审']),
    editorialBoard: hasAny(text, ['editorial board', 'editorial team', 'board of editors', '编委会', '编委成员', '编辑委员会', '编辑部']),
    apc: hasAny(text, ['article processing charge', 'apc', 'publication fee', 'processing fee', '版面费', '审稿费', '发表费', '稿件处理费', '超页费']),
    waiver: hasAny(text, ['waiver', 'fee waiver', 'fee discount', 'no charge', '减免', '费用减免', '免收费用', '全部免费']),
    openAccess: hasAny(text, ['open access', '开放获取', '开放存取']),
    license: hasAny(text, ['creative commons', 'cc by', 'copyright notice', '知识共享', '署名', '版权声明', '著作权声明']),
    ethics: hasAny(text, ['publication ethics', 'committee on publication ethics', 'cope guidelines', '出版伦理', '学术道德', '科研诚信', '学术不端', '伦理委员会']),
    corrections: hasAny(text, ['retraction', 'correction policy', 'errata', '撤稿', '勘误', '更正声明']),
    plagiarism: hasAny(text, ['plagiarism', 'similarity check', 'turnitin', 'ithenticate', 'similarity index', '查重', '抄袭', '剽窃', '相似度检测']),
    dataAvailability: hasAny(text, ['data availability', 'data sharing', 'data accessibility', '数据可用性', '数据共享', '数据获取声明']),
    authorshipCriteria: hasAny(text, ['authorship criteria', 'icmje', 'author contribution', '作者贡献', '署名规范', '作者资格', '同意署名']),
  }
}

// Disclosed fallback for JTF/EGF/RIF when a direct website crawl fails — see
// auto-pqf.mjs's header for the full rationale (bot-blocked sites etc.).
async function fetchDoajFallback(issn) {
  if (!issn) return null
  try {
    const res = await fetch(`https://doaj.org/api/search/journals/issn:${issn}`, {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(12000),
    })
    if (!res.ok) return null
    const data = await res.json()
    const first = data.results?.[0]
    if (!first) return null
    const bib = first.bibjson ?? {}
    const reviewProcesses = bib.editorial?.review_processes ?? []
    const license = (bib.license?.[0]?.type ?? '')
    return {
      aimScope: true,
      peerReview: reviewProcesses.some(r => String(r).toLowerCase().includes('peer')),
      editorialBoard: !!bib.editorial?.board_url,
      apc: !!bib.apc?.has_apc,
      waiver: !bib.apc?.has_apc || (bib.apc?.max?.length ?? 0) > 0,
      openAccess: true,
      license: license.length > 0,
      ethics: false,
      corrections: false,
      plagiarism: false,
      dataAvailability: false,
      authorshipCriteria: false,
    }
  } catch {
    return null
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
      method: 'HEAD',
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
    })
    return res.ok
  } catch {
    return false
  }
}

// ─── Crossref ────────────────────────────────────────────────────────────

async function fetchSampleDoi(issn) {
  try {
    const res = await fetch(`https://api.crossref.org/journals/${issn}/works?rows=1&select=DOI&mailto=posi@panoramagroup.org`, {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(10000),
    })
    if (res.ok) {
      const data = await res.json()
      const doi = data.message?.items?.[0]?.DOI
      if (doi) return doi
    }
  } catch { /* fall through to member fallback */ }
  // Crossref's journals/{issn} endpoint lags individual DOI registration for
  // brand-new journals (see CRoPT's admission) — fall back to the PSG member
  // works endpoint filtered by ISSN, same as api.ts's crossrefGetJournalWorks.
  try {
    const res = await fetch(`https://api.crossref.org/members/53186/works?filter=type:journal-article,issn:${issn}&rows=1&select=DOI&mailto=posi@panoramagroup.org`, {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.message?.items?.[0]?.DOI ?? null
  } catch {
    return null
  }
}

async function fetchCrossrefWorkSample(doi) {
  if (!doi) return null
  try {
    const res = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`, {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return null
    const data = await res.json()
    const w = data.message ?? {}
    return {
      hasAbstract: !!w.abstract,
      hasLicense: Array.isArray(w.license) && w.license.length > 0,
      hasReferences: (w['reference-count'] ?? 0) > 0,
      hasOrcid: (w.author ?? []).some(a => !!a.ORCID),
    }
  } catch {
    return null
  }
}

// ─── OpenAlex / OpenCitations ────────────────────────────────────────────

async function fetchOpenAlexStats(issn) {
  try {
    const params = new URLSearchParams({ filter: `issn:${issn}`, select: 'summary_stats,cited_by_count', mailto: 'posi@panoramagroup.org' })
    const res = await fetch(`https://api.openalex.org/sources?${params.toString()}`, {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(10000),
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

async function fetchOpenCitationsSample(doi) {
  if (!doi) return null
  try {
    const res = await fetch(`https://api.opencitations.net/index/v1/citation-count/${encodeURIComponent(doi)}`, {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return null
    const data = await res.json()
    const count = data?.[0]?.count
    return count != null ? parseInt(count, 10) : null
  } catch {
    return null
  }
}

// ─── Scoring — identical formulas to auto-pqf.mjs ───────────────────────────

function grade(total) {
  if (total >= 90) return 'A+'
  if (total >= 80) return 'A'
  if (total >= 70) return 'B+'
  if (total >= 60) return 'B'
  if (total >= 50) return 'C'
  if (total >= 40) return 'D'
  return 'E'
}

function readinessFromGrade(g) {
  if (g === 'A+' || g === 'A') return 'A'
  if (g === 'B+' || g === 'B') return 'B'
  if (g === 'C') return 'C'
  return 'D'
}

function clamp(v, max) { return Math.max(0, Math.min(v, max)) }

function scoreJtf(site) {
  if (!site) return 0
  let s = 0
  if (site.aimScope) s += 3
  if (site.peerReview) s += 4
  if (site.editorialBoard) s += 3
  if (site.apc) s += 3
  if (site.waiver) s += 2
  if (site.openAccess) s += 3
  if (site.license) s += 3
  if (site.ethics) s += 2
  if (site.corrections) s += 2
  return clamp(s, 25)
}

function scoreMqf(journal, crSample) {
  let s = 0
  if ((journal.article_count ?? 0) > 0) s += 8
  if (journal.issn_print && journal.issn_online) s += 3
  else if (journal.issn_print || journal.issn_online) s += 1
  if (crSample) {
    if (crSample.hasAbstract) s += 4
    if (crSample.hasLicense) s += 4
    if (crSample.hasReferences) s += 3
    if (crSample.hasOrcid) s += 3
  }
  return clamp(s, 25)
}

function scoreEgf(site) {
  if (!site) return 0
  let s = 0
  if (site.editorialBoard) s += 8
  if (site.peerReview) s += 6
  if (site.aimScope) s += 4
  if (site.ethics) s += 2
  return clamp(s, 20)
}

function scoreTdf(sitemapOk, robotsOk, openAlexStats, doiResolves) {
  let s = 0
  if (sitemapOk) s += 4
  if (robotsOk) s += 3
  if (openAlexStats) s += 4
  if (doiResolves) s += 4
  return clamp(s, 15)
}

function scoreCvf(openAlexStats, openCitationsCount, journal) {
  let s = 0
  if (openAlexStats) s += 4
  else if (journal.openalex_source_id) s += 1
  if (openCitationsCount != null) s += 4
  if ((journal.article_count ?? 0) > 0) s += 2
  return clamp(s, 10)
}

function scoreRif(site) {
  if (!site) return 0
  let s = 0
  if (site.corrections) s += 1
  if (site.plagiarism) s += 1
  if (site.dataAvailability) s += 1
  if (site.ethics) s += 1
  if (site.authorshipCriteria) s += 1
  return clamp(s, 5)
}

function computePqf({ site, journal, crSample, sitemapOk, robotsOk, doiResolves, openAlexStats, openCitationsCount }) {
  const jtf = scoreJtf(site)
  const mqf = scoreMqf(journal, crSample)
  const egf = scoreEgf(site)
  const tdf = scoreTdf(sitemapOk, robotsOk, openAlexStats, doiResolves)
  const cvf = scoreCvf(openAlexStats, openCitationsCount, journal)
  const rif = scoreRif(site)
  const total = jtf + mqf + egf + tdf + cvf + rif
  return { jtf, mqf, egf, tdf, cvf, rif, total, grade: grade(total) }
}

// ─── Batch runner ───────────────────────────────────────────────────────────

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function runBatch(items, fn, concurrency) {
  const results = []
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency)
    const br = await Promise.all(batch.map(fn))
    results.push(...br)
    if (i + concurrency < items.length) await sleep(DELAY_MS)
  }
  return results
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const journals = JSON.parse(readFileSync(DATA_PATH, 'utf-8'))
  let targets = journals.filter(j => (j.issn_online || j.issn_print) && !SKIP.includes(j.journal_code))
  if (ONLY) targets = targets.filter(j => ONLY.includes(j.journal_code))

  console.log(`Rating ${targets.length}/${journals.length} Core Collection journals in ${DATA_PATH} (concurrency=${CONCURRENCY})\n`)

  const results = await runBatch(targets, async (journal) => {
    const issn = journal.issn_online ?? journal.issn_print
    const [siteFromCrawl, sitemapOk, robotsOk, sampleDoi, openAlexStats] = await Promise.all([
      crawlJournalSite(journal.website_url),
      checkSitemap(journal.website_url),
      checkRobots(journal.website_url),
      fetchSampleDoi(issn),
      fetchOpenAlexStats(issn),
    ])
    const [crSample, doiResolves, openCitationsCount] = await Promise.all([
      fetchCrossrefWorkSample(sampleDoi),
      checkDoiResolves(sampleDoi),
      fetchOpenCitationsSample(sampleDoi),
    ])
    let site = siteFromCrawl
    let usedDoajFallback = false
    if (!site) {
      site = await fetchDoajFallback(issn)
      usedDoajFallback = !!site
    }
    process.stdout.write(!site ? 'x' : usedDoajFallback ? 'd' : '.')
    const scores = computePqf({ site, journal, crSample, sitemapOk, robotsOk, doiResolves, openAlexStats, openCitationsCount })
    return { journal, scores, usedDoajFallback, hasEvidence: !!site }
  }, CONCURRENCY)
  console.log('\n')

  const today = new Date().toISOString().slice(0, 10)
  let updated = 0
  let skipped = 0
  let fallbackCount = 0

  for (const { journal, scores, usedDoajFallback, hasEvidence } of results) {
    if (!hasEvidence) { skipped++; console.log(`[${journal.journal_code}] SKIPPED — no direct evidence and no DOAJ fallback available`); continue }
    if (usedDoajFallback) fallbackCount++
    const before = journal.pqf
    const beforeStr = before ? `${before.total} ${before.grade}` : '(none)'
    const afterStr = `${scores.total} ${scores.grade}`
    console.log(`[${journal.journal_code}] ${beforeStr} -> ${afterStr}  (JTF:${scores.jtf} MQF:${scores.mqf} EGF:${scores.egf} TDF:${scores.tdf} CVF:${scores.cvf} RIF:${scores.rif})${usedDoajFallback ? ' [DOAJ fallback]' : ''}`)

    if (WRITE) {
      journal.pqf = {
        total: scores.total,
        grade: scores.grade,
        subfactors: { jtf: scores.jtf, mqf: scores.mqf, egf: scores.egf, tdf: scores.tdf, cvf: scores.cvf, rif: scores.rif },
        evaluated_at: today,
        version: 'PQF v1.0',
      }
      journal.metadata_quality_score = scores.mqf * 4
      journal.transparency_score = scores.jtf * 4
      journal.indexing_readiness = readinessFromGrade(scores.grade)
      journal.updated_at = `${today}T00:00:00Z`
      updated++
    }
  }

  console.log(`\nRated: ${updated + skipped} (${fallbackCount} via DOAJ fallback)  Skipped: ${skipped}`)

  if (WRITE) {
    writeFileSync(DATA_PATH, JSON.stringify(journals, null, 2) + '\n', 'utf-8')
    console.log(`Wrote pqf/scores for ${updated} journals to ${DATA_PATH}`)
  } else {
    console.log('\nDry run. Pass --write to update the file.')
  }
}

main().catch(err => { console.error(err); process.exit(1) })
