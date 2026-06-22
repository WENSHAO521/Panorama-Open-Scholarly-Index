#!/usr/bin/env node
/**
 * sync-covers.mjs
 *
 * Automatically finds and patches cover_image_url for every journal
 * in src/lib/data.ts that currently has cover_image_url: null.
 *
 * Strategy (in order):
 *   1. Crossref /journals/{ISSN} — check links[] for image content-type
 *   2. DOAJ /api/search/journals/issn:{ISSN} — bibjson.image_links coverart
 *   3. Fetch journal website HTML, look for OJS journalThumbnail in src attributes
 *   4. <meta property="og:image"> from same page
 *   5. For known OJS domains: brute-probe /public/journals/{1..60}/journalThumbnail_en.png
 *
 * Each candidate URL is verified with a HEAD request before being written.
 *
 * Journals that already have a non-null cover_image_url are SKIPPED.
 *
 * Usage:
 *   node scripts/sync-covers.mjs            # patch all missing covers
 *   node scripts/sync-covers.mjs --dry-run  # print what would be patched, no file write
 *
 * Requires Node.js 18+
 */

import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dir = dirname(fileURLToPath(import.meta.url))
const DATA_FILE = join(__dir, '../src/lib/data.ts')
const DRY_RUN = process.argv.includes('--dry-run')

const UA = 'POSI-Bot/1.0 (mailto:posi@panorama-sg.com; +https://posi.panorama-sg.com)'

// ── Parse journals from data.ts ────────────────────────────────────────────

const src = readFileSync(DATA_FILE, 'utf8')

/**
 * Match journal blocks where cover_image_url is explicitly null.
 * Skips COVER('...') and any string URL.
 *
 * Matches patterns like:
 *   journal_code: 'xxx',
 *   ...
 *   issn_print: '...' / null,
 *   issn_online: '...' / null,
 *   ...
 *   website_url: '...' / null,
 *   cover_image_url: null,
 */
const BLOCK_RE = /journal_code:\s*'([^']+)'([\s\S]*?)cover_image_url:\s*null,/g

const targets = []
for (const m of src.matchAll(BLOCK_RE)) {
  const code   = m[1]
  const block  = m[2]

  const websiteMatch = block.match(/website_url:\s*'([^']+)'/)
  const issnOnlineMatch = block.match(/issn_online:\s*'([^']+)'/)
  const issnPrintMatch  = block.match(/issn_print:\s*'([^']+)'/)

  targets.push({
    code,
    url:          websiteMatch?.[1]   ?? null,
    issn_online:  issnOnlineMatch?.[1] ?? null,
    issn_print:   issnPrintMatch?.[1]  ?? null,
  })
}

if (targets.length === 0) {
  console.log('✓  All journals already have cover_image_url set.')
  process.exit(0)
}

console.log(`Found ${targets.length} journal(s) with cover_image_url: null\n`)

// ── Helpers ────────────────────────────────────────────────────────────────

async function fetchHtml(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: 'text/html' },
      signal: AbortSignal.timeout(10000),
      redirect: 'follow',
    })
    if (!res.ok) return null
    return res.text()
  } catch {
    return null
  }
}

async function fetchJson(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: 'application/json' },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

/** Returns true if the URL responds with 200 and an image content-type */
async function verifyImageUrl(url) {
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(6000),
      redirect: 'follow',
    })
    if (!res.ok) return false
    const ct = res.headers.get('content-type') ?? ''
    return ct.startsWith('image/')
  } catch {
    return false
  }
}

function origin(urlStr) {
  try { return new URL(urlStr).origin } catch { return null }
}

function toAbsolute(src, base) {
  try { return new URL(src, base).href } catch { return null }
}

// ── Cover extraction strategies ────────────────────────────────────────────

/** Strategy 1: Crossref /journals/{ISSN} — links[] with image content-type */
async function coverFromCrossref(issn) {
  if (!issn) return null
  const data = await fetchJson(
    `https://api.crossref.org/journals/${issn}?mailto=posi@panorama-sg.com`
  )
  const links = data?.message?.links ?? []
  const imgLink = links.find(l =>
    typeof l['content-type'] === 'string' && l['content-type'].startsWith('image/')
  )
  return imgLink?.URL ?? null
}

/** Strategy 2: DOAJ bibjson.image_links coverart */
async function coverFromDoaj(issn) {
  if (!issn) return null
  const data = await fetchJson(
    `https://doaj.org/api/search/journals/issn:${issn}`
  )
  const bib = data?.results?.[0]?.bibjson ?? {}
  const imageLinks = bib.image_links ?? []
  const cover = imageLinks.find(l =>
    l.type === 'coverart' || l.type === 'cover'
  )
  return cover?.url ?? null
}

/** Strategy 3: OJS journalThumbnail in page HTML */
function extractOjsThumbnail(html, baseUrl) {
  const m = html.match(/src="([^"]*public\/journals\/\d+\/journalThumbnail[^"]*)"/i)
  if (!m) return null
  return toAbsolute(m[1], baseUrl)
}

/** Strategy 4: og:image meta tag */
function extractOgImage(html, baseUrl) {
  const m = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)
          ?? html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i)
  if (!m) return null
  return toAbsolute(m[1], baseUrl)
}

/** Strategy 5: Brute-probe OJS sequential journal IDs */
async function probeOjsIds(domainOrigin) {
  for (let id = 1; id <= 60; id++) {
    const url = `${domainOrigin}/public/journals/${id}/journalThumbnail_en.png`
    if (await verifyImageUrl(url)) return url
  }
  return null
}

const OJS_DOMAINS = [
  'ojs.shiharr.com',
  'ojs.panorama-sg.com',
  'journals.panorama-sg.com',
]

function isOjsDomain(urlStr) {
  try {
    const host = new URL(urlStr).hostname
    return OJS_DOMAINS.some(d => host === d || host.endsWith('.' + d))
  } catch { return false }
}

// ── Main loop ──────────────────────────────────────────────────────────────

const patches = []

for (const { code, url, issn_online, issn_print } of targets) {
  process.stdout.write(`  ${code.padEnd(16)} `)

  let coverUrl = null

  // 1. Crossref (try both ISSNs)
  for (const issn of [issn_online, issn_print].filter(Boolean)) {
    coverUrl = await coverFromCrossref(issn)
    if (coverUrl) break
  }
  if (coverUrl && !(await verifyImageUrl(coverUrl))) coverUrl = null

  // 2. DOAJ
  if (!coverUrl) {
    for (const issn of [issn_online, issn_print].filter(Boolean)) {
      coverUrl = await coverFromDoaj(issn)
      if (coverUrl) break
    }
    if (coverUrl && !(await verifyImageUrl(coverUrl))) coverUrl = null
  }

  // 3 + 4 + 5: website scraping
  if (!coverUrl && url) {
    const html = await fetchHtml(url)
    if (html) {
      // OJS thumbnail in HTML
      coverUrl = extractOjsThumbnail(html, url)
      if (coverUrl && !(await verifyImageUrl(coverUrl))) coverUrl = null

      // og:image
      if (!coverUrl) {
        coverUrl = extractOgImage(html, url)
        if (coverUrl && !(await verifyImageUrl(coverUrl))) coverUrl = null
      }
    }

    // OJS brute-probe (known domains only)
    if (!coverUrl && isOjsDomain(url)) {
      const orig = origin(url)
      if (orig) coverUrl = await probeOjsIds(orig)
    }
  }

  if (coverUrl) {
    console.log(`✓  ${coverUrl}`)
    patches.push({ code, coverUrl })
  } else {
    console.log('✗  no cover found')
  }
}

// ── Patch data.ts ──────────────────────────────────────────────────────────

console.log(`\n${DRY_RUN ? '[DRY RUN] ' : ''}${patches.length} cover(s) found.\n`)

if (patches.length === 0 || DRY_RUN) {
  if (DRY_RUN && patches.length > 0) {
    console.log('Would write:')
    for (const { code, coverUrl } of patches) {
      console.log(`  ${code}: ${coverUrl}`)
    }
  }
  process.exit(0)
}

let updated = src
let written = 0

for (const { code, coverUrl } of patches) {
  const codeRe = new RegExp(
    `(journal_code:\\s*'${code}'[\\s\\S]*?cover_image_url:\\s*)null(,)`,
    ''
  )
  const before = updated
  updated = updated.replace(codeRe, `$1'${coverUrl}'$2`)
  if (updated !== before) {
    written++
    console.log(`  Patched: ${code} → ${coverUrl}`)
  } else {
    console.warn(`  ⚠  Could not patch ${code} (regex miss)`)
  }
}

writeFileSync(DATA_FILE, updated, 'utf8')
console.log(`\n✓  Updated ${written} cover_image_url value(s) in data.ts`)
