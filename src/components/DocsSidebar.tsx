'use client'

import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { CaretDown } from '@phosphor-icons/react/dist/ssr'
import { docsNav } from '@/lib/docs-nav'
import { stripLocale } from '@/i18n/config'
import { useMessages } from '@/i18n/LocaleProvider'
import { LocalizedLink } from './LocalizedLink'

function norm(p: string) { return p.endsWith('/') ? p : p + '/' }

export function DocsSidebar() {
  const pathname = norm(stripLocale(usePathname() || '/'))
  const m = useMessages()
  const sections = docsNav(m.docs)
  const [open, setOpen] = useState(false)
  const current = sections.flatMap(s => s.links).find(l => norm(l.href) === pathname)

  const list = (
    <nav aria-label={m.common.documentation} className="space-y-5">
      {sections.map(section => (
        <div key={section.title}>
          <h2 className="mb-1.5 text-[12.5px] font-semibold" style={{ color: 'var(--muted)' }}>{section.title}</h2>
          <ul>
            {section.links.map(l => {
              const active = norm(l.href) === pathname
              return (
                <li key={l.href}>
                  <LocalizedLink
                    href={l.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    className={`block py-[5px] text-[13.5px] leading-snug ${active ? '' : 'hover:underline underline-offset-2'}`}
                    style={active ? { color: 'var(--ink)', fontWeight: 600 } : { color: 'var(--teal)' }}
                  >
                    {l.label}
                  </LocalizedLink>
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
          <span className="truncate">{current ? current.label : m.common.documentation}</span>
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
