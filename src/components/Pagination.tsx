'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { pageWindow } from '@/lib/pagination'

/**
 * Shared Prev/Next + windowed page-number list + jump-to-page control, for
 * any list built from a fully-known, already-fetched array (client-side
 * slice, real `<Link>` navigation via `makeHref` — not a server refetch
 * per page; see src/app/search/page.tsx for that different case, which
 * intentionally keeps its own button+refetch pagination rather than using
 * this component). Page state lives in the URL (`?page=`), not React
 * state, so a page is directly linkable/shareable and works without JS.
 */
export function Pagination({
  page,
  totalPages,
  makeHref,
}: {
  page: number
  totalPages: number
  makeHref: (page: number) => string
}) {
  const router = useRouter()
  const [jumpValue, setJumpValue] = useState('')
  if (totalPages <= 1) return null
  const prev = page > 1 ? makeHref(page - 1) : null
  const next = page < totalPages ? makeHref(page + 1) : null

  function handleJumpSubmit(e: React.FormEvent) {
    e.preventDefault()
    const n = parseInt(jumpValue, 10)
    if (!Number.isFinite(n)) return
    const clamped = Math.min(Math.max(1, n), totalPages)
    router.push(makeHref(clamped))
    setJumpValue('')
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3" style={{ borderTop: '1px solid var(--posi-border)' }}>
      <div className="flex items-center gap-1 flex-wrap">
        {prev ? (
          <Link href={prev} className="px-3 py-1.5 text-xs font-medium transition-colors hover:bg-gray-100" style={{ border: '1px solid var(--posi-border)', color: 'var(--posi-text)' }}>
            ← Prev
          </Link>
        ) : (
          <span className="px-3 py-1.5 text-xs" style={{ color: 'var(--posi-muted)', border: '1px solid var(--posi-border)', opacity: 0.4 }}>← Prev</span>
        )}
        {pageWindow(page, totalPages).map((p, i) =>
          p === '…' ? (
            <span key={`ellipsis-${i}`} className="px-1.5 text-xs" style={{ color: 'var(--posi-muted)' }}>…</span>
          ) : p === page ? (
            <span key={p} aria-current="page" className="px-2.5 py-1.5 text-xs font-mono font-bold" style={{ border: '1px solid var(--posi-accent)', color: '#fff', background: 'var(--posi-accent)' }}>
              {p}
            </span>
          ) : (
            <Link key={p} href={makeHref(p)} className="px-2.5 py-1.5 text-xs font-mono transition-colors hover:bg-gray-100" style={{ border: '1px solid var(--posi-border)', color: 'var(--posi-text)' }}>
              {p}
            </Link>
          )
        )}
        {next ? (
          <Link href={next} className="px-3 py-1.5 text-xs font-medium transition-colors hover:bg-gray-100" style={{ border: '1px solid var(--posi-border)', color: 'var(--posi-text)' }}>
            Next →
          </Link>
        ) : (
          <span className="px-3 py-1.5 text-xs" style={{ color: 'var(--posi-muted)', border: '1px solid var(--posi-border)', opacity: 0.4 }}>Next →</span>
        )}
      </div>
      <form onSubmit={handleJumpSubmit} className="flex items-center gap-1.5">
        <span className="text-xs font-mono" style={{ color: 'var(--posi-muted)' }}>Page {page} / {totalPages} · Go to</span>
        <input
          type="number"
          min={1}
          max={totalPages}
          value={jumpValue}
          onChange={e => setJumpValue(e.target.value)}
          placeholder={String(page)}
          aria-label="Jump to page"
          className="w-14 px-2 py-1.5 text-xs font-mono"
          style={{ border: '1px solid var(--posi-border)', color: 'var(--posi-text)' }}
        />
        <button
          type="submit"
          className="px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-gray-100"
          style={{ border: '1px solid var(--posi-border)', color: 'var(--posi-text)' }}
        >
          Go
        </button>
      </form>
    </div>
  )
}
