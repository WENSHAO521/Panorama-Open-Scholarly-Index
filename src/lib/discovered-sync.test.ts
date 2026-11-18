import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildDiscovered, correctLegacyCorpusIssn, MIN_RECORDS } from '../../scripts/lib/discovered-sync.mjs'

const d = (code: string, extra: object = {}) => ({
  posi_id: `POSI-J-${code}`, journal_code: code, title: `Journal ${code}`, short_title: null, issn_print: null, issn_online: '1234-5678',
  publisher: 'P', country: 'DE', open_access: true, website_url: null, openalex_source_id: 'https://openalex.org/S1',
  journal_code_aliases: [], updated_at: '2026-10-11', ...extra,
})

test('records take the site shape, with the country as a name and the OpenAlex id bare', () => {
  const { records } = buildDiscovered([d('a')], 1)
  assert.equal(records[0].id, 'j-disc-a')
  assert.equal(records[0].country, 'Germany')
  assert.equal(records[0].openalex_source_id, 'S1')
})

test('aliases are returned for redirects', () => {
  const { aliases, report } = buildDiscovered([d('a', { journal_code_aliases: ['old'] })], 1)
  assert.deepEqual(aliases, { old: 'a' })
  assert.equal(report.aliases, 1)
})

test('a current journal code takes precedence over an old alias', () => {
  const collection = [d('older-record', { journal_code_aliases: ['current-code', 'old-code'] }), d('current-code')]
  const { records, aliases, report } = buildDiscovered(collection, 1)
  assert.deepEqual(records.map((r) => r.journal_code), ['older-record', 'current-code'])
  assert.deepEqual(aliases, { 'old-code': 'older-record' })
  assert.equal(report.aliases, 1)
  assert.deepEqual(report.conflictingAliases, ['current-code'])
})

test('a short collection, a repeated id or a title-less record is refused', () => {
  assert.ok(MIN_RECORDS >= 25000)
  assert.throws(() => buildDiscovered([d('a')]), /1 records \(need/)
  assert.throws(() => buildDiscovered([d('a'), d('a')], 1), /duplicate id/)
  assert.throws(() => buildDiscovered([d('a', { title: ' ' })], 1), /no title/)
  assert.throws(() => buildDiscovered([], 1), /empty/)
})

test('a verified discovered ISSN is detached from the stale corpus record only', () => {
  const current = d('issn-3033-5981', { issn_online: '3033-5981' })
  const old = {
    issn_l: '2077-1770',
    issns: ['2077-1770', '2218-7405', '3033-5981'],
    openalex_source_id: 'S2738561021',
    crossref_total_dois: 51,
  }
  const corrected = { ...old, issns: ['2077-1770', '2218-7405'], crossref_total_dois: 2692 }
  assert.equal(correctLegacyCorpusIssn([old], []), false)
  assert.equal(correctLegacyCorpusIssn([old], [current]), true)
  assert.deepEqual(old.issns, corrected.issns)
  assert.equal(old.crossref_total_dois, null)
  assert.equal(correctLegacyCorpusIssn([corrected], [current]), false)
  assert.equal(corrected.crossref_total_dois, 2692)
})
