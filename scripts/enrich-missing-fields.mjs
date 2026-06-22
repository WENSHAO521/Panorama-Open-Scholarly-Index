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

import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

const FILE  = resolve('src/lib/discovered-journals.ts')
const WRITE = process.argv.includes('--write')
const OA    = 'https://api.openalex.org'
const UA    = 'POSI/0.1 (mailto:posi@panoramagroup.org)'
const DELAY = 150   // ms between batches (~6 req/s, within OpenAlex polite limit)

const ISO_COUNTRY = {
  AF:'Afghanistan',AL:'Albania',DZ:'Algeria',AO:'Angola',AR:'Argentina',AM:'Armenia',
  AU:'Australia',AT:'Austria',AZ:'Azerbaijan',BH:'Bahrain',BD:'Bangladesh',BY:'Belarus',
  BE:'Belgium',BJ:'Benin',BO:'Bolivia',BA:'Bosnia and Herzegovina',BW:'Botswana',
  BR:'Brazil',BN:'Brunei',BG:'Bulgaria',KH:'Cambodia',CM:'Cameroon',CA:'Canada',
  CL:'Chile',CN:'China',CO:'Colombia',HR:'Croatia',CU:'Cuba',CY:'Cyprus',
  CZ:'Czech Republic',DK:'Denmark',DO:'Dominican Republic',EC:'Ecuador',EG:'Egypt',
  EE:'Estonia',ET:'Ethiopia',FI:'Finland',FR:'France',GE:'Georgia',DE:'Germany',
  GH:'Ghana',GR:'Greece',GT:'Guatemala',HU:'Hungary',IN:'India',ID:'Indonesia',
  IR:'Iran',IQ:'Iraq',IE:'Ireland',IL:'Israel',IT:'Italy',JP:'Japan',JO:'Jordan',
  KZ:'Kazakhstan',KE:'Kenya',KW:'Kuwait',KG:'Kyrgyzstan',LA:'Laos',LV:'Latvia',
  LB:'Lebanon',LT:'Lithuania',LU:'Luxembourg',MK:'North Macedonia',MY:'Malaysia',
  MT:'Malta',MX:'Mexico',MD:'Moldova',MN:'Mongolia',MA:'Morocco',MZ:'Mozambique',
  MM:'Myanmar',NP:'Nepal',NL:'Netherlands',NZ:'New Zealand',NG:'Nigeria',NO:'Norway',
  OM:'Oman',PK:'Pakistan',PE:'Peru',PH:'Philippines',PL:'Poland',PT:'Portugal',
  QA:'Qatar',RO:'Romania',RU:'Russia',RW:'Rwanda',SA:'Saudi Arabia',SN:'Senegal',
  RS:'Serbia',SG:'Singapore',SK:'Slovakia',SI:'Slovenia',ZA:'South Africa',
  ES:'Spain',LK:'Sri Lanka',SE:'Sweden',CH:'Switzerland',SY:'Syria',TW:'Taiwan',
  TJ:'Tajikistan',TZ:'Tanzania',TH:'Thailand',TN:'Tunisia',TR:'Turkey',
  UA:'Ukraine',AE:'United Arab Emirates',GB:'United Kingdom',US:'United States',
  UY:'Uruguay',UZ:'Uzbekistan',VE:'Venezuela',VN:'Vietnam',ZM:'Zambia',ZW:'Zimbabwe',
}

function isoToCountry(code) {
  if (!code) return ''
  return ISO_COUNTRY[code.toUpperCase()] ?? code
}

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

function parseNeedingEnrichment(src) {
  const issnSet = new Set()
  const needFreq = new Set()
  const needCountry = new Set()

  for (const block of src.split(/\n(?=\n  \{)/)) {
    const eissn = (block.match(/issn_online:\s*["']([^"']+)["']/) ?? [])[1] ?? null
    const pissn = (block.match(/issn_print:\s*["']([^"']+)["']/) ?? [])[1] ?? null
    const issn = eissn ?? pissn
    if (!issn) continue

    if (/frequency:\s*""/.test(block))                                   needFreq.add(issn)
    if (/registration_country:\s*null/.test(block) && /country:\s*""/.test(block)) needCountry.add(issn)
  }

  // All ISSNs that need at least one field
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

function applyEnrichment(src, oaMap, needFreq, needCountry) {
  let freqPatched = 0, countryPatched = 0

  const newBlocks = src.split(/\n(?=\n  \{)/).map(block => {
    const eissn = (block.match(/issn_online:\s*["']([^"']+)["']/) ?? [])[1] ?? null
    const pissn = (block.match(/issn_print:\s*["']([^"']+)["']/) ?? [])[1] ?? null
    const issn  = eissn ?? pissn
    if (!issn) return block

    const entry = oaMap.get(eissn) ?? oaMap.get(pissn)
    if (!entry) return block

    let updated = block

    if (needFreq.has(issn) && entry.frequency) {
      updated = updated.replace(/frequency:\s*""/, `frequency: "${entry.frequency}"`)
      if (updated !== block) freqPatched++
    }

    if (needCountry.has(issn) && entry.country) {
      const before = updated
      updated = updated
        .replace(/country:\s*""/, `country: "${entry.country}"`)
        .replace(/registration_country:\s*null/, `registration_country: "${entry.country}"`)
      if (updated !== before) countryPatched++
    }

    return updated
  })

  return { result: newBlocks.join('\n'), freqPatched, countryPatched }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const src = readFileSync(FILE, 'utf-8')
  const { allIssns, needFreq, needCountry } = parseNeedingEnrichment(src)

  console.log(`Missing frequency:  ${needFreq.size}`)
  console.log(`Missing country:    ${needCountry.size}`)
  console.log(`Unique ISSNs to query: ${allIssns.length}\n`)

  const oaMap = await fetchOaMap(allIssns)
  const { result, freqPatched, countryPatched } = applyEnrichment(src, oaMap, needFreq, needCountry)

  console.log(`\nFrequency patched:  ${freqPatched} / ${needFreq.size} (${Math.round(freqPatched/needFreq.size*100)}%)`)
  console.log(`Country patched:    ${countryPatched} / ${needCountry.size} (${Math.round(countryPatched/needCountry.size*100)}%)`)

  if (WRITE) {
    writeFileSync(FILE, result, 'utf-8')
    console.log(`\nWritten to ${FILE}`)
  } else {
    console.log('\nDry run — pass --write to apply.')
  }
}

main().catch(e => { console.error(e); process.exit(1) })
