'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { publisherJsonHref, type PublisherDetail } from '@/lib/publishers'
import { PublisherView } from '@/components/PublisherView'

type State = { kind: 'loading' } | { kind: 'missing' } | { kind: 'error' } | { kind: 'ok'; publisher: PublisherDetail }
type Keyed = { id: string; state: State }

export function PublisherViewer() {
  const id = useSearchParams().get('id') ?? ''
  const [result, setResult] = useState<Keyed | null>(null)
  const state: State = !id ? { kind: 'missing' } : result?.id === id ? result.state : { kind: 'loading' }

  useEffect(() => {
    if (!id) return
    let cancelled = false
    fetch(publisherJsonHref(id))
      .then(r => { if (!r.ok) throw new Error(String(r.status)); return r.json() })
      .then((rows: PublisherDetail[]) => {
        if (cancelled) return
        const p = rows.find(x => x.slug === id)
        setResult({ id, state: p ? { kind: 'ok', publisher: p } : { kind: 'missing' } })
      })
      .catch(() => { if (!cancelled) setResult({ id, state: { kind: 'error' } }) })
    return () => { cancelled = true }
  }, [id])

  if (state.kind === 'ok') return <PublisherView p={state.publisher} />

  if (state.kind === 'loading') {
    return (
      <div className="pt-10 space-y-4" aria-busy="true" aria-label="Loading publisher">
        <div className="h-4 w-40 rounded-[2px] animate-pulse" style={{ background: 'var(--surface-3)' }} />
        <div className="h-9 w-2/3 rounded-[2px] animate-pulse" style={{ background: 'var(--surface-3)' }} />
        <div className="h-24 rounded-[2px] animate-pulse mt-8" style={{ background: 'var(--surface-2)' }} />
        <div className="h-48 rounded-[2px] animate-pulse" style={{ background: 'var(--surface-2)' }} />
      </div>
    )
  }

  return (
    <div className="pt-16 pb-8 max-w-xl">
      <h1 className="text-[24px] font-semibold" style={{ color: 'var(--ink)' }}>
        {state.kind === 'error' ? 'Could not load this publisher' : 'Publisher not found'}
      </h1>
      <p className="mt-2" style={{ color: 'var(--muted)' }}>
        {state.kind === 'error'
          ? 'The publisher file did not load. Check your connection and reload the page.'
          : id ? `No publisher has the key "${id}".` : 'No publisher key was given.'}
      </p>
      <Link href="/publishers/" className="btn btn-primary mt-6">Browse publishers</Link>
    </div>
  )
}
