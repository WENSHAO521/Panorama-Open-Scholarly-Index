'use client'

// Publications and citations per year on one chart. Both are counts, so they
// share a single zero-based y-axis: where the lines cross, the journal
// received as many citations that year as it published works. Hovering or
// tapping a year shows a crosshair with both values. The current year is
// still accumulating, so its segment is drawn dashed and marked partial
// rather than read as a decline.

import { useEffect, useRef, useState } from 'react'
import { fmt } from './db'

type Row = [year: number, works: number, citations: number]

const H = 200                                   // plot height, px
const PAD = { top: 12, right: 12, bottom: 24, left: 44 }
const LABEL_W = 84                              // room for end labels when they fit

const SERIES = [
  { key: 1 as const, label: 'Publications', color: 'var(--series-1)' },
  { key: 2 as const, label: 'Citations', color: 'var(--series-2)' },
]

function niceMax(v: number): number {
  if (v <= 0) return 1
  const exp = 10 ** Math.floor(Math.log10(v))
  const f = v / exp
  const step = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10
  return step * exp
}

function compact(n: number): string {
  if (n >= 1_000_000) return `${+(n / 1_000_000).toFixed(1)}M`
  if (n >= 10_000) return `${Math.round(n / 1000)}k`
  if (n >= 1000) return `${+(n / 1000).toFixed(1)}k`
  return String(n)
}

/**
 * Monotone cubic path (Fritsch–Carlson) through the points: a smooth curve
 * that never overshoots the data, so no year appears higher or lower than
 * it was.
 */
function curve(pts: readonly (readonly [number, number])[]): string {
  const n = pts.length
  if (n === 0) return ''
  if (n < 3) return pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y}`).join('')
  const d = pts.slice(1).map(([x, y], i) => (y - pts[i][1]) / (x - pts[i][0]))
  const m = pts.map((_, i) => i === 0 ? d[0] : i === n - 1 ? d[n - 2] : d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2)
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue }
    const a = m[i] / d[i], b = m[i + 1] / d[i], h = a * a + b * b
    if (h > 9) { const t = 3 / Math.sqrt(h); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i] }
  }
  let out = `M${pts[0][0]},${pts[0][1]}`
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], dx = (x1 - x0) / 3
    out += `C${x0 + dx},${y0 + m[i] * dx} ${x1 - dx},${y1 - m[i + 1] * dx} ${x1},${y1}`
  }
  return out
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [w, setW] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setW(Math.floor(e.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, w] as const
}

export function YearTrend({ rows, title = 'Publications and citations per year' }: { rows: Row[]; title?: string }) {
  const recent = rows.slice(-10)
  const years = recent.map(r => r[0])
  const n = years.length
  const thisYear = new Date().getFullYear()
  const firstPartial = years.findIndex(yr => yr >= thisYear)
  const partialFrom = firstPartial === -1 ? null : firstPartial
  const lastFull = partialFrom == null ? n - 1 : partialFrom - 1
  const [hover, setHover] = useState<number | null>(null)
  const [ref, width] = useWidth<HTMLDivElement>()

  const max = niceMax(Math.max(1, ...recent.flatMap(r => [r[1], r[2]])))
  const y = (v: number) => PAD.top + H - (v / max) * H
  // End labels go to the right of the last point when the two ends are far
  // enough apart not to collide; otherwise the legend carries identity.
  const ends = SERIES.map(s => y(recent[n - 1][s.key]))
  const endLabels = width >= 480 && Math.abs(ends[0] - ends[1]) >= 16
  const right = PAD.right + (endLabels ? LABEL_W : 0)
  const innerW = Math.max(0, width - PAD.left - right)
  const x = (i: number) => PAD.left + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW)
  const every = n > 8 && innerW < 360 ? 2 : 1
  const ticks = [0, max / 2, max]
  const h = hover != null ? recent[hover] : null

  function onMove(e: React.PointerEvent<SVGRectElement>) {
    const r = e.currentTarget.getBoundingClientRect()
    const i = n === 1 ? 0 : Math.round(((e.clientX - r.left) / innerW) * (n - 1))
    setHover(Math.min(n - 1, Math.max(0, i)))
  }

  return (
    <section aria-labelledby="per-year">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-3">
        <h2 id="per-year" className="text-[17px] font-semibold tracking-tight">{title}</h2>
        <div className="flex gap-4 text-[12.5px]" style={{ color: 'var(--muted)' }}>
          {SERIES.map(s => (
            <span key={s.key} className="flex items-center gap-1.5">
              <i aria-hidden className="inline-block h-[2px] w-4 rounded-full" style={{ background: s.color }} />{s.label}
            </span>
          ))}
        </div>
      </div>
      <div className="panel p-4">
        <p className="text-[12.5px] min-h-[1.25rem] mb-2" style={{ color: 'var(--muted)' }} aria-live="polite">
          {h
            ? <><span className="font-medium" style={{ color: 'var(--ink)' }}>{h[0]}{partialFrom != null && hover! >= partialFrom ? ' (partial)' : ''}</span>
                {' · '}<span className="font-mono tnum" style={{ color: 'var(--ink)' }}>{fmt(h[1])}</span> publications
                {' · '}<span className="font-mono tnum" style={{ color: 'var(--ink)' }}>{fmt(h[2])}</span> citations</>
            : lastFull >= 0
              ? <>{years[lastFull]}: <span className="font-mono tnum" style={{ color: 'var(--ink)' }}>{fmt(recent[lastFull][1])}</span> publications
                  {' · '}<span className="font-mono tnum" style={{ color: 'var(--ink)' }}>{fmt(recent[lastFull][2])}</span> citations
                  <span style={{ color: 'var(--soft)' }}> · hover or tap a year</span></>
              : <span style={{ color: 'var(--soft)' }}>Hover or tap a year for values</span>}
        </p>
        <div ref={ref}>
          {width > 0 ? (
            <svg width={width} height={H + PAD.top + PAD.bottom} role="img" aria-label={`${title}, ${years[0]} to ${years[n - 1]}`} className="block overflow-visible">
              {ticks.map(t => (
                <g key={t}>
                  <line x1={PAD.left} x2={PAD.left + innerW} y1={y(t)} y2={y(t)} stroke="var(--line-soft)" strokeWidth={1} />
                  <text x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="font-mono" fontSize={10.5} fill="var(--soft)">{compact(t)}</text>
                </g>
              ))}
              {years.map((yr, i) => (i % every === 0 || i === n - 1) && (
                <text key={yr} x={x(i)} y={PAD.top + H + 16} textAnchor="middle" className="font-mono" fontSize={10.5} fill="var(--muted)">{String(yr).slice(2)}</text>
              ))}
              {hover != null && <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + H} stroke="var(--soft)" strokeWidth={1} />}
              {SERIES.map(s => {
                const pts = recent.map((r, i) => [x(i), y(r[s.key])] as const)
                const solidEnd = partialFrom == null ? n - 1 : Math.max(0, partialFrom - 1)
                return (
                  <g key={s.key}>
                    <path d={curve(pts.slice(0, solidEnd + 1))} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
                    {partialFrom != null && partialFrom > 0 && (
                      <path d={curve(pts.slice(partialFrom - 1))} fill="none" stroke={s.color} strokeWidth={2} strokeDasharray="4 4" strokeLinecap="round" />
                    )}
                    {pts.map(([px, py], i) => {
                      const partial = partialFrom != null && i >= partialFrom
                      const show = i === hover || i === lastFull || (partial && i === n - 1)
                      return show && (
                        <circle key={i} cx={px} cy={py} r={4} fill={partial ? 'var(--surface)' : s.color} stroke={partial ? s.color : 'var(--surface)'} strokeWidth={2} />
                      )
                    })}
                    {endLabels && (
                      <text x={x(n - 1) + 10} y={pts[n - 1][1]} dy="0.32em" fontSize={12} fill="var(--ink-2)">{s.label}</text>
                    )}
                  </g>
                )
              })}
              <rect x={PAD.left} y={PAD.top} width={innerW} height={H} fill="transparent"
                onPointerMove={onMove} onPointerDown={onMove} onPointerLeave={() => setHover(null)} />
            </svg>
          ) : <div style={{ height: H + PAD.top + PAD.bottom }} />}
        </div>
        <table className="sr-only">
          <caption>{title}</caption>
          <thead><tr><th>Year</th><th>Publications</th><th>Citations</th></tr></thead>
          <tbody>{recent.map(([yr, w, c]) => <tr key={yr}><td>{yr}</td><td>{w}</td><td>{c}</td></tr>)}</tbody>
        </table>
        <p className="mt-3 text-[12px]" style={{ color: 'var(--soft)' }}>
          Both on one scale. Citations are counted in the year they were received.
          {partialFrom != null && ` ${years[partialFrom]} is in progress (dashed).`}
        </p>
      </div>
    </section>
  )
}
