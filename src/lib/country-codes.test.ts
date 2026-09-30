// node --test src/lib/  (npm test)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { countryDisplayName, isoCountry } from './country-codes.ts'

test('map shape names resolve to current ISO codes, not retired ones', () => {
  // Retired codes share these English names (UK, FX, SU, YU, ZR, VD, YD, RH, HV, DY, TP, NH).
  const cases: [string, string][] = [
    ['United Kingdom', 'GB'], ['France', 'FR'], ['Russia', 'RU'], ['Serbia', 'RS'], ['Dem. Rep. Congo', 'CD'],
    ['Vietnam', 'VN'], ['Yemen', 'YE'], ['Zimbabwe', 'ZW'], ['Burkina Faso', 'BF'], ['Benin', 'BJ'],
    ['Timor-Leste', 'TL'], ['Vanuatu', 'VU'], ['Germany', 'DE'], ['United States of America', 'US'],
  ]
  for (const [name, code] of cases) assert.equal(isoCountry(name), code, name)
})

test('ISO codes pass through', () => {
  for (const c of ['US', 'GB', 'ID', 'DE', 'CN', 'CH', 'NL', 'BR', 'SG', 'HK']) assert.equal(isoCountry(c), c)
  assert.equal(isoCountry(' gb '), 'GB')
})

test('MARC codes read as the country they name', () => {
  const cases: [string, string][] = [
    ['IO', 'ID'], ['GW', 'DE'], ['SZ', 'CH'], ['BL', 'BR'], ['CC', 'CN'], ['NE', 'NL'], ['NR', 'NG'],
    ['II', 'IN'], ['UN', 'UA'], ['BU', 'BG'], ['JA', 'JP'], ['SW', 'SE'], ['XR', 'CZ'], ['SU', 'RU'],
    ['ENK', 'GB'], ['STK', 'GB'], ['XXK', 'GB'], ['CAU', 'US'], ['NYU', 'US'], ['DEU', 'US'], ['XXU', 'US'],
    ['ONC', 'CA'], ['QUC', 'CA'], ['VRA', 'AU'], ['QEA', 'AU'],
  ]
  for (const [raw, code] of cases) assert.equal(isoCountry(raw), code, raw)
})

test('abbreviations and names', () => {
  assert.equal(isoCountry('UK'), 'GB')
  assert.equal(isoCountry('USA'), 'US')
  assert.equal(isoCountry('UAE'), 'AE')
  assert.equal(isoCountry('Indonesia'), 'ID')
  assert.equal(isoCountry(''), null)
  assert.equal(isoCountry(null), null)
  assert.equal(isoCountry('Atlantis'), null)
})

test('display names', () => {
  assert.equal(countryDisplayName('IO'), 'Indonesia')
  assert.equal(countryDisplayName('ENK'), 'United Kingdom')
  assert.equal(countryDisplayName('United Kingdom'), 'United Kingdom')
  assert.equal(countryDisplayName('Atlantis'), 'Atlantis')
  assert.equal(countryDisplayName(null), null)
})
