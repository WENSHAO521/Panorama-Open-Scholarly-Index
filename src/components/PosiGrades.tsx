// One badge for a journal's POSI grades, the same everywhere a journal is
// listed: collection tier, AJR rating, Citation Quartile and POSI Zone, as
// segments of a single strip led by "POSI" so it reads as POSI's own
// grading, not another database's labels. Hook-free: renders on static
// pages and inside client components alike.

import Link from 'next/link'
import type { CitationQuartile, PosiZone, ZoneStatus } from '@/lib/evaluation/rules'
import { QUARTILE_TOOLTIP } from '@/lib/evaluation/rules'
import { ZONE_SHARE, quartileLabel } from '@/lib/evaluation/display'

export type GradeTier = 'core' | 'candidate' | 'indexed'

export interface PosiGradesProps {
  tier: GradeTier
  ajr?: string | null
  quartile?: CitationQuartile | null
  quartileProvisional?: boolean
  zone?: PosiZone | null
  zoneStatus?: ZoneStatus
  /** Show the quartile and zone slots even when not yet assigned. */
  showEmpty?: boolean
  size?: 'sm' | 'md'
}

type Seg = { key: string; text: string; title: string; style?: React.CSSProperties; dashed?: boolean }

const TIER: Record<GradeTier, { text: string; title: string; style: React.CSSProperties }> = {
  core: { text: 'Core', title: 'Core Collection: certified after PQF editorial evaluation', style: { background: 'var(--teal-soft)', color: 'var(--teal)' } },
  candidate: { text: 'Under review', title: 'Certified, now under PQF re-review', style: { color: 'var(--partial)' } },
  indexed: { text: 'Indexed', title: 'Indexed from registry metadata; not certified', style: { color: 'var(--ink-2)' } },
}

const QUARTILE_STYLE: Record<CitationQuartile, React.CSSProperties> = {
  Q1: { background: 'var(--teal)', color: 'var(--on-teal)' },
  Q2: { background: 'var(--teal-soft)', color: 'var(--teal)' },
  Q3: { color: 'var(--ink-2)' },
  Q4: { color: 'var(--muted)' },
}

export function PosiGrades({ tier, ajr, quartile, quartileProvisional, zone, zoneStatus = 'official', showEmpty = false, size = 'sm' }: PosiGradesProps) {
  const segs: Seg[] = [{ key: 'tier', ...TIER[tier] }]
  if (ajr) segs.push({ key: 'ajr', text: `AJR ${ajr}`, title: 'AJR Rating: an absolute lifecycle rating, A+ to D', style: { color: 'var(--ink)' } })
  const q = quartileLabel(quartile)
  if (q && quartile) {
    segs.push({ key: 'q', text: quartileProvisional ? `${q} prov.` : q, title: quartileProvisional ? `Provisional. ${QUARTILE_TOOLTIP}` : QUARTILE_TOOLTIP, style: quartileProvisional ? { color: 'var(--ink-2)' } : QUARTILE_STYLE[quartile], dashed: quartileProvisional })
  } else if (showEmpty) {
    segs.push({ key: 'q', text: 'C-Q –', title: 'Citation Quartile: not yet ranked', style: { color: 'var(--soft)' } })
  }
  if (zone && zoneStatus !== 'not_assigned') {
    const provisional = zoneStatus === 'provisional'
    segs.push({ key: 'z', text: `Zone ${zone}`, title: `POSI Zone ${zone}: ${ZONE_SHARE[zone]} of its PSC category by PNCI percentile${provisional ? ' (provisional)' : ''}`, style: { color: zone <= 2 ? 'var(--teal)' : zone === 3 ? 'var(--ink-2)' : 'var(--muted)' }, dashed: provisional })
  } else if (showEmpty) {
    segs.push({ key: 'z', text: 'Zone –', title: 'POSI Zone: not yet assigned', style: { color: 'var(--soft)' } })
  }

  const text = size === 'md' ? 'text-[12.5px] h-7' : 'text-[11.5px] h-6'
  const label = segs.map(s => s.text.replace('–', 'not yet assigned')).join(', ')
  return (
    <Link href="/grades/" prefetch={false} aria-label={`POSI grades: ${label}. How to read POSI grades`}
      className={`posi-grades inline-flex items-stretch whitespace-nowrap rounded-[3px] overflow-hidden font-medium align-middle ${text} transition-shadow hover:shadow-[0_0_0_2px_var(--teal-soft)]`}
      style={{ border: '1px solid var(--line)', background: 'var(--surface)' }}>
      <span className="grid place-items-center px-1.5 font-semibold tracking-wide" style={{ background: 'var(--ink)', color: 'var(--surface)' }} title="POSI's own grades">POSI</span>
      {segs.map(s => (
        <span key={s.key} title={s.title} className="grid place-items-center px-2 tnum"
          style={{ ...s.style, borderLeft: `1px ${s.dashed ? 'dashed' : 'solid'} var(--line)` }}>{s.text}</span>
      ))}
    </Link>
  )
}
