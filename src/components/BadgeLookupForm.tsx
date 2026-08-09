'use client'

import { useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'

interface EligibleJournal {
  code: string
  title: string
}

const VARIANTS: { id: string; label: string; width: number; height: number; dark?: boolean }[] = [
  { id: 'standard', label: 'Standard', width: 220, height: 64 },
  { id: 'dark', label: 'Dark', width: 220, height: 64, dark: true },
  { id: 'compact', label: 'Compact Seal', width: 140, height: 90 },
  { id: 'micro', label: 'Micro', width: 130, height: 20 },
  { id: 'icon', label: 'Icon', width: 40, height: 40 },
  { id: 'vertical', label: 'Vertical Seal', width: 90, height: 140 },
  { id: 'banner', label: 'Banner', width: 400, height: 48 },
  { id: 'mono', label: 'Monochrome', width: 220, height: 64 },
  { id: 'detailed', label: 'Detailed', width: 260, height: 100 },
]

function CopyBox({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="flex items-start gap-2">
      <pre className="flex-1 text-[10px] leading-relaxed bg-gray-900 text-gray-100 p-3 overflow-x-auto whitespace-pre-wrap break-all">{text}</pre>
      <button
        onClick={() => { navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) }) }}
        className="text-[10px] font-medium px-2 py-1 shrink-0 transition-colors"
        style={{ border: '1px solid var(--posi-border)', color: 'var(--posi-text)', background: copied ? '#f0fdf4' : 'white' }}
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  )
}

export function BadgeLookupForm({ journals, siteUrl }: { journals: EligibleJournal[]; siteUrl: string }) {
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('code') ?? '')

  const match = useMemo(
    () => journals.find(j => j.code.toLowerCase() === query.trim().toLowerCase()),
    [journals, query]
  )

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q || match) return []
    return journals.filter(j => j.code.toLowerCase().includes(q) || j.title.toLowerCase().includes(q)).slice(0, 8)
  }, [journals, query, match])

  return (
    <div className="bg-white p-5" style={{ border: '1px solid var(--posi-border)' }}>
      <h2 className="text-xs font-bold uppercase tracking-[0.1em] mb-3" style={{ color: 'var(--posi-muted)' }}>Get Your Badge</h2>
      <p className="text-[11px] mb-3" style={{ color: 'var(--posi-muted)' }}>
        Enter your journal code (shown on your POSI journal record URL, e.g. <code className="font-mono">/journal/&lt;code&gt;</code>).
        Only Core Collection journals — those with an official or auto-assessed PQF review — are eligible.
      </p>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="e.g. grhas"
        className="w-full text-xs px-3 py-2 focus:outline-none mb-1"
        style={{ border: '1px solid var(--posi-border)', color: 'var(--posi-text)' }}
      />
      {suggestions.length > 0 && (
        <div className="mb-3" style={{ border: '1px solid var(--posi-border-light)' }}>
          {suggestions.map(s => (
            <button
              key={s.code}
              onClick={() => setQuery(s.code)}
              className="block w-full text-left px-3 py-1.5 text-[11px] hover:bg-gray-50 transition-colors"
              style={{ color: 'var(--posi-text)' }}
            >
              <span className="font-mono" style={{ color: 'var(--posi-accent)' }}>{s.code}</span> — {s.title}
            </button>
          ))}
        </div>
      )}

      {query.trim() && !match && suggestions.length === 0 && (
        <div className="p-3 text-[11px]" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c' }}>
          No Core Collection journal matches "{query}". Badges are only issued to reviewed journals — see{' '}
          <a href="/pqf#eligibility" className="underline">PQF Eligibility</a>.
        </div>
      )}

      {match && (
        <div className="mt-4 space-y-5">
          {VARIANTS.map(v => {
            // Relative path for the on-page preview (works in any environment);
            // the copyable snippet below needs the absolute siteUrl since it's
            // meant to be pasted onto a third-party website.
            const previewUrl = `/api/badge/${match.code}/${v.id}`
            const imgUrl = `${siteUrl}/api/badge/${match.code}/${v.id}`
            const linkUrl = `${siteUrl}/journal/${match.code}/`
            const html = `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer"><img src="${imgUrl}" alt="POSI Verified — ${match.title}" /></a>`
            return (
              <div key={v.id}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--posi-text)' }}>{v.label}</span>
                </div>
                <div className="flex items-center gap-4 p-3 mb-2" style={{ background: v.dark ? '#111111' : 'var(--posi-bg)' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewUrl} alt={`POSI badge preview (${v.label})`} width={v.width} height={v.height} />
                </div>
                <CopyBox text={html} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
