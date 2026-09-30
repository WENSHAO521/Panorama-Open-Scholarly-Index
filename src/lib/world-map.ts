// World map geometry for the home page, projected to SVG paths at build time
// (Natural Earth via world-atlas, Equal Earth projection), keyed by ISO
// 3166-1 alpha-2 code. Server only: nothing here ships to the browser.
// The geometry itself is built in world-geometry.ts.

import world110 from 'world-atlas/countries-110m.json'
import world50 from 'world-atlas/countries-50m.json'
import { isoCountry } from './country-codes'
import { buildWorld, type CountryShape, type PlaceDot, type WorldGeometry } from './world-geometry'

export { MAP_H, MAP_W } from './world-geometry'
export type { CountryShape, PlaceDot }

/** A country field (ISO code, MARC code or name) as ISO alpha-2; see country-codes.ts. */
export function countryCode(raw: string | null | undefined): string | null {
  return isoCountry(raw)
}

let geometry: WorldGeometry | null = null
const getGeometry = () => (geometry ??= buildWorld(world110, world50))

/** Countries drawn as shapes (the 1:110m map). */
export function getWorldShapes(): CountryShape[] {
  return getGeometry().shapes
}

/** Countries and territories too small for the 1:110m map, drawn as dots. */
export function getSmallPlaceDots(): PlaceDot[] {
  return getGeometry().dots
}
