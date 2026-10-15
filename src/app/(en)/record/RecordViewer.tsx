'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import type { Journal } from '@/lib/types'
import { shardOf } from '@/lib/records'
import { RecordView } from '@/components/RecordView'
import { dataUrl } from '@/lib/data-base'

type State = { kind: 'loading' } | { kind: 'missing' } | { kind: 'error' } | { kind: 'ok'; journal: Journal }
type Keyed = { code: string; state: State }

export function RecordViewer() {
  const code = useSearchParams().get('code') ?? ''
  const [result, setResult] = useState<Keyed | null>(null)
  const state: State = !code ? { kind: 'missing' } : result?.code === code ? result.state : { kind: 'loading' }

  useEffect(() => {
    if (!code) return
    let cancelled = false
    fetch(dataUrl(`records/discovered-${shardOf(code)}.json`))
      .then(r => { if (!r.ok) throw new Error(String(r.status)); return r.json() })
      .then((rows: Journal[]) => {
        if (cancelled) return
        const j = rows.find(x => x.journal_code === code)
        setResult({ code, state: j ? { kind: 'ok', journal: j } : { kind: 'missing' } })
      })
      .catch(() => { if (!cancelled) setResult({ code, state: { kind: 'error' } }) })
    return () => { cancelled = true }
  }, [code])

  if (state.kind === 'ok') return <RecordView journal={state.journal} jsonHref={dataUrl(`records/discovered-${shardOf(code)}.json`)} />

  if (state.kind === 'loading') {
    return (
      <div className="pt-10 space-y-4" aria-busy="true" aria-label="Loading record">
        <div className="h-4 w-40 rounded-[2px] animate-pulse" style={{ background: 'var(--surface-3)' }} />
        <div className="h-9 w-2/3 rounded-[2px] animate-pulse" style={{ background: 'var(--surface-3)' }} />
        <div className="h-5 w-1/3 rounded-[2px] animate-pulse" style={{ background: 'var(--surface-2)' }} />
        <div className="h-48 rounded-[2px] animate-pulse mt-8" style={{ background: 'var(--surface-2)' }} />
      </div>
    )
  }

  return (
    <div className="pt-16 pb-8 max-w-xl">
      <h1 className="text-[24px] font-semibold" style={{ color: 'var(--ink)' }}>
        {state.kind === 'error' ? 'Could not load this record' : 'Record not found'}
      </h1>
      <p className="mt-2" style={{ color: 'var(--muted)' }}>
        {state.kind === 'error'
          ? 'The record file did not load. Check your connection and reload the page.'
          : code ? `No Discovered record has the key "${code}".` : 'No record key was given.'}
      </p>
      <Link href="/journals/" className="btn btn-primary mt-6">Browse records</Link>
    </div>
  )
}
