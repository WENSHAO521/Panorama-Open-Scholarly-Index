'use client'

import { useEffect, useMemo, useState } from 'react'
import { Copy, Check, DownloadSimple } from '@phosphor-icons/react/dist/ssr'
import { FORMATS, formatLabel, generateCitationText, generatePsgInText, generateShortNote } from '@/components/CitationFormatter'
import type { CitationFormat } from '@/components/CitationFormatter'
import type { RefEntry } from '@/lib/cite-parse'
import { decodeHtml } from '@/lib/utils'
import { psgAuthors, psgYearLabels } from '@/lib/psg'
import { resolveEntries } from '@/lib/cite-batch'
import type { BatchItem } from '@/lib/cite-batch'
import type { Locale } from '@/i18n/config'
import { useLocale } from '@/i18n/LocaleProvider'
import { fill } from '@/i18n/format'

const en = {
  sourceNote: {
    doi: '', none: '',
    search: 'Found by title search - check it is the right work',
    input: 'Built from your input, not verified against Crossref',
  } as Record<BatchItem['source'], string>,
  failed: 'Conversion failed. Check your connection and try again.',
  converting: 'Converting {done} / {total}…', converted: '{n} converted', notFound: ' · {n} not found',
  outputFormat: 'Output format', sort: 'Sort A-Z', copyAll: 'Copy all', copied: 'Copied', download: 'Download',
  shortNote: 'Short note', inText: 'In-text', byHand: 'Not found - convert these by hand',
}
const WORDS: Record<Locale, typeof en> = {
  en,
  'zh-Hans': {
    sourceNote: {
      doi: '', none: '',
      search: '通过标题检索匹配，请核对是否为所需文献',
      input: '依据您输入的内容生成，未经 Crossref 核验',
    },
    failed: '转换失败，请检查网络连接后重试。',
    converting: '正在转换 {done} / {total}…', converted: '已转换 {n} 条', notFound: ' · {n} 条未找到',
    outputFormat: '输出格式', sort: '按字母排序', copyAll: '全部复制', copied: '已复制', download: '下载',
    shortNote: '简注', inText: '文内引用', byHand: '以下条目未找到，请手动转换',
  },
}

/** Resolves the entries on mount and lists the converted references. Remount (new `key`) to run again. */
export function BatchRun({ entries }: { entries: RefEntry[] }) {
  const locale = useLocale()
  const w = WORDS[locale]
  const [fmt, setFmt] = useState<CitationFormat>('psg')
  const [sort, setSort] = useState(true)
  const [items, setItems] = useState<BatchItem[] | null>(null)
  const [progress, setProgress] = useState<[number, number]>([0, entries.length])
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let live = true
    resolveEntries(entries, (d, t) => { if (live) setProgress([d, t]) })
      .then(res => { if (live) setItems(res) })
      .catch(() => { if (live) setError(w.failed) })
    return () => { live = false }
  }, [entries, w.failed])

  const { rows, failed, output } = useMemo(() => {
    const ok = (items ?? []).filter(it => it.article)
    const people = ok.map(it => it.article!.authors.map(au => ({ family: au.family_name, given: au.given_name, name: au.display_name })))
    const labels = fmt === 'psg'
      ? psgYearLabels(ok.map((it, i) => ({ authors: people[i], year: it.article!.publication_year, title: decodeHtml(it.article!.title) })))
      : []
    const rows = ok.map((it, i) => ({
      it,
      text: generateCitationText(it.article!, fmt, labels[i]),
      intext: fmt === 'psg' ? generatePsgInText(it.article!.authors, labels[i]) : fmt === 'footnote' ? generateShortNote(it.article!) : null,
      // Sort keys: the reference without its year suffix, and the author+year group the suffix belongs to.
      base: fmt === 'psg' ? generateCitationText(it.article!, fmt) : '',
      group: fmt === 'psg' && labels[i].length > String(it.article!.publication_year).length
        ? `${psgAuthors(people[i])}#${it.article!.publication_year}` : '',
      label: labels[i] ?? '',
    }))
    // 2024z comes before 2024aa, so within a suffixed group compare the suffix by length first;
    // plain text order would put 2024aa straight after 2024a.
    if (sort) rows.sort((a, b) => a.group && a.group === b.group
      ? a.label.length - b.label.length || a.label.localeCompare(b.label)
      : (fmt === 'psg' ? a.base.localeCompare(b.base) : a.text.localeCompare(b.text)))
    const sep = fmt === 'bibtex' || fmt === 'ris' ? '\n\n' : '\n'
    return { rows, failed: (items ?? []).filter(it => !it.article), output: rows.map(r => r.text).join(sep) }
  }, [items, fmt, sort])

  async function copyAll() {
    try { await navigator.clipboard.writeText(output) } catch { /* ignore */ }
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  function download() {
    const ext = fmt === 'bibtex' ? 'bib' : fmt === 'ris' ? 'ris' : 'txt'
    const url = URL.createObjectURL(new Blob([output + '\n'], { type: 'text/plain;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url; a.download = `references-${fmt}.${ext}`; a.click()
    URL.revokeObjectURL(url)
  }


  return (
    <div className="space-y-4">
      {error && <p className="text-xs" style={{ color: 'var(--rejected)' }}>{error}</p>}
      {!items && !error && (
        <p className="text-xs font-mono" style={{ color: 'var(--posi-muted)' }}>{fill(w.converting, { done: progress[0], total: progress[1] })}</p>
      )}
      {items && (
        <div className="panel">
          <div className="px-5 py-3 flex flex-wrap items-center justify-between gap-2" style={{ borderBottom: '1px solid var(--posi-border)' }}>
            <p className="text-xs font-mono" style={{ color: 'var(--posi-muted)' }}>
              {fill(w.converted, { n: rows.length })}{failed.length > 0 && fill(w.notFound, { n: failed.length })}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <select value={fmt} onChange={e => setFmt(e.target.value as CitationFormat)} aria-label={w.outputFormat}
                className="input" style={{ width: 'auto', height: 28, fontSize: 12.5 }}>
                {FORMATS.map(f => <option key={f.id} value={f.id}>{formatLabel(f, locale)}</option>)}
              </select>
              <label className="flex items-center gap-1.5 text-xs cursor-pointer" style={{ color: 'var(--posi-muted)' }}>
                <input type="checkbox" checked={sort} onChange={e => setSort(e.target.checked)} className="w-3 h-3" />
                {w.sort}
              </label>
              <button onClick={copyAll} disabled={!rows.length} className="btn btn-sm"
                style={copied ? { color: 'var(--verified)', background: 'var(--verified-soft)' } : undefined}>
                {copied ? <Check className="h-3 w-3" weight="bold" /> : <Copy className="h-3 w-3" />}
                {copied ? w.copied : w.copyAll}
              </button>
              <button onClick={download} disabled={!rows.length} className="btn btn-sm">
                <DownloadSimple className="h-3 w-3" /> {w.download}
              </button>
            </div>
          </div>
          <ol className="divide-y divide-[var(--line-soft)]">
            {rows.map(({ it, text, intext }, i) => (
              <li key={i} className="px-5 py-3">
                <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words"
                  style={{ fontFamily: fmt === 'bibtex' || fmt === 'ris' ? 'var(--font-mono)' : 'var(--font-body)', color: 'var(--posi-text)' }}>
                  {text}
                </p>
                {intext && (
                  <p className="text-[11.5px] mt-1" style={{ color: 'var(--posi-muted)' }}>
                    {fmt === 'footnote' ? w.shortNote : w.inText}{locale === 'zh-Hans' ? '：' : ': '}<span className="font-mono">{intext}</span>
                  </p>
                )}
                {w.sourceNote[it.source] && (
                  <p className="text-[11px] mt-1" style={{ color: 'var(--check)' }}>{w.sourceNote[it.source]}</p>
                )}
              </li>
            ))}
          </ol>
          {failed.length > 0 && (
            <div className="px-5 py-4" style={{ borderTop: '1px solid var(--posi-border)', background: 'var(--rejected-soft)' }}>
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--rejected)' }}>{w.byHand}</p>
              <ul className="space-y-1">
                {failed.map((it, i) => (
                  <li key={i} className="text-xs font-mono break-words" style={{ color: 'var(--rejected)' }}>{it.entry.raw.slice(0, 200)}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
