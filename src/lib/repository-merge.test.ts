import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mergeRepositories, MAX_ADDED } from './repository-merge.ts'

const w = (doi: string | null, title: string, year = 2024, date: string | null = `${year}-01-01`, cited = 0) =>
  ({ doi: doi ? `https://doi.org/${doi}` : null, title, publication_year: year, publication_date: date, cited_by_count: cited })

test('places one repository record after every three OpenAlex results', () => {
  const oa = [1, 2, 3, 4, 5, 6, 7].map(i => w(`10.1/${i}`, `Paper ${i}`))
  const zen = [w('10.5281/zenodo.1', 'Data A'), w('10.5281/zenodo.2', 'Data B')]
  const dc = [w('10.6084/m9.figshare.1', 'Figure C')]
  const { results, added } = mergeRepositories(oa, [zen, dc], 'relevance')
  assert.equal(added, 3)
  assert.deepEqual(results.map(r => r.title), ['Paper 1', 'Paper 2', 'Paper 3', 'Data A', 'Paper 4', 'Paper 5', 'Paper 6', 'Figure C', 'Paper 7', 'Data B'])
})

test('skips records OpenAlex already returned, by DOI or by title and year', () => {
  const oa = [w('10.5281/zenodo.1', 'Data A'), w('10.1/x', 'A Study of Things', 2023)]
  const zen = [w('10.5281/ZENODO.1', 'Data A'), w('10.5281/zenodo.9', 'A study of things.', 2023)]
  assert.equal(mergeRepositories(oa, [zen], 'relevance').added, 0)
})

test('a Zenodo deposit also found in DataCite is added once', () => {
  const zen = [w('10.5281/zenodo.5', 'Survey data')]
  const dc = [w('10.5281/zenodo.5', 'Survey data'), w('10.5281/zenodo.4', 'Survey data')]
  const { results, added } = mergeRepositories([], [zen, dc], 'relevance')
  assert.equal(added, 1)
  assert.equal(results.length, 1)
})

test('keeps newest-first and most-cited order', () => {
  const oa = [w('10.1/a', 'A', 2026, '2026-03-01', 9), w('10.1/b', 'B', 2025, '2025-01-01', 1)]
  const dc = [w('10.2/c', 'C', 2025, '2025-06-01', 5)]
  assert.deepEqual(mergeRepositories(oa, [dc], 'newest').results.map(r => r.title), ['A', 'C', 'B'])
  assert.deepEqual(mergeRepositories(oa, [dc], 'cited').results.map(r => r.title), ['A', 'C', 'B'])
})

test(`adds at most ${MAX_ADDED} records, untitled ones never`, () => {
  const many = Array.from({ length: 10 }, (_, i) => w(`10.2/${i}`, `R ${i}`))
  assert.equal(mergeRepositories([], [many, [w('10.3/u', '')]], 'relevance').added, MAX_ADDED)
  assert.equal(mergeRepositories([], [[w('10.3/u', '')]], 'relevance').added, 0)
})

test('a journal listing takes every record its ISSN finds', () => {
  const many = Array.from({ length: 10 }, (_, i) => w(`10.5281/zenodo.${i}`, `Article ${i}`, 2026, `2026-01-${String(i + 1).padStart(2, '0')}`))
  const { results, added } = mergeRepositories([], [many], 'newest', Infinity)
  assert.equal(added, 10)
  assert.equal(results[0].title, 'Article 9')
})
