'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { publisherJsonHref, type PublisherDetail } from '@/lib/publishers'
import { PublisherView } from '@/components/PublisherView'
import { useLocale } from '@/i18n/LocaleProvider'
import { localizedHref } from '@/i18n/alternates'

// Every publisher, in the browser from its shard: the long tail without a static page, and in a language other than
// English every publisher (the static pages are English only, see VIEWERS in i18n/alternates).
const WORDS = {
  en: {
    loading: 'Loading publisher', errorTitle: 'Could not load this publisher', missingTitle: 'Publisher not found',
    errorBody: 'The publisher file did not load. Check your connection and reload the page.',
    missingBody: (id: string) => `No publisher has the key "${id}".`, noKey: 'No publisher key was given.', browse: 'Browse publishers',
  },
  'zh-Hans': {
    loading: '正在加载出版商', errorTitle: '无法加载该出版商', missingTitle: '未找到该出版商',
    errorBody: '出版商文件未能加载。请检查网络连接后刷新页面。',
    missingBody: (id: string) => `没有键为“${id}”的出版商。`, noKey: '未提供出版商键。', browse: '浏览出版商',
  },
}

type State = { kind: 'loading' } | { kind: 'missing' } | { kind: 'error' } | { kind: 'ok'; publisher: PublisherDetail }
type Keyed = { id: string; state: State }

export function PublisherViewer() {
  const locale = useLocale()
  const w = WORDS[locale]
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
      <div className="pt-10 space-y-4" aria-busy="true" aria-label={w.loading}>
        <div className="h-4 w-40 rounded-[var(--radius)] animate-pulse" style={{ background: 'var(--surface-3)' }} />
        <div className="h-9 w-2/3 rounded-[var(--radius)] animate-pulse" style={{ background: 'var(--surface-3)' }} />
        <div className="h-24 rounded-[var(--radius)] animate-pulse mt-8" style={{ background: 'var(--surface-2)' }} />
        <div className="h-48 rounded-[var(--radius)] animate-pulse" style={{ background: 'var(--surface-2)' }} />
      </div>
    )
  }

  return (
    <div className="pt-16 pb-8 max-w-xl">
      <h1 className="text-[24px] font-semibold" style={{ color: 'var(--ink)' }}>
        {state.kind === 'error' ? w.errorTitle : w.missingTitle}
      </h1>
      <p className="mt-2" style={{ color: 'var(--muted)' }}>
        {state.kind === 'error'
          ? w.errorBody
          : id ? w.missingBody(id) : w.noKey}
      </p>
      <Link href={localizedHref(locale, '/publishers/')} className="btn btn-primary mt-6">{w.browse}</Link>
    </div>
  )
}
