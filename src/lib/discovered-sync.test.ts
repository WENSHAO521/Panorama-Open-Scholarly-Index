import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildDiscovered } from '../../scripts/lib/discovered-sync.mjs'

const d = (code: string, extra: object = {}) => ({
  posi_id: `POSI-J-${code}`, journal_code: code, title: `Journal ${code}`, short_title: null, issn_print: null, issn_online: '1234-5678',
  publisher: 'P', country: 'DE', open_access: true, website_url: null, openalex_source_id: 'https://openalex.org/S1',
  journal_code_aliases: [], updated_at: '2026-10-11', ...extra,
})
const site = (code: string) => ({ id: `j-disc-${code}`, journal_code: code })

test('records take the site shape, with the country as a name and the OpenAlex id bare', () => {
  const { records } = buildDiscovered([d('a')], [site('a')])
  assert.equal(records[0].id, 'j-disc-a')
  assert.equal(records[0].country, 'Germany')
  assert.equal(records[0].openalex_source_id, 'S1')
})

test('an alias counts as covered and is returned for redirects', () => {
  const { aliases, report } = buildDiscovered([d('a', { journal_code_aliases: ['old'] })], [site('a'), site('old')])
  assert.deepEqual(aliases, { old: 'a' })
  assert.equal(report.covered, 2)
})

test('a collection that misses journals, repeats an id or has a title-less record is refused', () => {
  assert.throws(() => buildDiscovered([d('a')], [site('a'), site('b')]), /covers 50\.0%/)
  assert.throws(() => buildDiscovered([d('a'), d('a')], [site('a')]), /duplicate id/)
  assert.throws(() => buildDiscovered([d('a', { title: ' ' })], [site('a')]), /no title/)
  assert.throws(() => buildDiscovered([], [site('a')]), /empty/)
})
