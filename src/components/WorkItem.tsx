'use client'

import Link from 'next/link'
import { LockOpen, Quotes, Warning } from '@phosphor-icons/react/dist/ssr'
import { type Work, abstractOf, doiOf, pages, shortId, TYPE_LABEL } from '@/lib/openalex'
import { PUBLICATION_TYPE_ZH } from '@/i18n/publication-types'
import { recordHref, type IndexRecord } from '@/lib/records'
import { CollectionTag } from './db'
import type { Locale } from '@/i18n/config'
import { useLocale } from '@/i18n/LocaleProvider'
import { localizedHref } from '@/i18n/alternates'
import { fill } from '@/i18n/format'

const en = {
  more: ', +{n} more', sep: ', ', fresh: 'New in Crossref', freshTitle: 'Registered with Crossref; OpenAlex has not indexed it yet',
  openAccess: 'Open access', retracted: 'Retracted', untitled: 'Untitled', noSource: 'No source recorded',
  vol: 'Vol. {v}', no: 'No. {n}', pp: 'pp. {p}', fullText: 'Full text', cite: 'Cite',
  citationsTitle: 'Citations recorded in OpenAlex', citations: ' citations', journal: 'Journal',
  registry: 'From {source}', registryTitle: 'Record from {source}; OpenAlex did not return it for this search',
  registryCitations: 'Citations recorded in {source}',
  types: null as Record<string, string> | null,
}
const WORDS: Record<Locale, typeof en> = {
  en,
  'zh-Hans': {
    more: '等 {n} 人', sep: '，', fresh: 'Crossref 新登记', freshTitle: '已在 Crossref 登记，OpenAlex 尚未收录',
    openAccess: '开放获取', retracted: '已撤稿', untitled: '无题名', noSource: '未记录来源',
    vol: '第 {v} 卷', no: '第 {n} 期', pp: '第 {p} 页', fullText: '全文', cite: '引用',
    citationsTitle: 'OpenAlex 记录的被引次数', citations: ' 次被引', journal: '期刊',
    registry: '来自 {source}', registryTitle: '记录来自 {source}，OpenAlex 未在本次检索中返回',
    registryCitations: '{source} 记录的被引次数',
    types: PUBLICATION_TYPE_ZH,
  },
}

function Authors({ w, max = 6, t }: { w: Work; max?: number; t: typeof en }) {
  const names = w.authorships.map(a => a.author.display_name)
  if (!names.length) return null
  const shown = names.slice(0, max).join(', ')
  return <>{shown}{names.length > max && <span style={{ color: 'var(--soft)' }}>{fill(t.more, { n: names.length - max })}</span>}</>
}

export function WorkItem({ w, expand, posi }: { w: Work; expand: boolean; posi: IndexRecord | null }) {
  const locale = useLocale()
  const t = WORDS[locale]
  const href = (p: string) => localizedHref(locale, p)
  const src = w.primary_location?.source
  const doi = doiOf(w)
  const pg = pages(w)
  const abs = expand ? abstractOf(w) : null
  const vol = [w.biblio?.volume && fill(t.vol, { v: w.biblio.volume }), w.biblio?.issue && fill(t.no, { n: w.biblio.issue }), pg && fill(t.pp, { p: pg })].filter(Boolean).join(t.sep)

  return (
    <article className="panel p-5 mt-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px]" style={{ color: 'var(--muted)' }}>
        {w.publication_date && <time dateTime={w.publication_date} className="font-mono">{w.publication_date}</time>}
        {w.type && <span>{t.types?.[w.type] ?? TYPE_LABEL[w.type] ?? w.type}</span>}
        {w.fresh && <span title={t.freshTitle}>{t.fresh}</span>}
        {w.registry && <span title={fill(t.registryTitle, { source: w.registry })}>{fill(t.registry, { source: w.registry })}</span>}
        {w.open_access?.is_oa && (
          <span className="inline-flex items-center gap-1" style={{ color: 'var(--verified)' }}>
            <LockOpen className="h-3.5 w-3.5" /> {t.openAccess}
          </span>
        )}
        {w.is_retracted && (
          <span className="inline-flex items-center gap-1" style={{ color: 'var(--rejected)' }}>
            <Warning className="h-3.5 w-3.5" /> {t.retracted}
          </span>
        )}
      </div>

      <h3 className="mt-1.5 text-[16.5px] font-medium leading-snug">
        <Link href={href(`/work/?id=${shortId(w)}`)} className="hover:underline" style={{ color: 'var(--teal)' }}>
          {w.title || t.untitled}
        </Link>
      </h3>

      <p className="mt-1 text-[13.5px] leading-relaxed" style={{ color: 'var(--ink-2)' }}><Authors w={w} t={t} /></p>

      <p className="mt-1 text-[13px] leading-relaxed" style={{ color: 'var(--muted)' }}>
        {src ? <>
          {posi || src.id
            ? <Link href={href(posi ? recordHref(posi) : `/journal/?id=${src.id.replace('https://openalex.org/', '')}`)} className="font-medium hover:underline" style={{ color: 'var(--ink-2)' }}>{src.display_name}</Link>
            : <span className="font-medium" style={{ color: 'var(--ink-2)' }}>{src.display_name}</span>}
          {src.host_organization_name && <>{t.sep}{src.host_organization_name}</>}
        </> : t.noSource}
        {vol && <>{locale === 'en' ? '. ' : '。'}{vol}</>}
      </p>

      {abs && <p className="mt-3 text-[13.5px] leading-relaxed max-w-[90ch] line-clamp-3" style={{ color: 'var(--ink-2)' }}>{abs}</p>}

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[12.5px]">
        {doi && (
          <a href={`https://doi.org/${doi}`} target="_blank" rel="noopener noreferrer" className="btn btn-sm font-mono">
            {doi}
          </a>
        )}
        {w.open_access?.oa_url && (
          <a href={w.open_access.oa_url} target="_blank" rel="noopener noreferrer" className="btn btn-sm">{t.fullText}</a>
        )}
        {doi && <Link href={href(`/cite/?doi=${encodeURIComponent(doi)}`)} prefetch={false} className="btn btn-sm">{t.cite}</Link>}
        <span className="inline-flex items-center gap-1 ml-1" style={{ color: 'var(--muted)' }} title={w.registry ? fill(t.registryCitations, { source: w.registry }) : t.citationsTitle}>
          <Quotes className="h-3.5 w-3.5" /> <span className="font-mono tnum">{w.cited_by_count.toLocaleString('en-US')}</span>{t.citations}
        </span>
        {posi?.k === 'core' && <span className="ml-auto inline-flex items-center gap-1.5" style={{ color: 'var(--muted)' }}>{t.journal} <CollectionTag k="core" locale={locale} /></span>}
      </div>
    </article>
  )
}
