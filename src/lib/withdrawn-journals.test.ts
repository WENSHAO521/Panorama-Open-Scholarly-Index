// node --test src/lib/  (npm test)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { WITHDRAWN, isWithdrawn } from '../../scripts/lib/withdrawn.mjs'

const require = createRequire(import.meta.url)

test('a withdrawn journal is recognised by POSI id, code or ISSN', () => {
  assert.ok(isWithdrawn({ posi_id: 'POSI-J-000030' }))
  assert.ok(isWithdrawn({ journal_id: 'POSI-J-000030' }))
  assert.ok(isWithdrawn({ journal_code: 'dif-rfp' }))
  assert.ok(isWithdrawn({ issns: ['3135-0011'] }))
  assert.ok(isWithdrawn({ issn: ['3135-0011'] }))
  assert.ok(isWithdrawn({ issn_online: '3135-0011' }))
  assert.ok(!isWithdrawn({ posi_id: 'POSI-J-000001', issns: ['3052-539X'] }))
})

test('withdrawn journals are in none of the vendored data files', () => {
  const core = require('./core-collection.json') as Record<string, unknown>[]
  const pcs = require('./pcs.json') as Record<string, unknown>[]
  const pcsQ = (require('./pcs-q.json') as { records: Record<string, unknown>[] }).records
  const pci = require('./pci.json') as Record<string, unknown>[]
  for (const [name, rows] of Object.entries({ core, pcs, pcsQ, pci })) {
    assert.deepEqual(rows.filter(isWithdrawn), [], name)
  }
  const stats = require('./citation-stats.json') as Record<string, unknown>
  for (const w of WITHDRAWN) assert.ok(!(w.journal_code in stats), w.journal_code)
})
