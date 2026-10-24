'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import type { Journal } from '@/lib/types'
import { shardOf } from '@/lib/records'
import { RecordView, type RecordMetrics } from '@/components/RecordView'
import type { JournalEvaluation } from '@/lib/evaluation/journal'
import type { PcsEntry } from '@/lib/pcs'
import type { PciEntry } from '@/lib/pci'
import psc from '@/lib/psc-v1.0.snapshot.json'
import { subjectName } from '@/i18n/format'
import { dataUrl } from '@/lib/data-base'
import { useLocale } from '@/i18n/LocaleProvider'
import { localizedHref } from '@/i18n/alternates'

const WORDS = {
  en: {
    loading: 'Loading record', errorTitle: 'Could not load this record', missingTitle: 'Record not found',
    errorBody: 'The record file did not load. Check your connection and reload the page.',
    missingBody: (code: string) => `No record has the key "${code}".`, noKey: 'No record key was given.', browse: 'Browse records',
  },
  'zh-Hans': {
    loading: '正在加载记录', errorTitle: '无法加载该记录', missingTitle: '未找到该记录',
    errorBody: '记录文件未能加载。请检查网络连接后刷新页面。',
    missingBody: (code: string) => `没有键为“${code}”的记录。`, noKey: '未提供记录键。', browse: '浏览期刊',
  },
}

// A record's full file (/data/journal/<code>.json), published for every record that also has a static English page.
interface FullRecord { record: Journal; evaluation: JournalEvaluation; indicators: { pcs: PcsEntry | null; pci: PciEntry | null } }

const PSC_NAME: Record<string, string> = Object.fromEntries(psc.categories.map(c => [c.code, c.name]))

type State = { kind: 'loading' } | { kind: 'missing' } | { kind: 'error' } | { kind: 'ok'; journal: Journal; json: string; metrics?: RecordMetrics }
type Keyed = { code: string; state: State }

export function RecordViewer() {
  const locale = useLocale()
  const w = WORDS[locale]
  const code = useSearchParams().get('code') ?? ''
  const [result, setResult] = useState<Keyed | null>(null)
  const state: State = !code ? { kind: 'missing' } : result?.code === code ? result.state : { kind: 'loading' }

  useEffect(() => {
    if (!code) return
    let cancelled = false
    // A Discovered record is in its shard. Any other record has its own full file: the Chinese interface shows the
    // records without a static Chinese page here, built in the browser from that file.
    const shard = dataUrl(`records/discovered-${shardOf(code)}.json`)
    const full = dataUrl(`journal/${encodeURIComponent(code)}.json`)
    const load = async (): Promise<State> => {
      const r = await fetch(shard)
      if (!r.ok) throw new Error(String(r.status))
      const j = ((await r.json()) as Journal[]).find(x => x.journal_code === code)
      if (j) return { kind: 'ok', journal: j, json: shard }
      const f = await fetch(full)
      if (f.status === 404) return { kind: 'missing' }
      if (!f.ok) throw new Error(String(f.status))
      const d = (await f.json()) as FullRecord
      const cat = d.record.psc_category
      return {
        kind: 'ok', journal: d.record, json: full,
        metrics: {
          evaluation: d.evaluation, pcs: d.indicators.pcs, pci: d.indicators.pci,
          pscName: cat && PSC_NAME[cat] ? subjectName(locale, cat, PSC_NAME[cat]) : null,
        },
      }
    }
    load()
      .then(state => { if (!cancelled) setResult({ code, state }) })
      .catch(() => { if (!cancelled) setResult({ code, state: { kind: 'error' } }) })
    return () => { cancelled = true }
  }, [code, locale])

  if (state.kind === 'ok') return <RecordView journal={state.journal} jsonHref={state.json} metrics={state.metrics} locale={locale} />

  if (state.kind === 'loading') {
    return (
      <div className="pt-10 space-y-4" aria-busy="true" aria-label={w.loading}>
        <div className="h-4 w-40 rounded-[var(--radius)] animate-pulse" style={{ background: 'var(--surface-3)' }} />
        <div className="h-9 w-2/3 rounded-[var(--radius)] animate-pulse" style={{ background: 'var(--surface-3)' }} />
        <div className="h-5 w-1/3 rounded-[var(--radius)] animate-pulse" style={{ background: 'var(--surface-2)' }} />
        <div className="h-48 rounded-[var(--radius)] animate-pulse mt-8" style={{ background: 'var(--surface-2)' }} />
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
          : code ? w.missingBody(code) : w.noKey}
      </p>
      <Link href={localizedHref(locale, '/journals/')} className="btn btn-primary mt-6">{w.browse}</Link>
    </div>
  )
}
