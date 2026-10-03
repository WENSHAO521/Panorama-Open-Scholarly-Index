'use client'

// Hover tooltip and zoom for the home page world map. The map itself is
// static SVG rendered on the server; each country path carries data-name and
// data-n. Zoom changes the SVG's viewBox: the buttons zoom about the centre,
// and a zoomed map pans by dragging.

import { useEffect, useRef, useState } from 'react'
import { ArrowCounterClockwise, Minus, Plus } from '@phosphor-icons/react/dist/ssr'
import { fmt } from './db'

const MAX_ZOOM = 8

interface View { z: number; cx: number; cy: number }

export function MapHover({ children }: { children: React.ReactNode }) {
  const box = useRef<HTMLDivElement>(null)
  const base = useRef<{ x: number; y: number; w: number; h: number } | null>(null)
  const drag = useRef<{ x: number; y: number; view: View; moved: boolean } | null>(null)
  const [tip, setTip] = useState<{ x: number; y: number; flip: boolean; name: string; n: number } | null>(null)
  const [view, setView] = useState<View | null>(null)

  // Keep the visible window inside the map.
  function clamp(v: View): View {
    const b = base.current!
    const hw = b.w / v.z / 2, hh = b.h / v.z / 2
    return {
      z: v.z,
      cx: Math.min(b.x + b.w - hw, Math.max(b.x + hw, v.cx)),
      cy: Math.min(b.y + b.h - hh, Math.max(b.y + hh, v.cy)),
    }
  }

  function zoom(factor: number) {
    const b = base.current
    if (!b) return
    const v = view ?? { z: 1, cx: b.x + b.w / 2, cy: b.y + b.h / 2 }
    setView(clamp({ ...v, z: Math.min(MAX_ZOOM, Math.max(1, v.z * factor)) }))
  }

  useEffect(() => {
    const svg = box.current?.querySelector('svg')
    if (!svg) return
    if (!base.current) {
      const vb = svg.viewBox.baseVal
      base.current = { x: vb.x, y: vb.y, w: vb.width, h: vb.height }
      // The dots' drawn radius, so zooming can keep them small.
      svg.querySelectorAll('circle').forEach(c => c.setAttribute('data-r', c.getAttribute('r') ?? '0'))
    }
    const b = base.current
    const z = view?.z ?? 1
    const w = b.w / z, h = b.h / z
    const cx = view?.cx ?? b.x + b.w / 2, cy = view?.cy ?? b.y + b.h / 2
    svg.setAttribute('viewBox', `${cx - w / 2} ${cy - h / 2} ${w} ${h}`)
    // Dots grow a little with zoom, not in proportion, so they stay dots.
    svg.querySelectorAll('circle').forEach(c => c.setAttribute('r', String(Number(c.getAttribute('data-r')) / Math.sqrt(z))))
  }, [view])

  function move(e: React.PointerEvent) {
    const rect = box.current?.getBoundingClientRect()
    const d = drag.current
    if (d && rect && base.current) {
      const dx = e.clientX - d.x, dy = e.clientY - d.y
      if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true
      if (d.moved) {
        // Screen pixels to map units at the current zoom.
        const k = base.current.w / d.view.z / rect.width
        setView(clamp({ ...d.view, cx: d.view.cx - dx * k, cy: d.view.cy - dy * k }))
        setTip(null)
        return
      }
    }
    const t = e.target as Element
    const name = t.getAttribute('data-name')
    if (!name || !rect) { setTip(null); return }
    setTip({ x: e.clientX - rect.left, y: e.clientY - rect.top, flip: e.clientX - rect.left > rect.width * 0.7, name, n: Number(t.getAttribute('data-n') ?? 0) })
  }

  const zoomed = (view?.z ?? 1) > 1

  return (
    <div
      ref={box}
      className="relative overflow-hidden select-none"
      style={{ cursor: zoomed ? 'grab' : undefined, touchAction: zoomed ? 'none' : undefined }}
      onPointerMove={move}
      onPointerLeave={() => { setTip(null); drag.current = null }}
      onPointerDown={e => {
        if (!zoomed || !view || (e.target as Element).closest('button')) return
        drag.current = { x: e.clientX, y: e.clientY, view, moved: false }
        e.currentTarget.setPointerCapture(e.pointerId)
      }}
      onPointerUp={() => { drag.current = null }}
    >
      {children}
      <div className="absolute right-2 top-2 flex flex-col gap-1" role="group" aria-label="Map zoom">
        <button type="button" className="map-zoom" onClick={() => zoom(2)} disabled={(view?.z ?? 1) >= MAX_ZOOM} aria-label="Zoom in" title="Zoom in">
          <Plus className="h-3.5 w-3.5" />
        </button>
        <button type="button" className="map-zoom" onClick={() => zoom(0.5)} disabled={!zoomed} aria-label="Zoom out" title="Zoom out">
          <Minus className="h-3.5 w-3.5" />
        </button>
        {zoomed && (
          <button type="button" className="map-zoom" onClick={() => setView(null)} aria-label="Reset zoom" title="Reset zoom">
            <ArrowCounterClockwise className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {tip && (
        <div
          role="status"
          className="pointer-events-none absolute z-10 px-2.5 py-1.5 text-[12px] whitespace-nowrap"
          style={{
            left: tip.x, top: tip.y - 12, transform: `translate(${tip.flip ? '-100%' : '0'}, -100%)`,
            background: 'var(--band)', color: 'var(--band-ink)', borderRadius: 2,
          }}
        >
          <span className="font-medium">{tip.name}</span>
          <span className="ml-2 font-mono tnum">{tip.n ? `${fmt(tip.n)} journals` : 'no journals indexed'}</span>
        </div>
      )}
    </div>
  )
}
