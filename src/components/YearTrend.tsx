'use client'

// Publications and citations per year as two small line charts on a shared
// year axis. The two measures differ in scale by orders of magnitude, so
// each gets its own zero-based y-axis instead of sharing one chart with two
// scales. Hovering a year moves a crosshair through both charts at once.
// The current year is still accumulating, so its segment is drawn dashed
// and marked partial rather than read as a decline.

import { useEffect, useRef, useState } from 'react'
import { fmt } from './db'

type Row = [year: number, works: number, citations: number]

const H = 132                                   // plot height, px
const PAD = { top: 10, right: 12, bottom: 22, left: 44 }

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

function Line({ label, years, values, partialFrom, hover, setHover }: {
  label: string
  years: number[]
  values: number[]
  partialFrom: number | null          // index of the first in-progress year
  hover: number | null
  setHover: (i: number | null) => void
}) {
  const [ref, width] = useWidth<HTMLDivElement>()
  const n = years.length
  const max = niceMax(Math.max(...values))
  const innerW = Math.max(0, width - PAD.left - PAD.right)
  const x = (i: number) => PAD.left + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW)
  const y = (v: number) => PAD.top + H - (v / max) * H
  const pts = values.map((v, i) => [x(i), y(v)] as const)
  const solidEnd = partialFrom == null ? n - 1 : Math.max(0, partialFrom - 1)
  const path = (a: number, b: number) => curve(pts.slice(a, b + 1))
  const area = `${path(0, n - 1)}L${x(n - 1)},${y(0)}L${x(0)},${y(0)}Z`
  const ticks = [0, max / 2, max]
  const lastFull = partialFrom == null ? n - 1 : partialFrom - 1
  const every = n > 8 && innerW < 360 ? 2 : 1

  function onMove(e: React.PointerEvent<SVGRectElement>) {
    const r = e.currentTarget.getBoundingClientRect()
    const px = e.clientX - r.left
    const i = n === 1 ? 0 : Math.round((px / innerW) * (n - 1))
    setHover(Math.min(n - 1, Math.max(0, i)))
  }

  return (
    <figure className="min-w-0">
      <figcaption className="flex items-baseline justify-between gap-3 mb-1">
        <span className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>{label}</span>
        {lastFull >= 0 && (
          <span className="text-[12px]" style={{ color: 'var(--muted)' }}>
            {years[lastFull]}: <span className="font-mono tnum" style={{ color: 'var(--ink)' }}>{fmt(values[lastFull])}</span>
          </span>
        )}
      </figcaption>
      <div ref={ref} className="relative">
        {width > 0 && (
          <svg width={width} height={H + PAD.top + PAD.bottom} role="img" aria-label={`${label} per year, ${years[0]} to ${years[n - 1]}`} className="block overflow-visible">
            {ticks.map(t => (
              <g key={t}>
                <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--line-soft)" strokeWidth={1} />
                <text x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="font-mono" fontSize={10.5} fill="var(--soft)">{compact(t)}</text>
              </g>
            ))}
            {years.map((yr, i) => (i % every === 0 || i === n - 1) && (
              <text key={yr} x={x(i)} y={PAD.top + H + 15} textAnchor="middle" className="font-mono" fontSize={10.5} fill="var(--muted)">{String(yr).slice(2)}</text>
            ))}
            <path d={area} fill="var(--teal)" fillOpacity={0.1} />
            <path d={path(0, solidEnd)} fill="none" stroke="var(--teal)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            {partialFrom != null && partialFrom > 0 && (
              <path d={path(partialFrom - 1, n - 1)} fill="none" stroke="var(--teal)" strokeWidth={2} strokeDasharray="4 4" strokeLinecap="round" />
            )}
            {hover != null && (
              <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + H} stroke="var(--soft)" strokeWidth={1} />
            )}
            {pts.map(([px, py], i) => {
              const partial = partialFrom != null && i >= partialFrom
              const show = i === hover || i === lastFull || (partial && i === n - 1)
              return show && (
                <circle key={i} cx={px} cy={py} r={4} fill={partial ? 'var(--surface)' : 'var(--teal)'} stroke={partial ? 'var(--teal)' : 'var(--surface)'} strokeWidth={2} />
              )
            })}
            <rect x={PAD.left} y={PAD.top} width={innerW} height={H} fill="transparent"
              onPointerMove={onMove} onPointerDown={onMove} onPointerLeave={() => setHover(null)} />
          </svg>
        )}
        {width === 0 && <div style={{ height: H + PAD.top + PAD.bottom }} />}
      </div>
    </figure>
  )
}

export function YearTrend({ rows, title = 'Publications and citations per year' }: { rows: Row[]; title?: string }) {
  const recent = rows.slice(-10)
  const years = recent.map(r => r[0])
  const thisYear = new Date().getFullYear()
  const firstPartial = years.findIndex(yr => yr >= thisYear)
  const partialFrom = firstPartial === -1 ? null : firstPartial
  const [hover, setHover] = useState<number | null>(null)
  const h = hover != null ? recent[hover] : null

  return (
    <section aria-labelledby="per-year">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-3">
        <h2 id="per-year" className="text-[17px] font-semibold tracking-tight">{title}</h2>
        <p className="text-[12.5px] min-h-[1.25rem] w-full sm:w-auto sm:text-right" style={{ color: 'var(--muted)' }} aria-live="polite">
          {h
            ? <><span className="font-medium" style={{ color: 'var(--ink)' }}>{h[0]}{partialFrom != null && hover! >= partialFrom ? ' (partial)' : ''}</span>
                {' · '}<span className="font-mono tnum" style={{ color: 'var(--ink)' }}>{fmt(h[1])}</span> publications
                {' · '}<span className="font-mono tnum" style={{ color: 'var(--ink)' }}>{fmt(h[2])}</span> citations</>
            : <span style={{ color: 'var(--soft)' }}>Hover or tap a year for values</span>}
        </p>
      </div>
      <div className="panel p-4 grid gap-6 sm:grid-cols-2">
        <Line label="Publications" years={years} values={recent.map(r => r[1])} partialFrom={partialFrom} hover={hover} setHover={setHover} />
        <Line label="Citations received" years={years} values={recent.map(r => r[2])} partialFrom={partialFrom} hover={hover} setHover={setHover} />
        <table className="sr-only">
          <caption>{title}</caption>
          <thead><tr><th>Year</th><th>Publications</th><th>Citations</th></tr></thead>
          <tbody>{recent.map(([y, w, c]) => <tr key={y}><td>{y}</td><td>{w}</td><td>{c}</td></tr>)}</tbody>
        </table>
        <p className="sm:col-span-2 text-[12px]" style={{ color: 'var(--soft)' }}>
          Each chart has its own scale. Citations are counted in the year they were received.
          {partialFrom != null && ` ${years[partialFrom]} is in progress (dashed).`}
        </p>
      </div>
    </section>
  )
}
