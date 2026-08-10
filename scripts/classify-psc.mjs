#!/usr/bin/env node
/**
 * classify-psc.mjs
 *
 * Assigns a PSC (POSI Subject Classification) category to journals by
 * mapping OpenAlex's own topic-aggregation data through an OpenAlex-field
 * (and, for a targeted set of ambiguous fields, OpenAlex-subfield) to PSC
 * crosswalk. Full rationale and the crosswalk table itself:
 * posi-data's PSC-CROSSWALK.md.
 *
 * Uses ONLY the free OpenAlex singleton lookup (/sources/issn:{issn}) —
 * never the filtered list endpoint (/sources?filter=...), which is metered
 * against OpenAlex's daily request budget and is what exhausted it earlier
 * in rate-early-stage.mjs before that script was fixed to do the same.
 *
 * Confidence is based on topic concentration: a journal whose top topic
 * doesn't clearly dominate its aggregate topic distribution gets
 * psc_confidence: 'low' rather than a confidently-wrong single category.
 * This is expected and common for generalist/multidisciplinary flagship
 * journals (Nature, Science, The Lancet, JAMA) — their 100+ year, every-
 * field publication history genuinely doesn't reduce to one PSC category,
 * not a bug in the crosswalk.
 *
 * Operates directly on a corpus JSON file (Journal[]) — src/lib's vendored
 * core-collection.json by default, or any other path via --file (e.g. a
 * posi-data checkout's corpus/*.json, to update the authoritative copy
 * directly). If you write to a posi-data checkout, commit + push there, then
 * run this repo's scripts/sync-corpus.mjs to pull the update back.
 *
 * Usage:
 *   node scripts/classify-psc.mjs [--write] [--limit N]
 *   node scripts/classify-psc.mjs --file src/lib/global-benchmark.json --write
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

const WRITE = process.argv.includes('--write')
const LIMIT = (() => {
  const i = process.argv.indexOf('--limit')
  return i !== -1 ? parseInt(process.argv[i + 1], 10) : null
})()
const DATA_PATH = resolve((() => {
  const i = process.argv.indexOf('--file')
  return i !== -1 ? process.argv[i + 1] : 'src/lib/core-collection.json'
})())

const UA = 'POSI-PscClassification/0.1 (+https://posi.panorama-sg.com; posi@panoramagroup.org)'
const CONCURRENCY = 4
const DELAY_MS = 500
// Below this share of total topic-count mass, the top topic doesn't
// dominate clearly enough to trust a single-category assignment.
const CONFIDENCE_THRESHOLD = 0.15
// Below this many published works, even a dominant topic share is
// unreliable — a handful of outlier articles in a small journal can
// legitimately dominate its aggregate topic weighting without the journal
// actually being "about" that subject. Found via a real case: GRHAS (41
// works) classified as Psychology at 35% share driven mostly by 4-5
// dance-studies articles, for a journal named "Global Review of
// Humanities, Arts, and Society." Gates on works_count (real publication
// history), not aggregate topic-count mass, which scales with topics-per-
// work and doesn't actually reflect sample size.
const MIN_WORKS_COUNT = 50

// ─── OpenAlex field -> PSC crosswalk (see PSC-CROSSWALK.md for rationale) ───

const FIELD_TO_PSC = {
  'Mathematics': 'P1.01',
  'Computer Science': 'P1.02',
  'Physics and Astronomy': 'P1.03',
  'Chemistry': 'P1.04',
  'Earth and Planetary Sciences': 'P1.05',
  'Environmental Science': 'P1.05',
  'Biochemistry, Genetics and Molecular Biology': 'P1.06',
  'Agricultural and Biological Sciences': 'P1.06',
  'Immunology and Microbiology': 'P1.06',
  'Neuroscience': 'P3.01',
  'Chemical Engineering': 'P2.04',
  'Materials Science': 'P2.05',
  'Energy': 'P2.11',
  'Engineering': 'P2.11', // refined by subfield below where possible
  'Medicine': 'P3.02',
  'Health Professions': 'P3.03',
  'Nursing': 'P3.03',
  'Dentistry': 'P3.02',
  'Pharmacology, Toxicology and Pharmaceutics': 'P3.01',
  'Veterinary Science': 'P4.03',
  'Psychology': 'P5.01',
  'Business, Management and Accounting': 'P5.02',
  'Economics, Econometrics and Finance': 'P5.02',
  'Decision Sciences': 'P5.02',
  'Social Sciences': 'P5.09', // refined by subfield below where possible
  'Arts and Humanities': 'P6.05', // refined by subfield below where possible
}

// Subfield-level overrides for OpenAlex fields too broad to map to one PSC
// category reliably — checked before falling back to FIELD_TO_PSC.
const SUBFIELD_OVERRIDES = {
  'Sociology and Political Science': 'P5.04',
  'Political Science and International Relations': 'P5.06',
  'Education': 'P5.03',
  'Law': 'P5.05',
  'Geography, Planning and Development': 'P5.07',
  'Communication': 'P5.08',
  'Transportation': 'P2.01', // civil/transport engineering, mis-bucketed under Social Sciences by OpenAlex
  'History': 'P6.01',
  'Archeology (arts and humanities)': 'P6.01',
  'Language and Linguistics': 'P6.02',
  'Literature and Literary Theory': 'P6.02',
  'Linguistics and Language': 'P6.02',
  'Philosophy': 'P6.03',
  'Religious studies': 'P6.03',
  'Visual Arts and Performing Arts': 'P6.04',
  'Music': 'P6.04',
  'Civil and Structural Engineering': 'P2.01',
  'Electrical and Electronic Engineering': 'P2.02',
  'Mechanical Engineering': 'P2.03',
  'Aerospace Engineering': 'P2.03',
  'Automotive Engineering': 'P2.03',
  'Building and Construction': 'P2.01',
  'Plant Science': 'P4.01',
  'Animal Science and Zoology': 'P4.02',
  'Food Science': 'P4.01',
  'Insect Science': 'P4.01',
  'Aquatic Science': 'P4.01',
  'Forestry': 'P4.01',
}

function mapToPsc(field, subfield) {
  if (subfield && SUBFIELD_OVERRIDES[subfield]) return SUBFIELD_OVERRIDES[subfield]
  if (field && FIELD_TO_PSC[field]) return FIELD_TO_PSC[field]
  return null
}

async function fetchTopics(issn) {
  try {
    const params = new URLSearchParams({ select: 'id,works_count,topics', mailto: 'posi@panoramagroup.org' })
    const res = await fetch(`https://api.openalex.org/sources/issn:${issn}?${params.toString()}`, {
      headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return null
    const data = await res.json()
    if (!data?.id) return null
    return { topics: data.topics ?? [], worksCount: data.works_count ?? 0 }
  } catch {
    return null
  }
}

function classify(topics, worksCount) {
  if (!topics || topics.length === 0) return { psc_category: null, psc_confidence: null }
  const total = topics.reduce((s, t) => s + (t.count ?? 0), 0)
  if (total === 0) return { psc_category: null, psc_confidence: null }

  // Aggregate by mapped PSC category, not just the single top OpenAlex
  // topic — several distinct OpenAlex topics/subfields often map to the
  // same PSC code (e.g. Sociology, Political Science, and Urban Studies
  // subfields all under P5.x), so looking only at the top topic's own
  // share understates real concentration. Confidence is the winning PSC
  // category's share of total topic-count mass, not any single topic's.
  const byPsc = new Map()
  for (const t of topics) {
    const psc = mapToPsc(t.field?.display_name, t.subfield?.display_name)
    if (!psc) continue
    byPsc.set(psc, (byPsc.get(psc) ?? 0) + (t.count ?? 0))
  }
  if (byPsc.size === 0) return { psc_category: null, psc_confidence: null }

  const [winningPsc, winningCount] = [...byPsc.entries()].sort((a, b) => b[1] - a[1])[0]
  const share = winningCount / total
  const confident = share >= CONFIDENCE_THRESHOLD && worksCount >= MIN_WORKS_COUNT
  return { psc_category: winningPsc, psc_confidence: confident ? 'high' : 'low' }
}

async function classifyJournal(journal) {
  const issn = journal.issnOnline ?? journal.issnPrint
  if (!issn) return { id: journal.id, result: { psc_category: null, psc_confidence: null } }
  const data = await fetchTopics(issn)
  if (!data) return { id: journal.id, result: { psc_category: null, psc_confidence: null } }
  return { id: journal.id, result: classify(data.topics, data.worksCount) }
}

// ─── Load journals from the corpus JSON file ────────────────────────────────

function toClassifyTarget(j) {
  return { id: j.id, issnOnline: j.issn_online ?? null, issnPrint: j.issn_print ?? null }
}

function applyPsc(journals, id, result) {
  const idx = journals.findIndex(j => j.id === id)
  if (idx === -1) return
  journals[idx] = { ...journals[idx], psc_category: result.psc_category, psc_confidence: result.psc_confidence }
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function runBatch(items, fn, concurrency) {
  const results = []
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency)
    results.push(...await Promise.all(batch.map(fn)))
    if (i + concurrency < items.length) await sleep(DELAY_MS)
  }
  return results
}

async function main() {
  const journals = JSON.parse(readFileSync(DATA_PATH, 'utf-8'))
  const all = journals.map(toClassifyTarget)
  const targets = LIMIT ? all.slice(0, LIMIT) : all
  console.log(`Found ${all.length} journals in ${DATA_PATH}${LIMIT ? ` — processing first ${targets.length}` : ''}\n`)

  const results = await runBatch(targets, classifyJournal, CONCURRENCY)

  const highConf = results.filter(r => r.result.psc_confidence === 'high').length
  const lowConf = results.filter(r => r.result.psc_confidence === 'low').length
  const unclassified = results.filter(r => r.result.psc_category === null).length
  console.log('Classification breakdown:', { high_confidence: highConf, low_confidence: lowConf, unclassified })

  if (WRITE) {
    for (const r of results) applyPsc(journals, r.id, r.result)
    writeFileSync(DATA_PATH, JSON.stringify(journals, null, 2) + '\n', 'utf-8')
    console.log(`\nWrote psc_category for ${results.length} journals to ${DATA_PATH}`)
  } else {
    console.log('\nDry run (pass --write to persist):')
    for (const r of results) console.log(`  ${r.id}: ${r.result.psc_category ?? '—'} (${r.result.psc_confidence ?? 'n/a'})`)
  }
}

main().catch(err => { console.error(err); process.exit(1) })
