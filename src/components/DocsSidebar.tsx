'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { CaretDown } from '@phosphor-icons/react/dist/ssr'
import { DOCS_NAV } from '@/lib/docs-nav'

function norm(p: string) { return p.endsWith('/') ? p : p + '/' }

export function DocsSidebar() {
  const pathname = norm(usePathname() || '/')
  const [open, setOpen] = useState(false)
  const current = DOCS_NAV.flatMap(s => s.links).find(l => norm(l.href) === pathname)

  const list = (
    <nav aria-label="Documentation" className="space-y-6">
      {DOCS_NAV.map(section => (
        <div key={section.title}>
          <h2 className="eyebrow mb-2 px-2">{section.title}</h2>
          <ul className="space-y-px">
            {section.links.map(l => {
              const active = norm(l.href) === pathname
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    className="block px-2 py-1.5 rounded-[2px] text-[13.5px] leading-snug"
                    style={active
                      ? { background: 'var(--teal-soft)', color: 'var(--teal)', fontWeight: 500, boxShadow: 'inset 2px 0 0 var(--teal)' }
                      : { color: 'var(--ink-2)' }}
                  >
                    {l.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )

  return (
    <>
      <div className="lg:hidden mb-4">
        <button type="button" className="btn w-full justify-between" aria-expanded={open} onClick={() => setOpen(o => !o)}>
          <span className="truncate">{current ? current.label : 'Documentation'}</span>
          <CaretDown className="h-4 w-4 shrink-0" style={{ transform: open ? 'rotate(180deg)' : undefined }} />
        </button>
        {open && <div className="panel mt-2 p-3">{list}</div>}
      </div>
      <aside className="hidden lg:block sticky top-[104px] max-h-[calc(100vh-120px)] overflow-y-auto pr-2 pb-8 scrollbar-none">
        {list}
      </aside>
    </>
  )
}
