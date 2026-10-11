import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { recordCode } from '../../scripts/lib/doaj-record.mjs'

const records: { id: string; journal_code: string }[] =
  JSON.parse(readFileSync(new URL('./discovered-journals.json', import.meta.url), 'utf8'))

test('every discovered record has a unique, non-empty id that matches its journal_code', () => {
  const seen = new Map<string, number>()
  for (const r of records) {
    assert.ok(r.journal_code, `empty journal_code on ${r.id}`)
    assert.equal(r.id, `j-disc-${r.journal_code}`)
    seen.set(r.id, (seen.get(r.id) ?? 0) + 1)
  }
  const dup = [...seen].filter(([, n]) => n > 1).map(([id]) => id)
  assert.deepEqual(dup, [])
})

test('a journal code comes from the ISSN, and never from a slug that can be empty or cut short', () => {
  assert.equal(recordCode({ title: 'Арктика и Север', issn_online: '2221-2698' }), 'issn-2221-2698')
  assert.equal(recordCode({ title: 'Print only', issn_print: '0835-7900' }), 'issn-0835-7900')
  assert.equal(recordCode({ title: 'Plain Title' }), 'plain-title')
  assert.throws(() => recordCode({ title: 'Арктика и Север' }), /Cannot derive/)
})
