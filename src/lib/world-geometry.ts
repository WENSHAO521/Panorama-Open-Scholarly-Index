// World map geometry, as a pure function of the Natural Earth topologies
// (world-map.ts loads them; the test passes them in). Every inhabited
// country and territory is placed: as a shape when the 1:110m map draws it,
// otherwise as a dot at its centroid from the 1:50m data, or, for the few
// places Natural Earth draws as part of another country (Guadeloupe,
// Martinique, Réunion ...), at fixed coordinates.

import { geoCentroid, geoEqualEarth, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import type { Topology, GeometryCollection } from 'topojson-specification'
import { isoCountry } from './country-codes.ts'

export const MAP_W = 960
export const MAP_H = 420

export interface CountryShape { code: string; name: string; d: string }
export interface PlaceDot { code: string; x: number; y: number }
export interface WorldGeometry { shapes: CountryShape[]; dots: PlaceDot[] }

type Countries = Topology<{ countries: GeometryCollection<{ name: string }> }>

/** Places Natural Earth folds into another country at 1:50m, as [longitude, latitude]. */
const FIXED_PLACES: Record<string, [number, number]> = {
  GP: [-61.55, 16.25], MQ: [-61.02, 14.64], RE: [55.53, -21.12], YT: [45.15, -12.83], GF: [-53.1, 3.9],
  BQ: [-68.26, 12.2], TK: [-171.85, -9.2], CX: [105.69, -10.45], CC: [96.87, -12.16], GI: [-5.35, 36.14],
  SJ: [15.6, 78.2], TV: [179.2, -8.52],
}

/** Uninhabited territories, left off the map. */
const UNINHABITED = new Set(['AQ', 'BV', 'HM', 'GS', 'IO', 'UM'])

/**
 * Pixel nudges for dots that would sit on top of a neighbour at this scale
 * (Macao is ~60 km from Hong Kong, under 2 px).
 */
const NUDGE: Record<string, [number, number]> = { MO: [-3.5, 3], HK: [1.5, -1.5] }

export function buildWorld(world110: unknown, world50: unknown): WorldGeometry {
  const t110 = world110 as Countries
  const fc = feature(t110, t110.objects.countries)
  const features = fc.features.filter(f => f.id !== '010') // Antarctica
  const projection = geoEqualEarth().fitExtent([[4, 4], [MAP_W - 4, MAP_H - 4]], { type: 'FeatureCollection', features })
  const path = geoPath(projection).digits(0)
  const shapes = features
    .map(f => ({ code: isoCountry(f.properties.name) ?? '', name: f.properties.name, d: path(f) ?? '' }))
    .filter(s => s.d)

  const placed = new Set(shapes.map(s => s.code).filter(Boolean))
  const dots: PlaceDot[] = []
  const add = (code: string, lonLat: [number, number]) => {
    if (placed.has(code) || UNINHABITED.has(code)) return
    const xy = projection(lonLat)
    if (!xy) return
    const [dx, dy] = NUDGE[code] ?? [0, 0]
    dots.push({ code, x: Math.round((xy[0] + dx) * 10) / 10, y: Math.round((xy[1] + dy) * 10) / 10 })
    placed.add(code)
  }
  const t50 = world50 as Countries
  for (const f of feature(t50, t50.objects.countries).features) {
    const code = isoCountry(f.properties.name)
    if (code) add(code, geoCentroid(f) as [number, number])
  }
  for (const [code, lonLat] of Object.entries(FIXED_PLACES)) add(code, lonLat)
  return { shapes, dots }
}
