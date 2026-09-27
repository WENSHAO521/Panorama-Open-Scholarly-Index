// "The index at a glance": the home page's visual summary of the global
// journal directory. A subject treemap (area = indexed journals), the
// largest publishers, the leading countries and the open-access share.
// Server component; every figure is computed at build time.

import Link from 'next/link'
import type { DirCategory, DirRecord } from '@/lib/global-journals'
import type { PublisherRow } from '@/lib/publishers'
import { publisherHref } from '@/lib/publishers'
import { countryName } from '@/lib/records'
import { squarify, type Rect } from '@/lib/treemap'
import { fmt } from './db'

// One fixed hue per domain (validated categorical order; identity is also
// carried by the legend and direct labels). Multidisciplinary is neutral.
const DOMAIN_COLOR: Record<string, string> = {
  P1: '#2a78d6', P2: '#eb6834', P3: '#1baf7a', P4: '#eda100', P5: '#e87ba4', P6: '#008300', P0: '#8a939d',
}

interface Cell { code: string; name: string; domain: string; domainName: string; count: number; r: Rect }

function layout(cats: DirCategory[], w: number, h: number): Cell[] {
  const byDomain = new Map<string, DirCategory[]>()
  for (const c of cats) byDomain.set(c.domain, [...(byDomain.get(c.domain) ?? []), c])
  const domains = [...byDomain.values()]
    .map(cs => cs.sort((a, b) => b.count - a.count))
    .sort((a, b) => b.reduce((s, c) => s + c.count, 0) - a.reduce((s, c) => s + c.count, 0))
  const outer = squarify(domains.map(cs => cs.reduce((s, c) => s + c.count, 0)), { x: 0, y: 0, w, h })
  return domains.flatMap((cs, i) =>
    squarify(cs.map(c => c.count), outer[i]).map((r, j) => ({ ...cs[j], r })),
  )
}

function Treemap({ cells, w, h, className }: { cells: Cell[]; w: number; h: number; className: string }) {
  return (
    <div className={`relative ${className}`} style={{ aspectRatio: `${w} / ${h}` }}>
      {cells.map(c => {
        const color = DOMAIN_COLOR[c.domain] ?? DOMAIN_COLOR.P0
        // Label only when the text fits the cell at this layout's nominal size.
        const longestWord = Math.max(...c.name.split(' ').map(t => t.length))
        const lines = Math.ceil((c.name.length * 6.6) / Math.max(1, c.r.w - 16))
        const fitsName = c.r.w >= longestWord * 6.6 + 16 && lines <= 3 && c.r.h >= lines * 15 + 26
        const fitsCount = !fitsName && c.r.w >= 44 && c.r.h >= 24
        return (
          <Link
            key={c.code}
            href={`/journals/subject/${c.code}/`}
            title={`${c.name} (${c.domainName}): ${fmt(c.count)} journals`}
            aria-label={`${c.name}: ${fmt(c.count)} journals`}
            className="glance-cell absolute overflow-hidden"
            style={{
              left: `${(c.r.x / w) * 100}%`, top: `${(c.r.y / h) * 100}%`,
              width: `${(c.r.w / w) * 100}%`, height: `${(c.r.h / h) * 100}%`,
              ['--c' as string]: color,
            }}
          >
            {fitsName && (
              <span className="block px-2 pt-1.5 leading-tight">
                <span className="block text-[12px] font-medium" style={{ color: 'var(--ink)' }}>{c.name}</span>
                <span className="block font-mono text-[11.5px] tnum" style={{ color: 'var(--ink-2)' }}>{fmt(c.count)}</span>
              </span>
            )}
            {fitsCount && <span className="block px-1.5 pt-1 font-mono text-[11px] tnum" style={{ color: 'var(--ink-2)' }}>{fmt(c.count)}</span>}
          </Link>
        )
      })}
    </div>
  )
}

function Bars({ rows }: { rows: { label: string; value: number; href?: string }[] }) {
  const max = Math.max(...rows.map(r => r.value), 1)
  return (
    <ol className="space-y-2.5">
      {rows.map(r => {
        const label = <span className="block truncate text-[13px]" style={{ color: r.href ? 'var(--teal)' : 'var(--ink)' }}>{r.label}</span>
        return (
          <li key={r.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 gap-y-1" title={`${r.label}: ${fmt(r.value)} journals`}>
            {r.href ? <Link href={r.href} prefetch={false} className="min-w-0 hover:underline">{label}</Link> : <span className="min-w-0">{label}</span>}
            <span className="font-mono text-[12px] tnum" style={{ color: 'var(--ink-2)' }}>{fmt(r.value)}</span>
            <span className="col-span-2 block h-[6px] rounded-[1px]" style={{ background: 'var(--surface-2)' }}>
              <span className="block h-full rounded-r-[2px]" style={{ width: `${Math.max(1.5, (r.value / max) * 100)}%`, background: 'var(--teal)' }} />
            </span>
          </li>
        )
      })}
    </ol>
  )
}

export function IndexGlance({ records, cats, publishers }: { records: DirRecord[]; cats: DirCategory[]; publishers: PublisherRow[] }) {
  const shown = cats.filter(c => c.code !== 'unclassified' && c.count > 0)
  const classified = shown.reduce((s, c) => s + c.count, 0)
  const domains = [...new Map(shown.map(c => [c.domain, c.domainName])).entries()]
    .sort((a, b) => (a[0] === 'P0' ? 1 : b[0] === 'P0' ? -1 : a[0].localeCompare(b[0])))
  const wide = layout(shown, 860, 380)
  const tall = layout(shown, 360, 540)

  const countries = new Map<string, number>()
  let oa = 0, doaj = 0
  for (const r of records) {
    const c = countryName(r.co)
    if (c) countries.set(c, (countries.get(c) ?? 0) + 1)
    if (r.oa) oa++
    if (r.dj) doaj++
  }
  const topCountries = [...countries].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([label, value]) => ({ label, value }))
  const topPublishers = publishers.slice(0, 8).map(p => ({ label: p.name, value: p.n, href: publisherHref(p) }))
  const total = records.length
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0)

  return (
    <section aria-labelledby="glance">
      <div className="flex items-end justify-between gap-4 pb-2 mb-3" style={{ borderBottom: '2px solid var(--ink)' }}>
        <h2 id="glance" className="text-[17px] font-semibold" style={{ color: 'var(--ink)' }}>The index at a glance</h2>
        <Link href="/subjects/" className="link text-[13px]">All subject categories</Link>
      </div>
      <p className="text-[13px] mb-3" style={{ color: 'var(--muted)' }}>
        {fmt(classified)} classified journals by subject. Each block&rsquo;s area is its number of indexed journals; select one to browse it.
      </p>

      <ul className="flex flex-wrap gap-x-4 gap-y-1.5 mb-3 text-[12.5px]" aria-label="Domains">
        {domains.map(([d, name]) => (
          <li key={d} className="flex items-center gap-1.5" style={{ color: 'var(--ink-2)' }}>
            <span aria-hidden className="inline-block h-2.5 w-2.5 rounded-[2px]" style={{ background: DOMAIN_COLOR[d] ?? DOMAIN_COLOR.P0 }} />
            {name}
          </li>
        ))}
      </ul>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
        <Treemap cells={wide} w={860} h={380} className="hidden sm:block" />
        <Treemap cells={tall} w={360} h={540} className="sm:hidden" />
      </div>

      <div className="mt-6 p-4" style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <h3 className="text-[13.5px] font-semibold" style={{ color: 'var(--ink)' }}>Open access</h3>
          <p className="text-[12.5px]" style={{ color: 'var(--muted)' }}>
            <span className="font-mono tnum" style={{ color: 'var(--ink)' }}>{pct(oa)}%</span> of indexed journals are open access;{' '}
            <span className="font-mono tnum" style={{ color: 'var(--ink)' }}>{pct(doaj)}%</span> are in DOAJ.
          </p>
        </div>
        <div className="mt-3 flex h-[10px] gap-[2px] rounded-[2px] overflow-hidden" role="img" aria-label={`${pct(doaj)}% in DOAJ, ${pct(oa - doaj)}% other open access, ${100 - pct(oa)}% not open access`}>
          <span style={{ width: `${pct(doaj)}%`, background: 'var(--teal)' }} />
          <span style={{ width: `${Math.max(0, pct(oa) - pct(doaj))}%`, background: 'var(--teal-line)' }} />
          <span className="flex-1" style={{ background: 'var(--surface-3)' }} />
        </div>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px]" style={{ color: 'var(--muted)' }}>
          <li className="flex items-center gap-1.5"><span aria-hidden className="h-2.5 w-2.5 rounded-[2px]" style={{ background: 'var(--teal)' }} />Open access, in DOAJ</li>
          <li className="flex items-center gap-1.5"><span aria-hidden className="h-2.5 w-2.5 rounded-[2px]" style={{ background: 'var(--teal-line)' }} />Open access, not in DOAJ</li>
          <li className="flex items-center gap-1.5"><span aria-hidden className="h-2.5 w-2.5 rounded-[2px]" style={{ background: 'var(--surface-3)' }} />Not open access</li>
          <li><Link href="/journals/open-access/" className="link">Browse open access journals</Link></li>
        </ul>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="p-4" style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
          <div className="flex items-baseline justify-between gap-3 mb-3">
            <h3 className="text-[13.5px] font-semibold" style={{ color: 'var(--ink)' }}>Largest publishers</h3>
            <Link href="/publishers/" className="link text-[12.5px]">All publishers</Link>
          </div>
          <Bars rows={topPublishers} />
        </div>
        <div className="p-4" style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
          <div className="flex items-baseline justify-between gap-3 mb-3">
            <h3 className="text-[13.5px] font-semibold" style={{ color: 'var(--ink)' }}>Where journals are published</h3>
            <span className="text-[12.5px]" style={{ color: 'var(--muted)' }}>{fmt(countries.size)} countries</span>
          </div>
          <Bars rows={topCountries} />
        </div>
      </div>
    </section>
  )
}
