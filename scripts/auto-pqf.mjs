#!/usr/bin/env node
/**
 * auto-pqf.mjs
 *
 * Computes automated PQF scores for DISCOVERED_JOURNALS with doaj_status='listed'.
 * DOAJ listing is used as the discovery-time eligibility gate (a minimal "this
 * is a real, registered journal" bar) — that part is unchanged. Scoring itself
 * is POSI's own standard, not DOAJ's: every subfactor is computed primarily
 * from POSI's own direct verification, not from trusting a third party's
 * self-reported bibjson:
 *   - JTF/EGF/RIF: crawled directly from the journal's own website for the same
 *     evidence categories published in /pqf (aim & scope, peer review, editorial
 *     board, APC/waiver, license, ethics, corrections, plagiarism policy, etc.)
 *   - MQF: sampled directly from a Crossref work record (abstract, license,
 *     references, ORCID presence) plus ISSN/article-count completeness.
 *   - TDF: direct sitemap.xml/robots.txt probes and a live DOI-resolution check.
 *   - CVF: live OpenAlex source match + OpenCitations sample check.
 * Fallback: many journal platforms (MDPI among them) block simple server-side
 * fetches with bot protection, so a direct website crawl fails outright for a
 * meaningful share of journals. Rather than silently scoring those journals 0
 * on JTF/EGF/RIF (indistinguishable from "verified absent"), if the direct
 * crawl fails, POSI falls back to DOAJ's public bibjson as a disclosed
 * secondary signal — see fetchDoajFallback() below. This is intentionally a
 * lower-confidence path (several RIF/EGF items DOAJ bibjson doesn't cover are
 * left unscored rather than guessed) and is used only when direct verification
 * isn't possible, never as the primary source.
 * This is slower per journal than a DOAJ-only version (more live fetches per
 * journal) — budget accordingly for CI run time.
 *
 * Usage:
 *   node scripts/auto-pqf.mjs                 # dry run — print scores
 *   node scripts/auto-pqf.mjs --write         # inject auto_pqf into data.ts
 *   node scripts/auto-pqf.mjs --limit 50      # only process the first N eligible journals (testing/CI budget)
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

const DATA_PATH = resolve('src/lib/discovered-journals.ts')
const WRITE = process.argv.includes('--write')
const UA = 'POSI/0.1 (mailto:posi@panoramagroup.org)'
const CONCURRENCY = 5
const DELAY_MS = 300
const limitIdx = process.argv.indexOf('--limit')
const LIMIT = limitIdx !== -1 ? parseInt(process.argv[limitIdx + 1], 10) : null

// ─── Website crawl — POSI's own direct verification, replacing DOAJ bibjson ──

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
    authorshipCriteria: hasAny(home, ['authorship criteria', 'icmje', 'author contribution']),
  }
}

// Disclosed fallback for JTF/EGF/RIF when a direct website crawl fails (bot
// protection, timeout, dead link, etc.) — see file header. Maps DOAJ's public
// bibjson onto the same shape crawlJournalSite() returns so it flows through
// the same scoring functions, but leaves fields DOAJ doesn't cover (ethics
// detail, corrections, plagiarism, data availability, authorship criteria)
// as false rather than guessing — a weaker, lower-confidence signal by design.
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
      aimScope: true,   // DOAJ listing requires a stated aim & scope during application
      peerReview: reviewProcesses.some(r => String(r).toLowerCase().includes('peer')),
      editorialBoard: !!bib.editorial?.board_url,
      apc: !!bib.apc?.has_apc,
      waiver: !bib.apc?.has_apc || (bib.apc?.max?.length ?? 0) > 0,
      openAccess: true, // DOAJ only lists open-access journals
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
  // Crude "not blocking everything" check rather than a full robots.txt parse.
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

// ─── Crossref (article-inventory + metadata-completeness signals) ───────────

// One sample DOI per journal is enough to check completeness/resolution — not
// a per-article scoring pass.
async function fetchSampleDoi(issn) {
  try {
    const res = await fetch(`https://api.crossref.org/journals/${issn}/works?rows=1&select=DOI&mailto=posi@panoramagroup.org`, {
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

// ─── OpenAlex / OpenCitations (live citation-infrastructure checks) ─────────

async function fetchOpenAlexStats(issn) {
  try {
    const params = new URLSearchParams({
      filter: `issn:${issn}`,
      select: 'summary_stats,cited_by_count',
      mailto: 'posi@panoramagroup.org',
    })
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

// ─── Scoring ──────────────────────────────────────────────────────────────────

function grade(total) {
  if (total >= 90) return 'A+'
  if (total >= 80) return 'A'
  if (total >= 70) return 'B+'
  if (total >= 60) return 'B'
  if (total >= 50) return 'C'
  if (total >= 40) return 'D'
  return 'E'
}

function clamp(v, max) { return Math.max(0, Math.min(v, max)) }

function scoreJtf(site) {
  // JTF — Journal Transparency Factor /25 — same evidence categories as manual PQF's JTF
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
  // MQF — Metadata Quality Factor /25
  let s = 0
  if ((journal.article_count ?? 0) > 0) s += 8         // at least some DOI-registered articles
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
  // EGF — Editorial Governance Factor /20
  // POSI's automated crawl can only directly verify presence of these pages,
  // not deeper items like board geographic diversity — those require manual
  // review and are reserved for Official PQF.
  if (!site) return 0
  let s = 0
  if (site.editorialBoard) s += 8
  if (site.peerReview) s += 6
  if (site.aimScope) s += 4
  if (site.ethics) s += 2
  return clamp(s, 20)
}

function scoreTdf(sitemapOk, robotsOk, openAlexStats, doiResolves) {
  // TDF — Technical Discoverability /15
  let s = 0
  if (sitemapOk) s += 4
  if (robotsOk) s += 3
  if (openAlexStats) s += 4   // broad third-party indexing/discoverability proxy
  if (doiResolves) s += 4
  return clamp(s, 15)
}

function scoreCvf(openAlexStats, openCitationsCount, journal) {
  // CVF — Citation Visibility Factor /10 — live checks, unchanged in spirit from
  // the prior version (already didn't score raw citation volume, see /cvi).
  let s = 0
  if (openAlexStats) s += 4
  else if (journal.openalex_source_id) s += 1
  if (openCitationsCount != null) s += 4
  if ((journal.article_count ?? 0) > 0) s += 2
  return clamp(s, 10)
}

function scoreRif(site) {
  // RIF — Research Integrity Factor /5
  if (!site) return 0
  let s = 0
  if (site.corrections) s += 1
  if (site.plagiarism) s += 1
  if (site.dataAvailability) s += 1
  if (site.ethics) s += 1
  if (site.authorshipCriteria) s += 1
  return clamp(s, 5)
}

function computeAutoPqf({ site, journal, crSample, sitemapOk, robotsOk, doiResolves, openAlexStats, openCitationsCount }) {
  const jtf = scoreJtf(site)
  const mqf = scoreMqf(journal, crSample)
  const egf = scoreEgf(site)
  const tdf = scoreTdf(sitemapOk, robotsOk, openAlexStats, doiResolves)
  const cvf = scoreCvf(openAlexStats, openCitationsCount, journal)
  const rif = scoreRif(site)
  const total = jtf + mqf + egf + tdf + cvf + rif
  return { jtf, mqf, egf, tdf, cvf, rif, total, grade: grade(total) }
}

// ─── Parse discovered journals with doaj_status='listed' ─────────────────────
// DOAJ status is used only as the eligibility gate here (see file header) —
// no DOAJ field is read into the scoring functions above.

function parseDiscoveredListed(src) {
  const startMarker = "// BEGIN:DISCOVERED_JOURNALS"
  const start = src.indexOf(startMarker)
  if (start === -1) throw new Error('BEGIN:DISCOVERED_JOURNALS marker not found')

  const section = src.slice(start)
  const lines = section.split('\n')

  const journals = []
  let current = null

  const flush = () => {
    if (current?.id && current.doajStatus === 'listed') {
      journals.push({
        id: current.id,
        code: current.code,
        issnOnline: current.issnOnline,
        issnPrint: current.issnPrint,
        openalex_source_id: current.openalex,
        article_count: current.articleCount,
        website_url: current.websiteUrl,
      })
    }
  }

  for (const line of lines) {
    const idM = /id:\s*'(j-disc-[^']+)'/.exec(line)
    if (idM) {
      flush()
      current = { id: idM[1], code: null, issnOnline: null, issnPrint: null, doajStatus: null, openalex: null, articleCount: 0, websiteUrl: null }
      continue
    }
    if (!current) continue

    const codeM = /journal_code:\s*'([^']+)'/.exec(line)
    if (codeM) { current.code = codeM[1]; continue }
    const ionM = /issn_online:\s*["']([^"']+)["']/.exec(line)
    if (ionM) { current.issnOnline = ionM[1]; continue }
    const ipM = /issn_print:\s*["']([^"']+)["']/.exec(line)
    if (ipM) { current.issnPrint = ipM[1]; continue }
    const doajM = /doaj_status:\s*["']([^"']+)["']/.exec(line)
    if (doajM) { current.doajStatus = doajM[1]; continue }
    const oaM = /openalex_source_id:\s*'([^']+)'/.exec(line)
    if (oaM) { current.openalex = oaM[1]; continue }
    const acM = /article_count:\s*(\d+)/.exec(line)
    if (acM) { current.articleCount = parseInt(acM[1], 10); continue }
    const wsM = /website_url:\s*["']([^"']+)["']/.exec(line)
    if (wsM) { current.websiteUrl = wsM[1]; continue }
  }
  flush()
  return journals
}

// ─── Write auto_pqf into data.ts ─────────────────────────────────────────────

function injectAutoPqf(src, id, scores) {
  const { jtf, mqf, egf, tdf, cvf, rif } = scores

  const idIdx = src.indexOf(`id: '${id}'`)
  if (idIdx === -1) return src

  const blockEnd = src.indexOf('created_at:', idIdx)
  if (blockEnd === -1) return src

  const blockContent = src.slice(idIdx, blockEnd)

  const autoPqfLine = `  auto_pqf: autopqf(${jtf}, ${mqf}, ${egf}, ${tdf}, ${cvf}, ${rif}),\n`
  if (blockContent.includes('auto_pqf:')) {
    const autoIdx = src.indexOf('auto_pqf:', idIdx)
    if (autoIdx < blockEnd) {
      const lineEnd = src.indexOf('\n', autoIdx)
      return src.slice(0, autoIdx) + `auto_pqf: autopqf(${jtf}, ${mqf}, ${egf}, ${tdf}, ${cvf}, ${rif}),` + src.slice(lineEnd)
    }
  }

  return src.slice(0, blockEnd) + autoPqfLine + '  ' + src.slice(blockEnd)
}

// ─── Batch runner ─────────────────────────────────────────────────────────────

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

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const src = readFileSync(DATA_PATH, 'utf-8')
  const allListed = parseDiscoveredListed(src)
  const listed = LIMIT ? allListed.slice(0, LIMIT) : allListed
  console.log(`Found ${allListed.length} DISCOVERED_JOURNALS with doaj_status='listed' (eligibility gate; scoring prioritizes direct verification, DOAJ used only as a fallback when a site can't be crawled)${LIMIT ? ` — processing first ${listed.length}` : ''}\n`)

  const results = await runBatch(listed, async (j) => {
    const issn = j.issnOnline ?? j.issnPrint
    const [siteFromCrawl, sitemapOk, robotsOk, sampleDoi, openAlexStats] = await Promise.all([
      crawlJournalSite(j.website_url),
      checkSitemap(j.website_url),
      checkRobots(j.website_url),
      issn ? fetchSampleDoi(issn) : null,
      issn ? fetchOpenAlexStats(issn) : null,
    ])
    const [crSample, doiResolves, openCitationsCount] = await Promise.all([
      fetchCrossrefWorkSample(sampleDoi),
      checkDoiResolves(sampleDoi),
      fetchOpenCitationsSample(sampleDoi),
    ])
    // Direct crawl failed (bot-blocked site, dead link, no website_url at all) —
    // fall back to DOAJ's public bibjson as a disclosed, lower-confidence signal.
    let site = siteFromCrawl
    let usedDoajFallback = false
    if (!site) {
      site = await fetchDoajFallback(issn)
      usedDoajFallback = !!site
    }
    process.stdout.write(usedDoajFallback ? 'd' : '.')
    return { ...j, site, usedDoajFallback, sitemapOk, robotsOk, crSample, doiResolves, openAlexStats, openCitationsCount }
  }, CONCURRENCY)
  console.log('\n')

  let scored = 0
  let skipped = 0
  let fallbackCount = 0
  let updated = src

  for (const { id, code, website_url, usedDoajFallback, ...rest } of results) {
    if (!rest.site) { skipped++; continue }  // no direct evidence and no DOAJ fallback available
    if (usedDoajFallback) fallbackCount++
    const journal = { article_count: rest.article_count, issn_online: rest.issnOnline, issn_print: rest.issnPrint, openalex_source_id: rest.openalex_source_id }
    const scores = computeAutoPqf({ ...rest, journal })
    scored++

    if (!WRITE) {
      console.log(`[${code}] JTF:${scores.jtf} MQF:${scores.mqf} EGF:${scores.egf} TDF:${scores.tdf} CVF:${scores.cvf} RIF:${scores.rif} → ${scores.total} ${scores.grade}${usedDoajFallback ? ' (DOAJ fallback)' : ''}`)
    } else {
      updated = injectAutoPqf(updated, id, scores)
    }
  }

  console.log(`\nScored: ${scored} (${fallbackCount} via DOAJ fallback)  Skipped (no evidence available): ${skipped}`)

  if (WRITE) {
    writeFileSync(DATA_PATH, updated, 'utf-8')
    console.log(`Written auto_pqf for ${scored} journals to data.ts`)
  } else {
    console.log('\nDry run. Pass --write to update data.ts.')
  }
}

main().catch(err => { console.error(err); process.exit(1) })
