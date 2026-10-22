import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mergeNewest } from './newest-merge.ts'

const w = (doi: string, date: string | null) => ({ doi: `https://doi.org/${doi}`, publication_date: date })

test('adds Crossref articles OpenAlex has not indexed yet, newest first', () => {
  const oa = [w('10.1/a', '2026-10-01'), w('10.1/b', '2026-09-20')]
  const cr = [w('10.1/new', '2026-10-20'), w('10.1/A', '2026-10-01')]
  const { results, added } = mergeNewest(oa, cr, 2)
  assert.equal(added, 1)
  assert.deepEqual(results.map(r => r.doi), ['https://doi.org/10.1/new', 'https://doi.org/10.1/a', 'https://doi.org/10.1/b'])
})

test('leaves older Crossref articles to later OpenAlex pages', () => {
  const oa = [w('10.1/a', '2026-10-01'), w('10.1/b', '2026-09-20')]
  const { added } = mergeNewest(oa, [w('10.1/old', '2026-01-05')], 2)
  assert.equal(added, 0)
})

test('a short OpenAlex page takes every missing Crossref article', () => {
  const { results, added } = mergeNewest([], [w('10.1/x', '2026-10-21'), w('10.1/y', null)], 20)
  assert.equal(added, 1)
  assert.equal(results[0].doi, 'https://doi.org/10.1/x')
})
