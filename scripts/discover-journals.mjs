#!/usr/bin/env node
/**
 * discover-journals.mjs
 *
 * Discover journals from external sources and optionally write them directly
 * into src/lib/data.ts as unverified auto-discovered metadata records.
 *
 * Usage:
 *   node scripts/discover-journals.mjs --doaj "<publisher name>"
 *   node scripts/discover-journals.mjs --crossref-member <id>
 *   node scripts/discover-journals.mjs --ojs <domain>
 *
 *   Add --write to dedup against existing ISSNs and append to DISCOVERED_JOURNALS:
 *   node scripts/discover-journals.mjs --doaj "MDPI AG" --write
 *   node scripts/discover-journals.mjs --crossref-member 1968 --write
 *   node scripts/discover-journals.mjs --doaj "MDPI AG" --write --limit 50
 *
 * Without --write: prints TypeScript blocks to stdout (for manual review).
 * With    --write: deduplicates against data.ts and appends new journals.
 *
 * Requires Node.js 18+
 */

import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dir = dirname(fileURLToPath(import.meta.url))
const DATA_FILE = join(__dir, '../src/lib/data.ts')

const UA = 'POSI-Bot/1.0 (mailto:posi@panorama-sg.com; +https://posi.panorama-sg.com)'

const args = process.argv.slice(2)
const WRITE_MODE = args.includes('--write')
const LIMIT = (() => {
  const i = args.indexOf('--limit')
  return i !== -1 ? parseInt(args[i + 1], 10) : Infinity
})()
// DOAJ API key — pass via env var DOAJ_API_KEY or --doaj-key <key>
const DOAJ_KEY = (() => {
  const i = args.indexOf('--doaj-key')
  return i !== -1 ? args[i + 1] : (process.env.DOAJ_API_KEY ?? '')
})()

// ── Helpers ────────────────────────────────────────────────────────────────

function titleCase(str) {
  if (!str) return str
  return str === str.toUpperCase()
    ? str.replace(/\b\w+/g, w => w[0].toUpperCase() + w.slice(1).toLowerCase())
    : str
}

async function fetchJson(url, opts = {}) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'application/json', ...opts.headers },
    signal: AbortSignal.timeout(12000),
    ...opts,
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`)
  return res.json()
}

async function fetchXml(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA },
    signal: AbortSignal.timeout(12000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`)
  return res.text()
}

function extractTag(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'))
  return m ? m[1].trim().replace(/\s+/g, ' ') : null
}
function extractAll(xml, tag) {
  return [...xml.matchAll(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi'))].map(m => m[1].trim())
}

function slugify(str) {
  return (str ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24)
}

function parseIssns(issnArr) {
  const print = issnArr?.find(i => i.type === 'print')?.value ?? null
  const online = issnArr?.find(i => i.type === 'electronic')?.value ?? null
  return { issn_print: print, issn_online: online ?? issnArr?.[0]?.value ?? null }
}

// ── Output formatter ────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().slice(0, 10)

/**
 * Format a journal object into a TypeScript object literal.
 * All required Journal fields get safe non-null defaults.
 */
function formatEntry(j) {
  const code = j.code ?? slugify(j.title)
  const id   = `j-disc-${code}`
  // Required string fields — use safe defaults for unknown values
  const country       = j.country       ?? ''
  const language      = j.language      ?? 'English'
  const frequency     = j.frequency     ?? ''
  const license       = j.license       ?? 'Open Access'
  const peerReview    = j.peer_review_type ?? 'Peer review'
  const websiteUrl    = j.website_url   ?? ''
  const publisher     = j.publisher     ?? ''

  return `  {
    id: '${id}',
    journal_code: '${code}',
    title: ${JSON.stringify(j.title ?? '')},
    short_title: ${JSON.stringify(j.short_title ?? j.title?.split(':')[0]?.trim() ?? '')},
    issn_print: ${j.issn_print ? JSON.stringify(j.issn_print) : 'null'},
    issn_online: ${j.issn_online ? JSON.stringify(j.issn_online) : 'null'},
    publisher: ${JSON.stringify(publisher)},
    country: ${JSON.stringify(country)},
    language: ${JSON.stringify(language)},
    frequency: ${JSON.stringify(frequency)},
    open_access: true,
    license: ${JSON.stringify(license)},
    peer_review_type: ${JSON.stringify(peerReview)},
    website_url: ${JSON.stringify(websiteUrl)},
    cover_image_url: null,
    oai_base_url: ${j.oai_base_url ? JSON.stringify(j.oai_base_url) : 'null'},
    registration_country: null,
    doaj_status: ${j.doaj_status ? JSON.stringify(j.doaj_status) : "'not_listed'"},
    openalex_source_id: null,
    metadata_quality_score: 30,
    transparency_score: 30,
    indexing_readiness: 'D',
    pqf: null,
    article_count: ${j.article_count ?? 0},
    created_at: '${TODAY}T00:00:00Z',
    updated_at: '${TODAY}T00:00:00Z',
  },`
}

// ── MODE 1: OJS sitewide OAI-PMH ───────────────────────────────────────────

async function discoverOjs(domain) {
  const base = domain.startsWith('http') ? domain : `https://${domain}`
  console.error(`\n🔍  Scanning OJS server: ${base}\n`)

  const setsUrl = `${base}/index.php/index/oai?verb=ListSets`
  console.error(`    Fetching sets: ${setsUrl}`)
  const xml = await fetchXml(setsUrl)

  const setSpecList = extractAll(xml, 'setSpec')
  const setNameList = extractAll(xml, 'setName')

  const journals = []
  for (let i = 0; i < setSpecList.length; i++) {
    if (journals.length >= LIMIT) break
    const spec = setSpecList[i]
    const name = setNameList[i] ?? spec
    const slug = spec.includes(':') ? spec.split(':')[1] : spec
    if (!slug || slug === 'index') continue

    const oaiBase   = `${base}/index.php/${slug}/oai`
    const journalUrl = `${base}/index.php/${slug}`

    let issn_print = null, issn_online = null, articleCount = 0
    try {
      const recordsXml = await fetchXml(`${oaiBase}?verb=ListRecords&metadataPrefix=oai_dc`)
      const sources = extractAll(recordsXml, 'dc:source')
      const issnPattern = /\b(\d{4}-\d{3}[\dX])\b/g
      const issns = new Set()
      for (const s of sources) for (const [, issn] of s.matchAll(issnPattern)) issns.add(issn)
      const issnArr = [...issns]
      if (issnArr.length >= 2) { issnArr.sort(); issn_print = issnArr[0]; issn_online = issnArr[1] }
      else if (issnArr.length === 1) issn_online = issnArr[0]
      const totalMatch = recordsXml.match(/completeListSize="(\d+)"/) ?? recordsXml.match(/totalListSize="(\d+)"/)
      articleCount = totalMatch ? Number(totalMatch[1]) : (recordsXml.match(/<record>/g) ?? []).length
    } catch (e) {
      console.error(`    ⚠  ${slug}: ${e.message}`)
    }

    journals.push({ code: slug, title: name, short_title: name, issn_print, issn_online,
      website_url: journalUrl, oai_base_url: oaiBase, article_count: articleCount })
    console.error(`    ✓  ${slug.padEnd(16)} | ${issn_print ?? '----'} / ${issn_online ?? '----'} | ${articleCount} articles`)
  }
  return journals
}

// ── MODE 2: Crossref Member API ─────────────────────────────────────────────

async function discoverCrossrefMember(memberId) {
  console.error(`\n🔍  Fetching Crossref member ${memberId} journals\n`)

  let offset = 0
  const rows = 100
  const journals = []

  while (journals.length < LIMIT) {
    const url = `https://api.crossref.org/members/${memberId}/journals?rows=${rows}&offset=${offset}&mailto=posi@panorama-sg.com`
    console.error(`    Fetching offset ${offset}: ${url}`)
    const data = await fetchJson(url)
    const items = data?.message?.items ?? []
    if (items.length === 0) break

    for (const item of items) {
      if (journals.length >= LIMIT) break
      const issnArr = (item.ISSN ?? []).map((v, i) => ({
        value: v,
        type: item['issn-type']?.[i]?.type ?? (i === 0 ? 'electronic' : 'print'),
      }))
      const { issn_print, issn_online } = parseIssns(issnArr)
      journals.push({
        code: slugify(item.title),
        title: item.title,
        short_title: item.title,
        issn_print,
        issn_online,
        publisher: item.publisher ?? '',
        country: titleCase(item['publisher-location']) ?? '',
        website_url: item.URL ?? '',
        article_count: item['total-dois'] ?? 0,
      })
      console.error(`    ✓  ${item.title.slice(0, 44).padEnd(44)} | ${issn_print ?? '----'} / ${issn_online ?? '----'}`)
    }
    if (items.length < rows) break
    offset += rows
  }
  return journals
}

// ── MODE 3: DOAJ API ────────────────────────────────────────────────────────

async function discoverDoaj(publisherQuery) {
  console.error(`\n🔍  Searching DOAJ for publisher: "${publisherQuery}"\n`)

  const pageSize = 100
  let page = 1
  const journals = []

  while (journals.length < LIMIT) {
    const q = encodeURIComponent(`publisher:"${publisherQuery}"`)
    const keyParam = DOAJ_KEY ? `&api_key=${DOAJ_KEY}` : ''
    const url = `https://doaj.org/api/search/journals/${q}?pageSize=${pageSize}&page=${page}${keyParam}`
    console.error(`    Fetching page ${page}: ${url}`)
    const data = await fetchJson(url)
    const results = data?.results ?? []
    if (results.length === 0) break

    for (const item of results) {
      if (journals.length >= LIMIT) break
      const bib = item.bibjson ?? {}
      const issn_print   = bib.pissn ?? null
      const issn_online  = bib.eissn ?? null
      const licenseLabel = bib.license?.[0]?.type ?? 'Open Access'
      const peerType     = bib.editorial?.review_process?.[0] ?? 'Peer review'
      const lang         = bib.language?.[0] ?? 'English'

      journals.push({
        code: slugify(bib.title ?? ''),
        title: bib.title ?? 'Unknown',
        short_title: bib.title ?? 'Unknown',
        issn_print,
        issn_online,
        publisher: bib.publisher?.name ?? publisherQuery,
        country: bib.publisher?.country ?? '',
        language: lang,
        frequency: '',
        peer_review_type: peerType,
        license: licenseLabel,
        website_url: bib.ref?.journal ?? '',
        oai_base_url: null,
        doaj_status: item.admin?.in_doaj ? 'listed' : 'not_listed',
        article_count: 0,
      })
      console.error(`    ✓  ${(bib.title ?? '?').slice(0, 44).padEnd(44)} | ${issn_print ?? '----'} / ${issn_online ?? '----'}`)
    }
    if (results.length < pageSize) break
    page++
  }
  return journals
}

// ── Write mode: dedup + patch data.ts ─────────────────────────────────────

function writeToDataTs(journals) {
  const dataSrc = readFileSync(DATA_FILE, 'utf8')

  // Extract all known ISSNs already in data.ts
  const knownIssns = new Set(
    [...dataSrc.matchAll(/issn_(?:print|online):\s*'([^']+)'/g)].map(m => m[1])
  )

  // Filter out duplicates (match on either ISSN)
  const newJournals = journals.filter(j => {
    if (j.issn_online && knownIssns.has(j.issn_online)) return false
    if (j.issn_print  && knownIssns.has(j.issn_print))  return false
    return true
  })

  if (newJournals.length === 0) {
    console.error('\n✓  No new journals (all already in data.ts by ISSN).')
    return
  }

  console.error(`\nDeduplication: ${journals.length} discovered → ${newJournals.length} new (${journals.length - newJournals.length} already known)\n`)

  const entries = newJournals.map(j => formatEntry(j)).join('\n\n')

  // Insert before the // END:DISCOVERED_JOURNALS marker
  const MARKER = '// END:DISCOVERED_JOURNALS'
  if (!dataSrc.includes(MARKER)) {
    console.error('❌  Could not find // END:DISCOVERED_JOURNALS marker in data.ts')
    process.exit(1)
  }

  const updated = dataSrc.replace(MARKER, `${entries}\n${MARKER}`)
  writeFileSync(DATA_FILE, updated, 'utf8')
  console.error(`✓  Wrote ${newJournals.length} new journal(s) to DISCOVERED_JOURNALS in data.ts`)
  for (const j of newJournals) {
    console.error(`   + ${j.code.padEnd(24)} ${j.issn_online ?? j.issn_print ?? ''}  ${j.title?.slice(0, 44)}`)
  }
}

// ── CLI entrypoint ──────────────────────────────────────────────────────────

let journals = []

if (args[0] === '--ojs' && args[1]) {
  journals = await discoverOjs(args[1])
} else if (args[0] === '--crossref-member' && args[1]) {
  journals = await discoverCrossrefMember(args[1])
} else if (args[0] === '--doaj' && args[1]) {
  journals = await discoverDoaj(args[1])
} else {
  console.error(`
Usage:
  node scripts/discover-journals.mjs --ojs <domain>            [--write] [--limit N]
  node scripts/discover-journals.mjs --crossref-member <id>    [--write] [--limit N]
  node scripts/discover-journals.mjs --doaj "<publisher name>" [--write] [--limit N]

Examples:
  node scripts/discover-journals.mjs --doaj "MDPI AG" --write --limit 50
  node scripts/discover-journals.mjs --crossref-member 1968 --write --limit 30
  node scripts/discover-journals.mjs --ojs ojs.shiharr.com --write
  node scripts/discover-journals.mjs --doaj "Frontiers Media SA" --write --limit 20

Without --write: prints TypeScript blocks to stdout for manual review.
With    --write: deduplicates and appends new journals to DISCOVERED_JOURNALS in data.ts.
`)
  process.exit(1)
}

if (journals.length === 0) {
  console.error('\n⚠  No journals discovered.')
  process.exit(0)
}

console.error(`\n✓  Discovered ${journals.length} journals.`)

if (WRITE_MODE) {
  writeToDataTs(journals)
} else {
  // Print to stdout for manual review / paste
  console.error('─'.repeat(60))
  console.log(`// ── Discovered ${journals.length} journals — paste into data.ts ──`)
  console.log(`// Source: ${args.filter(a => a !== '--write').join(' ')}`)
  console.log(`// Generated: ${TODAY}`)
  console.log()
  for (const j of journals) {
    console.log(formatEntry(j))
    console.log()
  }
}
