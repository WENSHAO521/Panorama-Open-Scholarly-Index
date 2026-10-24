// Small presentational primitives shared by the database pages.
// Server-safe (no hooks) so both server and client components can use them.

import Link from 'next/link'
import { COLLECTIONS, VERIFICATION, FRESHNESS, type Collection, type Verification, type Freshness } from '@/lib/records'
import { BASIS, type Basis } from '@/lib/schema'
import type { Locale } from '@/i18n/config'
import { BASIS_ZH, FRESHNESS_ZH, VERIFICATION_ZH } from '@/i18n/records-zh-Hans'

export function VerificationPill({ v, withLabel = true, locale = 'en' }: { v: Verification; withLabel?: boolean; locale?: Locale }) {
  const m = locale === 'zh-Hans' ? { ...VERIFICATION[v], ...VERIFICATION_ZH[v] } : VERIFICATION[v]
  return (
    <span className="chip" title={m.rule}>
      <span aria-hidden className="chip-dot" style={{ background: m.color }} />
      {withLabel ? m.label : v}
    </span>
  )
}

/** Public tier chip: Core (certified) or Indexed. */
export function CollectionTag({ k, locale = 'en' }: { k: Collection; locale?: Locale }) {
  const core = k === 'core'
  return (
    <span
      className="chip"
      title={COLLECTIONS[k].description}
      style={core
        ? { color: 'var(--teal)', background: 'var(--teal-soft)', borderColor: 'transparent' }
        : { color: 'var(--ink-2)', background: 'var(--surface-2)' }}
    >
      {locale === 'zh-Hans' ? (core ? '核心合集' : '已收录') : core ? 'Core' : 'Indexed'}
    </span>
  )
}

export function FreshnessTag({ f, locale = 'en' }: { f: Freshness; locale?: Locale }) {
  const m = locale === 'zh-Hans' ? { ...FRESHNESS[f], ...FRESHNESS_ZH[f] } : FRESHNESS[f]
  return (
    <span className="chip" title={m.rule}>
      <span aria-hidden className="chip-dot" style={{ background: m.color }} />
      {m.label}
    </span>
  )
}

export function BasisTag({ b, locale = 'en' }: { b: Basis; locale?: Locale }) {
  return (
    <span
      className="font-mono text-[10.5px] uppercase tracking-wider px-1.5 py-px rounded-[var(--radius)]"
      title={locale === 'zh-Hans' ? BASIS_ZH[b].description : BASIS[b].description}
      style={{ color: 'var(--muted)', border: '1px solid var(--line)' }}
    >
      {locale === 'zh-Hans' ? BASIS_ZH[b].label : BASIS[b].label}
    </span>
  )
}

export function PageHeader({
  eyebrow, title, children, crumbs, actions, locale = 'en',
}: {
  /** The page's language, for the breadcrumb's label; crumb addresses are given already localised. */
  locale?: Locale
  eyebrow?: string
  title: React.ReactNode
  children?: React.ReactNode
  crumbs?: { label: string; href?: string }[]
  actions?: React.ReactNode
}) {
  return (
    <header className="pt-6 pb-8 md:pt-8">
      {crumbs && (
        <nav aria-label={locale === 'zh-Hans' ? '面包屑导航' : 'Breadcrumb'} className="mb-2.5 text-[12.5px]" style={{ color: 'var(--muted)' }}>
          {crumbs.map((c, i) => (
            <span key={i}>
              {i > 0 && <span className="mx-1.5" style={{ color: 'var(--soft)' }}>&rsaquo;</span>}
              {c.href ? <Link href={c.href} className="hover:underline">{c.label}</Link> : <span style={{ color: 'var(--ink-2)' }}>{c.label}</span>}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-col md:flex-row md:items-end gap-4 md:justify-between">
        <div className="min-w-0 max-w-3xl">
          {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
          <h1 className="text-[26px] md:text-[34px] font-semibold leading-tight tracking-tight" style={{ color: 'var(--ink)' }}>{title}</h1>
          {children && <div className="mt-3 text-[15.5px] leading-relaxed" style={{ color: 'var(--ink-2)' }}>{children}</div>}
        </div>
        {actions && <div className="flex flex-wrap gap-2 shrink-0">{actions}</div>}
      </div>
    </header>
  )
}

// Numbered in-page contents for long documentation pages; ids match the page's h2 anchors.
export function OnThisPage({ items, locale = 'en' }: { items: [id: string, label: string][]; locale?: Locale }) {
  return (
    <nav aria-label={locale === 'zh-Hans' ? '本页目录' : 'On this page'} className="mb-10 max-w-[760px]">
      <ol className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-[14px] list-decimal pl-5" style={{ color: 'var(--muted)' }}>
        {items.map(([id, label]) => <li key={id}><a href={`#${id}`} className="hover:underline" style={{ color: 'var(--teal)' }}>{label}</a></li>)}
      </ol>
    </nav>
  )
}

export function SectionTitle({ id, children, aside }: { id?: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 mb-3">
      <h2 id={id} className="text-[20px] font-semibold tracking-tight scroll-mt-28" style={{ color: 'var(--ink)' }}>{children}</h2>
      {aside && <div className="text-[13px]" style={{ color: 'var(--muted)' }}>{aside}</div>}
    </div>
  )
}

export function Note({ tone = 'info', children }: { tone?: 'info' | 'warn' | 'ok'; children: React.ReactNode }) {
  const bg = tone === 'warn' ? 'var(--check-soft)' : tone === 'ok' ? 'var(--verified-soft)' : 'var(--surface-2)'
  return (
    <div className="text-[14px] leading-relaxed px-4 py-3 rounded-[var(--radius-lg)]" style={{ background: bg, border: '1px solid var(--line-soft)', color: 'var(--ink-2)' }}>
      {children}
    </div>
  )
}

export function fmt(n: number | null | undefined): string {
  return n === null || n === undefined ? '-' : n.toLocaleString('en-US')
}
