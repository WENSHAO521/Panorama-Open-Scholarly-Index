#!/usr/bin/env node
/**
 * sync-covers.mjs
 *
 * Automatically finds and patches cover_image_url for every journal
 * in src/lib/data.ts that currently has cover_image_url: null.
 *
 * Strategy (in order):
 *   1. Fetch the journal's website_url, look for OJS journalThumbnail in HTML
 *   2. Fall back to <meta property="og:image"> on the same page
 *   3. For OJS domains: brute-probe /public/journals/{1..60}/journalThumbnail_en.png
 *      if the URL pattern of the journal slug matches a known OJS instance
 *
 * Each candidate URL is verified with a HEAD request before being written.
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
 * Extract journal_code + website_url pairs where cover_image_url is null.
 * Matches blocks like:
 *   journal_code: 'xxx',
 *   ...
 *   website_url: 'https://...',
 *   cover_image_url: null,
 */
const BLOCK_RE = /journal_code:\s*'([^']+)'[\s\S]*?website_url:\s*(?:'([^']+)'|null),\s*\n\s*cover_image_url:\s*null,/g

const targets = []
for (const m of src.matchAll(BLOCK_RE)) {
  const code = m[1]
  const url  = m[2] ?? null
  targets.push({ code, url })
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

/** Extract origin from a URL string */
function origin(urlStr) {
  try { return new URL(urlStr).origin } catch { return null }
}

/** Make an absolute URL from a possibly-relative src and a base URL */
function toAbsolute(src, base) {
  try { return new URL(src, base).href } catch { return null }
}

// ── Cover extraction strategies ────────────────────────────────────────────

/** Strategy 1: OJS journalThumbnail in HTML (most reliable) */
function extractOjsThumbnail(html, baseUrl) {
  const m = html.match(/src="([^"]*public\/journals\/\d+\/journalThumbnail[^"]*)"/i)
  if (!m) return null
  return toAbsolute(m[1], baseUrl)
}

/** Strategy 2: og:image meta tag */
function extractOgImage(html, baseUrl) {
  const m = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)
          ?? html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i)
  if (!m) return null
  return toAbsolute(m[1], baseUrl)
}

/** Strategy 3: Brute-probe OJS sequential journal IDs */
async function probeOjsIds(domainOrigin) {
  for (let id = 1; id <= 60; id++) {
    const url = `${domainOrigin}/public/journals/${id}/journalThumbnail_en.png`
    if (await verifyImageUrl(url)) return url
  }
  return null
}

/** Known OJS domains — probe sequential IDs for these */
const OJS_DOMAINS = [
  'ojs.shiharr.com',
  'ojs.panorama-sg.com',
]

function isOjsDomain(urlStr) {
  try {
    const host = new URL(urlStr).hostname
    return OJS_DOMAINS.some(d => host === d || host.endsWith('.' + d))
  } catch { return false }
}

// ── Main loop ──────────────────────────────────────────────────────────────

const patches = [] // { code, coverUrl }

for (const { code, url } of targets) {
  process.stdout.write(`  ${code.padEnd(14)} `)

  if (!url) {
    console.log('— no website_url, skipping')
    continue
  }

  // Fetch journal homepage
  const html = await fetchHtml(url)
  if (!html) {
    console.log('— could not fetch page')
    continue
  }

  let coverUrl = null

  // 1. OJS thumbnail in HTML
  coverUrl = extractOjsThumbnail(html, url)
  if (coverUrl && !(await verifyImageUrl(coverUrl))) coverUrl = null

  // 2. og:image
  if (!coverUrl) {
    coverUrl = extractOgImage(html, url)
    if (coverUrl && !(await verifyImageUrl(coverUrl))) coverUrl = null
  }

  // 3. Brute-probe OJS IDs for known OJS servers
  if (!coverUrl && isOjsDomain(url)) {
    const orig = origin(url)
    if (orig) coverUrl = await probeOjsIds(orig)
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

/**
 * Patch cover_image_url: null → 'url' for the first occurrence
 * that follows a matching journal_code line.
 *
 * We do this by replacing occurrences in order so that multiple null
 * entries don't all get the same cover.
 */
let updated = src
let written = 0

for (const { code, coverUrl } of patches) {
  // Find the journal block for this code and replace its cover_image_url: null
  const codeRe = new RegExp(
    `(journal_code:\\s*'${code}'[\\s\\S]*?cover_image_url:\\s*)null(,)`,
    ''  // first match only
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
