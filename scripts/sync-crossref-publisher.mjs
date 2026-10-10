#!/usr/bin/env node
/**
 * sync-crossref-publisher.mjs
 *
 * Adds a publisher's journals that are missing from src/lib/discovered-journals.json,
 * using the Crossref member's journal articles as the source of the journal list.
 *
 * Crossref has no "journals of member N" endpoint, so the journals are found
 * from the member's journal articles: the ISSN facet of /members/<id>/works is
 * read for a date window, and a window that hits the facet cap (1,000 values)
 * is split in half until it no longer does. Each ISSN not already in the Core
 * or Discovered records is then looked up at /journals/<issn> and the print and
 * online ISSNs of one journal are merged into a single record.
 *
 * Usage:
 *   node scripts/sync-crossref-publisher.mjs --member 311                      # dry run, last 120 days
 *   node scripts/sync-crossref-publisher.mjs --member 311 --write              # add the new journals
 *   node scripts/sync-crossref-publisher.mjs --member 311 --since 2018-01-01 --write   # backfill
 *
 * Options:
 *   --member <id>      Crossref member id (Wiley: 311)
 *   --since <date>     start of the scan window (default: 120 days ago)
 *   --name <label>     publisher name written on records whose Crossref publisher
 *                      matches --match (default: the Crossref publisher name)
 *   --match <regex>    which Crossref publisher names count as --name, e.g. wiley
 *   --site <template>  journal home page, with {issn} (hyphen removed), e.g.
 *                      https://onlinelibrary.wiley.com/journal/{issn}
 *   --min-issns <n>    abort without writing when fewer ISSNs than this are found
 *                      (a failed scan must not look like a quiet month; default 1)
 *
 * Records of other publishers (journals Wiley hosts for societies) keep their
 * Crossref publisher name and no home page. The script only adds journals; it
 * reports, but does not change, existing records whose publisher differs.
 *
 * Requires Node.js 18+
 */

import { loadDiscovered, saveDiscovered, knownIssns } from './lib/discovered-store.mjs'
import { buildRecord } from './lib/doaj-record.mjs'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const MAILTO = 'posi@panorama-sg.com'
const UA = `POSI/0.1 (mailto:${MAILTO})`
const FACET_CAP = 1000

const args = process.argv.slice(2)
const opt = (name, fallback = null) => {
  const i = args.indexOf(name)
  return i !== -1 ? args[i + 1] : fallback
}
const WRITE = args.includes('--write')
const MEMBER = opt('--member')
if (!MEMBER) { console.error('Missing --member <id>'); process.exit(2) }
const TODAY = new Date().toISOString().slice(0, 10)
const SINCE = opt('--since', new Date(Date.now() - 120 * 864e5).toISOString().slice(0, 10))
const NAME = opt('--name')
const MATCH = opt('--match') ? new RegExp(opt('--match'), 'i') : null
const SITE = opt('--site')
const MIN_ISSNS = parseInt(opt('--min-issns', '1'), 10)

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function getJson(url) {
  let last
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(120000) })
      if (res.status === 404) return null
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return (await res.json()).message
    } catch (e) {
      last = e
      await sleep(3000 * (attempt + 1))
    }
  }
  throw new Error(`${last.message} — ${url}`)
}

const day = s => new Date(s + 'T00:00:00Z')
const iso = d => d.toISOString().slice(0, 10)

/** ISSN → article count for one date window, split until the facet is complete. */
async function scan(from, until, found) {
  const filter = `type:journal-article,from-pub-date:${from},until-pub-date:${until}`
  const url = `https://api.crossref.org/members/${MEMBER}/works?rows=0&facet=issn:*&filter=${filter}&mailto=${MAILTO}`
  const values = (await getJson(url))?.facets?.issn?.values ?? {}
  const keys = Object.keys(values)
  if (keys.length >= FACET_CAP && from !== until) {
    const a = day(from), b = day(until)
    const mid = new Date(a.getTime() + Math.floor((b - a) / 2 / 864e5) * 864e5)
    await scan(from, iso(mid), found)
    await scan(iso(new Date(mid.getTime() + 864e5)), until, found)
    return
  }
  // Facet keys look like https://id.crossref.org/issn/1234-5678
  for (const k of keys) found.add(k.slice(k.lastIndexOf('/') + 1))
}

async function scanWindow() {
  const found = new Set()
  const end = day(TODAY)
  for (let d = day(SINCE); d <= end; ) {
    const next = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1))
    const last = new Date(Math.min(next - 864e5, end))
    await scan(iso(d), iso(last), found)
    console.error(`  scanned to ${iso(last)}: ${found.size} ISSNs`)
    d = next
  }
  return found
}

/** DOAJ-listed ISSNs among these, so open access journals are recorded as such. */
async function doajListed(issns) {
  const listed = new Set()
  for (let i = 0; i < issns.length; i += 40) {
    const q = issns.slice(i, i + 40).map(x => `issn:"${x}"`).join(' OR ')
    try {
      const res = await fetch(`https://doaj.org/api/search/journals/${encodeURIComponent(q)}?pageSize=100`, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(60000) })
      if (!res.ok) continue
      for (const j of (await res.json()).results ?? []) {
        for (const x of [j.bibjson?.eissn, j.bibjson?.pissn]) if (x) listed.add(x)
      }
    } catch { /* leave them as not listed; the DOAJ sync corrects it */ }
    await sleep(400)
  }
  return listed
}

const records = loadDiscovered()
let coreRecords = []
try {
  const dir = dirname(fileURLToPath(import.meta.url))
  coreRecords = JSON.parse(readFileSync(join(dir, '../src/lib/core-collection.json'), 'utf8'))
} catch { /* the Core file is optional for de-duplication */ }
const known = knownIssns([...records, ...coreRecords])
const codes = new Set(records.map(r => r.journal_code))

console.error(`Scanning Crossref member ${MEMBER} from ${SINCE} to ${TODAY}`)
const issns = await scanWindow()
console.error(`Found ${issns.size} ISSNs`)
if (issns.size < MIN_ISSNS) {
  console.error(`Fewer than --min-issns (${MIN_ISSNS}); not writing.`)
  process.exit(1)
}

const todo = [...issns].filter(i => !known.has(i))
console.error(`${todo.length} not in the index yet; reading their Crossref journal records`)

const candidates = []
const done = new Set()
for (const issn of todo) {
  if (done.has(issn)) continue
  const m = await getJson(`https://api.crossref.org/journals/${issn}?mailto=${MAILTO}`)
  if (!m) continue
  const all = m.ISSN ?? [issn]
  all.forEach(x => done.add(x))
  if (all.some(x => known.has(x))) continue
  candidates.push({
    title: m.title, publisher: m.publisher, issns: all, types: m['issn-type'] ?? [],
    dois: m.counts?.['total-dois'] ?? 0, subjects: (m.subjects ?? []).map(s => s.name),
  })
  await sleep(100)
}

const listed = await doajListed(candidates.flatMap(c => c.issns))

let added = 0
const byPublisher = {}
for (const c of candidates) {
  const online = c.types.find(t => t.type === 'electronic')?.value ?? null
  const print = c.types.find(t => t.type === 'print')?.value ?? null
  const main = online ?? print ?? c.issns[0]
  const code = `issn-${main.toLowerCase()}`
  if (!c.title || codes.has(code)) continue
  const ours = !MATCH || MATCH.test(c.publisher ?? '')
  const oa = c.issns.some(x => listed.has(x))
  const rec = buildRecord({
    code, title: c.title, issn_print: print, issn_online: online,
    publisher: ours && NAME ? NAME : c.publisher,
    website_url: ours && SITE ? SITE.replace('{issn}', main.replace('-', '')) : '',
    doaj_status: oa ? 'listed' : 'not_listed',
    license: oa ? 'Open Access' : 'Subscription',
    subjects: c.subjects, article_count: c.dois,
  })
  rec.open_access = oa
  records.push(rec)
  codes.add(code)
  c.issns.forEach(x => known.add(x))
  added++
  byPublisher[rec.publisher] = (byPublisher[rec.publisher] ?? 0) + 1
}

console.log(`${added} new journals`, JSON.stringify(byPublisher))
if (WRITE && added) {
  saveDiscovered(records)
  console.log(`Wrote ${records.length} records`)
} else if (!WRITE) {
  console.log('Dry run: nothing written (use --write)')
}
