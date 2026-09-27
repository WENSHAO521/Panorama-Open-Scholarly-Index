'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { MagnifyingGlass, List, X, CaretDown } from '@phosphor-icons/react/dist/ssr'
import { extractDoi } from '@/lib/utils'
import { PRIMARY_NAV, UTILITY_NAV, type NavGroup } from '@/lib/site-nav'

/**
 * The Panorama block mark, same geometry as public/posi-logo.svg (three
 * ink blocks, one brand-red block, one bar). Ink blocks use currentColor so
 * the mark follows the colour scheme; the red block stays the brand red.
 */
export function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5" style={{ color: inverted ? 'var(--band-ink)' : 'var(--ink)' }}>
      <svg width="22" height="22" viewBox="20 20 54 54" aria-hidden="true">
        <rect x="20" y="20" width="24" height="24" fill="currentColor" />
        <rect x="50" y="20" width="24" height="24" fill="var(--brand-red)" />
        <rect x="20" y="50" width="24" height="24" fill="currentColor" />
        <rect x="50" y="50" width="24" height="8" fill="currentColor" />
      </svg>
      <span className="leading-none whitespace-nowrap">
        <span className="text-[15px] font-semibold tracking-tight">Panorama Open Scholarly Index</span>
        <span className="hidden xl:inline text-[12px] font-medium ml-2 pl-2" style={{ color: inverted ? 'var(--band-muted)' : 'var(--muted)', borderLeft: `1px solid ${inverted ? 'var(--band-line)' : 'var(--line)'}` }}>
          POSI
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
      <label htmlFor="header-search" className="sr-only">Search publications</label>
      <MagnifyingGlass className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: 'var(--soft)' }} />
      <input
        id="header-search"
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Search publications, or enter a DOI"
        className="input pl-8 h-8 text-[13px]"
      />
    </form>
  )
}

function norm(p: string) { return p.split('?')[0].replace(/\/?$/, '/') }

function groupActive(g: NavGroup, pathname: string) {
  const hrefs = g.href ? [g.href] : (g.links ?? []).map(l => l.href)
  return hrefs.some(h => { const n = norm(h); return n !== '/' && pathname.startsWith(n) })
}

/** Desktop dropdown: opens on click or hover, closes on Escape, outside focus or navigation. */
function Dropdown({ group, active, open, onOpen, onClose }: { group: NavGroup; active: boolean; open: boolean; onOpen: () => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const id = `menu-${group.label.toLowerCase()}`
  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={onOpen}
      onMouseLeave={onClose}
      onBlur={e => { if (!ref.current?.contains(e.relatedTarget as Node)) onClose() }}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={onOpen}
        className="inline-flex h-14 items-center gap-1 px-3 text-[13.5px] font-medium transition-colors hover:text-[var(--ink)]"
        style={{ color: active || open ? 'var(--ink)' : 'var(--ink-2)', boxShadow: active ? 'inset 0 -2px 0 var(--teal)' : undefined }}
      >
        {group.label}
        <CaretDown className="h-3 w-3 transition-transform" style={{ transform: open ? 'rotate(180deg)' : undefined }} />
      </button>
      {open && (
        <div id={id} className="absolute left-0 top-full z-50">
          <ul className="w-[300px] py-1" style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderTop: '2px solid var(--teal)', boxShadow: '0 6px 18px rgba(15, 23, 32, 0.12)' }}>
            {group.links!.map(l => (
              <li key={l.href}>
                <Link href={l.href} onClick={onClose} className="block px-3.5 py-2 transition-colors hover:bg-[var(--hover)]">
                  <span className="block text-[13.5px] font-medium" style={{ color: 'var(--ink)' }}>{l.label}</span>
                  {l.description && <span className="block text-[12px] mt-0.5 leading-snug" style={{ color: 'var(--muted)' }}>{l.description}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export function SiteHeader() {
  const pathname = norm(usePathname() || '/')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpenMenu(null); setMobileOpen(false) } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
    <div className="hidden md:block" style={{ background: 'var(--band)', color: 'var(--band-muted)' }}>
      <div className="wrap flex h-8 items-center justify-between text-[12px]">
        <span>Panorama Scholarly Group Ltd.</span>
        <nav aria-label="Utility" className="flex items-center gap-4">
          {UTILITY_NAV.map(l => (
            <Link key={l.href} href={l.href} className="transition-colors hover:text-[var(--band-ink)]">{l.label}</Link>
          ))}
        </nav>
      </div>
    </div>
    <header
      className="sticky top-0 z-40"
      style={{ background: 'var(--surface)', borderBottom: '1px solid var(--line)' }}
    >
      <div className="wrap flex items-center gap-5 h-14">
        <Link href="/" aria-label="POSI home" className="shrink-0"><Logo /></Link>
        <nav aria-label="Primary" className="hidden lg:flex items-center">
          {PRIMARY_NAV.map(g => g.links ? (
            <Dropdown
              key={g.label}
              group={g}
              active={groupActive(g, pathname)}
              open={openMenu === g.label}
              onOpen={() => setOpenMenu(g.label)}
              onClose={() => setOpenMenu(m => (m === g.label ? null : m))}
            />
          ) : (
            <Link
              key={g.label}
              href={g.href!}
              aria-current={groupActive(g, pathname) ? 'page' : undefined}
              className="inline-flex h-14 items-center px-3 text-[13.5px] font-medium transition-colors hover:text-[var(--ink)]"
              style={{ color: groupActive(g, pathname) ? 'var(--ink)' : 'var(--ink-2)', boxShadow: groupActive(g, pathname) ? 'inset 0 -2px 0 var(--teal)' : undefined }}
            >
              {g.label}
            </Link>
          ))}
        </nav>
        <div className="hidden md:block ml-auto w-[240px] xl:w-[300px]"><HeaderSearch /></div>
        <button
          type="button"
          className="lg:hidden ml-auto md:ml-2 btn btn-sm"
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMobileOpen(o => !o)}
        >
          {mobileOpen ? <X className="h-4 w-4" /> : <List className="h-4 w-4" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden max-h-[calc(100dvh-56px)] overflow-y-auto" style={{ borderTop: '1px solid var(--line)', background: 'var(--surface)' }}>
          <div className="wrap py-3 space-y-3">
            <div className="md:hidden"><HeaderSearch onDone={() => setMobileOpen(false)} /></div>
            <nav aria-label="Mobile">
              <ul>
                {PRIMARY_NAV.map(g => (
                  <li key={g.label} style={{ borderBottom: '1px solid var(--line-soft)' }}>
                    {g.links ? (
                      <>
                        <button
                          type="button"
                          aria-expanded={expanded === g.label}
                          onClick={() => setExpanded(x => (x === g.label ? null : g.label))}
                          className="w-full flex items-center justify-between py-3 text-[15px]"
                          style={{ color: 'var(--ink)' }}
                        >
                          {g.label}
                          <CaretDown className="h-4 w-4" style={{ transform: expanded === g.label ? 'rotate(180deg)' : undefined }} />
                        </button>
                        {expanded === g.label && (
                          <ul className="pb-2">
                            {g.links.map(l => (
                              <li key={l.href}>
                                <Link href={l.href} onClick={() => setMobileOpen(false)} className="block py-2 pl-3 text-[14px]" style={{ color: 'var(--ink-2)' }}>{l.label}</Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </>
                    ) : (
                      <Link href={g.href!} onClick={() => setMobileOpen(false)} className="block py-3 text-[15px]" style={{ color: 'var(--ink)' }}>{g.label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      )}
    </header>
    </>
  )
}
