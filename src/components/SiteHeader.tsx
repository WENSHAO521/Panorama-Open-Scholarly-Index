'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { MagnifyingGlass, List, X, GithubLogo } from '@phosphor-icons/react/dist/ssr'
import { extractDoi } from '@/lib/utils'

const NAV = [
  { label: 'Publications', href: '/publications/' },
  { label: 'Sources', href: '/journals/' },
  { label: 'Publishers', href: '/publishers/' },
  { label: 'Subjects', href: '/subjects/' },
  { label: 'Rankings', href: '/rankings/' },
  { label: 'Certificates', href: '/certificate/' },
  { label: 'Datasets', href: '/datasets/' },
  { label: 'Docs', href: '/docs/' },
]

/**
 * The Panorama block mark, same geometry as public/posi-logo.svg (three
 * ink blocks, one brand-red block, one bar). Ink blocks use currentColor so
 * the mark follows the colour scheme; the red block stays the brand red.
 */
export function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5" style={{ color: inverted ? 'var(--band-ink)' : 'var(--ink)' }}>
      <svg width="24" height="24" viewBox="20 20 54 54" aria-hidden="true">
        <rect x="20" y="20" width="24" height="24" fill="currentColor" />
        <rect x="50" y="20" width="24" height="24" fill="var(--brand-red)" />
        <rect x="20" y="50" width="24" height="24" fill="currentColor" />
        <rect x="50" y="50" width="24" height="8" fill="currentColor" />
      </svg>
      <span className="leading-none">
        <span className="block text-[15px] font-semibold tracking-tight">POSI</span>
        <span className="block text-[11px] mt-0.5" style={{ color: inverted ? 'var(--band-muted)' : 'var(--muted)' }}>
          Open Scholarly Index
        </span>
      </span>
    </span>
  )
}

function HeaderSearch({ onDone }: { onDone?: () => void }) {
  const router = useRouter()
  const [q, setQ] = useState('')
  function submit(e: FormEvent) {
    e.preventDefault()
    const v = q.trim()
    if (!v) return
    const doi = extractDoi(v)
    router.push(doi ? `/work/?id=${encodeURIComponent(doi)}` : `/publications/?q=${encodeURIComponent(v)}`)
    onDone?.()
  }
  return (
    <form onSubmit={submit} role="search" className="relative w-full">
      <label htmlFor="header-search" className="sr-only">Search records</label>
      <MagnifyingGlass className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: 'var(--soft)' }} />
      <input
        id="header-search"
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Search publications or paste a DOI"
        className="input pl-8 h-[34px] text-[13.5px]"
      />
    </form>
  )
}

export function SiteHeader() {
  const pathname = usePathname() || '/'
  const [open, setOpen] = useState(false)
  const active = (href: string) => pathname.startsWith(href) || pathname + '/' === href

  return (
    <header
      className="sticky top-0 z-40"
      style={{ background: 'color-mix(in srgb, var(--paper) 92%, transparent)', backdropFilter: 'saturate(1.4) blur(8px)', borderBottom: '1px solid var(--line)' }}
    >
      <div className="wrap flex items-center gap-6 h-16">
        <Link href="/" aria-label="POSI home" className="shrink-0"><Logo /></Link>
        <nav aria-label="Primary" className="hidden lg:flex items-center gap-1">
          {NAV.map(n => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={active(n.href) ? 'page' : undefined}
              className="px-2.5 py-1.5 text-[14px] rounded-[6px] transition-colors hover:bg-[var(--hover)]"
              style={active(n.href) ? { color: 'var(--teal)', background: 'var(--teal-soft)', fontWeight: 500 } : { color: 'var(--ink-2)' }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden xl:block ml-auto w-[260px]"><HeaderSearch /></div>
        <Link href="/publications/" aria-label="Search publications" className="hidden md:inline-flex xl:hidden ml-auto btn btn-sm px-2">
          <MagnifyingGlass className="h-4 w-4" />
        </Link>
        <a
          href="https://github.com/WENSHAO521/Panorama-Open-Scholarly-Index"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Source on GitHub"
          className="hidden md:inline-flex btn btn-sm px-2"
        >
          <GithubLogo className="h-4 w-4" />
        </a>
        <button
          type="button"
          className="lg:hidden ml-auto md:ml-0 btn btn-sm"
          aria-expanded={open}
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen(o => !o)}
        >
          {open ? <X className="h-4 w-4" /> : <List className="h-4 w-4" />}
        </button>
      </div>
      {open && (
        <div className="lg:hidden" style={{ borderTop: '1px solid var(--line)', background: 'var(--paper)' }}>
          <div className="wrap py-3 space-y-3">
            <div className="md:hidden"><HeaderSearch onDone={() => setOpen(false)} /></div>
            <nav aria-label="Mobile" className="grid grid-cols-2 gap-1">
              {NAV.map(n => (
                <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="px-3 py-2 rounded-[6px] text-[14px]"
                  style={active(n.href) ? { background: 'var(--teal-soft)', color: 'var(--teal)' } : { color: 'var(--ink-2)' }}>
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </header>
  )
}
