// node --test src/lib/  (npm test)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { LISTED_PLACES } from './country-list.ts'
import { buildWorld } from './world-geometry.ts'
import { isoCountry } from './country-codes.ts'

const require = createRequire(import.meta.url)
const { shapes, dots } = buildWorld(require('world-atlas/countries-110m.json'), require('world-atlas/countries-50m.json'))

test('the list holds the 219 countries and territories, one per code', () => {
  assert.equal(LISTED_PLACES.size, 219)
})

test('each listed name reads back as its own code', () => {
  for (const p of LISTED_PLACES.values()) {
    const back = isoCountry(p.name)
    if (back) assert.equal(back, p.code, p.name)
  }
  for (const [raw, code] of [['Hong Kong', 'HK'], ['Taiwan', 'TW'], ['Germany', 'DE'], ['Vietnam', 'VN'], ['Kosovo', 'XK']]) {
    assert.equal(isoCountry(raw), code, raw)
  }
})

test('every listed place is on the map, as a shape or a dot', () => {
  const placed = new Set([...shapes.map(s => s.code), ...dots.map(d => d.code)])
  const missing = [...LISTED_PLACES.keys()].filter(c => !placed.has(c))
  assert.deepEqual(missing, [])
})
