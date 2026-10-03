// node --test src/lib/  (npm test)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { LISTED_PLACES, PARENT, listedPlaceOf } from './country-list.ts'
import { buildWorld } from './world-geometry.ts'
import { countryDisplayName, isoCountry } from './country-codes.ts'

const require = createRequire(import.meta.url)
const { shapes, dots } = buildWorld(require('world-atlas/countries-110m.json'), require('world-atlas/countries-50m.json'))

test('the list holds the editors\' 219 places plus North Korea and Comoros, one per code', () => {
  assert.equal(LISTED_PLACES.size, 221)
})

test('each listed name reads back as its own code', () => {
  for (const p of LISTED_PLACES.values()) assert.equal(isoCountry(p.name), p.code, p.name)
  for (const [raw, code] of [['Hong Kong', 'HK'], ['Taiwan', 'TW'], ['Germany', 'DE'], ['Vietnam', 'VN'], ['Kosovo', 'XK']]) {
    assert.equal(isoCountry(raw), code, raw)
  }
})

test('every listed place is on the map, as a shape or a dot', () => {
  const placed = new Set([...shapes.map(s => s.code), ...dots.map(d => d.code)])
  const missing = [...LISTED_PLACES.keys()].filter(c => !placed.has(c))
  assert.deepEqual(missing, [])
})

test('display names are the list names', () => {
  assert.equal(countryDisplayName('HK'), 'Hong Kong')
  assert.equal(countryDisplayName('Hong Kong SAR China'), 'Hong Kong')
  assert.equal(countryDisplayName('TR'), 'Turkey')
  assert.equal(countryDisplayName('Congo - Kinshasa'), 'DR Congo')
  assert.equal(countryDisplayName('GP'), 'Guadeloupe')
})

test('every territory on the map is listed or folded into a listed country', () => {
  for (const [code, parent] of Object.entries(PARENT)) {
    assert.ok(!LISTED_PLACES.has(code), code)
    assert.ok(LISTED_PLACES.has(parent), parent)
  }
  const codes = [...shapes.map(s => s.code), ...dots.map(d => d.code)].filter(Boolean)
  assert.deepEqual(codes.filter(c => !listedPlaceOf(c)), [])
  assert.equal(listedPlaceOf('GP')?.name, 'France')
  assert.equal(listedPlaceOf('CW')?.name, 'Netherlands')
})
