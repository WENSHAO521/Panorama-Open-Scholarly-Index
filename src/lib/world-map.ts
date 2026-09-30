// World map geometry for the home page, projected to SVG paths at build time
// (Natural Earth 1:110m via world-atlas, Equal Earth projection), keyed by
// ISO 3166-1 alpha-2 code. Server only: nothing here ships to the browser.

import { geoEqualEarth, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import type { Topology, GeometryCollection } from 'topojson-specification'
import world from 'world-atlas/countries-110m.json'
import { isoCountry } from './country-codes'

export const MAP_W = 960
export const MAP_H = 420

export interface CountryShape { code: string; name: string; d: string }

/** A country field (ISO code, MARC code or name) as ISO alpha-2; see country-codes.ts. */
export function countryCode(raw: string | null | undefined): string | null {
  return isoCountry(raw)
}

let shapes: CountryShape[] | null = null
let project: ((lonLat: [number, number]) => [number, number] | null) | null = null

export function getWorldShapes(): CountryShape[] {
  if (shapes) return shapes
  const topo = world as unknown as Topology<{ countries: GeometryCollection<{ name: string }> }>
  const fc = feature(topo, topo.objects.countries)
  const features = fc.features.filter(f => f.id !== '010') // Antarctica
  const projection = geoEqualEarth().fitExtent([[4, 4], [MAP_W - 4, MAP_H - 4]], { type: 'FeatureCollection', features })
  project = p => projection(p)
  const path = geoPath(projection).digits(0)
  shapes = features
    .map(f => ({ code: countryCode(f.properties.name) ?? '', name: f.properties.name, d: path(f) ?? '' }))
    .filter(s => s.d)
  return shapes
}

// Countries and territories too small for the 1:110m map, as [longitude,
// latitude]: the map marks them with a dot. Only those with journals are
// drawn. Macao sits ~60 km from Hong Kong, under 2 px at this scale, so its
// dot is nudged south-west to stay separate.
const SMALL_PLACES: Record<string, [number, number]> = {
  SG: [103.82, 1.35], HK: [114.17, 22.32], MO: [112.9, 21.2], BH: [50.55, 26.07], MT: [14.44, 35.9],
  MU: [57.55, -20.25], RE: [55.53, -21.12], SC: [55.45, -4.68], KM: [43.3, -11.7], MV: [73.5, 4.2],
  CV: [-23.6, 15.1], ST: [6.6, 0.2], BB: [-59.55, 13.19], VG: [-64.62, 18.42], VI: [-64.9, 18.3],
  AI: [-63.06, 18.22], GP: [-61.55, 16.25], MQ: [-61.02, 14.64], DM: [-61.37, 15.41], LC: [-60.98, 13.9],
  GD: [-61.68, 12.12], KN: [-62.75, 17.3], AG: [-61.8, 17.1], AW: [-70, 12.5], CW: [-68.99, 12.17],
  KY: [-81.25, 19.3], BM: [-64.75, 32.3], GU: [144.79, 13.44], MP: [145.7, 15.2], PW: [134.6, 7.5],
  FM: [158.2, 6.9], MH: [171.2, 7.1], KI: [173, 1.4], NR: [166.93, -0.52], TV: [179.2, -8.5],
  WS: [-172.1, -13.76], TO: [-175.2, -21.18], PF: [-149.4, -17.6], MC: [7.42, 43.74], AD: [1.52, 42.51],
  SM: [12.46, 43.94], LI: [9.55, 47.16], VA: [12.45, 41.9], GI: [-5.35, 36.14], IM: [-4.5, 54.2],
  JE: [-2.13, 49.21], GG: [-2.58, 49.45], FO: [-6.9, 62],
}

export interface PlaceDot { code: string; x: number; y: number }

/** Map positions for the small places in SMALL_PLACES that have no shape on the map. */
export function getSmallPlaceDots(): PlaceDot[] {
  const drawn = new Set(getWorldShapes().map(s => s.code))
  const dots: PlaceDot[] = []
  for (const [code, lonLat] of Object.entries(SMALL_PLACES)) {
    if (drawn.has(code)) continue
    const xy = project!(lonLat)
    if (xy) dots.push({ code, x: Math.round(xy[0] * 10) / 10, y: Math.round(xy[1] * 10) / 10 })
  }
  return dots
}
