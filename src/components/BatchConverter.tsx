'use client'

import { useMemo, useRef, useState, ChangeEvent } from 'react'
import { Copy, Check, DownloadSimple, UploadSimple } from '@phosphor-icons/react/dist/ssr'
import { FORMATS, generateCitationText } from '@/components/CitationFormatter'
import type { CitationFormat } from '@/components/CitationFormatter'
import { parseInput, MAX_BATCH } from '@/lib/cite-parse'
import type { InputFormat } from '@/lib/cite-parse'
import { resolveEntries } from '@/lib/cite-batch'
import type { BatchItem } from '@/lib/cite-batch'

const FORMAT_NAMES: Record<InputFormat, string> = {
  text: 'DOI / reference list', bibtex: 'BibTeX', ris: 'RIS', csl: 'CSL JSON',
}

const SOURCE_NOTE: Record<BatchItem['source'], string> = {
  doi: '', none: '',
  search: 'Found by title search - check it is the right work',
  input: 'Built from your input, not verified against Crossref',
}

export function BatchConverter() {
  const [text, setText] = useState('')
  const [fmt, setFmt] = useState<CitationFormat>('psg')
  const [sort, setSort] = useState(true)
  const [items, setItems] = useState<BatchItem[] | null>(null)
  const [progress, setProgress] = useState<[number, number] | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const run = useRef(0)

  const parsed = useMemo(() => (text.trim() ? parseInput(text) : null), [text])
  const count = parsed?.entries.length ?? 0

  async function convert() {
    if (!parsed || !count) return
    if (count > MAX_BATCH) { setError(`At most ${MAX_BATCH} entries at a time (found ${count}).`); return }
    const id = ++run.current
    setError(null); setItems(null); setProgress([0, count])
    try {
      const res = await resolveEntries(parsed.entries, (d, t) => { if (id === run.current) setProgress([d, t]) })
      if (id === run.current) setItems(res)
    } catch {
      if (id === run.current) setError('Conversion failed. Check your connection and try again.')
    } finally {
      if (id === run.current) setProgress(null)
    }
  }

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setText(await f.text()); setItems(null); setError(null)
    e.target.value = ''
  }

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
    <div className="space-y-6">
      <div className="bg-white p-6" style={{ border: '1px solid var(--posi-border)' }}>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="batch-input" className="block text-sm font-medium" style={{ color: 'var(--posi-text)' }}>
            DOIs or references - one per line, or a whole BibTeX / RIS / CSL JSON file
          </label>
          <label className={`${btn} cursor-pointer`} style={btnStyle}>
            <UploadSimple className="h-3 w-3" /> Open file
            <input type="file" accept=".bib,.bibtex,.ris,.txt,.json,.csv,text/plain" className="hidden" onChange={onFile} />
          </label>
        </div>
        <textarea
          id="batch-input" value={text} onChange={e => { setText(e.target.value); setItems(null) }} rows={10}
          placeholder={'10.63802/afs.2024.008\nhttps://doi.org/10.1038/s41586-020-2649-2\nSmith, J. (2020). Deep learning for protein folding. Nature, 5(2), 1-10.\n\n... or paste a .bib / .ris export'}
          className="w-full px-3 py-2 text-xs font-mono focus:outline-none"
          style={{ border: '1px solid var(--posi-border)', color: 'var(--posi-text)' }}
        />
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3">
          <button
            onClick={convert} disabled={!count || !!progress}
            className="px-5 py-2.5 text-white text-sm font-semibold disabled:opacity-50" style={{ background: 'var(--posi-accent)' }}>
            {progress ? `Converting ${progress[0]} / ${progress[1]}…` : `Convert${count ? ` ${count}` : ''}`}
          </button>
          <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--posi-muted)' }}>
            Output
            <select value={fmt} onChange={e => setFmt(e.target.value as CitationFormat)}
              className="px-2 py-1.5 text-xs" style={{ border: '1px solid var(--posi-border)', color: 'var(--posi-text)' }}>
              {FORMATS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-1.5 text-xs cursor-pointer" style={{ color: 'var(--posi-muted)' }}>
            <input type="checkbox" checked={sort} onChange={e => setSort(e.target.checked)} className="w-3 h-3" />
            Sort alphabetically
          </label>
          {parsed && (
            <span className="text-xs font-mono" style={{ color: 'var(--posi-muted)' }}>
              {FORMAT_NAMES[parsed.format]} · {count} {count === 1 ? 'entry' : 'entries'}
            </span>
          )}
        </div>
        {error && <p className="text-xs mt-3" style={{ color: 'var(--rejected)' }}>{error}</p>}
      </div>

      {items && (
        <div className="bg-white" style={{ border: '1px solid var(--posi-border)' }}>
          <div className="px-5 py-3 flex flex-wrap items-center justify-between gap-2" style={{ borderBottom: '1px solid var(--posi-border)' }}>
            <p className="text-xs font-mono" style={{ color: 'var(--posi-muted)' }}>
              {rows.length} converted{failed.length > 0 && ` · ${failed.length} not found`}
            </p>
            <div className="flex gap-2">
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
