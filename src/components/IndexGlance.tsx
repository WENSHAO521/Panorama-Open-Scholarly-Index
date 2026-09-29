// "The index at a glance": the home page's visual summary of the global
// journal directory. A subject treemap (area = indexed journals), a world
// map of where journals are published, the largest publishers and the
// open-access share.
// Server component; every figure is computed at build time.

import Link from 'next/link'
import type { DirCategory, DirRecord } from '@/lib/global-journals'
import type { PublisherRow } from '@/lib/publishers'
import { publisherHref } from '@/lib/publishers'
import { countryName } from '@/lib/records'
import { squarify, type Rect } from '@/lib/treemap'
import { MAP_H, MAP_W, countryCode, getWorldShapes } from '@/lib/world-map'
import { MapHover } from './MapHover'
import { fmt } from './db'

// One fixed hue per domain (validated categorical order; identity is also
// carried by the legend and direct labels). Multidisciplinary is neutral.
const DOMAIN_COLOR: Record<string, string> = {
  P1: '#2a78d6', P2: '#eb6834', P3: '#1baf7a', P4: '#eda100', P5: '#e87ba4', P6: '#008300', P0: '#8a939d',
}

// World map: one hue, darker = more journals, on a log scale.
const MAP_BINS = [
  { min: 1, label: '1-9', mix: 24 },
  { min: 10, label: '10-99', mix: 42 },
  { min: 100, label: '100-999', mix: 60 },
  { min: 1000, label: '1,000-9,999', mix: 80 },
  { min: 10000, label: '10,000+', mix: 100 },
]
const binFill = (n: number) => {
  const b = [...MAP_BINS].reverse().find(x => n >= x.min)
  return b ? `color-mix(in srgb, var(--teal) ${b.mix}%, var(--surface))` : 'var(--hover)'
}

function WorldMap({ counts }: { counts: Map<string, number> }) {
  const dn = new Intl.DisplayNames(['en'], { type: 'region' })
  return (
    <MapHover>
      <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} className="block w-full h-auto" role="img" aria-label="World map of indexed journals by country">
        {getWorldShapes().map((s, i) => {
          const n = counts.get(s.code) ?? 0
          let name = s.name
          try { if (s.code) name = dn.of(s.code) ?? s.name } catch { /* keep the atlas name */ }
          return (
            <path key={`${s.code}-${i}`} d={s.d} data-name={name} data-n={n} className="map-country"
              style={{ fill: binFill(n) }} />
          )
        })}
      </svg>
    </MapHover>
  )
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
  const byCode = new Map<string, number>()
  let oa = 0, doaj = 0
  for (const r of records) {
    const c = countryName(r.co)
    if (c) countries.set(c, (countries.get(c) ?? 0) + 1)
    const code = countryCode(r.co)
    if (code) byCode.set(code, (byCode.get(code) ?? 0) + 1)
    if (r.oa) oa++
    if (r.dj) doaj++
  }
  const topCountries = [...countries].sort((a, b) => b[1] - a[1]).slice(0, 10)
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
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 mb-2">
          <h3 className="text-[13.5px] font-semibold" style={{ color: 'var(--ink)' }}>Where journals are published</h3>
          <span className="text-[12.5px]" style={{ color: 'var(--muted)' }}>{fmt(countries.size)} countries and territories</span>
        </div>
        <WorldMap counts={byCode} />
        <ul className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]" style={{ color: 'var(--muted)' }} aria-label="Journals per country">
          {MAP_BINS.map(b => (
            <li key={b.min} className="flex items-center gap-1.5">
              <span aria-hidden className="h-2.5 w-4 rounded-[1px]" style={{ background: `color-mix(in srgb, var(--teal) ${b.mix}%, var(--surface))` }} />{b.label}
            </li>
          ))}
          <li className="flex items-center gap-1.5">
            <span aria-hidden className="h-2.5 w-4 rounded-[1px]" style={{ background: 'var(--hover)', border: '1px solid var(--line)' }} />none
          </li>
        </ul>
        <ol className="mt-4 pt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-5 gap-y-1.5 text-[12.5px]" style={{ borderTop: '1px solid var(--line-soft)' }}>
          {topCountries.map(([c, n], i) => (
            <li key={c} className="flex items-baseline justify-between gap-2 min-w-0">
              <span className="truncate" style={{ color: 'var(--ink-2)' }}><span className="font-mono mr-1.5" style={{ color: 'var(--soft)' }}>{i + 1}</span>{c}</span>
              <span className="font-mono tnum shrink-0" style={{ color: 'var(--ink)' }}>{fmt(n)}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="p-4" style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
          <div className="flex items-baseline justify-between gap-3 mb-3">
            <h3 className="text-[13.5px] font-semibold" style={{ color: 'var(--ink)' }}>Largest publishers</h3>
            <Link href="/publishers/" className="link text-[12.5px]">All publishers</Link>
          </div>
          <Bars rows={topPublishers} />
        </div>
        <div className="p-4 flex flex-col" style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
          <div className="flex items-baseline justify-between gap-3 mb-3">
            <h3 className="text-[13.5px] font-semibold" style={{ color: 'var(--ink)' }}>Open access</h3>
            <Link href="/journals/open-access/" className="link text-[12.5px]">Browse</Link>
          </div>
          <p className="font-mono text-[40px] leading-none tnum tracking-tight" style={{ color: 'var(--ink)' }}>{pct(oa)}%</p>
          <p className="mt-1.5 text-[13px]" style={{ color: 'var(--muted)' }}>of indexed journals are open access; {pct(doaj)}% are listed in DOAJ.</p>
          <div className="mt-5 flex h-[10px] gap-[2px] rounded-[2px] overflow-hidden" role="img" aria-label={`${pct(doaj)}% in DOAJ, ${Math.max(0, pct(oa) - pct(doaj))}% other open access, ${100 - pct(oa)}% not open access`}>
            <span style={{ width: `${pct(doaj)}%`, background: 'var(--teal)' }} />
            <span style={{ width: `${Math.max(0, pct(oa) - pct(doaj))}%`, background: 'var(--teal-line)' }} />
            <span className="flex-1" style={{ background: 'var(--surface-3)' }} />
          </div>
          <ul className="mt-2.5 space-y-1 text-[12px]" style={{ color: 'var(--muted)' }}>
            <li className="flex items-center gap-1.5"><span aria-hidden className="h-2.5 w-2.5 rounded-[2px]" style={{ background: 'var(--teal)' }} />Open access, in DOAJ <span className="ml-auto font-mono tnum" style={{ color: 'var(--ink-2)' }}>{fmt(doaj)}</span></li>
            <li className="flex items-center gap-1.5"><span aria-hidden className="h-2.5 w-2.5 rounded-[2px]" style={{ background: 'var(--teal-line)' }} />Open access, not in DOAJ <span className="ml-auto font-mono tnum" style={{ color: 'var(--ink-2)' }}>{fmt(Math.max(0, oa - doaj))}</span></li>
            <li className="flex items-center gap-1.5"><span aria-hidden className="h-2.5 w-2.5 rounded-[2px]" style={{ background: 'var(--surface-3)' }} />Not open access <span className="ml-auto font-mono tnum" style={{ color: 'var(--ink-2)' }}>{fmt(total - oa)}</span></li>
          </ul>
        </div>
      </div>
    </section>
  )
}
