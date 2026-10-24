'use client'

// Links out to Web of Science, Scopus and PubMed for this journal. POSI is
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
import { dataUrl } from '@/lib/data-base'
import type { Locale } from '@/i18n/config'
import { useLocale } from '@/i18n/LocaleProvider'

export const mjlHref = (issn: string) => `https://mjl.clarivate.com/search-results?issn=${encodeURIComponent(issn)}`
export const SCOPUS_SOURCES = 'https://www.scopus.com/sources'
/** NLM Catalog search by ISSN, for a journal not in the PubMed list. */
export const nlmCatalogHref = (issn: string) => `https://www.ncbi.nlm.nih.gov/nlmcatalog/?term=${encodeURIComponent(`${issn}[issn]`)}`
/** A journal's own NLM Catalog page, which states its MEDLINE indexing status. */
export const nlmRecordHref = (nlmId: string) => `https://www.ncbi.nlm.nih.gov/nlmcatalog/${encodeURIComponent(nlmId)}`

type Shard = { as_of: string; list: string; d: Record<string, ScopusEntry> }
const shards = new Map<string, Promise<Shard | null>>()
function loadShard(name: string) {
  if (!shards.has(name)) shards.set(name, fetch(dataUrl(`scopus/${name}.json`)).then(r => (r.ok ? r.json() : null)).catch(() => null))
  return shards.get(name)!
}

type PubmedShard = { as_of: string; d: Record<string, string> }
const pubmedShards = new Map<string, Promise<PubmedShard | null>>()
function loadPubmed(name: string) {
  if (!pubmedShards.has(name)) pubmedShards.set(name, fetch(dataUrl(`pubmed/${name}.json`)).then(r => (r.ok ? r.json() : null)).catch(() => null))
  return pubmedShards.get(name)!
}

/** NLM ID of the journal in NLM's list of journals cited in PubMed, if any. */
function usePubmed(issns: string[]) {
  const [state, setState] = useState<{ nlmId: string | null; asOf: string | null } | null>(null)
  const sig = issns.map(scopusKey).filter((k): k is string => !!k).join(',')
  useEffect(() => {
    let live = true
    const ks = sig ? sig.split(',') : []
    Promise.all(ks.map(k => loadPubmed(scopusShard(k)).then(s => ({ s, id: s?.d[k] ?? null })))).then(found => {
      if (live) setState({ nlmId: found.find(f => f.id)?.id ?? null, asOf: found.find(f => f.s)?.s?.as_of ?? null })
    })
    return () => { live = false }
  }, [sig])
  return state
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
const listDate = (asOf: string | null, locale: Locale = 'en') => {
  const m = asOf?.match(/^(\d{4})-(\d{2})/)
  if (locale === 'zh-Hans') return m ? `${m[1]}年${Number(m[2])}月` : '最新版'
  return m ? `${MONTHS[Number(m[2]) - 1]} ${m[1]}` : 'latest'
}

function status(e: ScopusEntry | null, locale: Locale = 'en'): { text: string; tone: string } {
  const zh = locale === 'zh-Hans'
  if (!e) return { text: zh ? 'Scopus 来源列表中未找到（该列表并未涵盖 Scopus 的全部刊物）' : 'Not found in the Scopus source list, which does not include every Scopus title', tone: 'var(--muted)' }
  const [, code, detail] = e
  if (code === 'a') return { text: zh ? `Scopus 在收${detail ? `，收录始于 ${detail}` : ''}` : `Active in Scopus${detail ? `, covered since ${detail}` : ''}`, tone: 'var(--verified)' }
  if (code === 'i') return { text: zh ? `Scopus 已停止更新${detail ? `，收录截至 ${detail}` : ''}` : `Inactive in Scopus${detail ? `, coverage ended ${detail}` : ''}`, tone: 'var(--ink-2)' }
  if (code === 'x') return { text: zh ? `已被 Scopus 剔除${detail ? `（${detail}）` : ''}` : `Discontinued by Scopus${detail ? ` in ${detail}` : ''}`, tone: 'var(--check)' }
  return { text: zh ? `已被 Scopus 接收，正在收录${detail ? `（接收于 ${detail}）` : ''}` : `Accepted by Scopus, being added${detail ? ` (accepted ${detail})` : ''}`, tone: 'var(--teal)' }
}

const WORDS = {
  en: {
    title: 'Check other indexes', listName: 'Scopus source list', searchIssn: 'In Scopus, search ISSN', copyIssn: 'Copy ISSN', copied: 'Copied', copy: 'Copy',
    inPubmed: (id: React.ReactNode) => <>In PubMed’s journal list, NLM ID {id}. Its NLM Catalog page states MEDLINE indexing.</>,
    notPubmed: 'Not found in PubMed’s journal list',
    note: 'Opens Clarivate’s Master Journal List, Scopus and the NLM Catalog. POSI is independent of all three; the Scopus and PubMed statuses are as stated in Elsevier’s and NLM’s published journal lists.',
    sep: ', ',
  },
  'zh-Hans': {
    title: '核查其他索引', listName: 'Scopus 来源列表', searchIssn: '在 Scopus 中检索 ISSN', copyIssn: '复制 ISSN', copied: '已复制', copy: '复制',
    inPubmed: (id: React.ReactNode) => <>已列入 PubMed 期刊列表，NLM ID {id}。其 NLM Catalog 页面注明 MEDLINE 收录状态。</>,
    notPubmed: 'PubMed 期刊列表中未找到',
    note: '将打开 Clarivate 的 Master Journal List、Scopus 与 NLM Catalog。POSI 独立于这三者；Scopus 与 PubMed 的状态以 Elsevier 和 NLM 公布的期刊列表为准。',
    sep: '，',
  },
} satisfies Record<Locale, unknown>

export function IndexChecks({ issns }: { issns: string[] }) {
  const locale = useLocale()
  const w = WORDS[locale]
  const issn = issns[0]
  const scopus = useScopus(issns)
  const pubmed = usePubmed(issns)
  const id = scopus?.entry?.[0] ?? null
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(issn)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch { /* clipboard blocked: the ISSN stays visible to select by hand */ }
  }
  const st = scopus ? status(scopus.entry, locale) : null
  return (
    <div className="space-y-2 pt-3 mt-1" style={{ borderTop: '1px solid var(--line-soft)' }}>
      <p className="text-[11.5px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>{w.title}</p>
      <a href={mjlHref(issn)} target="_blank" rel="noopener noreferrer" className="btn w-full justify-start">
        <span aria-hidden className="index-mark" style={{ background: 'var(--wos-brand)' }} /> Web of Science
        <ArrowSquareOut aria-hidden className="ml-auto h-3.5 w-3.5" style={{ color: 'var(--muted)' }} />
      </a>
      <a href={id ? scopusSourceHref(id) : SCOPUS_SOURCES} target="_blank" rel="noopener noreferrer" className="btn w-full justify-start">
        <span aria-hidden className="index-mark" style={{ background: 'var(--scopus-brand)' }} /> Scopus
        <ArrowSquareOut aria-hidden className="ml-auto h-3.5 w-3.5" style={{ color: 'var(--muted)' }} />
      </a>
      {st && (
        <p className="flex items-start gap-1.5 text-[12px] leading-snug" style={{ color: 'var(--ink-2)' }}>
          <span aria-hidden className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: st.tone }} />
          <span>
            <span style={{ color: st.tone === 'var(--check)' ? 'var(--check)' : undefined, fontWeight: scopus?.entry?.[1] === 'x' ? 600 : undefined }}>{st.text}</span>
            <span style={{ color: 'var(--soft)' }}> · {w.listName}{w.sep}{listDate(scopus?.asOf ?? null, locale)}</span>
          </span>
        </p>
      )}
      {!id && (
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px]" style={{ color: 'var(--muted)' }}>
          {w.searchIssn}
          <span className="font-mono whitespace-nowrap select-all" style={{ color: 'var(--ink)' }}>{issn}</span>
          <button type="button" onClick={copy} className="inline-flex items-center gap-1 whitespace-nowrap rounded-[3px] px-1.5 py-0.5 hover:bg-[var(--hover)]"
            style={{ border: '1px solid var(--line)', color: copied ? 'var(--verified)' : 'var(--ink-2)' }} aria-label={`${w.copyIssn} ${issn}`}>
            {copied ? <><Check className="h-3 w-3" /> {w.copied}</> : <><Copy className="h-3 w-3" /> {w.copy}</>}
          </button>
        </p>
      )}
      <a href={pubmed?.nlmId ? nlmRecordHref(pubmed.nlmId) : nlmCatalogHref(issn)} target="_blank" rel="noopener noreferrer" className="btn w-full justify-start">
        <span aria-hidden className="index-mark" style={{ background: 'var(--pubmed-brand)' }} /> PubMed
        <ArrowSquareOut aria-hidden className="ml-auto h-3.5 w-3.5" style={{ color: 'var(--muted)' }} />
      </a>
      {pubmed && (
        <p className="flex items-start gap-1.5 text-[12px] leading-snug" style={{ color: 'var(--ink-2)' }}>
          <span aria-hidden className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: pubmed.nlmId ? 'var(--verified)' : 'var(--muted)' }} />
          <span>
            {pubmed.nlmId
              ? w.inPubmed(<span className="font-mono">{pubmed.nlmId}</span>)
              : w.notPubmed}
            <span style={{ color: 'var(--soft)' }}> · NLM{w.sep}{listDate(pubmed.asOf, locale)}</span>
          </span>
        </p>
      )}
      <p className="text-[11.5px] leading-snug" style={{ color: 'var(--soft)' }}>
        {w.note}
      </p>
    </div>
  )
}
