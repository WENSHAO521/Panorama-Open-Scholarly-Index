// node --test src/lib/evaluation/  (npm test)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  getAJRRating, getPQFStatus, getAJRModel, getLifecycleStage, calculateMidRank, calculatePercentile,
  calculateCitationQuartile, calculatePOSIZone, rankWithTies, getCitationRankingStatus, getRankingOutputs, ajrRatingRange,
} from './rules.ts'
import { validateCitationEdition, validateAjrRatings } from './check.ts'

test('AJR Rating boundaries', () => {
  const cases: [number, string][] = [[100, 'A+'], [90, 'A+'], [89.99, 'A'], [85, 'A'], [84.99, 'A−'], [80, 'A−'], [79.99, 'B+'],
    [75, 'B+'], [74.99, 'B'], [70, 'B'], [69.99, 'B−'], [65, 'B−'], [64.99, 'C+'], [60, 'C+'], [59.99, 'C'], [50, 'C'], [49.99, 'D'], [0, 'D'],
    [85.72, 'A'], [82.64, 'A−'], [80.87, 'A−'], [76.2, 'B+']]
  for (const [s, r] of cases) assert.equal(getAJRRating(s), r, `score ${s}`)
  for (const bad of [null, undefined, NaN, Infinity, -1, 100.5]) assert.equal(getAJRRating(bad as number), null)
  assert.equal(ajrRatingRange('A'), '85.00–89.99')
  assert.equal(ajrRatingRange('A+'), '90.00–100.00')
})

test('PQF status bands', () => {
  assert.equal(getPQFStatus(70), 'eligible')
  assert.equal(getPQFStatus(69.99), 'review_required')
  assert.equal(getPQFStatus(50), 'review_required')
  assert.equal(getPQFStatus(49.99), 'insufficient_evidence')
  assert.equal(getPQFStatus(40), 'insufficient_evidence')
  assert.equal(getPQFStatus(39.99), 'not_eligible')
  assert.equal(getPQFStatus(null), null)
})

test('lifecycle windows', () => {
  assert.equal(getLifecycleStage(11), 'observation')
  assert.equal(getLifecycleStage(12), 'early_stage')
  assert.equal(getLifecycleStage(59), 'early_stage')
  assert.equal(getLifecycleStage(60), 'mature')
  assert.equal(getAJRModel('early_stage'), 'AJR-E')
  assert.equal(getAJRModel('mature'), 'AJR-M')
})

test('Citation Quartile boundaries', () => {
  const cases: [number, string][] = [[74.99, 'Q2'], [75, 'Q1'], [49.99, 'Q3'], [50, 'Q2'], [24.99, 'Q4'], [25, 'Q3']]
  for (const [p, q] of cases) assert.equal(calculateCitationQuartile(p), q)
})

test('POSI Zone boundaries', () => {
  const cases: [number, number][] = [[95, 1], [94.99, 2], [80, 2], [79.99, 3], [50, 3], [49.99, 4]]
  for (const [p, z] of cases) assert.equal(calculatePOSIZone(p), z)
})

test('mid-rank percentile', () => {
  assert.equal(calculateMidRank(2, 3), 2.5)
  assert.equal(calculatePercentile(1, 4), 87.5)
  assert.equal(calculatePercentile(0.1, 1), 100)
  assert.equal(calculatePercentile(1, 0), null)
})

test('ties [3.0, 2.0, 2.0, 1.0]', () => {
  const r = rankWithTies([{ id: 'a', value: 3 }, { id: 'b', value: 2 }, { id: 'c', value: 2 }, { id: 'd', value: 1 }])
  assert.deepEqual(['a', 'b', 'c', 'd'].map(k => r.get(k)!.rank), [1, 2, 2, 4])
  assert.equal(r.get('b')!.percentile, r.get('c')!.percentile)
  assert.equal(r.get('b')!.quartile, r.get('c')!.quartile)
  assert.equal(r.get('b')!.zone, r.get('c')!.zone)
})

const good = { pnci: 1.2, eligibleItems: 40, publicationYears: 3, coverage: 0.95, hasCategory: true }

test('items <10 / 10–19 / >=20 and publication years', () => {
  assert.equal(getCitationRankingStatus({ ...good, eligibleItems: 9, categorySize: 60 }).status, 'insufficient_items')
  assert.equal(getCitationRankingStatus({ ...good, eligibleItems: 10, categorySize: 60 }).status, 'provisional')
  assert.equal(getCitationRankingStatus({ ...good, eligibleItems: 19, categorySize: 60 }).status, 'provisional')
  assert.equal(getCitationRankingStatus({ ...good, eligibleItems: 20, categorySize: 60 }).status, 'official')
  assert.equal(getCitationRankingStatus({ ...good, publicationYears: 1, categorySize: 60 }).status, 'provisional')
})

test('coverage 89.9% / 90%', () => {
  assert.equal(getCitationRankingStatus({ ...good, coverage: 0.899, categorySize: 60 }).status, 'incomplete_coverage')
  assert.equal(getCitationRankingStatus({ ...good, coverage: 0.9, categorySize: 60 }).status, 'official')
})

test('category N 19 / 20 / 29 / 30 / 49 / 50', () => {
  assert.equal(getCitationRankingStatus({ ...good, categorySize: 19 }).status, 'insufficient_category')
  assert.equal(getCitationRankingStatus({ ...good, categorySize: 20 }).status, 'official')
  assert.equal(getRankingOutputs('official', 19).rank, false)
  assert.equal(getRankingOutputs('official', 20).zone, null)
  assert.equal(getRankingOutputs('official', 29).zone, null)
  assert.equal(getRankingOutputs('official', 30).zone, 'provisional')
  assert.equal(getRankingOutputs('official', 49).zone, 'provisional')
  assert.equal(getRankingOutputs('official', 50).zone, 'official')
  assert.equal(getRankingOutputs('provisional', 80).zone, null)
})

test('missing data', () => {
  assert.equal(getCitationRankingStatus({}).status, 'not_available')
  assert.equal(getCitationRankingStatus({ pnci: null, eligibleItems: 0, lifecycleStage: 'observation' }).status, 'observation')
})

test('edition invariants', () => {
  const base = { pnci: 1, ranking_category_id: 'P1.01', citation_rank: 1, citation_rank_total: 60, citation_percentile: 99, citation_quartile: 'Q1', posi_zone: 1, zone_status: 'official', citation_ranking_status: 'official' }
  assert.deepEqual(validateCitationEdition([{ journal_id: 'a', ...base }]), [])
  assert.equal(validateCitationEdition([{ journal_id: 'a', ...base, citation_quartile: 'Q2' }]).length, 1)
  assert.equal(validateCitationEdition([{ journal_id: 'a', ...base, posi_zone: null }]).length, 1)
  assert.equal(validateCitationEdition([{ journal_id: 'a', ...base, pnci: null }]).length, 1)
  assert.equal(validateCitationEdition([{ journal_id: 'a', ...base, citation_ranking_status: 'insufficient_items' }]).length, 1)
  assert.equal(validateCitationEdition([{ journal_id: 'a', ...base }, { journal_id: 'b', ...base, citation_rank: 2 }]).length, 1)
  assert.deepEqual(validateAjrRatings([{ id: 'x', score: 85.72, storedRating: 'A' }]), [])
  assert.equal(validateAjrRatings([{ id: 'x', score: 85.72, storedRating: 'A−' }]).length, 1)
})
