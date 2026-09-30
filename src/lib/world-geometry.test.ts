// node --test src/lib/  (npm test)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { buildWorld } from './world-geometry.ts'
import { isoCountry } from './country-codes.ts'

const require = createRequire(import.meta.url)
const { shapes, dots } = buildWorld(require('world-atlas/countries-110m.json'), require('world-atlas/countries-50m.json'))

// Codes Intl names that are not places a journal is published in.
const NOT_PLACES = new Set([
  // retired
  'AN', 'BU', 'CS', 'DD', 'DY', 'FX', 'HV', 'NH', 'RH', 'SU', 'TP', 'UK', 'VD', 'YD', 'YU', 'ZR',
  // reserved and grouping codes
  'AC', 'CP', 'CQ', 'DG', 'EA', 'EU', 'EZ', 'IC', 'QO', 'TA', 'UN', 'XA', 'XB', 'ZZ',
  // uninhabited
  'AQ', 'BV', 'HM', 'GS', 'IO', 'UM',
])

test('every inhabited country and territory is on the map, as a shape or a dot', () => {
  const placed = new Set([...shapes.map(s => s.code), ...dots.map(d => d.code)])
  const dn = new Intl.DisplayNames(['en'], { type: 'region' })
  const L = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const missing: string[] = []
  for (const a of L) for (const b of L) {
    const code = a + b
    let name: string | undefined
    try { name = dn.of(code) } catch { continue }
    if (!name || name === code || NOT_PLACES.has(code)) continue
    if (!placed.has(code)) missing.push(`${code} ${name}`)
  }
  assert.deepEqual(missing, [])
})

test('small places are dots, placed once, inside the map', () => {
  const codes = dots.map(d => d.code)
  assert.equal(new Set(codes).size, codes.length)
  for (const c of ['SG', 'HK', 'MO', 'BH', 'MT', 'MU', 'GP', 'RE', 'BB', 'MC']) assert.ok(codes.includes(c), c)
  for (const d of dots) assert.ok(d.x >= 0 && d.x <= 960 && d.y >= 0 && d.y <= 420, d.code)
  // The big countries stay shapes (earlier they took retired codes and matched nothing).
  for (const c of ['GB', 'FR', 'RU', 'US', 'CN', 'ID']) assert.ok(shapes.some(s => s.code === c), c)
  const hk = dots.find(d => d.code === 'HK')!, mo = dots.find(d => d.code === 'MO')!
  assert.ok(Math.hypot(hk.x - mo.x, hk.y - mo.y) >= 5, 'Macao and Hong Kong dots overlap')
})

test('journal country fields all resolve to a placed code', () => {
  const placed = new Set([...shapes.map(s => s.code), ...dots.map(d => d.code)])
  for (const raw of ['SG', 'HK', 'Singapore', 'Hong Kong', 'IO', 'ENK', 'CAU', 'MO', 'MT', 'GP', 'United Kingdom']) {
    assert.ok(placed.has(isoCountry(raw)!), raw)
  }
})
