#!/usr/bin/env node
/**
 * enrich-missing-fields.mjs
 *
 * Fills in missing `frequency` and `registration_country` for discovered journals.
 *
 * Strategy:
 *   For journals missing frequency or country, batch-query OpenAlex by ISSN.
 *   - country_code → registration_country / country
 *   - counts_by_year (2020-2024) → infer publication frequency
 *
 * Usage:
 *   node scripts/enrich-missing-fields.mjs            # dry run — print stats
 *   node scripts/enrich-missing-fields.mjs --write    # apply changes
 */

import { loadDiscovered, saveDiscovered, DISCOVERED_FILE } from './lib/discovered-store.mjs'
import { isoToCountry } from './lib/country-codes.mjs'

const WRITE = process.argv.includes('--write')
const OA    = 'https://api.openalex.org'
const UA    = 'POSI/0.1 (mailto:posi@panoramagroup.org)'
const DELAY = 150   // ms between batches (~6 req/s, within OpenAlex polite limit)


/** Infer frequency from average annual works count (last 3 years 2020-2024) */
function inferFrequency(countsByYear) {
  const recent = (countsByYear ?? [])
    .filter(y => y.year >= 2020 && y.year <= 2024)
    .sort((a, b) => b.year - a.year)
    .slice(0, 3)
  if (!recent.length) return ''
  const avg = recent.reduce((s, y) => s + (y.works_count ?? 0), 0) / recent.length
  if (avg >= 150) return 'Monthly'
  if (avg >= 70)  return 'Bimonthly'
  if (avg >= 30)  return 'Quarterly'
  if (avg >= 15)  return 'Three times a year'
  if (avg >= 6)   return 'Semiannual'
  if (avg >= 2)   return 'Annual'
  return 'Irregular'
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// ── Parse which ISSNs need enrichment ────────────────────────────────────────

function parseNeedingEnrichment(records) {
  const issnSet = new Set()
  const needFreq = new Set()
  const needCountry = new Set()
  for (const r of records) {
    const issn = r.issn_online ?? r.issn_print
    if (!issn) continue
    if (r.frequency === '') needFreq.add(issn)
    if (r.registration_country == null && r.country === '') needCountry.add(issn)
  }
  for (const i of needFreq)    issnSet.add(i)
  for (const i of needCountry) issnSet.add(i)
  return { allIssns: [...issnSet], needFreq, needCountry }
}

// ── Batch OpenAlex fetch ──────────────────────────────────────────────────────

async function fetchOaMap(issns) {
  const map = new Map()   // ISSN → { country, frequency }
  const batches = []
  for (let i = 0; i < issns.length; i += 50) batches.push(issns.slice(i, i + 50))

  console.log(`Querying OpenAlex for ${issns.length} ISSNs in ${batches.length} batches…`)
  let done = 0, found = 0

  for (const batch of batches) {
    const filter = `issn:${batch.join('|')}`
    const url = `${OA}/sources?filter=${encodeURIComponent(filter)}&select=issn,country_code,counts_by_year&per_page=50`
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(20000) })
      if (res.ok) {
        const data = await res.json()
        for (const src of (data.results ?? [])) {
          const country   = isoToCountry(src.country_code)
          const frequency = inferFrequency(src.counts_by_year)
          const entry     = { country, frequency }
          for (const issn of (src.issn ?? [])) {
            if (!map.has(issn)) { map.set(issn, entry); found++ }
          }
        }
      }
    } catch { /* skip on timeout */ }
    done += batch.length
    process.stdout.write(`\r  ${done} / ${issns.length}  (${found} matches)`)
    await sleep(DELAY)
  }
  console.log(`\nOpenAlex map: ${map.size} ISSNs with data`)
  return map
}

// ── Apply enrichment ──────────────────────────────────────────────────────────

function applyEnrichment(records, oaMap, needFreq, needCountry) {
  let freqPatched = 0, countryPatched = 0
  for (const r of records) {
    const issn = r.issn_online ?? r.issn_print
    if (!issn) continue
    const entry = oaMap.get(r.issn_online) ?? oaMap.get(r.issn_print)
    if (!entry) continue
    if (needFreq.has(issn) && entry.frequency && r.frequency === '') {
      r.frequency = entry.frequency
      freqPatched++
    }
    if (needCountry.has(issn) && entry.country) {
      let changed = false
      if (r.country === '') { r.country = entry.country; changed = true }
      if (r.registration_country == null) { r.registration_country = entry.country; changed = true }
      if (changed) countryPatched++
    }
  }
  return { freqPatched, countryPatched }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const records = loadDiscovered()
  const { allIssns, needFreq, needCountry } = parseNeedingEnrichment(records)

  console.log(`Missing frequency:  ${needFreq.size}`)
  console.log(`Missing country:    ${needCountry.size}`)
  console.log(`Unique ISSNs to query: ${allIssns.length}\n`)

  const oaMap = await fetchOaMap(allIssns)
  const { freqPatched, countryPatched } = applyEnrichment(records, oaMap, needFreq, needCountry)

  console.log(`\nFrequency patched:  ${freqPatched} / ${needFreq.size} (${Math.round(freqPatched/needFreq.size*100)}%)`)
  console.log(`Country patched:    ${countryPatched} / ${needCountry.size} (${Math.round(countryPatched/needCountry.size*100)}%)`)

  if (WRITE) {
    saveDiscovered(records)
    console.log(`\nWritten to ${DISCOVERED_FILE}`)
  } else {
    console.log('\nDry run — pass --write to apply.')
  }
}

main().catch(e => { console.error(e); process.exit(1) })
