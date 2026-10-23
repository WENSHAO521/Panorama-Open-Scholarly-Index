// One badge for a journal's POSI grades, the same everywhere a journal is
// listed: collection tier, AJR rating, Citation Quartile and POSI Zone, as
// segments of a single strip led by "POSI" so it reads as POSI's own
// grading, not another database's labels. Hook-free: renders on static
// pages and inside client components alike.

import Link from 'next/link'
import type { CitationQuartile, PosiZone, ZoneStatus } from '@/lib/evaluation/rules'
import { QUARTILE_TOOLTIP } from '@/lib/evaluation/rules'
import { ZONE_SHARE, quartileLabel } from '@/lib/evaluation/display'
import type { Locale } from '@/i18n/config'
import { localizedHref } from '@/i18n/alternates'

export type GradeTier = 'core' | 'indexed'

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
  /** Language of the badge's words and of its link. */
  locale?: Locale
}

type Seg = { key: string; text: string; title: string; style?: React.CSSProperties; dashed?: boolean }

// The badge's words in each language. The grade codes themselves (AJR, C-Q1, Zone) are the same everywhere.
const en = {
  core: 'Core Collection', coreTitle: 'Core Collection: certified after PQF editorial evaluation',
  indexed: 'Indexed', indexedTitle: 'Indexed from registry metadata; not certified',
  ajrTitle: 'AJR Rating: an absolute lifecycle rating, A+ to D',
  provisional: 'provisional', provisionalTitle: 'Provisional. ',
  cqUnranked: 'C-Q unranked', cqUnrankedTitle: 'Citation Quartile: not yet ranked',
  zone: 'Zone', zoneTitle: 'POSI Zone {zone}: {share} of its PSC category by PNCI percentile', zoneProvisional: ' (provisional)',
  zoneUnassigned: 'Zone unassigned', zoneUnassignedTitle: 'POSI Zone: not yet assigned',
  label: 'POSI grades: {list}. How to read POSI grades', own: 'POSI’s own grades', sep: ', ',
  quartileTitle: QUARTILE_TOOLTIP, share: ZONE_SHARE as Record<PosiZone, string>,
}
const WORDS: Record<Locale, typeof en> = {
  en,
  'zh-Hans': {
    core: '核心合集', coreTitle: '核心合集：经 PQF 编辑评审认证',
    indexed: '已收录', indexedTitle: '依据注册机构元数据收录，未经认证',
    ajrTitle: 'AJR 评级：期刊生命周期绝对评级，A+ 至 D',
    provisional: '暂定', provisionalTitle: '暂定。',
    cqUnranked: 'C-Q 未排名', cqUnrankedTitle: '引文分区：尚未排名',
    zone: 'Zone', zoneTitle: 'POSI Zone {zone}：按 PNCI 百分位位于其 PSC 类别的{share}', zoneProvisional: '（暂定）',
    zoneUnassigned: 'Zone 未划定', zoneUnassignedTitle: 'POSI Zone：尚未划定',
    label: 'POSI 等级：{list}。查看如何解读 POSI 等级', own: 'POSI 自有等级', sep: '，',
    quartileTitle: 'POSI 引文分区，依据期刊在其 PSC 类别内的 PNCI 百分位划定。',
    share: { 1: '前 5%', 2: '前 5%–20%', 3: '前 20%–50%', 4: '后 50%' },
  },
}

const TIER_STYLE: Record<GradeTier, React.CSSProperties> = {
  core: { background: 'var(--teal-soft)', color: 'var(--teal)' },
  indexed: { color: 'var(--ink-2)' },
}

const QUARTILE_STYLE: Record<CitationQuartile, React.CSSProperties> = {
  Q1: { background: 'var(--teal)', color: 'var(--on-teal)' },
  Q2: { background: 'var(--teal-soft)', color: 'var(--teal)' },
  Q3: { color: 'var(--ink-2)' },
  Q4: { color: 'var(--muted)' },
}

// Four steps, one per zone, so Zone 1 and Zone 2 read apart; lighter than the quartile steps (no solid fill).
const ZONE_STYLE: Record<PosiZone, React.CSSProperties> = {
  1: { background: 'var(--teal-soft)', color: 'var(--teal)' },
  2: { color: 'var(--teal)' },
  3: { color: 'var(--ink-2)' },
  4: { color: 'var(--muted)' },
}

export function PosiGrades({ tier, ajr, quartile, quartileProvisional, zone, zoneStatus = 'official', showEmpty = false, size = 'sm', locale = 'en' }: PosiGradesProps) {
  const w = WORDS[locale]
  const segs: Seg[] = [{ key: 'tier', text: w[tier], title: tier === 'core' ? w.coreTitle : w.indexedTitle, style: TIER_STYLE[tier] }]
  if (ajr) segs.push({ key: 'ajr', text: `AJR ${ajr}`, title: w.ajrTitle, style: { color: 'var(--ink)' } })
  const q = quartileLabel(quartile)
  if (q && quartile) {
    segs.push({ key: 'q', text: quartileProvisional ? `${q} ${w.provisional}` : q, title: quartileProvisional ? `${w.provisionalTitle}${w.quartileTitle}` : w.quartileTitle, style: quartileProvisional ? { color: 'var(--ink-2)' } : QUARTILE_STYLE[quartile], dashed: quartileProvisional })
  } else if (showEmpty) {
    segs.push({ key: 'q', text: w.cqUnranked, title: w.cqUnrankedTitle, style: { color: 'var(--soft)' } })
  }
  if (zone && zoneStatus !== 'not_assigned') {
    const provisional = zoneStatus === 'provisional'
    segs.push({ key: 'z', text: provisional ? `${w.zone} ${zone} ${w.provisional}` : `${w.zone} ${zone}`, title: `${w.zoneTitle.replace('{zone}', String(zone)).replace('{share}', w.share[zone])}${provisional ? w.zoneProvisional : ''}`, style: provisional ? { color: 'var(--ink-2)' } : ZONE_STYLE[zone], dashed: provisional })
  } else if (showEmpty) {
    segs.push({ key: 'z', text: w.zoneUnassigned, title: w.zoneUnassignedTitle, style: { color: 'var(--soft)' } })
  }

  const text = size === 'md' ? 'text-[12.5px] h-7' : 'text-[11.5px] h-6'
  const label = segs.map(s => s.text).join(w.sep)
  return (
    <Link href={localizedHref(locale, '/grades/')} prefetch={false} aria-label={w.label.replace('{list}', label)}
      className={`posi-grades inline-flex items-stretch whitespace-nowrap rounded-[var(--radius)] overflow-hidden font-medium align-middle ${text} transition-shadow hover:shadow-[0_0_0_2px_var(--posi-brand-line)]`}
      style={{ border: '1px solid var(--line)', background: 'var(--surface)' }}>
      <span className="grid place-items-center px-1.5 font-semibold tracking-wide" style={{ background: 'var(--posi-brand)', color: 'var(--posi-on-brand)' }} title={w.own}>POSI</span>
      {segs.map(s => (
        <span key={s.key} title={s.title} className="grid place-items-center px-2 tnum"
          style={{ ...s.style, borderLeft: `1px ${s.dashed ? 'dashed' : 'solid'} var(--line)` }}>{s.text}</span>
      ))}
    </Link>
  )
}
