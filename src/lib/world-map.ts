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

export function getWorldShapes(): CountryShape[] {
  if (shapes) return shapes
  const topo = world as unknown as Topology<{ countries: GeometryCollection<{ name: string }> }>
  const fc = feature(topo, topo.objects.countries)
  const features = fc.features.filter(f => f.id !== '010') // Antarctica
  const projection = geoEqualEarth().fitExtent([[4, 4], [MAP_W - 4, MAP_H - 4]], { type: 'FeatureCollection', features })
  const path = geoPath(projection).digits(0)
  shapes = features
    .map(f => ({ code: countryCode(f.properties.name) ?? '', name: f.properties.name, d: path(f) ?? '' }))
    .filter(s => s.d)
  return shapes
}
