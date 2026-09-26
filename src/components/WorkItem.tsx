'use client'

import Link from 'next/link'
import { LockOpen, Quotes, ArrowSquareOut, Warning } from '@phosphor-icons/react/dist/ssr'
import { type Work, abstractOf, doiOf, pages, shortId, TYPE_LABEL } from '@/lib/openalex'
import { recordHref, type IndexRecord } from '@/lib/records'
import { CollectionTag } from './db'

function Authors({ w, max = 6 }: { w: Work; max?: number }) {
  const names = w.authorships.map(a => a.author.display_name)
  if (!names.length) return null
  const shown = names.slice(0, max).join(', ')
  return <>{shown}{names.length > max && <span style={{ color: 'var(--soft)' }}>{`, +${names.length - max} more`}</span>}</>
}

export function WorkItem({ w, expand, posi }: { w: Work; expand: boolean; posi: IndexRecord | null }) {
  const src = w.primary_location?.source
  const doi = doiOf(w)
  const pg = pages(w)
  const abs = expand ? abstractOf(w) : null
  const vol = [w.biblio?.volume && `Vol. ${w.biblio.volume}`, w.biblio?.issue && `No. ${w.biblio.issue}`, pg && `pp. ${pg}`].filter(Boolean).join(', ')

  return (
    <article className="py-5" style={{ borderTop: '1px solid var(--line-soft)' }}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px]" style={{ color: 'var(--muted)' }}>
        {w.publication_date && <time dateTime={w.publication_date} className="font-mono">{w.publication_date}</time>}
        {w.type && <span>{TYPE_LABEL[w.type] ?? w.type}</span>}
        {w.open_access?.is_oa && (
          <span className="inline-flex items-center gap-1" style={{ color: 'var(--verified)' }}>
            <LockOpen className="h-3.5 w-3.5" /> Open access
          </span>
        )}
        {w.is_retracted && (
          <span className="inline-flex items-center gap-1" style={{ color: 'var(--rejected)' }}>
            <Warning className="h-3.5 w-3.5" /> Retracted
          </span>
        )}
      </div>

      <h3 className="mt-1.5 text-[16.5px] font-medium leading-snug">
        <Link href={`/work/?id=${shortId(w)}`} className="hover:underline" style={{ color: 'var(--teal)' }}>
          {w.title || 'Untitled'}
        </Link>
      </h3>

      <p className="mt-1 text-[13.5px] leading-relaxed" style={{ color: 'var(--ink-2)' }}><Authors w={w} /></p>

      <p className="mt-1 text-[13px] leading-relaxed" style={{ color: 'var(--muted)' }}>
        {src ? <>
          {posi ? <Link href={recordHref(posi)} className="font-medium hover:underline" style={{ color: 'var(--ink-2)' }}>{src.display_name}</Link> : <span style={{ color: 'var(--ink-2)' }}>{src.display_name}</span>}
          {src.host_organization_name && <>, {src.host_organization_name}</>}
        </> : 'No source recorded'}
        {vol && <>. {vol}</>}
      </p>

      {abs && <p className="mt-3 text-[13.5px] leading-relaxed max-w-[90ch] line-clamp-3" style={{ color: 'var(--ink-2)' }}>{abs}</p>}

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[12.5px]">
        {doi && (
          <a href={`https://doi.org/${doi}`} target="_blank" rel="noopener noreferrer" className="btn btn-sm font-mono">
            {doi} <ArrowSquareOut className="h-3 w-3" />
          </a>
        )}
        {w.open_access?.oa_url && (
          <a href={w.open_access.oa_url} target="_blank" rel="noopener noreferrer" className="btn btn-sm">Full text</a>
        )}
        <span className="inline-flex items-center gap-1 ml-1" style={{ color: 'var(--muted)' }} title="Citations recorded in OpenAlex">
          <Quotes className="h-3.5 w-3.5" /> <span className="font-mono tnum">{w.cited_by_count.toLocaleString('en-US')}</span> citations
        </span>
        {posi && <span className="ml-auto inline-flex items-center gap-1.5" style={{ color: 'var(--muted)' }}>Journal in POSI <CollectionTag k={posi.k} /></span>}
      </div>
    </article>
  )
}
