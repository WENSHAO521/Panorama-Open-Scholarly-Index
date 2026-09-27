#!/usr/bin/env node
/**
 * enrich-publishers.mjs
 *
 * Fills missing `publisher` and `country` / `registration_country` on Discovered
 * journals from Crossref, which knows the DOI-registering member of every
 * journal it holds.
 *
 * Per ISSN (online first, then print):
 *   1. /journals/{issn}                    → publisher name
 *   2. /works?filter=issn:{issn}&rows=1    → Crossref member id (and publisher, if 1 had none)
 *   3. /members/{id}                       → member postal address → country
 *
 * Caveats, and why only blank fields are filled:
 *   - Crossref's publisher is the member that deposits the DOIs. For some
 *     journals that is a host university, platform or sponsoring agency rather
 *     than the imprint on the journal.
 *   - The member address is where the member is registered, not necessarily the
 *     journal's place of publication, so it ranks below the ISSN Portal and DOAJ.
 *     The country is taken only when the address ends in a recognised country name.
 *   - Journals whose DOIs are registered elsewhere (DataCite, JaLC, mEDRA, CNKI)
 *     or that have no DOIs are not found.
 *
 * Usage:
 *   node scripts/enrich-publishers.mjs                 # dry run over every candidate
 *   node scripts/enrich-publishers.mjs --limit 200     # dry run over a sample
 *   node scripts/enrich-publishers.mjs --write         # apply
 *   node scripts/enrich-publishers.mjs --no-country    # publisher only
 */

import { fileURLToPath } from 'url'
import { loadDiscovered, saveDiscovered, DISCOVERED_FILE } from './lib/discovered-store.mjs'
import { countryFromAddress } from './lib/country-codes.mjs'

const CR = 'https://api.crossref.org'
const MAILTO = 'posi@panorama-sg.com'
const UA = `POSI/0.1 (https://posi.panorama-sg.com; mailto:${MAILTO})`
const CONCURRENCY = 4

/** Requests that failed outright (network, timeouts, 429/5xx after retries), so a blocked run is not read as "not in Crossref". */
export const stats = { failed: 0 }

const blank = v => v == null || (typeof v === 'string' && !v.trim())

async function getJson(fetchFn, path) {
  const sep = path.includes('?') ? '&' : '?'
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetchFn(`${CR}${path}${sep}mailto=${MAILTO}`, {
        headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(20000),
      })
      if (res.status === 404) return null
      if (res.status === 429 || res.status >= 500) { await new Promise(r => setTimeout(r, 2000 * (attempt + 1))); continue }
      if ([401, 403, 407].includes(res.status)) break   // blocked, not an answer about the journal
      if (!res.ok) return null
      return (await res.json())?.message ?? null
    } catch {
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)))
    }
  }
  stats.failed++
  return null
}

/** Crossref lookup for one journal. Returns { publisher, country, member } with nulls for what was not found. */
export async function lookup(issns, { fetchFn = fetch, memberCache = new Map(), wantCountry = true } = {}) {
  let publisher = null, member = null
  for (const issn of issns) {
    const j = await getJson(fetchFn, `/journals/${encodeURIComponent(issn)}`)
    if (j?.publisher?.trim()) publisher = j.publisher.trim()
    if (publisher && !wantCountry) break
    const w = await getJson(fetchFn, `/works?filter=issn:${encodeURIComponent(issn)}&rows=1&select=member,publisher`)
    const item = w?.items?.[0]
    if (item) {
      if (!publisher && item.publisher?.trim()) publisher = item.publisher.trim()
      member = item.member ?? null
    }
    if (publisher && (member || !wantCountry)) break
  }

  let country = null
  if (wantCountry && member) {
    if (!memberCache.has(member)) memberCache.set(member, getJson(fetchFn, `/members/${member}`))
    const m = await memberCache.get(member)
    country = countryFromAddress(m?.location)
    if (!publisher && m?.['primary-name']?.trim()) publisher = m['primary-name'].trim()
  }
  return { publisher, country, member }
}

/** Fill blanks on a record from a lookup result. Returns the list of fields set. */
export function applyResult(r, { publisher, country }) {
  const set = []
  if (blank(r.publisher) && publisher) { r.publisher = publisher; set.push('publisher') }
  if (country) {
    if (blank(r.country)) { r.country = country; set.push('country') }
    if (blank(r.registration_country)) { r.registration_country = country; set.push('registration_country') }
  }
  return set
}

async function main() {
  const argv = process.argv.slice(2)
  const WRITE = argv.includes('--write')
  const wantCountry = !argv.includes('--no-country')
  const li = argv.indexOf('--limit')
  const LIMIT = li >= 0 ? Number(argv[li + 1]) : Infinity

  const records = loadDiscovered()
  const candidates = records.filter(r =>
    (r.issn_online || r.issn_print) &&
    (blank(r.publisher) || (wantCountry && (blank(r.country) || blank(r.registration_country))))
  ).slice(0, LIMIT)

  console.log(`Missing publisher: ${records.filter(r => blank(r.publisher)).length}`)
  console.log(`Missing country:   ${records.filter(r => blank(r.country)).length}`)
  console.log(`Querying Crossref for ${candidates.length} journals…`)

  const memberCache = new Map()
  const tally = { publisher: 0, country: 0, registration_country: 0, notFound: 0 }
  let next = 0, done = 0

  async function worker() {
    while (next < candidates.length) {
      const r = candidates[next++]
      const issns = [r.issn_online, r.issn_print].filter(Boolean)
      const res = await lookup(issns, { memberCache, wantCountry })
      if (!res.publisher && !res.country) tally.notFound++
      const set = applyResult(r, res)
      for (const f of set) tally[f]++
      if (set.length && !WRITE) console.log(`  ${issns[0]}  ${set.map(f => `${f}=${r[f]}`).join('  ')}`)
      done++
      if (done % 200 === 0) console.error(`  … ${done} / ${candidates.length}`)
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker))

  console.log(`\nPublisher filled:            ${tally.publisher}`)
  console.log(`Country filled:              ${tally.country}`)
  console.log(`Registration country filled: ${tally.registration_country}`)
  console.log(`Not found in Crossref:       ${tally.notFound} / ${candidates.length}`)
  if (stats.failed) console.log(`Failed requests:             ${stats.failed} (blocked, network or rate limit; those journals were not really checked)`)

  if (WRITE) {
    saveDiscovered(records)
    console.log(`\nWritten to ${DISCOVERED_FILE}. Re-run calc-discovered-mqs.mjs and auto-pqf.mjs --write to refresh scores.`)
  } else {
    console.log('\nDry run — pass --write to apply.')
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(e => { console.error(e); process.exit(1) })
}
