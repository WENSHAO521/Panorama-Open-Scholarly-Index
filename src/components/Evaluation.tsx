// Evaluation display (POSI-EVAL-1.0). Presentation only: every label and
// threshold comes from src/lib/evaluation. Hook-free, so it renders on
// static pages and inside client components alike.

import Link from 'next/link'
import { Note } from './db'
import type { JournalEvaluation } from '@/lib/evaluation/journal'
import {
  AJR_MODEL_NAME, PCS_DISCLAIMER, PQF_DISCLAIMER, QUARTILE_TOOLTIP,
  type CitationQuartile, type CitationRankingStatus, type PosiZone, type ZoneStatus,
} from '@/lib/evaluation/rules'
import {
  NOT_AVAILABLE, NOT_YET_RANKED, RANKING_STATUS_LABEL, ZONE_SHARE, fmtCoverage, fmtDay, fmtPercentile, fmtPqf, fmtScore, fmtSnapshot,
  pqfStatusLabel, quartileLabel, rankingReason,
} from '@/lib/evaluation/display'

/** Citation Quartile chip, C-Q1 … C-Q4; one accent stepped in strength. */
export function QuartileBadge({ q, provisional = false }: { q: CitationQuartile | null | undefined; provisional?: boolean }) {
  const label = quartileLabel(q)
  if (!label || !q) return <span style={{ color: 'var(--soft)' }}>{NOT_YET_RANKED}</span>
  const tone = {
    Q1: { background: 'var(--teal)', color: 'var(--on-teal)', borderColor: 'var(--teal)' },
    Q2: { background: 'var(--teal-soft)', color: 'var(--teal)', borderColor: 'var(--teal-line)' },
    Q3: { background: 'var(--surface-2)', color: 'var(--ink-2)', borderColor: 'var(--line)' },
    Q4: { background: 'transparent', color: 'var(--muted)', borderColor: 'var(--line)' },
  }[q]
  return (
    <span className="chip font-semibold whitespace-nowrap" title={provisional ? `Provisional. ${QUARTILE_TOOLTIP}` : QUARTILE_TOOLTIP}
      style={provisional ? { ...tone, background: 'transparent', color: 'var(--ink-2)', borderColor: 'var(--line)', borderStyle: 'dashed' } : tone}>
      {provisional ? `Provisional ${label}` : label}
    </span>
  )
}

/** POSI Zone chip: numbered and outlined, distinct from the filled quartile chips. */
export function ZoneBadge({ z, status = 'official', long = false }: { z: PosiZone | null | undefined; status?: ZoneStatus; long?: boolean }) {
  if (!z || status === 'not_assigned') return <span style={{ color: 'var(--soft)' }}>No zone</span>
  const provisional = status === 'provisional'
  return (
    <span className="chip font-semibold whitespace-nowrap" title={`POSI Zone ${z}: ${ZONE_SHARE[z]} of the journal’s PSC category by PNCI percentile${provisional ? ' (provisional: category of 30–49 journals)' : ''}`}
      style={{ color: z <= 2 ? 'var(--teal)' : z === 3 ? 'var(--ink-2)' : 'var(--muted)', borderColor: z <= 2 ? 'var(--teal)' : 'var(--line)', background: 'transparent', borderStyle: provisional ? 'dashed' : 'solid' }}>
      {provisional ? 'Provisional ' : ''}Zone {z}{long ? ` · ${ZONE_SHARE[z]}` : ''}
    </span>
  )
}

export function RankingStatusBadge({ status }: { status: CitationRankingStatus }) {
  const official = status === 'official'
  return (
    <span className="chip whitespace-nowrap" style={official ? { color: 'var(--teal)', background: 'var(--teal-soft)', borderColor: 'transparent' } : status === 'provisional' ? { borderStyle: 'dashed' } : { color: 'var(--muted)' }}>
      {RANKING_STATUS_LABEL[status]}
    </span>
  )
}

export function AjrRatingBadge({ rating }: { rating: string | null | undefined }) {
  if (!rating) return <span style={{ color: 'var(--soft)' }}>{NOT_AVAILABLE}</span>
  return <span className="chip whitespace-nowrap" title="AJR Rating: an absolute lifecycle rating, not a quartile">Rating {rating}</span>
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
 */
export function EvaluationPanel({ ev, core, idPrefix = 'ev', showPqf = true }: {
  ev: JournalEvaluation
  core: 'core' | 'indexed' | null
  idPrefix?: string
  showPqf?: boolean
}) {
  const r = ev.ranking
  const ranked = r.rank != null
  const provisional = r.status === 'provisional'
  const a = ev.ajr
  return (
    <div className="space-y-1">
      <Block title="Core Collection" id={`${idPrefix}-core`}>
        <Row k="Status" v={core === 'core' ? <span className="font-medium" style={{ color: 'var(--teal)' }}>Eligible, certified</span> : 'Indexed, not certified'} />
      </Block>

      {showPqf && (
        <Block title="PQF" id={`${idPrefix}-pqf`} aside={ev.pqf.version ? <span className="font-mono text-[10.5px]" style={{ color: 'var(--soft)' }}>{ev.pqf.version}</span> : null}>
          <Row k="PQF score" v={ev.pqf.score != null ? mono(`${fmtPqf(ev.pqf.score)} / 100`) : soft('Not assessed')} />
          <Row k="Eligibility" v={pqfStatusLabel(ev.pqf.status)} note={PQF_DISCLAIMER} />
        </Block>
      )}

      <Block title="Journal Development Rating" id={`${idPrefix}-ajr`} aside={a.version ? <span className="font-mono text-[10.5px]" style={{ color: 'var(--soft)' }}>{a.version}</span> : null}>
        <Row k="Lifecycle" v={a.model ? `${a.model === 'Observation' ? 'Observation' : a.model} · ${AJR_MODEL_NAME[a.model]}` : soft(NOT_AVAILABLE)}
          note={a.monthsSinceLaunch != null ? `${a.monthsSinceLaunch} months since first publication` : undefined} />
        {a.score != null
          ? <Row k={a.model ?? 'AJR'} v={<>{mono(`${fmtScore(a.score)} / 100`)} <span className="ml-1"><AjrRatingBadge rating={a.rating} /></span></>}
              note={a.status === 'provisional' ? 'Provisional score: evidence coverage below the official threshold' : undefined} />
          : <Row k="AJR" v={soft(a.lifecycle === 'observation' ? 'Observation period' : a.model === 'AJR-M' ? 'AJR-M: not yet rated' : 'Not rated')} note={a.reason ?? undefined} />}
        {fmtDay(a.ratedAt) && <Row k="Rated" v={fmtDay(a.ratedAt)} note={core === 'core' ? 'Core Collection journals are re-rated every month' : undefined} />}
      </Block>

      <Block title="Citation Performance" id={`${idPrefix}-cit`} aside={<Link href="/methodology/#ranking" className="link text-[12px]">Method</Link>}>
        <Row k="PNCI" v={ev.citations.pnci != null ? mono(fmtScore(ev.citations.pnci)) : soft(NOT_AVAILABLE)} note={ev.citations.pnciModel ?? undefined} />
        {/* PCI is a Core Collection indicator: other journals do not show it at all. */}
        {core === 'core' && <Row k="PCI" v={ev.citations.pci != null ? mono(fmtScore(ev.citations.pci)) : soft('Not computed')} />}
        <Row k="PCS" v={ev.citations.pcs != null ? mono(fmtScore(ev.citations.pcs)) : soft(NOT_AVAILABLE)} note="Supplementary; does not determine rank, quartile or zone" />
        <Row k="Eligible items" v={ev.citations.eligibleItems != null ? mono(String(ev.citations.eligibleItems)) : soft(NOT_AVAILABLE)}
          note={ev.citations.coverage != null ? `Citation coverage ${fmtCoverage(ev.citations.coverage)}` : undefined} />
        <Row k="PSC Citation Rank" v={ranked
          ? <>{mono(`${r.rank} / ${r.total}`)}{r.categoryId && <> in <Link href={`/rankings/${r.categoryId}/`} className="link">{r.category ?? r.categoryId}</Link></>}</>
          : soft(RANKING_STATUS_LABEL[r.status])} />
        {ranked && <Row k="Percentile" v={mono(fmtPercentile(r.percentile))} />}
        {ranked && <Row k="Citation Quartile" v={<QuartileBadge q={r.quartile} provisional={provisional} />} note={QUARTILE_TOOLTIP} />}
        {ranked && <Row k="POSI Zone" v={<ZoneBadge z={r.zone} status={r.zoneStatus} long />} note={!r.zone ? (provisional ? 'No zone for a provisional ranking' : 'No zone: category has fewer than 30 ranked journals') : undefined} />}
        <Row k="Ranking status" v={<RankingStatusBadge status={r.status} />} note={rankingReason(r.reason, ev.citations.eligibleItems) ?? undefined} />
        <Row k="Snapshot" v={r.snapshot ? fmtSnapshot(r.snapshot) : soft('Not yet generated')} note={r.methodology ? `${r.methodology} · ${ev.evaluationVersion}` : ev.evaluationVersion} />
      </Block>
      <p className="pt-2 text-[11.5px] leading-snug" style={{ color: 'var(--soft)' }}>{PCS_DISCLAIMER}</p>
    </div>
  )
}

type CardState = 'done' | 'pending' | 'none'
const CARD_DOT: Record<CardState, string> = { done: 'var(--verified)', pending: 'var(--partial)', none: 'var(--soft)' }

function Card({ step, title, version, state, value, children, action }: {
  step: number; title: string; version?: string | null; state: CardState
  value: React.ReactNode; children?: React.ReactNode; action?: React.ReactNode
}) {
  return (
    <div className="p-4 flex flex-col gap-1.5 min-w-0" style={{ background: 'var(--surface)' }}>
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
 * The evaluation as four status cards in the fixed order (Core Collection,
 * PQF, AJR, Citation Ranking). Same values as EvaluationPanel, laid out so
 * the state of each stage reads at a glance on the journal record.
 */
export function EvaluationCards({ ev, core, autoPqf }: {
  ev: JournalEvaluation
  core: 'core' | 'indexed'
  autoPqf?: { total: number; version: string } | null
}) {
  const r = ev.ranking
  const ranked = r.rank != null
  const provisional = r.status === 'provisional'
  const a = ev.ajr
  const c = ev.citations
  const reason = rankingReason(r.reason, c.eligibleItems)
  return (
    <div>
      <div className="grid sm:grid-cols-2 gap-px rounded-[2px] overflow-hidden" style={{ background: 'var(--line)', border: '1px solid var(--line)' }}>
        <Card step={1} title="Core Collection" state={core === 'core' ? 'done' : 'none'}
          value={core === 'core' ? <span style={{ color: 'var(--teal)' }}>Eligible, certified</span> : 'Indexed, not certified'}
          action={core === 'core'
            ? <Link href="/core-collection/" className="link">Core Collection</Link>
            : <Link href="/certification/" className="link">Apply for certification →</Link>}>
          <p>{core === 'core' ? 'Passed editorial evaluation under the POSI Quality Framework.' : 'Listed in the journal directory. Certification is by application.'}</p>
        </Card>

        <Card step={2} title="PQF" version={ev.pqf.version} state={ev.pqf.status === 'eligible' ? 'done' : ev.pqf.score != null ? 'pending' : 'none'}
          value={ev.pqf.score != null ? <>{mono(`${fmtPqf(ev.pqf.score)} / 100`)} · {pqfStatusLabel(ev.pqf.status)}</> : 'Not assessed'}
          action={<Link href="/pqf/" className="link">What PQF measures</Link>}>
          {autoPqf && ev.pqf.score == null && <p>Automated pre-screen: {mono(String(autoPqf.total))} ({autoPqf.version}), not an admission decision.</p>}
          <p>Eligibility framework; not a citation metric.</p>
        </Card>

        <Card step={3} title="AJR lifecycle" version={a.version}
          state={a.score != null ? (a.status === 'provisional' ? 'pending' : 'done') : a.model === 'AJR-M' || a.lifecycle === 'observation' ? 'pending' : 'none'}
          value={a.score != null
            ? <span className="inline-flex flex-wrap items-center gap-2">{mono(`${fmtScore(a.score)} / 100`)}<AjrRatingBadge rating={a.rating} /></span>
            : a.lifecycle === 'observation' ? 'Observation period' : a.model === 'AJR-M' ? 'Not yet rated' : 'Not rated'}
          action={<Link href="/ratings/" className="link">About AJR</Link>}>
          <p>
            {a.model ? AJR_MODEL_NAME[a.model] : NOT_AVAILABLE}
            {a.monthsSinceLaunch != null && ` · ${a.monthsSinceLaunch} months since first publication`}
            {fmtDay(a.ratedAt) && ` · rated ${fmtDay(a.ratedAt)}`}
          </p>
          {a.score != null && a.status === 'provisional' && <p>Provisional score: evidence coverage below the official threshold.</p>}
          {a.score == null && a.reason && <p>{a.reason}.</p>}
        </Card>

        <Card step={4} title="Citation ranking" version={r.methodology} state={ranked ? (provisional ? 'pending' : 'done') : 'none'}
          value={ranked
            ? <span className="inline-flex flex-wrap items-center gap-2">{mono(`${r.rank} / ${r.total}`)}<QuartileBadge q={r.quartile} provisional={provisional} /><ZoneBadge z={r.zone} status={r.zoneStatus} /></span>
            : RANKING_STATUS_LABEL[r.status]}
          action={<Link href="/methodology/#ranking" className="link">Ranking method</Link>}>
          {ranked && r.categoryId && <p>In <Link href={`/rankings/${r.categoryId}/`} className="link">{r.category ?? r.categoryId}</Link> · percentile {fmtPercentile(r.percentile)}</p>}
          <p>
            PNCI {c.pnci != null ? mono(fmtScore(c.pnci)) : NOT_AVAILABLE.toLowerCase()}
            {' · '}{c.eligibleItems != null ? `${c.eligibleItems} eligible items` : 'eligible items not available'}
            {c.coverage != null && ` · coverage ${fmtCoverage(c.coverage)}`}
          </p>
          {!ranked && reason && <p>{reason}.</p>}
          {ranked && !r.zone && <p>{provisional ? 'No zone for a provisional ranking.' : 'No zone: category has fewer than 30 ranked journals.'}</p>}
          <p>Snapshot: {r.snapshot ? fmtSnapshot(r.snapshot) : 'not yet generated'}</p>
        </Card>
      </div>
      <p className="mt-2 text-[11.5px] leading-snug" style={{ color: 'var(--soft)' }}>{PQF_DISCLAIMER} {PCS_DISCLAIMER}</p>
    </div>
  )
}

/** Shown until the first PNCI-1.0 Citation Ranking edition is published. */
export function RankingsPending() {
  return (
    <Note tone="info">
      The first Citation Ranking edition under POSI-EVAL-1.0 (PNCI-1.0) has not been published yet. It is computed from
      item-level citation data in the next data cycle. The earlier PCS-based quartiles (PCS-Q) were retired on
      28 September 2026: PCS is a supplementary indicator and no longer determines any rank, quartile or zone.
    </Note>
  )
}
