// "The index at a glance": the home page's visual summary of the global
// journal directory. A subject treemap (area = indexed journals), a world
// map of where journals are published (over the editors' list of countries
// and territories, country-list.ts), the largest publishers and the
// open-access share.
// Server component; every figure is computed at build time.

import Link from 'next/link'
import type { DirCategory, DirRecord } from '@/lib/global-journals'
import type { PublisherRow } from '@/lib/publishers'
import { publisherHref } from '@/lib/publishers'
import { LISTED_PLACES } from '@/lib/country-list'
import { squarify, type Rect } from '@/lib/treemap'
import { MAP_H, MAP_W, countryCode, getSmallPlaceDots, getWorldShapes } from '@/lib/world-map'
import { MapHover } from './MapHover'
import { fmt } from './db'
import { getMessages, type Messages } from '@/i18n'
import type { Locale } from '@/i18n/config'
import { localizedHref } from '@/i18n/alternates'
import { fill, subjectName } from '@/i18n/format'

// One fixed hue per domain (low-chroma, scheme-aware tokens in posi-tokens.css; identity is also
// carried by the legend and direct labels). Multidisciplinary is neutral.
const DOMAIN_COLOR: Record<string, string> = {
  P1: 'var(--posi-cat-1)', P2: 'var(--posi-cat-2)', P3: 'var(--posi-cat-3)', P4: 'var(--posi-cat-4)',
  P5: 'var(--posi-cat-5)', P6: 'var(--posi-cat-6)', P0: 'var(--posi-cat-neutral)',
}

// World map: one hue (the brand green), stronger = more journals, on a log scale.
// A sequential scale for a continuous measure; the legend lists every bin.
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

type Glance = Messages['glance']

function WorldMap({ counts, t, placeName }: { counts: Map<string, number>; t: Glance; placeName: (code: string) => string }) {
  return (
    <MapHover labels={{ zoom: t.mapZoom, zoomIn: t.zoomIn, zoomOut: t.zoomOut, zoomReset: t.zoomReset, journals: t.tipJournals, none: t.tipNone }}>
      <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} className="block w-full h-auto" role="img" aria-label={t.mapLabel}>
        {getWorldShapes().map((s, i) => {
          const place = LISTED_PLACES.get(s.code)
          // Land off the list (the uninhabited French Southern Territories) is drawn for context only: no fill, no tooltip.
          if (!place) return <path key={`${s.code}-${i}`} d={s.d} className="map-country-off" />
          const n = counts.get(s.code) ?? 0
          return (
            <path key={`${s.code}-${i}`} d={s.d} data-name={placeName(s.code)} data-n={n} className="map-country"
              style={{ fill: binFill(n) }} />
          )
        })}
        {/* Every listed place too small to draw, as a dot: with journals on top, larger counts last. */}
        {getSmallPlaceDots()
          .filter(d => LISTED_PLACES.has(d.code))
          .map(d => ({ ...d, n: counts.get(d.code) ?? 0 }))
          .sort((a, b) => a.n - b.n)
          .map(d => {
            const name = LISTED_PLACES.has(d.code) ? placeName(d.code) : d.code
            return (
              <g key={d.code} className={d.n ? 'map-dot' : 'map-dot map-dot-empty'}>
                <circle cx={d.x} cy={d.y} r={d.n ? 3.6 : 2.4} data-name={name} data-n={d.n} style={{ fill: d.n ? binFill(d.n) : 'var(--hover)' }} />
                {/* A larger, invisible target, so the dot is easy to hover. */}
                <circle cx={d.x} cy={d.y} r={d.n ? 9 : 6} data-name={name} data-n={d.n} fill="transparent" />
              </g>
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

function Treemap({ cells, w, h, className, t, href }: { cells: Cell[]; w: number; h: number; className: string; t: Glance; href: (p: string) => string }) {
  return (
    <div className={`relative ${className}`} style={{ aspectRatio: `${w} / ${h}` }}>
      {cells.map(c => {
        const color = DOMAIN_COLOR[c.domain] ?? DOMAIN_COLOR.P0
        // Label only when the text fits the cell at this layout's nominal size.
        // Chinese characters are about twice as wide as Latin letters and break anywhere.
        const cjk = /[\u3000-\u9fff]/.test(c.name)
        const charW = cjk ? 12.5 : 6.6
        const longestWord = cjk ? 2 : Math.max(...c.name.split(' ').map(t => t.length))
        const lines = Math.ceil((c.name.length * charW) / Math.max(1, c.r.w - 16))
        const fitsName = c.r.w >= longestWord * charW + 16 && lines <= 3 && c.r.h >= lines * 15 + 26
        const fitsCount = !fitsName && c.r.w >= 44 && c.r.h >= 24
        return (
          <Link
            key={c.code}
            href={href(`/journals/subject/${c.code}/`)}
            title={fill(t.cellTitle, { name: c.name, domain: c.domainName, n: fmt(c.count) })}
            aria-label={fill(t.cellLabel, { name: c.name, n: fmt(c.count) })}
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

function Bars({ rows, t }: { rows: { label: string; value: number; href?: string }[]; t: Glance }) {
  const max = Math.max(...rows.map(r => r.value), 1)
  return (
    <ol className="space-y-2.5">
      {rows.map(r => {
        const label = <span className="block truncate text-[13px]" style={{ color: r.href ? 'var(--teal)' : 'var(--ink)' }}>{r.label}</span>
        return (
          <li key={r.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 gap-y-1" title={fill(t.barTitle, { label: r.label, n: fmt(r.value) })}>
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

export function IndexGlance({ locale, records, cats, publishers }: { locale: Locale; records: DirRecord[]; cats: DirCategory[]; publishers: PublisherRow[] }) {
  const t = getMessages(locale).glance
  const href = (p: string) => localizedHref(locale, p)
  const placeName = (code: string) => { const p = LISTED_PLACES.get(code)!; return locale === 'zh-Hans' ? p.zh : p.name }
  const shown = cats.filter(c => c.code !== 'unclassified' && c.count > 0)
    .map(c => ({ ...c, name: subjectName(locale, c.code, c.name), domainName: subjectName(locale, c.domain, c.domainName) }))
  const classified = shown.reduce((s, c) => s + c.count, 0)
  const domains = [...new Map(shown.map(c => [c.domain, c.domainName])).entries()]
    .sort((a, b) => (a[0] === 'P0' ? 1 : b[0] === 'P0' ? -1 : a[0].localeCompare(b[0])))
  const wide = layout(shown, 640, 440)
  const tall = layout(shown, 360, 540)

  // Journals per listed country or territory, each territory in its own right.
  const byCode = new Map<string, number>()
  let oa = 0, doaj = 0, oaUnknown = 0
  for (const r of records) {
    const code = countryCode(r.co)
    if (code && LISTED_PLACES.has(code)) byCode.set(code, (byCode.get(code) ?? 0) + 1)
    if (r.oa) oa++
    else if (r.oa == null) oaUnknown++
    if (r.dj) doaj++
  }
  const topCountries = [...byCode].sort((a, b) => b[1] - a[1]).slice(0, 10)
    .map(([code, n]) => [placeName(code), n] as const)
  const topPublishers = publishers.slice(0, 8).map(p => ({ label: p.name, value: p.n, href: href(publisherHref(p)) }))
  const total = records.length
  // The open access panel counts journals whose access status is known; journals with no status (oaUnknown) are left out.
  const known = total - oaUnknown
  const pctOa = (n: number) => (known ? Math.round((n / known) * 100) : 0)

  return (
    <section aria-labelledby="glance">
      <div className="flex items-end justify-between gap-4 mb-1.5">
        <h2 id="glance" className="text-[22px] font-semibold tracking-tight" style={{ color: 'var(--ink)' }}>{t.title}</h2>
        <Link href={href('/subjects/')} className="link text-[13.5px]">{t.allSubjects}</Link>
      </div>
      <p className="text-[14px] mb-4" style={{ color: 'var(--muted)' }}>
        {fill(t.intro, { n: fmt(classified) })}
      </p>

      <ul className="flex flex-wrap gap-x-4 gap-y-1.5 mb-3 text-[12.5px]" aria-label={t.domains}>
        {domains.map(([d, name]) => (
          <li key={d} className="flex items-center gap-1.5" style={{ color: 'var(--ink-2)' }}>
            <span aria-hidden className="inline-block h-2.5 w-2.5 rounded-[var(--radius)]" style={{ background: DOMAIN_COLOR[d] ?? DOMAIN_COLOR.P0 }} />
            {name}
          </li>
        ))}
      </ul>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
      <div className="panel">
        <Treemap cells={wide} w={640} h={440} className="hidden sm:block" t={t} href={href} />
        <Treemap cells={tall} w={360} h={540} className="sm:hidden" t={t} href={href} />
      </div>

      <div className="panel p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 mb-2">
          <h3 className="text-[13.5px] font-semibold" style={{ color: 'var(--ink)' }}>{t.mapTitle}</h3>
          <span className="text-[12.5px]" style={{ color: 'var(--muted)' }}>{fill(t.mapCoverage, { n: fmt(byCode.size), total: fmt(LISTED_PLACES.size) })}</span>
        </div>
        <WorldMap counts={byCode} t={t} placeName={placeName} />
        <ul className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]" style={{ color: 'var(--muted)' }} aria-label={t.mapLegend}>
          {MAP_BINS.map(b => (
            <li key={b.min} className="flex items-center gap-1.5">
              <span aria-hidden className="h-2.5 w-4 rounded-[1px]" style={{ background: `color-mix(in srgb, var(--teal) ${b.mix}%, var(--surface))` }} />{b.label}
            </li>
          ))}
          <li className="flex items-center gap-1.5">
            <span aria-hidden className="h-2.5 w-4 rounded-[1px]" style={{ background: 'var(--hover)', border: '1px solid var(--line)' }} />{t.mapNone}
          </li>
          <li className="flex items-center gap-1.5">
            <svg aria-hidden width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="3.6" className="map-dot-key" /></svg>{t.mapSmall}
          </li>
        </ul>
        <ol className="mt-4 pt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-x-5 gap-y-1.5 text-[12.5px]" style={{ borderTop: '1px solid var(--line-soft)' }}>
          {topCountries.map(([c, n], i) => (
            <li key={c} className="flex items-baseline justify-between gap-2 min-w-0">
              <span className="truncate" style={{ color: 'var(--ink-2)' }}><span className="font-mono mr-1.5" style={{ color: 'var(--soft)' }}>{i + 1}</span>{c}</span>
              <span className="font-mono tnum shrink-0" style={{ color: 'var(--ink)' }}>{fmt(n)}</span>
            </li>
          ))}
        </ol>
      </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="panel p-5">
          <div className="flex items-baseline justify-between gap-3 mb-3">
            <h3 className="text-[13.5px] font-semibold" style={{ color: 'var(--ink)' }}>{t.largestPublishers}</h3>
            <Link href={href('/publishers/')} className="link text-[12.5px]">{t.allPublishers}</Link>
          </div>
          <Bars rows={topPublishers} t={t} />
        </div>
        <div className="panel p-5 flex flex-col">
          <div className="flex items-baseline justify-between gap-3 mb-3">
            <h3 className="text-[13.5px] font-semibold" style={{ color: 'var(--ink)' }}>{t.openAccess}</h3>
            <Link href={href('/journals/open-access/')} className="link text-[12.5px]">{t.browse}</Link>
          </div>
          <p className="font-mono text-[40px] leading-none tnum tracking-tight" style={{ color: 'var(--ink)' }}>{pctOa(oa)}%</p>
          <p className="mt-1.5 text-[13px]" style={{ color: 'var(--muted)' }}>{fill(t.oaShare, { doaj: pctOa(doaj) })}</p>
          <div className="mt-5 flex h-[10px] gap-[2px] rounded-[var(--radius)] overflow-hidden" role="img" aria-label={fill(t.oaBar, { doaj: pctOa(doaj), other: Math.max(0, pctOa(oa) - pctOa(doaj)), closed: pctOa(known - oa) })}>
            <span style={{ width: `${pctOa(doaj)}%`, background: 'var(--teal)' }} />
            <span style={{ width: `${Math.max(0, pctOa(oa) - pctOa(doaj))}%`, background: 'var(--teal-line)' }} />
            <span className="flex-1" style={{ background: 'var(--surface-3)' }} />
          </div>
          <ul className="mt-2.5 space-y-1 text-[12px]" style={{ color: 'var(--muted)' }}>
            <li className="flex items-center gap-1.5"><span aria-hidden className="h-2.5 w-2.5 rounded-[var(--radius)]" style={{ background: 'var(--teal)' }} />{t.oaInDoaj} <span className="ml-auto font-mono tnum" style={{ color: 'var(--ink-2)' }}>{fmt(doaj)}</span></li>
            <li className="flex items-center gap-1.5"><span aria-hidden className="h-2.5 w-2.5 rounded-[var(--radius)]" style={{ background: 'var(--teal-line)' }} />{t.oaNotDoaj} <span className="ml-auto font-mono tnum" style={{ color: 'var(--ink-2)' }}>{fmt(Math.max(0, oa - doaj))}</span></li>
            <li className="flex items-center gap-1.5"><span aria-hidden className="h-2.5 w-2.5 rounded-[var(--radius)]" style={{ background: 'var(--surface-3)' }} />{t.notOa} <span className="ml-auto font-mono tnum" style={{ color: 'var(--ink-2)' }}>{fmt(known - oa)}</span></li>
          </ul>
        </div>
      </div>
    </section>
  )
}
