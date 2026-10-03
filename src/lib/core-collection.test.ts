// node --test src/lib/  (npm test)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const records = require('./core-collection.json') as { journal_code: string; collection_status?: string | null; open_access?: boolean | null }[]

test('every Core Collection journal is open access', () => {
  const core = records.filter(j => !j.collection_status || j.collection_status === 'core')
  assert.ok(core.length > 0)
  assert.deepEqual(core.filter(j => j.open_access !== true).map(j => j.journal_code), [])
})
