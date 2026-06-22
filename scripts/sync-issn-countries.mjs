#!/usr/bin/env node
/**
 * sync-issn-countries.mjs
 *
 * Fetches ISSN registration countries from portal.issn.org for every journal
 * in src/lib/data.ts and patches the registration_country field in-place.
 *
 * Usage:
 *   node scripts/sync-issn-countries.mjs
 *
 * Run this whenever you add new journals to data.ts.
 * Requires Node.js 18+ (native fetch).
 */

import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dir = dirname(fileURLToPath(import.meta.url))
const DATA_FILE = join(__dir, '../src/lib/data.ts')

// ── 1. Extract all ISSN → journal_code pairs from data.ts ──────────────────

const src = readFileSync(DATA_FILE, 'utf8')

// Match lines like:  journal_code: 'grhas',
// and              issn_online: '3052-539X',
const journalBlocks = [...src.matchAll(/journal_code:\s*'([^']+)'[\s\S]*?issn_online:\s*'([^']+)'/g)]
  .map(m => ({ code: m[1], issn: m[2] }))

if (journalBlocks.length === 0) {
  console.error('No journals found — check the regex or file format.')
  process.exit(1)
}

console.log(`Found ${journalBlocks.length} journals. Fetching from ISSN Portal…\n`)

// ── 2. Fetch each ISSN from portal.issn.org ────────────────────────────────

async function fetchCountry(issn) {
  try {
    const res = await fetch(`https://portal.issn.org/resource/ISSN/${issn}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; POSI-Bot/1.0; +https://posi.panorama-sg.com)',
        'Accept': 'application/ld+json, application/json;q=0.9',
      },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return null
    const data = await res.json()
    const locs = data?.publication?.[0]?.location ?? []
    const preferred = locs.find(l => typeof l.label === 'string' && l.label !== l.label.toUpperCase())
    return preferred?.label ?? locs[0]?.label ?? null
  } catch {
    return null
  }
}

const results = []
for (const { code, issn } of journalBlocks) {
  const country = await fetchCountry(issn)
  results.push({ code, issn, country })
  console.log(`  ${code.padEnd(10)} ${issn}  →  ${country ?? '(not found)'}`)
}

// ── 3. Patch data.ts ───────────────────────────────────────────────────────

let updated = src
let changed = 0

for (const { country } of results) {
  // We patch sequentially — find each registration_country line in order
  // and replace null with the fetched value (or keep null if not found)
  if (country !== null) {
    updated = updated.replace(
      /registration_country: null,/,
      `registration_country: '${country}',`
    )
    changed++
  }
  // If null, leave as-is (ISSN Portal had no location data)
}

if (changed > 0) {
  writeFileSync(DATA_FILE, updated, 'utf8')
  console.log(`\n✓ Updated ${changed} registration_country values in data.ts`)
} else {
  console.log('\n⚠ No values updated (all already set or ISSN Portal returned nothing)')
}

// ── 4. Print summary ────────────────────────────────────────────────────────

console.log('\nSummary:')
for (const { code, issn, country } of results) {
  console.log(`  ${code.padEnd(10)} ${issn}  →  ${country ?? 'null (not patched)'}`)
}
