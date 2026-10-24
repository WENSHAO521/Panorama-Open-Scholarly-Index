'use client'

// Builds the HTML a journal pastes into its website: the chosen POSI mark,
// linked to the journal's own POSI page, where anyone can check its status.

import { useState } from 'react'
import type { Locale } from '@/i18n/config'
import { useLocale } from '@/i18n/LocaleProvider'

const SITE = 'https://posi.panorama-sg.com'

export interface MarkFile { file: string; label: string; width: number; height: number }

// The form's words; the embed code itself (alt text, links) stays in English, as it appears on the journal's website.
const en = {
  yourJournal: 'Your journal is', indexed: 'Indexed in POSI', core: 'In the Core Collection', issn: 'Journal ISSN',
  badIssn: 'Enter an ISSN such as 1234-567X.', issnHelp: 'The mark links to your journal’s POSI profile.',
  journal: 'Journal', coreHelp: 'Only journals currently certified are listed. The mark links to the journal’s POSI record.',
  style: 'Style', code: 'Embed code', copied: 'Copied', copy: 'Copy code', first: 'Enter your journal’s ISSN first.',
}
const WORDS: Record<Locale, typeof en> = {
  en,
  'zh-Hans': {
    yourJournal: '您的期刊', indexed: '已被 POSI 收录', core: '已入选核心合集', issn: '期刊 ISSN',
    badIssn: '请输入格式如 1234-567X 的 ISSN。', issnHelp: '徽标将链接至您期刊的 POSI 页面。',
    journal: '期刊', coreHelp: '仅列出当前处于认证有效期内的期刊。徽标将链接至该期刊的 POSI 记录。',
    style: '样式', code: '嵌入代码', copied: '已复制', copy: '复制代码', first: '请先输入期刊的 ISSN。',
  },
}

export function LogoEmbed({ core, indexedMarks, coreMarks }: {
  core: { code: string; title: string }[]
  indexedMarks: MarkFile[]
  coreMarks: MarkFile[]
}) {
  const w = WORDS[useLocale()]
  const [kind, setKind] = useState<'indexed' | 'core'>('indexed')
  const [issn, setIssn] = useState('')
  const [code, setCode] = useState(core[0]?.code ?? '')
  const [style, setStyle] = useState(0)
  const [copied, setCopied] = useState(false)

  const marks = kind === 'core' ? coreMarks : indexedMarks
  const mark = marks[Math.min(style, marks.length - 1)]
  const cleanIssn = issn.trim().toUpperCase()
  const validIssn = /^\d{4}-?\d{3}[\dX]$/.test(cleanIssn)
  const issnKey = validIssn ? `${cleanIssn.replace('-', '').slice(0, 4)}-${cleanIssn.replace('-', '').slice(4)}` : ''
  const href = kind === 'core' ? `${SITE}/journal/${code}/` : `${SITE}/journal/?issn=${issnKey || 'XXXX-XXXX'}`
  const alt = kind === 'core' ? 'Panorama Open Scholarly Index Core Collection' : 'Indexed in the Panorama Open Scholarly Index'
  const html = `<a href="${href}" target="_blank" rel="noopener"><img src="${SITE}/logos/${mark.file}" alt="${alt}" width="${mark.width}" height="${mark.height}"></a>`
  const ready = kind === 'core' ? !!code : validIssn

  async function copy() {
    try {
      await navigator.clipboard.writeText(html)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch { /* the code stays selectable below */ }
  }

  return (
    <div className="panel p-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <div className="space-y-4">
        <fieldset>
          <legend className="text-[13px] font-medium mb-2" style={{ color: 'var(--ink)' }}>{w.yourJournal}</legend>
          <div className="flex flex-wrap gap-4 text-[14px]">
            <label className="flex items-center gap-2"><input type="radio" name="kind" checked={kind === 'indexed'} onChange={() => { setKind('indexed'); setStyle(0) }} /> {w.indexed}</label>
            <label className="flex items-center gap-2"><input type="radio" name="kind" checked={kind === 'core'} onChange={() => { setKind('core'); setStyle(0) }} /> {w.core}</label>
          </div>
        </fieldset>

        {kind === 'indexed' ? (
          <div>
            <label htmlFor="embed-issn" className="block text-[13px] font-medium mb-1.5" style={{ color: 'var(--ink)' }}>{w.issn}</label>
            <input id="embed-issn" className="input h-10 font-mono" value={issn} onChange={e => setIssn(e.target.value)} placeholder="0000-0000" aria-describedby="embed-issn-help" />
            <p id="embed-issn-help" className="mt-1.5 text-[12.5px]" style={{ color: issn && !validIssn ? 'var(--check)' : 'var(--muted)' }}>
              {issn && !validIssn ? w.badIssn : w.issnHelp}
            </p>
          </div>
        ) : (
          <div>
            <label htmlFor="embed-core" className="block text-[13px] font-medium mb-1.5" style={{ color: 'var(--ink)' }}>{w.journal}</label>
            <select id="embed-core" className="input h-10" value={code} onChange={e => setCode(e.target.value)}>
              {core.map(j => <option key={j.code} value={j.code}>{j.title}</option>)}
            </select>
            <p className="mt-1.5 text-[12.5px]" style={{ color: 'var(--muted)' }}>{w.coreHelp}</p>
          </div>
        )}

        <div>
          <label htmlFor="embed-style" className="block text-[13px] font-medium mb-1.5" style={{ color: 'var(--ink)' }}>{w.style}</label>
          <select id="embed-style" className="input h-10" value={style} onChange={e => setStyle(Number(e.target.value))}>
            {marks.map((m, i) => <option key={m.file} value={i}>{m.label}</option>)}
          </select>
        </div>
      </div>

      <div className="min-w-0 space-y-3">
        <div className="flex items-center justify-center p-5 rounded-[2px]" style={{ background: /dark/.test(mark.file) ? '#1e2b26' : 'var(--surface-2)', minHeight: 120 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/logos/${mark.file}`} alt={alt} width={mark.width} height={mark.height} style={{ maxWidth: '100%', height: 'auto' }} />
        </div>
        <pre className="code whitespace-pre-wrap break-all text-[12px]" aria-label={w.code}><code>{html}</code></pre>
        <div className="flex items-center gap-3">
          <button type="button" className="btn btn-primary" onClick={copy} disabled={!ready}>{copied ? w.copied : w.copy}</button>
          {!ready && <span className="text-[12.5px]" style={{ color: 'var(--muted)' }}>{w.first}</span>}
        </div>
      </div>
    </div>
  )
}
