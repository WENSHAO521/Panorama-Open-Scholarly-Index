// Zone certificates (POSI 分区证书): a certificate stating a journal's POSI
// Zone (POSI-ZONES-2.0) in the current Citation Ranking edition: the zone of
// its PNCI percentile within its PSC category. Issued only for an official
// zone (official ranking, category of 50+ journals), in the browser, from the
// journal's profile record (the same /data/j/ shard the journal page reads),
// so it covers the whole index without a PDF per journal at build time.
// Certificates issued under the retired PCS-based trial (POSI-ZONES-1.0,
// payload POSI-ZONE-CERT-1) no longer verify: the ranking they stated is
// withdrawn.
//
// Like the certificate of indexing there is no signing key. The certificate
// number is a SHA-256 digest of the date of issue, the journal and the zones
// stated; verification recomputes it from the journal's current record. It
// therefore matches for as long as the journal's zones are unchanged: ranks
// move a little with every monthly refresh, zones rarely do, and a
// certificate whose zones no longer hold stops verifying.

import editions from './data-editions.json'
import type { JournalProfile } from './journal-profile'
import psc from './psc-v1.0.snapshot.json'
import { ZONES_VERSION, ZONE_SHARE, type Zone } from './zones'
import { quartileLabel } from './evaluation/display'

const PSC_NAME: Record<string, string> = Object.fromEntries(psc.categories.map(c => [c.code, c.name]))

export { ZONE_SHARE }

export interface ZonePlacement {
  scope: 'category'
  /** "P5.01 Philosophy" */
  label: string
  zone: Zone
  rank: number
  size: number
  percentile: number
  /** "C-Q1" */
  quartile: string | null
}

export interface ZoneCertificateData {
  code: string
  issued: string
  /** ranking edition year */
  year: number
  /** ranking snapshot date (YYYY-MM-DD) */
  rankingSnapshot: string | null
  /** data-layer snapshot the site was built from */
  snapshot: string
  journal: { key: string; pid: string; title: string; publisher: string | null; issns: string[] }
  pnci: number
  items: number | null
  primary: ZonePlacement
  verifyUrl: string
}

/** The journal's official category zone; empty when it has none. */
export function placements(j: JournalProfile): ZonePlacement[] {
  const e = j.ev
  if (!e || e.st !== 'official' || e.zs !== 'official' || !e.z || !e.cat || e.r == null || e.rt == null || e.p == null || e.pnci == null) return []
  return [{ scope: 'category', label: `${e.cat} ${PSC_NAME[e.cat] ?? ''}`.trim(), zone: e.z, rank: e.r, size: e.rt, percentile: e.p, quartile: quartileLabel(e.q) }]
}

export function hasZone(j: JournalProfile): boolean {
  return placements(j).length > 0
}

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('')
}

/** PZ-XXXX-XXXX-XXXX over the date of issue, journal, edition year, category and zone (not the rank). */
export async function zoneCertificateCode(issued: string, j: JournalProfile): Promise<string | null> {
  const p = placements(j)
  if (!p.length || !j.ev) return null
  const payload = ['POSI-ZONE-CERT-2', ZONES_VERSION, issued, j.pid, j.ev.y ?? '', j.ev.cat ?? '', p[0].zone].join('|')
  const h = (await sha256Hex(payload)).slice(0, 12).toUpperCase()
  return `PZ-${h.slice(0, 4)}-${h.slice(4, 8)}-${h.slice(8, 12)}`
}

export function zoneVerifyPath(code: string, issued: string, key: string): string {
  return `/certificate/zone/verify/?${new URLSearchParams({ c: code, d: issued, issn: key })}`
}

export async function buildZoneCertificate(j: JournalProfile, issued: string, origin: string): Promise<ZoneCertificateData | null> {
  const p = placements(j)
  const code = await zoneCertificateCode(issued, j)
  if (!code || !j.ev) return null
  return {
    code, issued, year: j.ev.y ?? new Date().getUTCFullYear(), rankingSnapshot: j.ev.snap ?? null, snapshot: editions.snapshot,
    journal: { key: j.k, pid: j.pid, title: j.t, publisher: j.pub ?? null, issns: j.is },
    pnci: j.ev.pnci!, items: j.ev.n ?? null,
    primary: p[0],
    verifyUrl: `${origin}${zoneVerifyPath(code, issued, j.k)}`,
  }
}
