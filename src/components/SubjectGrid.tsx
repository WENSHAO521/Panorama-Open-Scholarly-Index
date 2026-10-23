import Link from 'next/link'
import type { DirCategory } from '@/lib/global-journals'
import { fmt } from './db'

/** Subject categories grouped by domain, each linking to its journal list. */
export function SubjectGrid({ cats, count = c => c.count, query = '' }: { cats: DirCategory[]; count?: (c: DirCategory) => number; query?: string }) {
  const shown = cats.filter(c => c.code !== 'unclassified' && count(c) > 0)
  const domains = [...new Map(shown.map(c => [c.domain, c.domainName])).entries()]
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 items-start">
      {domains.map(([d, name]) => (
        <div key={d} className="panel">
          <h3 className="px-4 py-3 text-[14px] font-semibold" style={{ color: 'var(--ink)', borderBottom: '1px solid var(--line)' }}>{name}</h3>
          <ul>
            {shown.filter(c => c.domain === d).map((c, i) => (
              <li key={c.code} style={i ? { borderTop: '1px solid var(--line-soft)' } : undefined}>
                <Link href={`/journals/subject/${c.code}/${query}`} className="grid grid-cols-[52px_minmax(0,1fr)_auto] gap-2 items-baseline px-4 py-2.5 transition-colors hover:bg-[var(--hover)]">
                  <span className="font-mono text-[12px]" style={{ color: 'var(--muted)' }}>{c.code === 'multidisciplinary' ? 'GEN' : c.code}</span>
                  <span className="text-[14px] truncate" style={{ color: 'var(--ink)' }}>{c.name}</span>
                  <span className="font-mono text-[12px] tnum" style={{ color: 'var(--muted)' }}>{fmt(count(c))}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
