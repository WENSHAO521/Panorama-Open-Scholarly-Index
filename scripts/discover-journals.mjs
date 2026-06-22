#!/usr/bin/env node
/**
 * discover-journals.mjs
 *
 * Discover new journals from three sources and output ready-to-paste data.ts entries.
 *
 * Usage:
 *   node scripts/discover-journals.mjs --ojs <domain>
 *   node scripts/discover-journals.mjs --crossref-member <id>
 *   node scripts/discover-journals.mjs --doaj "<publisher name>"
 *
 * Examples:
 *   node scripts/discover-journals.mjs --ojs ojs.shiharr.com
 *   node scripts/discover-journals.mjs --crossref-member 53186
 *   node scripts/discover-journals.mjs --doaj "Panorama Scholarly Group"
 *
 * Output: prints a TypeScript block for each discovered journal,
 *         ready to paste into src/lib/data.ts.
 *         Unknown fields are left as null / placeholder.
 *
 * Requires Node.js 18+
 */

const UA = 'POSI-Bot/1.0 (mailto:posi@panorama-sg.com; +https://posi.panorama-sg.com)'

// ── Helpers ────────────────────────────────────────────────────────────────

function titleCase(str) {
  if (!str) return str
  return str === str.toUpperCase()
    ? str.replace(/\b\w+/g, w => w[0].toUpperCase() + w.slice(1).toLowerCase())
    : str
}

/** Fetch JSON with polite User-Agent and timeout */
async function fetchJson(url, opts = {}) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'application/json', ...opts.headers },
    signal: AbortSignal.timeout(12000),
    ...opts,
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`)
  return res.json()
}

/** Fetch XML text */
async function fetchXml(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA },
    signal: AbortSignal.timeout(12000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`)
  return res.text()
}

/** Simple XML tag extractor — no dependency on xmldom */
function extractTag(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'))
  return m ? m[1].trim().replace(/\s+/g, ' ') : null
}
function extractAll(xml, tag) {
  return [...xml.matchAll(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi'))].map(m => m[1].trim())
}

/** Slugify a title for use as journal_code */
function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 20)
}

/** Convert ISSN from label (print or online) */
function parseIssns(issnArr) {
  const print = issnArr?.find(i => i.type === 'print')?.value ?? null
  const online = issnArr?.find(i => i.type === 'electronic')?.value ?? null
  return { issn_print: print, issn_online: online ?? issnArr?.[0]?.value ?? null }
}

// ── Output formatter ────────────────────────────────────────────────────────

function formatEntry(j, index) {
  const id = `j-${j.code ?? slugify(j.title)}`
  return `  {
    id: '${id}',
    journal_code: '${j.code ?? slugify(j.title)}',
    title: '${j.title?.replace(/'/g, "\\'")}',
    short_title: '${(j.short_title ?? j.title?.split(':')[0])?.replace(/'/g, "\\'")}',
    issn_print: ${j.issn_print ? `'${j.issn_print}'` : 'null'},
    issn_online: ${j.issn_online ? `'${j.issn_online}'` : 'null'},
    publisher: '${j.publisher?.replace(/'/g, "\\'") ?? 'Unknown'}',
    country: ${j.country ? `'${j.country}'` : 'null'},
    registration_country: ${j.registration_country ? `'${j.registration_country}'` : 'null'},
    language: '${j.language ?? 'English'}',
    frequency: '${j.frequency ?? 'Unknown'}',
    peer_review_type: '${j.peer_review_type ?? 'Peer review'}',
    license: '${j.license ?? 'Open Access'}',
    website_url: ${j.website_url ? `'${j.website_url}'` : 'null'},
    cover_image_url: null,
    oai_base_url: ${j.oai_base_url ? `'${j.oai_base_url}'` : 'null'},
    indexing_readiness: 'D',
    doaj_status: ${j.doaj_status ? `'${j.doaj_status}'` : "'not_listed'"},
    article_count: ${j.article_count ?? 0},
    metadata_quality_score: 50,
    transparency_score: 50,
    pqf: null,
  },`
}

// ── MODE 1: OJS sitewide OAI-PMH ───────────────────────────────────────────

async function discoverOjs(domain) {
  const base = domain.startsWith('http') ? domain : `https://${domain}`
  console.error(`\n🔍  Scanning OJS server: ${base}\n`)

  // Sitewide ListSets — returns all journals on this OJS instance
  const setsUrl = `${base}/index.php/index/oai?verb=ListSets`
  console.error(`    Fetching sets: ${setsUrl}`)
  const xml = await fetchXml(setsUrl)

  // Each <set> has <setSpec> (slug) and <setName> (title)
  const setSpecList = extractAll(xml, 'setSpec')
  const setNameList = extractAll(xml, 'setName')

  const journals = []
  for (let i = 0; i < setSpecList.length; i++) {
    const spec = setSpecList[i]
    const name = setNameList[i] ?? spec

    // spec may be "journal:slug" or just "slug"
    const slug = spec.includes(':') ? spec.split(':')[1] : spec
    if (!slug || slug === 'index') continue

    const oaiBase = `${base}/index.php/${slug}/oai`
    const journalUrl = `${base}/index.php/${slug}`

    // Fetch Identify for this journal
    let issn_print = null
    let issn_online = null
    let articleCount = 0
    try {
      const identifyXml = await fetchXml(`${oaiBase}?verb=Identify`)
      // OJS Identify doesn't return ISSNs; get them from ListRecords
      const recordsXml = await fetchXml(`${oaiBase}?verb=ListRecords&metadataPrefix=oai_dc`)
      const sources = extractAll(recordsXml, 'dc:source')
      const issnPattern = /\b(\d{4}-\d{3}[\dX])\b/g
      const issns = new Set()
      for (const s of sources) {
        for (const [, issn] of s.matchAll(issnPattern)) issns.add(issn)
      }
      const issnArr = [...issns]
      if (issnArr.length >= 2) {
        // smaller = print, larger = online (consistent pattern across SHIHARR)
        issnArr.sort()
        issn_print = issnArr[0]
        issn_online = issnArr[1]
      } else if (issnArr.length === 1) {
        issn_online = issnArr[0]
      }

      // Count records from resumptionToken totalListSize or count <record> tags
      const totalMatch = recordsXml.match(/completeListSize="(\d+)"/)
        ?? recordsXml.match(/totalListSize="(\d+)"/)
      articleCount = totalMatch ? Number(totalMatch[1]) : (recordsXml.match(/<record>/g) ?? []).length
    } catch (e) {
      console.error(`    ⚠  ${slug}: ${e.message}`)
    }

    journals.push({
      code: slug,
      title: name,
      short_title: name,
      issn_print,
      issn_online,
      publisher: null,
      country: null,
      registration_country: null,
      website_url: journalUrl,
      oai_base_url: oaiBase,
      article_count: articleCount,
    })

    console.error(`    ✓  ${slug.padEnd(16)} | ${issn_print ?? '----'} / ${issn_online ?? '----'} | ${articleCount} articles`)
  }

  return journals
}

// ── MODE 2: Crossref Member API ─────────────────────────────────────────────

async function discoverCrossrefMember(memberId) {
  console.error(`\n🔍  Fetching Crossref member ${memberId} journals\n`)

  // Crossref /members/{id}/journals endpoint
  let offset = 0
  const rows = 100
  const journals = []

  while (true) {
    const url = `https://api.crossref.org/members/${memberId}/journals?rows=${rows}&offset=${offset}&mailto=posi@panorama-sg.com`
    console.error(`    Fetching: ${url}`)
    const data = await fetchJson(url, { headers: { 'User-Agent': UA } })
    const items = data?.message?.items ?? []
    if (items.length === 0) break

    for (const item of items) {
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
        publisher: item['publisher-location'] ?? null,
        country: titleCase(item['publisher-location']) ?? null,
        registration_country: null,
        website_url: item.URL ?? null,
        oai_base_url: null,
        article_count: item['total-dois'] ?? 0,
      })
      console.error(`    ✓  ${item.title.slice(0, 40).padEnd(40)} | ${issn_print ?? '----'} / ${issn_online ?? '----'}`)
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

  while (true) {
    const q = encodeURIComponent(`publisher:"${publisherQuery}"`)
    const url = `https://doaj.org/api/search/journals/${q}?pageSize=${pageSize}&page=${page}`
    console.error(`    Fetching page ${page}: ${url}`)
    const data = await fetchJson(url)
    const results = data?.results ?? []
    if (results.length === 0) break

    for (const item of results) {
      const bib = item.bibjson ?? {}
      const issn_print = bib.pissn ?? null
      const issn_online = bib.eissn ?? null

      const licenseLabel = bib.license?.[0]?.type ?? 'Open Access'
      const apcAmt = bib.apc?.max?.[0]
      const peerType = bib.editorial?.review_process?.[0] ?? 'Peer review'

      journals.push({
        code: slugify(bib.title ?? ''),
        title: bib.title ?? 'Unknown',
        short_title: bib.title ?? 'Unknown',
        issn_print,
        issn_online,
        publisher: bib.publisher?.name ?? null,
        country: bib.publisher?.country ?? null,
        registration_country: null,
        language: bib.language?.join(', ') ?? 'English',
        frequency: bib.publication_time_weeks ? `${bib.publication_time_weeks}w cycle` : null,
        peer_review_type: peerType,
        license: licenseLabel,
        website_url: bib.ref?.journal ?? null,
        oai_base_url: bib.ref?.oa_statement ?? null,
        doaj_status: item.admin?.in_doaj ? 'listed' : 'not_listed',
        article_count: 0,
      })

      console.error(`    ✓  ${(bib.title ?? '?').slice(0, 40).padEnd(40)} | ${issn_print ?? '----'} / ${issn_online ?? '----'}`)
    }

    if (results.length < pageSize) break
    page++
  }

  return journals
}

// ── CLI entrypoint ──────────────────────────────────────────────────────────

const args = process.argv.slice(2)
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
  node scripts/discover-journals.mjs --ojs <domain>
  node scripts/discover-journals.mjs --crossref-member <id>
  node scripts/discover-journals.mjs --doaj "<publisher name>"

Examples:
  node scripts/discover-journals.mjs --ojs ojs.shiharr.com
  node scripts/discover-journals.mjs --crossref-member 53186
  node scripts/discover-journals.mjs --doaj "Panorama Scholarly Group"
`)
  process.exit(1)
}

// ── Output ─────────────────────────────────────────────────────────────────

if (journals.length === 0) {
  console.error('\n⚠  No journals discovered.')
  process.exit(0)
}

console.error(`\n✓  Discovered ${journals.length} journals. Output below:\n`)
console.error('─'.repeat(60))

// Print to stdout — pipe to a file if needed
console.log(`// ── Discovered ${journals.length} journals — paste into data.ts ──`)
console.log(`// Source: ${args.join(' ')}`)
console.log(`// Generated: ${new Date().toISOString().slice(0, 10)}`)
console.log()
for (const j of journals) {
  console.log(formatEntry(j))
  console.log()
}
