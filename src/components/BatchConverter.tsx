'use client'

import { useEffect, useMemo, useState } from 'react'
import { Copy, Check, DownloadSimple } from '@phosphor-icons/react/dist/ssr'
import { FORMATS, generateCitationText } from '@/components/CitationFormatter'
import type { CitationFormat } from '@/components/CitationFormatter'
import type { RefEntry } from '@/lib/cite-parse'
import { resolveEntries } from '@/lib/cite-batch'
import type { BatchItem } from '@/lib/cite-batch'

const SOURCE_NOTE: Record<BatchItem['source'], string> = {
  doi: '', none: '',
  search: 'Found by title search - check it is the right work',
  input: 'Built from your input, not verified against Crossref',
}

/** Resolves the entries on mount and lists the converted references. Remount (new `key`) to run again. */
export function BatchRun({ entries }: { entries: RefEntry[] }) {
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
      .catch(() => { if (live) setError('Conversion failed. Check your connection and try again.') })
    return () => { live = false }
  }, [entries])

  const { rows, failed, output } = useMemo(() => {
    const ok = (items ?? []).filter(it => it.article)
    const rows = ok.map(it => ({ it, text: generateCitationText(it.article!, fmt) }))
    if (sort) rows.sort((a, b) => a.text.localeCompare(b.text))
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

  const btn = 'flex items-center gap-1.5 px-3 py-1.5 text-[11px] uppercase tracking-[0.06em]'
  const btnStyle = { border: '1px solid var(--posi-border)', color: 'var(--posi-muted)', fontFamily: 'var(--font-mono)', background: '#fff' }

  return (
    <div className="space-y-4">
      {error && <p className="text-xs" style={{ color: 'var(--rejected)' }}>{error}</p>}
      {!items && !error && (
        <p className="text-xs font-mono" style={{ color: 'var(--posi-muted)' }}>Converting {progress[0]} / {progress[1]}…</p>
      )}
      {items && (
        <div className="bg-white" style={{ border: '1px solid var(--posi-border)' }}>
          <div className="px-5 py-3 flex flex-wrap items-center justify-between gap-2" style={{ borderBottom: '1px solid var(--posi-border)' }}>
            <p className="text-xs font-mono" style={{ color: 'var(--posi-muted)' }}>
              {rows.length} converted{failed.length > 0 && ` · ${failed.length} not found`}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <select value={fmt} onChange={e => setFmt(e.target.value as CitationFormat)} aria-label="Output format"
                className="px-2 py-1.5 text-xs" style={{ border: '1px solid var(--posi-border)', color: 'var(--posi-text)' }}>
                {FORMATS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
              </select>
              <label className="flex items-center gap-1.5 text-xs cursor-pointer" style={{ color: 'var(--posi-muted)' }}>
                <input type="checkbox" checked={sort} onChange={e => setSort(e.target.checked)} className="w-3 h-3" />
                Sort A-Z
              </label>
              <button onClick={copyAll} disabled={!rows.length} className={btn}
                style={{ ...btnStyle, color: copied ? 'var(--verified)' : btnStyle.color }}>
                {copied ? <Check className="h-3 w-3" weight="bold" /> : <Copy className="h-3 w-3" />}
                {copied ? 'Copied' : 'Copy all'}
              </button>
              <button onClick={download} disabled={!rows.length} className={btn} style={btnStyle}>
                <DownloadSimple className="h-3 w-3" /> Download
              </button>
            </div>
          </div>
          <ol className="divide-y divide-[var(--line-soft)]">
            {rows.map(({ it, text }, i) => (
              <li key={i} className="px-5 py-3">
                <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words"
                  style={{ fontFamily: fmt === 'bibtex' || fmt === 'ris' ? 'var(--font-mono)' : 'var(--font-body)', color: 'var(--posi-text)' }}>
                  {text}
                </p>
                {SOURCE_NOTE[it.source] && (
                  <p className="text-[11px] mt-1" style={{ color: 'var(--check, #b45309)' }}>{SOURCE_NOTE[it.source]}</p>
                )}
              </li>
            ))}
          </ol>
          {failed.length > 0 && (
            <div className="px-5 py-4" style={{ borderTop: '1px solid var(--posi-border)', background: 'var(--rejected-soft)' }}>
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--rejected)' }}>Not found - convert these by hand</p>
              <ul className="space-y-1">
                {failed.map((it, i) => (
                  <li key={i} className="text-xs font-mono break-words" style={{ color: '#7f1d1d' }}>{it.entry.raw.slice(0, 200)}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
