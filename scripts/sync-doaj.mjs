#!/usr/bin/env node
/**
 * sync-doaj.mjs
 *
 * Brings the Discovered journals in line with DOAJ's full journal list.
 * Runs twice a month from .github/workflows/doaj-sync.yml.
 *
 * Source: DOAJ's public data dump (https://doaj.org/docs/public-data-dump/),
 * a tar.gz of JSON files holding every journal currently in DOAJ, in the same
 * shape as the search API. Downloading it needs an API key (DOAJ_API_KEY).
 * The search API cannot list the whole catalogue (it stops at 1,000 results
 * per query), and the daily OpenAlex step only sees the first 100 sources.
 *
 * What it changes in src/lib/discovered-journals.json:
 *   1. Journals in DOAJ but not in the index are added as Discovered records.
 *   2. Records found in DOAJ (by ISSN) are marked listed, and their DOAJ fields
 *      are refreshed: license, language, subjects, homepage, review type.
 *      Missing ISSNs, publisher and country are filled; a filled value is
 *      never replaced, so Crossref and manual corrections stay.
 *   3. Records marked listed that DOAJ no longer has (no ISSN or title match)
 *      are marked not_listed.
 * Core Collection records are curated in posi-data and are not touched; their
 * ISSNs are only used to avoid adding duplicates.
 *
 * Safety: if the dump holds fewer than MIN_DOAJ_JOURNALS journals, nothing is
 * written. If step 3 would delist more than MAX_DELIST_SHARE of the listed
 * records, step 3 is skipped (a matching problem, not a mass withdrawal).
 *
 * Usage:
 *   DOAJ_API_KEY=xxx node scripts/sync-doaj.mjs            # dry run, prints a summary
 *   DOAJ_API_KEY=xxx node scripts/sync-doaj.mjs --write
 *   node scripts/sync-doaj.mjs --dump path/to/doaj_journal_data.tar.gz [--write]
 */

import { execFileSync } from 'child_process'
import { appendFileSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { loadDiscovered, saveDiscovered, knownIssns } from './lib/discovered-store.mjs'
import { buildFromDoaj, buildRecord, languageName, licenseLabel } from './lib/doaj-record.mjs'
import { isoToCountry } from './lib/country-codes.mjs'

const __dir = dirname(fileURLToPath(import.meta.url))
const CORE_FILE = join(__dir, '../src/lib/core-collection.json')
const UA = 'POSI/0.1 (mailto:posi@panoramagroup.org)'
const DUMP_URL = 'https://doaj.org/public-data-dump/journal'

const args = process.argv.slice(2)
const WRITE = args.includes('--write')
const DUMP_FILE = (() => { const i = args.indexOf('--dump'); return i !== -1 ? args[i + 1] : null })()
const DOAJ_KEY = process.env.DOAJ_API_KEY ?? ''

// DOAJ lists about 22,000 journals; a dump far below that is truncated.
const MIN_DOAJ_JOURNALS = 15000
const MAX_DELIST_SHARE = 0.05

const TODAY = new Date().toISOString().slice(0, 10)

// ── Download and read the dump ──────────────────────────────────────────────

async function downloadDump(dest) {
  if (!DOAJ_KEY) throw new Error('DOAJ_API_KEY is not set (the public data dump needs an API key)')
  for (let attempt = 1; ; attempt++) {
    try {
      // The key goes in the query string, so the URL is never logged.
      const res = await fetch(`${DUMP_URL}?api_key=${encodeURIComponent(DOAJ_KEY)}`, {
        headers: { 'User-Agent': UA },
        redirect: 'follow',
        signal: AbortSignal.timeout(10 * 60_000),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status} from the DOAJ data dump`)
      writeFileSync(dest, Buffer.from(await res.arrayBuffer()))
      return
    } catch (e) {
      if (attempt >= 3) throw e
      console.error(`  ⚠  ${e.message} — retrying in ${attempt * 30}s`)
      await new Promise(r => setTimeout(r, attempt * 30_000))
    }
  }
}

function jsonFilesUnder(dir) {
  return readdirSync(dir).flatMap(name => {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) return jsonFilesUnder(p)
    return name.endsWith('.json') ? [p] : []
  })
}

function readDump(archive) {
  const dir = mkdtempSync(join(tmpdir(), 'doaj-'))
  try {
    execFileSync('tar', ['-xzf', archive, '-C', dir])
    const journals = []
    for (const file of jsonFilesUnder(dir).sort()) {
      const data = JSON.parse(readFileSync(file, 'utf8'))
      journals.push(...(Array.isArray(data) ? data : [data]))
    }
    return journals.filter(j => j?.bibjson)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

// ── Matching ────────────────────────────────────────────────────────────────

const normIssn = v => (typeof v === 'string' && /^\d{4}-?\d{3}[\dXx]$/.test(v.trim()))
  ? v.trim().toUpperCase().replace(/^(\d{4})-?/, '$1-') : null
const normTitle = t => (t ?? '').normalize('NFKD').toLowerCase().replace(/^the\s+/, '').replace(/[^\p{L}\p{N}]+/gu, '')

function issnsOf(r) {
  return [normIssn(r.issn_online), normIssn(r.issn_print)].filter(Boolean)
}

// ── Refresh one record from its DOAJ entry ──────────────────────────────────

const isBlank = v => v == null || (typeof v === 'string' && v.trim() === '')
const sameList = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null)

/** Returns the names of the fields it changed. */
function refresh(rec, item) {
  const bib = item.bibjson
  const changed = []
  const set = (field, value) => {
    if (value === undefined) return
    if (Array.isArray(value) ? sameList(rec[field], value) : rec[field] === value) return
    rec[field] = value
    changed.push(field)
  }

  set('doaj_status', 'listed')

  // Fields DOAJ is the source for: take its current value when it has one.
  const license = licenseLabel(bib)
  if (license) set('license', license)
  const lang = languageName(bib.language)
  if (lang) set('language', lang)
  const subjects = [...new Set((bib.subject ?? []).map(s => s.term).filter(Boolean))]
  if (subjects.length) set('subjects', subjects)
  const homepage = bib.ref?.journal
  if (typeof homepage === 'string' && homepage.trim()) set('website_url', homepage.trim())
  const review = [bib.editorial?.review_process ?? bib.editorial?.review_processes ?? []].flat()[0]
  if (review && (isBlank(rec.peer_review_type) || rec.peer_review_type === 'Peer review')) set('peer_review_type', review)

  // Fields other steps also fill: only fill gaps.
  if (isBlank(rec.issn_online) && normIssn(bib.eissn) && !issnsOf(rec).includes(normIssn(bib.eissn))) set('issn_online', normIssn(bib.eissn))
  if (isBlank(rec.issn_print) && normIssn(bib.pissn) && !issnsOf(rec).includes(normIssn(bib.pissn))) set('issn_print', normIssn(bib.pissn))
  if (isBlank(rec.publisher) && bib.publisher?.name) set('publisher', bib.publisher.name)
  const country = isoToCountry(bib.publisher?.country)
  if (isBlank(rec.country) && country) set('country', country)
  if (isBlank(rec.registration_country) && country) set('registration_country', country)

  if (changed.length) rec.updated_at = `${TODAY}T00:00:00Z`
  return changed
}

// ── Main ────────────────────────────────────────────────────────────────────

const summary = []
const log = line => { console.error(line); summary.push(line) }

let archive = DUMP_FILE
let tmpArchiveDir = null
if (!archive) {
  tmpArchiveDir = mkdtempSync(join(tmpdir(), 'doaj-dl-'))
  archive = join(tmpArchiveDir, 'doaj_journal_data.tar.gz')
  console.error('Downloading the DOAJ journal data dump...')
  await downloadDump(archive)
}
let doaj
try {
  doaj = readDump(archive)
} finally {
  if (tmpArchiveDir) rmSync(tmpArchiveDir, { recursive: true, force: true })
}

log(`DOAJ data dump: ${doaj.length} journals`)
if (doaj.length < MIN_DOAJ_JOURNALS) {
  console.error(`❌  Expected at least ${MIN_DOAJ_JOURNALS} journals; the dump looks incomplete. Nothing written.`)
  process.exit(1)
}

// ISSN / title → DOAJ entry
const byIssn = new Map()
const byTitle = new Map()
for (const item of doaj) {
  for (const issn of [normIssn(item.bibjson.eissn), normIssn(item.bibjson.pissn)]) {
    if (issn && !byIssn.has(issn)) byIssn.set(issn, item)
  }
  const t = normTitle(item.bibjson.title)
  if (t) byTitle.set(t, byTitle.has(t) ? null : item)   // null = ambiguous title
}

const records = loadDiscovered()
const core = JSON.parse(readFileSync(CORE_FILE, 'utf8'))

// 1–2. Refresh the records DOAJ has; collect the listed ones it does not.
const matched = new Set()
let refreshed = 0
const fieldCounts = {}
const missing = []
for (const rec of records) {
  const item = issnsOf(rec).map(i => byIssn.get(i)).find(Boolean)
  if (item) {
    matched.add(item)
    const changed = refresh(rec, item)
    if (changed.length) refreshed++
    for (const f of changed) fieldCounts[f] = (fieldCounts[f] ?? 0) + 1
    continue
  }
  // Same journal under an ISSN DOAJ does not carry (e.g. an ISSN-L): still listed,
  // but not refreshed, since the match is weaker.
  const byName = byTitle.get(normTitle(rec.title))
  if (byName) { matched.add(byName); continue }
  if (rec.doaj_status === 'listed') missing.push(rec)
}
log(`Records refreshed from DOAJ: ${refreshed}` +
  (refreshed ? ` (${Object.entries(fieldCounts).map(([f, n]) => `${f} ${n}`).join(', ')})` : ''))

// 3. Delist the listed records DOAJ no longer has.
const listed = records.filter(r => r.doaj_status === 'listed').length + missing.length
if (missing.length > listed * MAX_DELIST_SHARE) {
  log(`⚠  ${missing.length} listed records are not in the dump (more than ${MAX_DELIST_SHARE * 100}% of ${listed}); not delisting any. Check the matching.`)
} else {
  for (const rec of missing) {
    rec.doaj_status = 'not_listed'
    rec.updated_at = `${TODAY}T00:00:00Z`
  }
  log(`Records no longer in DOAJ, marked not_listed: ${missing.length}`)
  for (const r of missing.slice(0, 50)) log(`  - ${r.issn_online ?? r.issn_print ?? ''}  ${r.title}`)
}

// 4. Add the DOAJ journals the index does not have yet.
const known = knownIssns([...records, ...core].map(r => ({ issn_online: normIssn(r.issn_online), issn_print: normIssn(r.issn_print) })))
const knownTitles = new Set([...records, ...core].map(r => normTitle(r.title)))
const takenIds = new Set(records.map(r => r.id))
const added = []
for (const item of doaj) {
  if (matched.has(item)) continue
  const bib = item.bibjson
  const issns = [normIssn(bib.eissn), normIssn(bib.pissn)].filter(Boolean)
  if (!issns.length || issns.some(i => known.has(i))) continue
  if (knownTitles.has(normTitle(bib.title))) continue
  const rec = buildRecord(buildFromDoaj({ ...bib, eissn: normIssn(bib.eissn), pissn: normIssn(bib.pissn) }, item))
  if (takenIds.has(rec.id)) continue
  takenIds.add(rec.id)
  for (const i of issns) known.add(i)
  added.push(rec)
}
log(`New journals added from DOAJ: ${added.length}`)
for (const r of added.slice(0, 50)) log(`  + ${r.issn_online ?? r.issn_print ?? ''}  ${r.title}`)
if (added.length > 50) log(`  … and ${added.length - 50} more`)

const out = [...records, ...added]
log(`Discovered records: ${records.length} → ${out.length} (${out.filter(r => r.doaj_status === 'listed').length} DOAJ-listed)`)

if (WRITE) {
  saveDiscovered(out)
  console.error('✓  Wrote src/lib/discovered-journals.json')
} else {
  console.error('Dry run; pass --write to save.')
}

if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### DOAJ sync ${TODAY}\n\n\`\`\`\n${summary.join('\n')}\n\`\`\`\n`)
}
