// Small presentational primitives shared by the database pages.
// Server-safe (no hooks) so both server and client components can use them.

import Link from 'next/link'
import { COLLECTIONS, VERIFICATION, FRESHNESS, type Collection, type Verification, type Freshness } from '@/lib/records'
import { BASIS, type Basis } from '@/lib/schema'

export function VerificationPill({ v, withLabel = true }: { v: Verification; withLabel?: boolean }) {
  const m = VERIFICATION[v]
  return (
    <span className="chip" title={m.rule} style={{ color: m.color, background: m.bg, borderColor: 'transparent' }}>
      {withLabel ? m.label : v}
    </span>
  )
}

/** Public tier chip: Core (certified) or Indexed. */
export function CollectionTag({ k }: { k: Collection }) {
  const core = k === 'core'
  return (
    <span
      className="chip"
      title={COLLECTIONS[k].description}
      style={core
        ? { color: 'var(--teal)', background: 'var(--teal-soft)', borderColor: 'transparent' }
        : { color: 'var(--ink-2)', background: 'var(--surface-2)' }}
    >
      {core ? 'Core' : 'Indexed'}
    </span>
  )
}

export function FreshnessTag({ f }: { f: Freshness }) {
  const m = FRESHNESS[f]
  return (
    <span className="chip" title={m.rule} style={{ color: m.color }}>
      {m.label}
    </span>
  )
}

export function BasisTag({ b }: { b: Basis }) {
  return (
    <span
      className="font-mono text-[10.5px] uppercase tracking-wider px-1.5 py-px rounded"
      title={BASIS[b].description}
      style={{ color: 'var(--muted)', border: '1px solid var(--line)' }}
    >
      {BASIS[b].label}
    </span>
  )
}

export function PageHeader({
  eyebrow, title, children, crumbs, actions,
}: {
  eyebrow?: string
  title: React.ReactNode
  children?: React.ReactNode
  crumbs?: { label: string; href?: string }[]
  actions?: React.ReactNode
}) {
  return (
    <header className="pt-8 pb-6 md:pt-10">
      {crumbs && (
        <nav aria-label="Breadcrumb" className="mb-3 text-[12.5px] font-mono" style={{ color: 'var(--muted)' }}>
          {crumbs.map((c, i) => (
            <span key={i}>
              {i > 0 && <span className="mx-1.5" style={{ color: 'var(--soft)' }}>/</span>}
              {c.href ? <Link href={c.href} className="hover:underline">{c.label}</Link> : <span style={{ color: 'var(--ink-2)' }}>{c.label}</span>}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-col md:flex-row md:items-end gap-4 md:justify-between">
        <div className="min-w-0 max-w-3xl">
          {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
          <h1 className="text-[28px] md:text-[34px] font-semibold leading-tight tracking-tight" style={{ color: 'var(--ink)' }}>{title}</h1>
          {children && <div className="mt-3 text-[15.5px] leading-relaxed" style={{ color: 'var(--ink-2)' }}>{children}</div>}
        </div>
        {actions && <div className="flex flex-wrap gap-2 shrink-0">{actions}</div>}
      </div>
    </header>
  )
}

export function Stat({ label, value, note, href }: { label: string; value: React.ReactNode; note?: React.ReactNode; href?: string }) {
  const body = (
    <>
      <p className="text-[12.5px]" style={{ color: 'var(--muted)' }}>{label}</p>
      <p className="mt-1 text-[26px] font-semibold tnum tracking-tight" style={{ color: 'var(--ink)' }}>{value}</p>
      {note && <p className="mt-1 text-[12px] leading-snug" style={{ color: 'var(--soft)' }}>{note}</p>}
    </>
  )
  return href
    ? <Link href={href} className="block p-4 hover:bg-[var(--hover)] transition-colors">{body}</Link>
    : <div className="p-4">{body}</div>
}

export function SectionTitle({ id, children, aside }: { id?: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 mb-3">
      <h2 id={id} className="text-[17px] font-semibold tracking-tight scroll-mt-28" style={{ color: 'var(--ink)' }}>{children}</h2>
      {aside && <div className="text-[13px]" style={{ color: 'var(--muted)' }}>{aside}</div>}
    </div>
  )
}

export function Note({ tone = 'info', children }: { tone?: 'info' | 'warn' | 'ok'; children: React.ReactNode }) {
  const t = tone === 'warn'
    ? { c: 'var(--check)', bg: 'var(--check-soft)', b: 'var(--line)' }
    : tone === 'ok'
      ? { c: 'var(--verified)', bg: 'var(--verified-soft)', b: 'var(--line)' }
      : { c: 'var(--info)', bg: 'var(--info-soft)', b: 'var(--line)' }
  return (
    <div className="text-[13.5px] leading-relaxed px-4 py-3 rounded" style={{ background: t.bg, border: `1px solid ${t.b}`, color: 'var(--ink-2)', borderLeft: `3px solid ${t.c}` }}>
      {children}
    </div>
  )
}

export function fmt(n: number | null | undefined): string {
  return n === null || n === undefined ? '-' : n.toLocaleString('en-US')
}
