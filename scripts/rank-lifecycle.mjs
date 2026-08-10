#!/usr/bin/env node
/**
 * rank-lifecycle.mjs
 *
 * Assigns E-Q1-E-Q4 (early_stage journals) and M-Q1-M-Q4 (mature journals)
 * quartiles by ranking AJR-scored journals within PSC peer cohorts, per
 * AJR-SPEC.md § 5. Mirrors posi-engine's ranking.mjs midrank-percentile
 * algorithm (RANK-1.0) — the same formula is reused for every quartile
 * track (E-Q/M-Q/Citation Q); only the input score and cohort membership
 * differ. This script does NOT compute Citation Q — that needs a persisted
 * per-journal PCI figure, which isn't stored anywhere yet (see
 * /citation-reports, which fetches live at build time instead).
 *
 * Cohort = PSC category (L2) x lifecycle stage (early_stage or mature).
 * Falls back from the L2 category (min 20 journals) to its L1 domain (min
 * 30 journals) to no quartile at all, per AJR-SPEC.md § 5's peer-group
 * fallback rule. Mature-track cohorts pool Core Collection + Global
 * Benchmark journals together (Early-Stage cohorts are Core Collection
 * only — Benchmark journals are never early_stage in practice).
 *
 * Operates directly on the two corpus JSON files (Journal[]) — src/lib's
 * vendored core-collection.json/global-benchmark.json by default, or any
 * other paths via --core/--benchmark (e.g. a posi-data checkout's
 * corpus/*.json, to update the authoritative copies directly). If you write
 * to a posi-data checkout, commit + push there, then run this repo's
 * scripts/sync-corpus.mjs to pull the update back.
 *
 * Usage:
 *   node scripts/rank-lifecycle.mjs                # dry run — print cohort sizes/results
 *   node scripts/rank-lifecycle.mjs --write         # inject provisional_quartile into both files
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import taxonomy from '../src/lib/psc-v1.0.snapshot.json' with { type: 'json' }

const WRITE = process.argv.includes('--write')
const CORE_PATH = resolve((() => {
  const i = process.argv.indexOf('--core')
  return i !== -1 ? process.argv[i + 1] : 'src/lib/core-collection.json'
})())
const BENCHMARK_PATH = resolve((() => {
  const i = process.argv.indexOf('--benchmark')
  return i !== -1 ? process.argv[i + 1] : 'src/lib/global-benchmark.json'
})())

const RANKING_METHODOLOGY_VERSION = 'RANK-1.0'
const MIN_L2_SIZE = 20
const MIN_L1_SIZE = 30

const PARENT_OF = new Map(taxonomy.categories.filter(c => c.level === 2).map(c => [c.code, c.parent]))

function toQuartile(percentile) {
  if (percentile >= 75) return 1
  if (percentile >= 50) return 2
  if (percentile >= 25) return 3
  return 4
}

// Same midrank-percentile algorithm as posi-engine's ranking.mjs
// rankCategory(), generalized over an arbitrary numeric score field instead
// of a hardcoded `pci` field name.
function rankCohort(entries) {
  const sorted = [...entries].sort((a, b) => b.score - a.score)
  const blocks = []
  let i = 0
  while (i < sorted.length) {
    let j = i
    while (j < sorted.length && sorted[j].score === sorted[i].score) j++
    blocks.push(sorted.slice(i, j))
    i = j
  }
  const results = new Map()
  let position = 1
  for (const block of blocks) {
    const rankMid = position + (block.length - 1) / 2
    const percentile = 100 * (sorted.length - rankMid + 0.5) / sorted.length
    const quartile = toQuartile(percentile)
    for (const entry of block) results.set(entry.id, quartile)
    position += block.length
  }
  return results
}

/**
 * @param {{ id: string, psc_category: string, score: number }[]} entries
 * @param {'E' | 'M'} prefix
 * @returns {Map<string, string>} id -> 'E-Q1'..'E-Q4' / 'M-Q1'..'M-Q4'
 */
function rankTrack(entries, prefix) {
  const results = new Map()

  const byL2 = new Map()
  for (const e of entries) {
    if (!byL2.has(e.psc_category)) byL2.set(e.psc_category, [])
    byL2.get(e.psc_category).push(e)
  }

  const unresolved = []
  for (const [l2, group] of byL2) {
    if (group.length >= MIN_L2_SIZE) {
      const ranked = rankCohort(group)
      for (const [id, q] of ranked) results.set(id, `${prefix}-Q${q}`)
    } else {
      unresolved.push(...group)
    }
  }

  const byL1 = new Map()
  for (const e of unresolved) {
    const l1 = PARENT_OF.get(e.psc_category) ?? e.psc_category
    if (!byL1.has(l1)) byL1.set(l1, [])
    byL1.get(l1).push(e)
  }
  for (const [, group] of byL1) {
    if (group.length >= MIN_L1_SIZE) {
      const ranked = rankCohort(group)
      for (const [id, q] of ranked) results.set(id, `${prefix}-Q${q}`)
    }
    // else: stays unassigned (no quartile) — cohort too small at every tier
  }

  return results
}

function toRankTarget(j) {
  return {
    id: j.id,
    psc_category: j.psc_category ?? null,
    eligibility: j.early_stage_rating?.eligibility ?? null,
    total: j.early_stage_rating?.total ?? null,
  }
}

function applyQuartile(journals, id, quartile) {
  const idx = journals.findIndex(j => j.id === id)
  if (idx === -1 || !journals[idx].early_stage_rating) return
  journals[idx] = {
    ...journals[idx],
    early_stage_rating: { ...journals[idx].early_stage_rating, provisional_quartile: quartile },
  }
}

function main() {
  const coreData = JSON.parse(readFileSync(CORE_PATH, 'utf-8'))
  const benchmarkData = JSON.parse(readFileSync(BENCHMARK_PATH, 'utf-8'))

  const coreJournals = coreData.map(toRankTarget)
  const benchmarkJournals = benchmarkData.map(toRankTarget)

  const eEntries = coreJournals
    .filter(j => j.eligibility === 'early_stage' && j.psc_category && j.total != null)
    .map(j => ({ id: j.id, psc_category: j.psc_category, score: j.total }))

  const mEntries = [...coreJournals, ...benchmarkJournals]
    .filter(j => j.eligibility === 'mature' && j.psc_category && j.total != null)
    .map(j => ({ id: j.id, psc_category: j.psc_category, score: j.total }))

  console.log(`E-Q candidates (early_stage, classified, scored): ${eEntries.length}`)
  console.log(`M-Q candidates (mature, classified, scored): ${mEntries.length}`)

  const eResults = rankTrack(eEntries, 'E')
  const mResults = rankTrack(mEntries, 'M')

  console.log(`\nE-Q assigned: ${eResults.size} of ${eEntries.length}`)
  console.log(`M-Q assigned: ${mResults.size} of ${mEntries.length}`)
  if (eResults.size === 0 && mResults.size === 0) {
    console.log(`\nNo cohort reached the minimum size (L2 >= ${MIN_L2_SIZE}, L1 fallback >= ${MIN_L1_SIZE}).`)
    console.log('This is AJR-SPEC.md §5\'s anti-noise safeguard working as designed, not a bug —')
    console.log('quartiles stay unassigned until enough classified, scored journals exist per category.')
  }

  if (!WRITE) {
    console.log('\nDry run (pass --write to persist).')
    for (const [id, q] of eResults) console.log(`  ${id}: ${q}`)
    for (const [id, q] of mResults) console.log(`  ${id}: ${q}`)
    return
  }

  for (const [id, q] of eResults) applyQuartile(coreData, id, q)
  for (const [id, q] of mResults) {
    applyQuartile(coreData, id, q)
    applyQuartile(benchmarkData, id, q)
  }

  writeFileSync(CORE_PATH, JSON.stringify(coreData, null, 2) + '\n', 'utf-8')
  writeFileSync(BENCHMARK_PATH, JSON.stringify(benchmarkData, null, 2) + '\n', 'utf-8')
  console.log(`\nWrote quartile assignments to ${CORE_PATH} and ${BENCHMARK_PATH}`)
}

main()
