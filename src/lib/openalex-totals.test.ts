import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const totals = require('./openalex-totals.json') as { fetched_at: string | null; works: number | null; journals: number | null; types: { key: string; label: string; count: number }[] }

test('the OpenAlex totals file has the shape the search page reads', () => {
  assert.ok(Array.isArray(totals.types))
  assert.ok(totals.works === null || Number.isInteger(totals.works))
  assert.ok(totals.journals === null || Number.isInteger(totals.journals))
  for (const t of totals.types) assert.ok(t.key && t.label && Number.isInteger(t.count))
})
