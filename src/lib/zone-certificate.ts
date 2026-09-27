// Zone certificates (POSI 分区证书): a certificate stating a journal's POSI
// Zone in the current PCS-Q ranking edition. Issued for every ranked journal
// that has a zone, in the browser, from the journal's profile record (the
// same /data/j/ shard the journal page reads), so it covers the whole index
// without a PDF per journal at build time.
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
import { ZONES_TRIAL, ZONES_VERSION, zoneOf, type Zone } from './zones'

const PSC_NAME: Record<string, string> = Object.fromEntries(psc.categories.map(c => [c.code, c.name]))

export const ZONE_SHARE: Record<Zone, string> = {
  1: 'top 5%',
  2: 'top 6–20%',
  3: 'top 21–50%',
  4: 'lower 50%',
}

export interface ZonePlacement {
  scope: 'category' | 'overall'
  /** "P5.01 Philosophy" or "all ranked journals" */
  label: string
  zone: Zone
  rank: number
  size: number
  quartile: string | null
}

export interface ZoneCertificateData {
  code: string
  issued: string
  /** ranking edition year */
  year: number
  snapshot: string
  trial: boolean
  journal: { key: string; pid: string; title: string; publisher: string | null; issns: string[] }
  pcs: number
  items: number | null
  /** the category zone when the journal is ranked in its category, else the overall zone */
  primary: ZonePlacement
  /** the overall zone, when the primary one is the category zone */
  secondary: ZonePlacement | null
  verifyUrl: string
}

/** The journal's zones, category first; empty when it has none. */
export function placements(j: JournalProfile): ZonePlacement[] {
  const r = j.rk
  if (!r || r.pcs == null) return []
  const out: ZonePlacement[] = []
  const cz = r.cq ? zoneOf(r.cr, r.cs) : null
  if (cz && r.cat) out.push({ scope: 'category', label: `${r.cat} ${PSC_NAME[r.cat] ?? ''}`.trim(), zone: cz, rank: r.cr!, size: r.cs!, quartile: r.cq })
  const oz = zoneOf(r.or, r.os)
  if (oz) out.push({ scope: 'overall', label: 'all ranked journals', zone: oz, rank: r.or!, size: r.os!, quartile: r.oq })
  return out
}

export function hasZone(j: JournalProfile): boolean {
  return placements(j).length > 0
}

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('')
}

/** PZ-XXXX-XXXX-XXXX over the date of issue, journal, edition year and zones (not ranks). */
export async function zoneCertificateCode(issued: string, j: JournalProfile): Promise<string | null> {
  const p = placements(j)
  if (!p.length || !j.rk) return null
  const cat = p.find(x => x.scope === 'category')
  const all = p.find(x => x.scope === 'overall')
  const payload = ['POSI-ZONE-CERT-1', ZONES_VERSION, issued, j.pid, j.rk.y, j.rk.cat ?? '', cat?.zone ?? '', all?.zone ?? ''].join('|')
  const h = (await sha256Hex(payload)).slice(0, 12).toUpperCase()
  return `PZ-${h.slice(0, 4)}-${h.slice(4, 8)}-${h.slice(8, 12)}`
}

export function zoneVerifyPath(code: string, issued: string, key: string): string {
  return `/certificate/zone/verify/?${new URLSearchParams({ c: code, d: issued, issn: key })}`
}

export async function buildZoneCertificate(j: JournalProfile, issued: string, origin: string): Promise<ZoneCertificateData | null> {
  const p = placements(j)
  const code = await zoneCertificateCode(issued, j)
  if (!code || !j.rk) return null
  return {
    code, issued, year: j.rk.y, snapshot: editions.snapshot, trial: ZONES_TRIAL,
    journal: { key: j.k, pid: j.pid, title: j.t, publisher: j.pub ?? null, issns: j.is },
    pcs: j.rk.pcs!, items: j.rk.n,
    primary: p[0], secondary: p[1] ?? null,
    verifyUrl: `${origin}${zoneVerifyPath(code, issued, j.k)}`,
  }
}
