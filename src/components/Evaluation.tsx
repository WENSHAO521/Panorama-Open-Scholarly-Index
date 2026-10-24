// Evaluation display (POSI-EVAL-1.0). Presentation only: every label and
// threshold comes from src/lib/evaluation. Hook-free, so it renders on
// static pages and inside client components alike.

import Link from 'next/link'
import { Hourglass } from '@phosphor-icons/react/dist/ssr'
import type { JournalEvaluation } from '@/lib/evaluation/journal'
import {
  AJR_MODEL_NAME, PCS_DISCLAIMER, PQF_DISCLAIMER, QUARTILE_TOOLTIP,
  type CitationQuartile, type CitationRankingStatus, type PosiZone, type ZoneStatus, type PqfStatus,
} from '@/lib/evaluation/rules'
import {
  NOT_AVAILABLE, NOT_YET_RANKED, RANKING_STATUS_LABEL, ZONE_SHARE, fmtCoverage, fmtDay, fmtPercentile, fmtPqf, fmtScore, fmtSnapshot,
  pqfStatusLabel, quartileLabel, rankingReason,
} from '@/lib/evaluation/display'
import type { Locale } from '@/i18n/config'
import { localizedHref } from '@/i18n/alternates'
import { formatDate, formatMonth, subjectName } from '@/i18n/format'

// The words of the badges below in Simplified Chinese; English uses the labels from lib/evaluation. Grade codes
// (C-Q1, Zone 1) are the same in every language.
const ZH = {
  notYetRanked: '尚未排名',
  provisional: '暂定',
  quartileTitle: 'POSI 引文分区，依据期刊在其 PSC 类别内的 PNCI 百分位划定。',
  noZone: '无 Zone',
  zoneTitle: 'POSI Zone {z}：按 PNCI 百分位位于期刊所属 PSC 类别的{share}',
  zoneProvisional: '（暂定：类别内期刊数为 30–49 种）',
  share: { 1: '前 5%', 2: '前 5%–20%', 3: '前 20%–50%', 4: '后 50%' } as Record<PosiZone, string>,
  status: {
    official: '正式', provisional: '暂定', insufficient_items: '数据不足', insufficient_category: '类别规模不足',
    incomplete_coverage: '引文覆盖不完整', observation: '观察期', not_available: '尚未排名',
  } as Record<CitationRankingStatus, string>,
}

/** The label of a ranking status in the language. */
export function rankingStatusLabel(status: CitationRankingStatus, locale: Locale = 'en'): string {
  return locale === 'zh-Hans' ? ZH.status[status] : RANKING_STATUS_LABEL[status]
}

/** Citation Quartile chip, C-Q1 … C-Q4; one accent stepped in strength. */
export function QuartileBadge({ q, provisional = false, locale = 'en' }: { q: CitationQuartile | null | undefined; provisional?: boolean; locale?: Locale }) {
  const zh = locale === 'zh-Hans'
  const label = quartileLabel(q)
  if (!label || !q) return <span style={{ color: 'var(--soft)' }}>{zh ? ZH.notYetRanked : NOT_YET_RANKED}</span>
  const tip = zh ? ZH.quartileTitle : QUARTILE_TOOLTIP
  const tone = {
    Q1: { background: 'var(--teal)', color: 'var(--on-teal)', borderColor: 'var(--teal)' },
    Q2: { background: 'var(--teal-soft)', color: 'var(--teal)', borderColor: 'var(--teal-line)' },
    Q3: { background: 'var(--surface-2)', color: 'var(--ink-2)', borderColor: 'var(--line)' },
    Q4: { background: 'transparent', color: 'var(--muted)', borderColor: 'var(--line)' },
  }[q]
  return (
    <span className="chip font-semibold whitespace-nowrap" title={provisional ? `${zh ? `${ZH.provisional}。` : 'Provisional. '}${tip}` : tip}
      style={provisional ? { ...tone, background: 'transparent', color: 'var(--ink-2)', borderColor: 'var(--line)', borderStyle: 'dashed' } : tone}>
      {provisional ? (zh ? `${ZH.provisional} ${label}` : `Provisional ${label}`) : label}
    </span>
  )
}

// One step per zone, outlined so zones stay distinct from the filled quartile chips.
const ZONE_TONE: Record<PosiZone, React.CSSProperties> = {
  1: { color: 'var(--teal)', borderColor: 'var(--teal)', background: 'var(--teal-soft)' },
  2: { color: 'var(--teal)', borderColor: 'var(--teal-line)', background: 'transparent' },
  3: { color: 'var(--ink-2)', borderColor: 'var(--line)', background: 'transparent' },
  4: { color: 'var(--muted)', borderColor: 'var(--line)', background: 'transparent' },
}

/** POSI Zone chip: numbered and outlined, distinct from the filled quartile chips. */
export function ZoneBadge({ z, status = 'official', long = false, locale = 'en' }: { z: PosiZone | null | undefined; status?: ZoneStatus; long?: boolean; locale?: Locale }) {
  const zh = locale === 'zh-Hans'
  if (!z || status === 'not_assigned') return <span style={{ color: 'var(--soft)' }}>{zh ? ZH.noZone : 'No zone'}</span>
  const provisional = status === 'provisional'
  const share = zh ? ZH.share[z] : ZONE_SHARE[z]
  return (
    <span className="chip font-semibold whitespace-nowrap" title={zh
        ? `${ZH.zoneTitle.replace('{z}', String(z)).replace('{share}', share)}${provisional ? ZH.zoneProvisional : ''}`
        : `POSI Zone ${z}: ${ZONE_SHARE[z]} of the journal’s PSC category by PNCI percentile${provisional ? ' (provisional: category of 30–49 journals)' : ''}`}
      style={{ ...ZONE_TONE[z], borderStyle: provisional ? 'dashed' : 'solid' }}>
      {provisional ? (zh ? `${ZH.provisional} ` : 'Provisional ') : ''}Zone {z}{long ? ` · ${share}` : ''}
    </span>
  )
}

export function RankingStatusBadge({ status, locale = 'en' }: { status: CitationRankingStatus; locale?: Locale }) {
  const official = status === 'official'
  return (
    <span className="chip whitespace-nowrap" style={official ? { color: 'var(--teal)', background: 'var(--teal-soft)', borderColor: 'transparent' } : status === 'provisional' ? { borderStyle: 'dashed' } : { color: 'var(--muted)' }}>
      {rankingStatusLabel(status, locale)}
    </span>
  )
}

// The words of the evaluation panel and cards. English uses the labels from lib/evaluation, so the English pages keep
// exactly the wording the rules define.
const PANEL_EN = {
  notAvailable: NOT_AVAILABLE,
  ajrTitle: 'AJR Rating: an absolute lifecycle rating, not a quartile', rating: (r: string) => `Rating ${r}`,
  coreCollection: 'Core Collection', status: 'Status', certified: 'Eligible, certified', notCertified: 'Indexed, not certified',
  pqfScore: 'PQF score', notAssessed: 'Not assessed', eligibility: 'Eligibility', pqfStatus: (s: PqfStatus | null | undefined) => pqfStatusLabel(s),
  pqfDisclaimer: PQF_DISCLAIMER, pcsDisclaimer: PCS_DISCLAIMER, quartileTooltip: QUARTILE_TOOLTIP,
  devRating: 'Journal Development Rating', lifecycle: 'Lifecycle', model: AJR_MODEL_NAME as Record<string, string>,
  months: (n: number) => `${n} months since first publication`,
  provisionalScore: 'Provisional score: evidence coverage below the official threshold',
  observationModel: 'Observation', observation: 'Observation period', ajrmNotYet: 'AJR-M: not yet rated', ajrmNot: 'AJR-M: not rated', notRated: 'Not rated', notYetRated: 'Not yet rated',
  rated: 'Rated', reRated: 'Core Collection journals are re-rated every month',
  citationPerformance: 'Citation Performance', method: 'Method', notComputed: 'Not computed',
  pcsNote: 'Supplementary; does not determine rank, quartile or zone', eligibleItems: 'Eligible items',
  coverage: (c: string) => `Citation coverage ${c}`, pscRank: 'PSC Citation Rank', percentile: 'Percentile', citationQuartile: 'Citation Quartile',
  noZoneProvisional: 'No zone for a provisional ranking', noZoneSmall: 'No zone: category has fewer than 30 ranked journals',
  rankingStatus: 'Ranking status', snapshot: 'Snapshot', notYetGenerated: 'Not yet generated', statusLabel: RANKING_STATUS_LABEL as Record<CitationRankingStatus, string>,
  reason: (r: string | null | undefined, items?: number | null) => rankingReason(r, items),
  day: (d: string | null | undefined) => fmtDay(d), month: (d: string | null | undefined) => fmtSnapshot(d),
  rankIn: (rank: React.ReactNode, cat: React.ReactNode) => <>{rank} in {cat}</>,
  passed: 'Passed editorial evaluation under the POSI Quality Framework.', listed: 'Listed in the journal directory. Certification is by application.',
  apply: 'Apply for certification', whatPqf: 'What PQF measures',
  autoPqf: (score: React.ReactNode, version: string) => <>Automated pre-screen: {score} ({version}), not an admission decision.</>,
  pqfFramework: 'Eligibility framework; not a citation metric.', ajrLifecycle: 'AJR lifecycle', aboutAjr: 'About AJR', ratedOn: (d: string) => ` · rated ${d}`,
  provisionalScoreEnd: '.', citationRanking: 'Citation ranking', rankingMethod: 'Ranking method',
  inCategory: (cat: React.ReactNode, p: string) => <>In {cat} · percentile {p}</>,
  pnci: (v: React.ReactNode) => <>PNCI {v}</>, notAvailableLower: NOT_AVAILABLE.toLowerCase(),
  itemsCount: (n: number) => `${n} eligible items`, itemsNA: 'eligible items not available', coverageShort: (c: string) => ` · coverage ${c}`,
  snapshotLine: (s: string) => `Snapshot: ${s}`, notYetGeneratedLower: 'not yet generated', stop: '.',
  categoryName: (_id: string, name: string) => name,
}
type PanelWords = typeof PANEL_EN

const ZH_REASON: Record<string, string> = {
  no_eligible_items: '引文窗口内无合格的可引文献',
  citation_coverage_below_90: '获取到引文数据的合格文献不足 90%',
  fewer_than_10_items: '合格的可引文献少于 10 篇',
  no_pnci: '尚未计算 PNCI',
  no_rankable_category: '无高置信度 PSC 类别（多学科或暂定分类）',
  fewer_than_20_items: '合格的可引文献少于 20 篇',
  fewer_than_2_publication_years: '合格文献仅来自单一出版年份',
  category_below_20: '该 PSC 类别中可排名期刊少于 20 种',
}
const ZH_PQF: Record<PqfStatus, string> = { eligible: '符合条件', review_required: '需复核', insufficient_evidence: '证据不足', not_eligible: '不符合条件' }

const PANEL_ZH: PanelWords = {
  notAvailable: '暂无',
  ajrTitle: 'AJR 评级：依据期刊生命周期给出的绝对评级，并非分区', rating: r => `评级 ${r}`,
  coreCollection: '核心合集', status: '状态', certified: '符合条件，已认证', notCertified: '已收录，未认证',
  pqfScore: 'PQF 得分', notAssessed: '未评估', eligibility: '资格', pqfStatus: s => (s ? ZH_PQF[s] : '未评估'),
  pqfDisclaimer: 'PQF 是资格与质量框架评估，并非引文排名指标，不决定引文分区或 POSI Zone。',
  pcsDisclaimer: 'PCS 是补充性引文指标，不决定 POSI 官方引文排名、引文百分位、引文分区或 POSI Zone。',
  quartileTooltip: ZH.quartileTitle,
  devRating: '期刊发展评级', lifecycle: '生命周期', model: { Observation: '观察期', 'AJR-E': '早期期刊评级', 'AJR-M': '成熟期刊评级' },
  months: n => `首次出版至今 ${n} 个月`,
  provisionalScore: '暂定分值：证据覆盖率低于正式阈值',
  observationModel: '观察期', observation: '观察期', ajrmNotYet: 'AJR-M：尚未评级', ajrmNot: 'AJR-M：未评级', notRated: '未评级', notYetRated: '尚未评级',
  rated: '评级日期', reRated: '核心合集期刊每月重新评级',
  citationPerformance: '引文表现', method: '方法', notComputed: '未计算',
  pcsNote: '补充指标，不决定排名、分区或 Zone', eligibleItems: '合格文献数',
  coverage: c => `引文覆盖率 ${c}`, pscRank: 'PSC 引文排名', percentile: '百分位', citationQuartile: '引文分区',
  noZoneProvisional: '暂定排名不划定 Zone', noZoneSmall: '无 Zone：该类别已排名期刊少于 30 种',
  rankingStatus: '排名状态', snapshot: '快照', notYetGenerated: '尚未生成', statusLabel: ZH.status,
  reason: (r, items) => {
    if (!r) return null
    if ((r === 'fewer_than_20_items' || r === 'fewer_than_10_items') && typeof items === 'number' && Number.isFinite(items)) return `合格文献 ${Math.round(items)} 篇`
    return ZH_REASON[r] ?? r.replace(/_/g, ' ')
  },
  day: d => (d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? formatDate('zh-Hans', d) : null),
  month: d => (d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? formatMonth('zh-Hans', d) : '尚未生成'),
  rankIn: (rank, cat) => <>{rank}（{cat}）</>,
  passed: '已依据 POSI 质量框架通过编辑评审。', listed: '已列入期刊目录。认证须经申请。',
  apply: '申请认证', whatPqf: 'PQF 评估内容',
  autoPqf: (score, version) => <>自动预筛结果：{score}（{version}），并非入选决定。</>,
  pqfFramework: '资格评估框架，并非引文指标。', ajrLifecycle: 'AJR 生命周期评级', aboutAjr: '关于 AJR', ratedOn: d => ` · 评级于 ${d}`,
  provisionalScoreEnd: '。', citationRanking: '引文排名', rankingMethod: '排名方法',
  inCategory: (cat, p) => <>所属类别：{cat} · 百分位 {p}</>,
  pnci: v => <>PNCI {v}</>, notAvailableLower: '暂无',
  itemsCount: n => `合格文献 ${n} 篇`, itemsNA: '合格文献数暂无', coverageShort: c => ` · 覆盖率 ${c}`,
  snapshotLine: s => `快照：${s}`, notYetGeneratedLower: '尚未生成', stop: '。',
  categoryName: (id, name) => subjectName('zh-Hans', id, name),
}

const PANEL: Record<Locale, PanelWords> = { en: PANEL_EN, 'zh-Hans': PANEL_ZH }

export function AjrRatingBadge({ rating, locale = 'en' }: { rating: string | null | undefined; locale?: Locale }) {
  const t = PANEL[locale]
  if (!rating) return <span style={{ color: 'var(--soft)' }}>{t.notAvailable}</span>
  return <span className="chip whitespace-nowrap" title={t.ajrTitle}>{t.rating(rating)}</span>
}

function Row({ k, v, note }: { k: React.ReactNode; v: React.ReactNode; note?: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,150px)_minmax(0,1fr)] gap-3 py-2 items-baseline">
      <dt style={{ color: 'var(--muted)' }}>{k}</dt>
      <dd className="min-w-0">
        {v}
        {note && <span className="block text-[12px] mt-0.5" style={{ color: 'var(--soft)' }}>{note}</span>}
      </dd>
    </div>
  )
}

function Block({ title, id, children, aside }: { title: string; id: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="py-3 first:pt-0" style={{ borderTop: '1px solid var(--line-soft)' }}>
      <div className="flex items-baseline justify-between gap-3">
        <h3 id={id} className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>{title}</h3>
        {aside}
      </div>
      <dl className="mt-1 text-[13.5px] divide-y divide-[var(--line-soft)]">{children}</dl>
    </section>
  )
}

const mono = (s: string) => <span className="font-mono tnum">{s}</span>
const soft = (s: string) => <span style={{ color: 'var(--soft)' }}>{s}</span>

/**
 * The fixed evaluation order: Core Collection status, PQF, AJR, Citation
 * Performance. `core` is null for journals outside the curated collections.
 * AJR is published for Core Collection journals only: no other journal
 * shows the AJR block.
 */
export function EvaluationPanel({ ev, core, idPrefix = 'ev', showPqf = true, locale = 'en' }: {
  ev: JournalEvaluation
  core: 'core' | 'indexed' | null
  idPrefix?: string
  showPqf?: boolean
  locale?: Locale
}) {
  const t = PANEL[locale]
  const href = (p: string) => localizedHref(locale, p)
  const r = ev.ranking
  const ranked = r.rank != null
  const provisional = r.status === 'provisional'
  const a = ev.ajr
  return (
    <div className="space-y-1">
      <Block title={t.coreCollection} id={`${idPrefix}-core`}>
        <Row k={t.status} v={core === 'core' ? <span className="font-medium" style={{ color: 'var(--teal)' }}>{t.certified}</span> : t.notCertified} />
      </Block>

      {showPqf && (
        <Block title="PQF" id={`${idPrefix}-pqf`} aside={ev.pqf.version ? <span className="font-mono text-[10.5px]" style={{ color: 'var(--soft)' }}>{ev.pqf.version}</span> : null}>
          <Row k={t.pqfScore} v={ev.pqf.score != null ? mono(`${fmtPqf(ev.pqf.score)} / 100`) : soft(t.notAssessed)} />
          <Row k={t.eligibility} v={t.pqfStatus(ev.pqf.status)} note={t.pqfDisclaimer} />
        </Block>
      )}

      {core === 'core' && <Block title={t.devRating} id={`${idPrefix}-ajr`} aside={a.version ? <span className="font-mono text-[10.5px]" style={{ color: 'var(--soft)' }}>{a.version}</span> : null}>
        <Row k={t.lifecycle} v={a.model ? `${a.model === 'Observation' ? t.observationModel : a.model} · ${t.model[a.model]}` : soft(t.notAvailable)}
          note={a.monthsSinceLaunch != null ? t.months(a.monthsSinceLaunch) : undefined} />
        {a.score != null
          ? <Row k={a.model ?? 'AJR'} v={<>{mono(`${fmtScore(a.score)} / 100`)} <span className="ml-1"><AjrRatingBadge rating={a.rating} locale={locale} /></span></>}
              note={a.status === 'provisional' ? t.provisionalScore : undefined} />
          : <Row k="AJR" v={soft(a.lifecycle === 'observation' ? t.observation : a.model === 'AJR-M' ? (a.status === 'not_rated' ? t.ajrmNotYet : t.ajrmNot) : t.notRated)} note={a.reason ?? undefined} />}
        {t.day(a.ratedAt) && <Row k={t.rated} v={t.day(a.ratedAt)} note={t.reRated} />}
      </Block>}

      <Block title={t.citationPerformance} id={`${idPrefix}-cit`} aside={<Link href={href('/methodology/#ranking')} className="link text-[12px]">{t.method}</Link>}>
        <Row k="PNCI" v={ev.citations.pnci != null ? mono(fmtScore(ev.citations.pnci)) : soft(t.notAvailable)} note={ev.citations.pnciModel ?? undefined} />
        {/* PCI is a Core Collection indicator: other journals do not show it at all. */}
        {core === 'core' && <Row k="PCI" v={ev.citations.pci != null ? mono(fmtScore(ev.citations.pci)) : soft(t.notComputed)} />}
        <Row k="PCS" v={ev.citations.pcs != null ? mono(fmtScore(ev.citations.pcs)) : soft(t.notAvailable)} note={t.pcsNote} />
        <Row k={t.eligibleItems} v={ev.citations.eligibleItems != null ? mono(String(ev.citations.eligibleItems)) : soft(t.notAvailable)}
          note={ev.citations.coverage != null ? t.coverage(fmtCoverage(ev.citations.coverage)) : undefined} />
        <Row k={t.pscRank} v={ranked
          ? (r.categoryId ? t.rankIn(mono(`${r.rank} / ${r.total}`), <Link href={href(`/rankings/${r.categoryId}/`)} className="link">{t.categoryName(r.categoryId, r.category ?? r.categoryId)}</Link>) : mono(`${r.rank} / ${r.total}`))
          : soft(t.statusLabel[r.status])} />
        {ranked && <Row k={t.percentile} v={mono(fmtPercentile(r.percentile))} />}
        {ranked && <Row k={t.citationQuartile} v={<QuartileBadge q={r.quartile} provisional={provisional} locale={locale} />} note={t.quartileTooltip} />}
        {ranked && <Row k="POSI Zone" v={<ZoneBadge z={r.zone} status={r.zoneStatus} long locale={locale} />} note={!r.zone ? (provisional ? t.noZoneProvisional : t.noZoneSmall) : undefined} />}
        <Row k={t.rankingStatus} v={<RankingStatusBadge status={r.status} locale={locale} />} note={t.reason(r.reason, ev.citations.eligibleItems) ?? undefined} />
        <Row k={t.snapshot} v={r.snapshot ? t.month(r.snapshot) : soft(t.notYetGenerated)} note={r.methodology ? `${r.methodology} · ${ev.evaluationVersion}` : ev.evaluationVersion} />
      </Block>
      <p className="pt-2 text-[11.5px] leading-snug" style={{ color: 'var(--soft)' }}>{t.pcsDisclaimer}</p>
    </div>
  )
}

type CardState = 'done' | 'pending' | 'none'
const CARD_DOT: Record<CardState, string> = { done: 'var(--verified)', pending: 'var(--partial)', none: 'var(--soft)' }

function Card({ step, title, version, state, value, children, action, wide = false }: {
  step: number; title: string; version?: string | null; state: CardState
  value: React.ReactNode; children?: React.ReactNode; action?: React.ReactNode; wide?: boolean
}) {
  return (
    <div className={`p-4 flex flex-col gap-1.5 min-w-0${wide ? ' sm:col-span-2' : ''}`} style={{ background: 'var(--surface)' }}>
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-[11.5px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>{step} · {title}</h3>
        {version && <span className="font-mono text-[10.5px]" style={{ color: 'var(--soft)' }}>{version}</span>}
      </div>
      <div className="flex items-center gap-2 text-[15px] font-medium" style={{ color: 'var(--ink)' }}>
        <span aria-hidden className="inline-block h-2 w-2 rounded-full shrink-0" style={{ background: CARD_DOT[state] }} />
        <span className="min-w-0">{value}</span>
      </div>
      {children && <div className="text-[12.5px] leading-snug space-y-1" style={{ color: 'var(--muted)' }}>{children}</div>}
      {action && <div className="mt-auto pt-1 text-[12.5px]">{action}</div>}
    </div>
  )
}

/**
 * The evaluation as status cards in the fixed order (Core Collection, PQF,
 * AJR, Citation Ranking). Same values as EvaluationPanel, laid out so the
 * state of each stage reads at a glance on the journal record. The AJR card
 * is shown for Core Collection journals only.
 */
export function EvaluationCards({ ev, core, autoPqf, locale = 'en' }: {
  ev: JournalEvaluation
  core: 'core' | 'indexed'
  autoPqf?: { total: number; version: string } | null
  locale?: Locale
}) {
  const t = PANEL[locale]
  const href = (p: string) => localizedHref(locale, p)
  const r = ev.ranking
  const ranked = r.rank != null
  const provisional = r.status === 'provisional'
  const a = ev.ajr
  const c = ev.citations
  const reason = t.reason(r.reason, c.eligibleItems)
  return (
    <div>
      <div className="grid sm:grid-cols-2 gap-px rounded-[var(--radius-lg)] overflow-hidden" style={{ background: 'var(--line)', border: '1px solid var(--line)' }}>
        <Card step={1} title={t.coreCollection} state={core === 'core' ? 'done' : 'none'}
          value={core === 'core' ? <span style={{ color: 'var(--teal)' }}>{t.certified}</span> : t.notCertified}
          action={core === 'core'
            ? <Link href={href('/core-collection/')} className="link">{t.coreCollection}</Link>
            : <Link href={href('/certification/')} className="link">{t.apply}</Link>}>
          <p>{core === 'core' ? t.passed : t.listed}</p>
        </Card>

        <Card step={2} title="PQF" version={ev.pqf.version} state={ev.pqf.status === 'eligible' ? 'done' : ev.pqf.score != null ? 'pending' : 'none'}
          value={ev.pqf.score != null ? <>{mono(`${fmtPqf(ev.pqf.score)} / 100`)} · {t.pqfStatus(ev.pqf.status)}</> : t.notAssessed}
          action={<Link href={href('/pqf/')} className="link">{t.whatPqf}</Link>}>
          {autoPqf && ev.pqf.score == null && <p>{t.autoPqf(mono(String(autoPqf.total)), autoPqf.version)}</p>}
          <p>{t.pqfFramework}</p>
        </Card>

        {core === 'core' && <Card step={3} title={t.ajrLifecycle} version={a.version}
          state={a.score != null ? (a.status === 'provisional' ? 'pending' : 'done') : a.model === 'AJR-M' || a.lifecycle === 'observation' ? 'pending' : 'none'}
          value={a.score != null
            ? <span className="inline-flex flex-wrap items-center gap-2">{mono(`${fmtScore(a.score)} / 100`)}<AjrRatingBadge rating={a.rating} locale={locale} /></span>
            : a.lifecycle === 'observation' ? t.observation : a.model === 'AJR-M' && a.status === 'not_rated' ? t.notYetRated : t.notRated}
          action={<Link href={href('/ratings/')} className="link">{t.aboutAjr}</Link>}>
          <p>
            {a.model ? t.model[a.model] : t.notAvailable}
            {a.monthsSinceLaunch != null && ` · ${t.months(a.monthsSinceLaunch)}`}
            {t.day(a.ratedAt) && t.ratedOn(t.day(a.ratedAt)!)}
          </p>
          {a.score != null && a.status === 'provisional' && <p>{t.provisionalScore}{t.provisionalScoreEnd}</p>}
          {a.score == null && a.reason && <p>{a.reason}.</p>}
        </Card>}

        <Card step={core === 'core' ? 4 : 3} wide={core !== 'core'} title={t.citationRanking} version={r.methodology} state={ranked ? (provisional ? 'pending' : 'done') : 'none'}
          value={ranked
            ? <span className="inline-flex flex-wrap items-center gap-2">{mono(`${r.rank} / ${r.total}`)}<QuartileBadge q={r.quartile} provisional={provisional} locale={locale} /><ZoneBadge z={r.zone} status={r.zoneStatus} locale={locale} /></span>
            : t.statusLabel[r.status]}
          action={<Link href={href('/methodology/#ranking')} className="link">{t.rankingMethod}</Link>}>
          {ranked && r.categoryId && <p>{t.inCategory(<Link href={href(`/rankings/${r.categoryId}/`)} className="link">{t.categoryName(r.categoryId, r.category ?? r.categoryId)}</Link>, fmtPercentile(r.percentile))}</p>}
          <p>
            {t.pnci(c.pnci != null ? mono(fmtScore(c.pnci)) : t.notAvailableLower)}
            {' · '}{c.eligibleItems != null ? t.itemsCount(c.eligibleItems) : t.itemsNA}
            {c.coverage != null && t.coverageShort(fmtCoverage(c.coverage))}
          </p>
          {!ranked && reason && <p>{reason}{t.stop}</p>}
          {ranked && !r.zone && <p>{provisional ? t.noZoneProvisional : t.noZoneSmall}{t.stop}</p>}
          <p>{t.snapshotLine(r.snapshot ? t.month(r.snapshot) : t.notYetGeneratedLower)}</p>
        </Card>
      </div>
      <p className="mt-2 text-[11.5px] leading-snug" style={{ color: 'var(--soft)' }}>{t.pqfDisclaimer} {t.pcsDisclaimer}</p>
    </div>
  )
}

/** Shown until the first PNCI-1.0 Citation Ranking edition is published. */
export function RankingsPending({ locale = 'en' }: { locale?: Locale }) {
  if (locale === 'zh-Hans') return (
    <div className="panel p-5 flex gap-4">
      <span aria-hidden className="h-10 w-10 shrink-0 grid place-items-center rounded-[var(--radius)]" style={{ background: 'var(--posi-info-bg)', color: 'var(--posi-info)' }}>
        <Hourglass className="h-5 w-5" />
      </span>
      <div className="min-w-0 text-[14px] leading-relaxed" style={{ color: 'var(--ink-2)' }}>
        <p className="text-[15px] font-semibold" style={{ color: 'var(--ink)' }}>首个排名版本正在编制中</p>
        <p className="mt-1">
          依据 POSI-EVAL-1.0（PNCI-1.0）编制的首个引文排名版本，将在下一个数据周期依据篇级引文数据计算。在此之前，所有期刊均无排名、引文分区或 POSI Zone。
        </p>
        <p className="mt-1.5 text-[13px]" style={{ color: 'var(--muted)' }}>
          此前基于 PCS 的分区（PCS-Q）已于 2026 年 9 月 28 日停用：PCS 仅为补充指标，不再决定任何排名、分区或 Zone。
        </p>
      </div>
    </div>
  )
  return (
    <div className="panel p-5 flex gap-4">
      <span aria-hidden className="h-10 w-10 shrink-0 grid place-items-center rounded-[var(--radius)]" style={{ background: 'var(--posi-info-bg)', color: 'var(--posi-info)' }}>
        <Hourglass className="h-5 w-5" />
      </span>
      <div className="min-w-0 text-[14px] leading-relaxed" style={{ color: 'var(--ink-2)' }}>
        <p className="text-[15px] font-semibold" style={{ color: 'var(--ink)' }}>The first ranking edition is in preparation</p>
        <p className="mt-1">
          The first Citation Ranking edition under POSI-EVAL-1.0 (PNCI-1.0) is computed from item-level citation data in
          the next data cycle. Until then no journal has a rank, quartile or zone.
        </p>
        <p className="mt-1.5 text-[13px]" style={{ color: 'var(--muted)' }}>
          The earlier PCS-based quartiles (PCS-Q) were retired on 28 September 2026: PCS is a supplementary indicator and
          no longer determines any rank, quartile or zone.
        </p>
      </div>
    </div>
  )
}
