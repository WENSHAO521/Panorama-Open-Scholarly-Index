// Country and territory names in the interface language. Server-side only: it carries the full place list.
import { countryDisplayName, isoCountry } from '@/lib/country-codes'
import { LISTED_PLACES } from '@/lib/country-list'
import type { Locale } from './config.ts'

const zhRegion = new Intl.DisplayNames(['zh-Hans'], { type: 'region' })

/** As countryDisplayName, in `locale`: the editors' Chinese name for a listed place, else the standard one. */
export function countryNameIn(locale: Locale, raw: string | null | undefined): string | null {
  if (locale !== 'zh-Hans' || !raw) return countryDisplayName(raw)
  const code = isoCountry(raw)
  if (code) {
    const listed = LISTED_PLACES.get(code)
    if (listed) return listed.zh
    try { const n = zhRegion.of(code); if (n && n !== code) return n } catch { /* not a region */ }
  }
  // A free-text name such as "China, Hong Kong SAR": the longest listed English name it contains.
  const text = raw.toLowerCase()
  let best: { name: string; zh: string } | null = null
  for (const p of LISTED_PLACES.values()) {
    if (text.includes(p.name.toLowerCase()) && (!best || p.name.length > best.name.length)) best = p
  }
  return best ? best.zh : countryDisplayName(raw)
}
