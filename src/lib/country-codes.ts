// One reading of the journal country field, for the map, the country
// list, journal pages and the directory.
//
// The global corpus mixes three spellings of a country:
//   - ISO 3166-1 alpha-2 codes ("GB", "ID"), from Crossref and OpenAlex;
//   - MARC country codes (Library of Congress), from library records: two
//     letters for most countries ("io" Indonesia, "gw" Germany, "sz"
//     Switzerland) and three for US states, UK nations, Canadian provinces
//     and Australian states ("cau" California, "enk" England);
//   - English names ("United Kingdom"), in the curated records.
// Many MARC codes are also ISO codes for another place (MARC "io" is
// Indonesia; ISO IO is the British Indian Ocean Territory), so read as ISO
// they put thousands of journals in the wrong country. isoCountry() maps
// all three to ISO alpha-2.

/** Common abbreviations, checked first. */
const ALIASES: Record<string, string> = { UK: 'GB', USA: 'US', UAE: 'AE' }

/** MARC two-letter codes that are not ISO codes, or not current ones. */
const MARC_ONLY: Record<string, string> = {
  AA: 'AL', AJ: 'AZ', BU: 'BG', CB: 'KH', CE: 'LK', EM: 'TL', HO: 'HN', II: 'IN', JA: 'JP', KO: 'KR', KU: 'KW',
  LE: 'LB', NN: 'VU', PO: 'PT', RB: 'RS', RM: 'RO', SP: 'ES', SQ: 'SZ', SU: 'RU', SW: 'SE', TS: 'AE',
  TU: 'TR', UN: 'UA', VM: 'VN', XE: 'EE', XN: 'MK', XO: 'SK', XR: 'CZ', XV: 'SI',
}

/**
 * MARC codes that are also ISO codes of another, usually tiny, territory.
 * In the corpus these are MARC: the "British Indian Ocean Territory"
 * journals are Indonesian universities, the "Guinea-Bissau" ones German
 * publishers, the "Eswatini" ones Springer International and Palgrave
 * (Switzerland), and so on. The few real journals of those territories
 * are outnumbered by far.
 */
const MARC_OVER_ISO: Record<string, string> = {
  AG: 'AR', AI: 'AM', BL: 'BR', CC: 'CN', CK: 'CO', GS: 'GE', GW: 'DE', IO: 'ID', LI: 'LT', MV: 'MD',
  NE: 'NL', NR: 'NG', PN: 'PA', SJ: 'SD', SZ: 'CH',
}

/** MARC three-letter codes by their last letter: US states, UK nations, Canadian provinces, Australian states. */
const MARC_SUBDIVISION: Record<string, string> = { U: 'US', K: 'GB', C: 'CA', A: 'AU' }

/** Retired ISO codes that share a current country's English name ("UK", "FX", "SU" ...). */
const RETIRED = new Set(['AN', 'BU', 'CS', 'DD', 'DY', 'FX', 'HV', 'NH', 'RH', 'SU', 'TP', 'UK', 'VD', 'YD', 'YU', 'ZR'])

/** Names used by Natural Earth (the world map) and older records that Intl does not give. */
const EXTRA_NAMES: Record<string, string> = {
  'W. Sahara': 'EH', 'United States of America': 'US', 'Dem. Rep. Congo': 'CD', 'Dominican Rep.': 'DO',
  'Falkland Is.': 'FK', 'Fr. S. Antarctic Lands': 'TF', "Côte d'Ivoire": 'CI', 'Central African Rep.': 'CF',
  Congo: 'CG', 'Eq. Guinea': 'GQ', eSwatini: 'SZ', Palestine: 'PS', Myanmar: 'MM', Turkey: 'TR',
  'Solomon Is.': 'SB', 'N. Cyprus': 'CY', Somaliland: 'SO', 'Bosnia and Herz.': 'BA', Macedonia: 'MK',
  'Trinidad and Tobago': 'TT', 'S. Sudan': 'SS',
}

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' })
let byName: Map<string, string> | null = null

function codeForName(name: string): string | null {
  if (!byName) {
    byName = new Map()
    const L = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    for (const a of L) for (const b of L) {
      const code = a + b
      if (RETIRED.has(code)) continue
      try { const n = regionNames.of(code); if (n && n !== code && !byName.has(n)) byName.set(n, code) } catch { /* not a region */ }
    }
    for (const [n, code] of Object.entries(EXTRA_NAMES)) byName.set(n, code)
  }
  return byName.get(name) ?? null
}

/** The ISO 3166-1 alpha-2 code for a country field (ISO code, MARC code or English name), or null. */
export function isoCountry(raw: string | null | undefined): string | null {
  if (!raw) return null
  const v = raw.trim()
  const alias = ALIASES[v.toUpperCase()]
  if (alias) return alias
  if (/^[A-Za-z]{2}$/.test(v)) {
    const c = v.toUpperCase()
    return MARC_ONLY[c] ?? MARC_OVER_ISO[c] ?? c
  }
  if (/^[A-Za-z]{3}$/.test(v)) return MARC_SUBDIVISION[v.slice(2).toUpperCase()] ?? null
  return codeForName(v)
}

/** The English name for a country field, or the field itself when it names no known country. */
export function countryDisplayName(raw: string | null | undefined): string | null {
  if (!raw) return null
  const code = isoCountry(raw)
  if (code) {
    try { const n = regionNames.of(code); if (n && n !== code) return n } catch { /* not a region */ }
  }
  return raw.trim()
}
