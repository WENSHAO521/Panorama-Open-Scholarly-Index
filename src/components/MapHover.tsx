'use client'

// Hover tooltip for the home page world map. The map itself is static SVG
// rendered on the server; each country path carries data-name and data-n.

import { useRef, useState } from 'react'
import { fmt } from './db'

export function MapHover({ children }: { children: React.ReactNode }) {
  const box = useRef<HTMLDivElement>(null)
  const [tip, setTip] = useState<{ x: number; y: number; flip: boolean; name: string; n: number } | null>(null)

  function move(e: React.MouseEvent) {
    const t = e.target as Element
    const name = t.getAttribute('data-name')
    const rect = box.current?.getBoundingClientRect()
    if (!name || !rect) { setTip(null); return }
    setTip({ x: e.clientX - rect.left, y: e.clientY - rect.top, flip: e.clientX - rect.left > rect.width * 0.7, name, n: Number(t.getAttribute('data-n') ?? 0) })
  }

  return (
    <div ref={box} className="relative" onMouseMove={move} onMouseLeave={() => setTip(null)}>
      {children}
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
