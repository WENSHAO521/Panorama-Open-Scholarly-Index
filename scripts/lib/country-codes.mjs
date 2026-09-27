// Country values arrive from several sources in different shapes: OpenAlex and
// DOAJ give ISO 3166 alpha-2 codes, ISSN / library records give MARC country
// codes (two letters for countries, three for US states, Canadian provinces and
// UK nations), and Crossref member records give a free-text postal address.
// The site renders any two-letter value as ISO (records.ts countryName), so a
// MARC code such as IO (Indonesia) shows up as British Indian Ocean Territory.
// Everything is stored as an English country name; this module does the mapping.

// Two-letter codes that were stored as MARC. Several collide with a different
// ISO country (NE Niger, AG Antigua, BL St Barthelemy, CC Cocos Islands, SZ
// Eswatini, GW Guinea-Bissau, NR Nauru, CK Cook Islands, CI Cote d'Ivoire), so
// the scheme was decided per code from the titles and publishers carrying it.
const MARC2 = {
  AG: 'Argentina', BL: 'Brazil', BU: 'Bulgaria', CC: 'China', CI: 'Croatia', CK: 'Colombia',
  EM: 'Timor-Leste', GW: 'Germany', II: 'India', IO: 'Indonesia', KO: 'South Korea', LE: 'Lebanon',
  NE: 'Netherlands', NR: 'Nigeria', PO: 'Portugal', RM: 'Romania', SP: 'Spain', SZ: 'Switzerland',
  TS: 'United Arab Emirates', TU: 'Turkey', UN: 'Ukraine', XN: 'North Macedonia', XO: 'Slovakia',
  XV: 'Slovenia',
}

// Two-letter codes that were stored as ISO (checked the same way).
const ISO2 = {
  BB: 'Barbados', CD: 'Congo - Kinshasa', CR: 'Costa Rica', GM: 'Gambia',
  GP: 'Guadeloupe', GU: 'Guam', HK: 'Hong Kong', KR: 'South Korea', LY: 'Libya', ME: 'Montenegro',
  MU: 'Mauritius', PR: 'Puerto Rico', PS: 'Palestine', TT: 'Trinidad and Tobago',
}

// MARC three-letter codes: xx* and the UK nations / US states / Canadian and
// Australian provinces. Anything ending in U is a US state (xxu = United States).
const MARC3 = {
  XXK: 'United Kingdom', ENK: 'United Kingdom', STK: 'United Kingdom', WLK: 'United Kingdom', NIK: 'United Kingdom',
  XXU: 'United States', XXC: 'Canada', XXA: 'Australia',
  ABC: 'Canada', BCC: 'Canada', MBC: 'Canada', NBC: 'Canada', NSC: 'Canada', ONC: 'Canada', QUC: 'Canada', SNC: 'Canada',
  XNA: 'Australia', VRA: null, QEA: 'Australia', WEA: 'Australia', XRA: 'Australia', TMA: 'Australia', ACA: 'Australia',
}

/**
 * Stored country value -> English name. Returns the input unchanged when it is
 * already a name, and null for a code that cannot be placed with confidence
 * (the caller keeps the original). Unlisted two-letter codes are not guessed.
 */
export function normalizeCountryCode(raw) {
  if (typeof raw !== 'string') return raw
  const v = raw.trim()
  if (!/^[A-Za-z]{2,3}$/.test(v) || v !== v.toUpperCase()) return raw
  if (v.length === 2) return MARC2[v] ?? ISO2[v] ?? null
  if (v in MARC3) return MARC3[v]
  if (v.endsWith('U')) return 'United States'
  return null
}

// Spellings Crossref member addresses use that are not the stored name.
const ADDRESS_ALIASES = {
  'usa': 'United States', 'u.s.a.': 'United States', 'u.s.a': 'United States', 'us': 'United States',
  'united states of america': 'United States', 'uk': 'United Kingdom', 'u.k.': 'United Kingdom',
  'great britain': 'United Kingdom', 'england': 'United Kingdom', 'scotland': 'United Kingdom', 'wales': 'United Kingdom',
  'korea': 'South Korea', 'republic of korea': 'South Korea', 'korea, republic of': 'South Korea',
  'russian federation': 'Russia', 'iran, islamic republic of': 'Iran', 'islamic republic of iran': 'Iran',
  'türkiye': 'Turkey', 'turkiye': 'Turkey', 'viet nam': 'Vietnam', 'czechia': 'Czech Republic',
  "people's republic of china": 'China', 'pr china': 'China', 'p.r. china': 'China',
  'the netherlands': 'Netherlands', 'kingdom of saudi arabia': 'Saudi Arabia', 'ksa': 'Saudi Arabia',
  'uae': 'United Arab Emirates', 'hong kong sar': 'Hong Kong', 'hong kong sar china': 'Hong Kong', 'democratic republic of the congo': 'Congo - Kinshasa', 'dr congo': 'Congo - Kinshasa', 'republic of north macedonia': 'North Macedonia',
}

let knownNames = null
function nameIndex() {
  if (knownNames) return knownNames
  knownNames = new Map()
  const dn = new Intl.DisplayNames(['en'], { type: 'region' })
  const L = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  for (const a of L) for (const b of L) {
    try {
      const n = dn.of(a + b)
      if (n && n !== a + b) knownNames.set(n.toLowerCase(), n)
    } catch { /* not a region */ }
  }
  for (const n of [...Object.values(MARC2), ...Object.values(ISO2)]) knownNames.set(n.toLowerCase(), n)
  for (const n of ['Turkey', 'Czech Republic', 'Russia', 'Iran', 'Vietnam', 'Taiwan', 'Palestine']) knownNames.set(n.toLowerCase(), n)
  return knownNames
}

/**
 * Country from a free-text postal address such as a Crossref member's
 * `location` ("Jl. Sudirman 12, Jakarta, Indonesia"). Only the last comma
 * segment (or last two, for names with a comma) is considered and it must be a recognised country name; otherwise null.
 */
export function countryFromAddress(address) {
  if (typeof address !== 'string' || !address.trim()) return null
  const parts = address.split(',').map(p => p.trim().replace(/[.\s]+$/, '').replace(/\s+/g, ' ').toLowerCase())
  // Try the last two segments first for names that contain a comma ("Korea, Republic of").
  for (const k of [parts.slice(-2).join(', '), parts[parts.length - 1]]) {
    const hit = ADDRESS_ALIASES[k] ?? nameIndex().get(k)
    if (hit) return hit
  }
  return null
}
