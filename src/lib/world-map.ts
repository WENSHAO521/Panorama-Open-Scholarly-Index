// World map geometry for the home page, projected to SVG paths at build time
// (Natural Earth 1:110m via world-atlas, Equal Earth projection), keyed by
// ISO 3166-1 alpha-2 code. Server only: nothing here ships to the browser.

import { geoEqualEarth, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import type { Topology, GeometryCollection } from 'topojson-specification'
import world from 'world-atlas/countries-110m.json'

export const MAP_W = 960
export const MAP_H = 420

export interface CountryShape { code: string; name: string; d: string }

// world-atlas names that differ from Intl.DisplayNames' English names.
const NAME_TO_CODE: Record<string, string> = {
  'W. Sahara': 'EH', 'United States of America': 'US', 'Dem. Rep. Congo': 'CD', 'Dominican Rep.': 'DO',
  'Falkland Is.': 'FK', 'Fr. S. Antarctic Lands': 'TF', "Côte d'Ivoire": 'CI', 'Central African Rep.': 'CF',
  Congo: 'CG', 'Eq. Guinea': 'GQ', eSwatini: 'SZ', Palestine: 'PS', Myanmar: 'MM', Turkey: 'TR',
  'Solomon Is.': 'SB', 'N. Cyprus': 'CY', Somaliland: 'SO', 'Bosnia and Herz.': 'BA', Macedonia: 'MK',
  'Trinidad and Tobago': 'TT', 'S. Sudan': 'SS',
}

let byName: Map<string, string> | null = null

/** English country name -> alpha-2, for directory records that carry a name rather than a code. */
export function countryCode(raw: string | null | undefined): string | null {
  if (!raw) return null
  const v = raw.trim()
  if (/^[A-Z]{2}$/.test(v)) return v
  if (!byName) {
    byName = new Map(Object.entries(NAME_TO_CODE))
    const dn = new Intl.DisplayNames(['en'], { type: 'region' })
    const L = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    for (const a of L) for (const b of L) {
      const code = a + b
      try { const n = dn.of(code); if (n && n !== code) byName.set(n, code) } catch { /* not a region */ }
    }
  }
  return byName.get(v) ?? null
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
