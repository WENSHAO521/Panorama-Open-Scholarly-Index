'use client'

// Links out to Web of Science and Scopus for this journal. POSI is
// independent of both. Web of Science: Clarivate's Master Journal List takes
// the ISSN in the URL. Scopus: the journal's own Scopus page when Elsevier's
// Scopus source title list (reduced to src/lib/scopus-sources.json, served
// as /data/scopus/<NN>.json) has its ISSN, with its status in that list;
// otherwise Scopus Sources search with the ISSN to copy. The list holds
// ~49,000 of Scopus's 50,000+ serial titles, so a journal absent from it is
// never described as not in Scopus.

import { useEffect, useState } from 'react'
import { ArrowSquareOut, Check, Copy } from '@phosphor-icons/react/dist/ssr'
import { SCOPUS_RANK, scopusKey, scopusShard, scopusSourceHref, type ScopusEntry } from '@/lib/scopus'

export const mjlHref = (issn: string) => `https://mjl.clarivate.com/search-results?issn=${encodeURIComponent(issn)}`
export const SCOPUS_SOURCES = 'https://www.scopus.com/sources'

type Shard = { as_of: string; list: string; d: Record<string, ScopusEntry> }
const shards = new Map<string, Promise<Shard | null>>()
function loadShard(name: string) {
  if (!shards.has(name)) shards.set(name, fetch(`/data/scopus/${name}.json`).then(r => (r.ok ? r.json() : null)).catch(() => null))
  return shards.get(name)!
}

/** The best entry among the journal's ISSNs, and the list's date. */
function useScopus(issns: string[]) {
  const [state, setState] = useState<{ entry: ScopusEntry | null; asOf: string | null } | null>(null)
  const keys = issns.map(scopusKey).filter((k): k is string => !!k)
  const sig = keys.join(',')
  useEffect(() => {
    let live = true
    const ks = sig ? sig.split(',') : []
    Promise.all(ks.map(k => loadShard(scopusShard(k)).then(s => ({ s, e: s?.d[k] ?? null })))).then(found => {
      if (!live) return
      const best = found.map(f => f.e).filter((e): e is ScopusEntry => !!e).sort((a, b) => SCOPUS_RANK[a[1]] - SCOPUS_RANK[b[1]])[0] ?? null
      setState({ entry: best, asOf: found.find(f => f.s)?.s?.as_of ?? null })
    })
    return () => { live = false }
  }, [sig])
  return state
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const listDate = (asOf: string | null) => {
  const m = asOf?.match(/^(\d{4})-(\d{2})/)
  return m ? `${MONTHS[Number(m[2]) - 1]} ${m[1]}` : 'latest'
}

function status(e: ScopusEntry | null): { text: string; tone: string } {
  if (!e) return { text: 'Not found in the Scopus source list, which does not include every Scopus title', tone: 'var(--muted)' }
  const [, code, detail] = e
  if (code === 'a') return { text: `Active in Scopus${detail ? `, covered since ${detail}` : ''}`, tone: 'var(--verified)' }
  if (code === 'i') return { text: `Inactive in Scopus${detail ? `, coverage ended ${detail}` : ''}`, tone: 'var(--ink-2)' }
  if (code === 'x') return { text: `Discontinued by Scopus${detail ? ` in ${detail}` : ''}`, tone: 'var(--check)' }
  return { text: `Accepted by Scopus, being added${detail ? ` (accepted ${detail})` : ''}`, tone: 'var(--teal)' }
}

export function IndexChecks({ issns }: { issns: string[] }) {
  const issn = issns[0]
  const scopus = useScopus(issns)
  const id = scopus?.entry?.[0] ?? null
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(issn)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch { /* clipboard blocked: the ISSN stays visible to select by hand */ }
  }
  const st = scopus ? status(scopus.entry) : null
  return (
    <div className="space-y-2">
      <a href={mjlHref(issn)} target="_blank" rel="noopener noreferrer" className="btn w-full justify-start hover:brightness-95"
        style={{ background: 'var(--wos-brand)', borderColor: 'var(--wos-brand)', color: 'var(--on-wos-brand)' }}>
        <ArrowSquareOut className="h-4 w-4" /> Check Web of Science listing
      </a>
      <a href={id ? scopusSourceHref(id) : SCOPUS_SOURCES} target="_blank" rel="noopener noreferrer" className="btn w-full justify-start hover:brightness-95"
        style={{ background: 'var(--scopus-brand)', borderColor: 'var(--scopus-brand)', color: 'var(--on-scopus-brand)' }}>
        <ArrowSquareOut className="h-4 w-4" /> {id ? 'View in Scopus' : 'Check Scopus listing'}
      </a>
      {st && (
        <p className="flex items-start gap-1.5 text-[12px] leading-snug" style={{ color: 'var(--ink-2)' }}>
          <span aria-hidden className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: st.tone }} />
          <span>
            <span style={{ color: st.tone === 'var(--check)' ? 'var(--check)' : undefined, fontWeight: scopus?.entry?.[1] === 'x' ? 600 : undefined }}>{st.text}</span>
            <span style={{ color: 'var(--soft)' }}> · Scopus source list, {listDate(scopus?.asOf ?? null)}</span>
          </span>
        </p>
      )}
      {!id && (
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px]" style={{ color: 'var(--muted)' }}>
          In Scopus, search ISSN
          <span className="font-mono whitespace-nowrap select-all" style={{ color: 'var(--ink)' }}>{issn}</span>
          <button type="button" onClick={copy} className="inline-flex items-center gap-1 whitespace-nowrap rounded-[3px] px-1.5 py-0.5 hover:bg-[var(--hover)]"
            style={{ border: '1px solid var(--line)', color: copied ? 'var(--verified)' : 'var(--ink-2)' }} aria-label={`Copy ISSN ${issn}`}>
            {copied ? <><Check className="h-3 w-3" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
          </button>
        </p>
      )}
      <p className="text-[11.5px] leading-snug" style={{ color: 'var(--soft)' }}>
        Opens Clarivate’s Master Journal List and Scopus. POSI is independent of both; the Scopus status is as stated in Elsevier’s published source list.
      </p>
    </div>
  )
}
