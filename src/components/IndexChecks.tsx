'use client'

// Links out to the official coverage lists of Web of Science and Scopus for
// this journal. POSI does not hold or republish either service's coverage
// (SCIE, SSCI, AHCI, ESCI, Scopus): the reader checks it at the source, which
// stays current where a copied label would go stale. Clarivate's Master
// Journal List takes the ISSN in the URL; Scopus Sources has no documented
// ISSN link, so its search page opens and the ISSN is offered to copy.

import { useState } from 'react'
import { ArrowSquareOut, Check, Copy } from '@phosphor-icons/react/dist/ssr'

export const mjlHref = (issn: string) => `https://mjl.clarivate.com/search-results?issn=${encodeURIComponent(issn)}`
export const SCOPUS_SOURCES = 'https://www.scopus.com/sources'

export function IndexChecks({ issn }: { issn: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(issn)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch { /* clipboard blocked: the ISSN stays visible to select by hand */ }
  }
  return (
    <div className="space-y-2">
      <a href={mjlHref(issn)} target="_blank" rel="noopener noreferrer" className="btn w-full justify-start hover:brightness-95"
        style={{ background: 'var(--wos-brand)', borderColor: 'var(--wos-brand)', color: 'var(--on-wos-brand)' }}>
        <ArrowSquareOut className="h-4 w-4" /> Check Web of Science listing
      </a>
      <a href={SCOPUS_SOURCES} target="_blank" rel="noopener noreferrer" className="btn w-full justify-start hover:brightness-95"
        style={{ background: 'var(--scopus-brand)', borderColor: 'var(--scopus-brand)', color: 'var(--on-scopus-brand)' }}>
        <ArrowSquareOut className="h-4 w-4" /> Check Scopus listing
      </a>
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px]" style={{ color: 'var(--muted)' }}>
        In Scopus, search ISSN
        <span className="font-mono whitespace-nowrap select-all" style={{ color: 'var(--ink)' }}>{issn}</span>
        <button type="button" onClick={copy} className="inline-flex items-center gap-1 whitespace-nowrap rounded-[3px] px-1.5 py-0.5 hover:bg-[var(--hover)]"
          style={{ border: '1px solid var(--line)', color: copied ? 'var(--verified)' : 'var(--ink-2)' }} aria-label={`Copy ISSN ${issn}`}>
          {copied ? <><Check className="h-3 w-3" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
        </button>
      </p>
      <p className="text-[11.5px] leading-snug" style={{ color: 'var(--soft)' }}>
        Opens Clarivate’s Master Journal List and Scopus Sources. POSI is independent of both and does not record their coverage.
      </p>
    </div>
  )
}
