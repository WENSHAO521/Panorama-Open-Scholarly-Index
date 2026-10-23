// The PSC subject categories (/subjects/), in every language it is published in.
import Link from 'next/link'
import type { Metadata } from 'next'
import psc from '@/lib/psc-v1.0.snapshot.json'
import { getDirectoryCategories } from '@/lib/global-journals'
import { getCategories } from '@/lib/rankings'
import { PageHeader, fmt } from '@/components/db'
import type { Locale } from '@/i18n/config'
import { localizedHref, pageAlternates } from '@/i18n/alternates'
import { fill, subjectName } from '@/i18n/format'

const CATS = psc.categories as { code: string; name: string; level: number; parent: string | null }[]

const en = {
  title: 'Subject categories',
  description: 'The POSI Subject Classification (PSC): six domains and 42 categories, with the number of indexed and ranked journals in each.',
  journals: 'Journals',
  lead: 'The POSI Subject Classification (PSC) {version} groups journals into {domains} domains and {cats} categories, following the OECD Fields of Research and Development. Journals are ranked within these categories. How journals are assigned is described in the ',
  methodology: 'methodology',
  leadEnd: '.',
  cols: { code: 'Code', category: 'Category', indexed: 'Indexed journals', ranked: 'Ranked', core: 'Core' },
  rankings: 'Rankings',
  other: 'Other groups',
  multi: 'Multidisciplinary',
  multiNote: 'General journals whose output spans several domains. Ranked across all journals, not by category.',
  unclassified: 'Not yet classified',
  unclassifiedNote: 'Journals without subject data, usually registered with Crossref only.',
}
const WORDS: Record<Locale, typeof en> = {
  en,
  'zh-Hans': {
    title: '学科类别',
    description: 'POSI 学科分类体系（PSC）：6 个学科大类、42 个学科类别，并列出各类别的收录期刊数与参与排名期刊数。',
    journals: '期刊',
    lead: 'POSI 学科分类体系（PSC）{version} 参照经济合作与发展组织（OECD）的研究与发展领域分类（FORD），将期刊划分为 {domains} 个学科大类和 {cats} 个学科类别。期刊在各自类别内参与排名。期刊的归类方法详见',
    methodology: '评价方法',
    leadEnd: '。',
    cols: { code: '代码', category: '学科类别', indexed: '收录期刊', ranked: '参与排名', core: '核心合集' },
    rankings: '排名',
    other: '其他分组',
    multi: '多学科',
    multiNote: '刊载内容横跨多个学科大类的综合性期刊。此类期刊在全部期刊范围内排名，不按类别排名。',
    unclassified: '尚未分类',
    unclassifiedNote: '暂无学科信息的期刊，通常仅在 Crossref 注册。',
  },
}

export function subjectsMetadata(locale: Locale): Metadata {
  const w = WORDS[locale]
  return { title: w.title, description: w.description, alternates: pageAlternates('/subjects/', locale) }
}

export function SubjectsView({ locale }: { locale: Locale }) {
  const w = WORDS[locale]
  const href = (p: string) => localizedHref(locale, p)
  const dir = new Map(getDirectoryCategories().map(c => [c.code, c]))
  const ranked = new Map(getCategories().map(c => [c.code, c.ranked]))
  const domains = CATS.filter(c => c.level === 1)
  const multi = dir.get('multidisciplinary')
  const unclassified = dir.get('unclassified')

  return (
    <div className="wrap pb-12">
      <PageHeader locale={locale} title={w.title} crumbs={[{ label: 'POSI', href: href('/') }, { label: w.journals, href: href('/journals/') }, { label: w.title }]}>
        <p className="max-w-[68ch]">
          {fill(w.lead, { version: psc.version, domains: domains.length, cats: CATS.filter(c => c.level === 2).length })}
          <Link href={href('/methodology/#subjects')} className="link">{w.methodology}</Link>{w.leadEnd}
        </p>
      </PageHeader>

      <div className="space-y-8">
        {domains.map(d => (
          <section key={d.code} aria-labelledby={`d-${d.code}`}>
            <h2 id={`d-${d.code}`} className="text-[17px] font-semibold tracking-tight mb-3">
              <span className="font-mono text-[13px] mr-2" style={{ color: 'var(--muted)' }}>{d.code}</span>{subjectName(locale, d.code, d.name)}
            </h2>
            <div className="panel overflow-x-auto">
              <table className="dtable">
                <thead>
                  <tr><th className="w-[72px]">{w.cols.code}</th><th>{w.cols.category}</th><th className="text-right">{w.cols.indexed}</th><th className="text-right">{w.cols.ranked}</th><th className="text-right">{w.cols.core}</th><th /></tr>
                </thead>
                <tbody>
                  {CATS.filter(c => c.parent === d.code).map(c => {
                    const n = dir.get(c.code)
                    const r = ranked.get(c.code) ?? 0
                    const name = subjectName(locale, c.code, c.name)
                    return (
                      <tr key={c.code}>
                        <td className="font-mono text-[12.5px]" style={{ color: 'var(--muted)' }}>{c.code}</td>
                        <td>
                          {n?.count
                            ? <Link href={href(`/journals/subject/${c.code}/`)} className="hover:underline" style={{ color: 'var(--teal)' }}>{name}</Link>
                            : name}
                        </td>
                        <td className="text-right font-mono tnum text-[13px]">{fmt(n?.count ?? 0)}</td>
                        <td className="text-right font-mono tnum text-[13px]">{fmt(r)}</td>
                        <td className="text-right font-mono tnum text-[13px]">{fmt(n?.core ?? 0)}</td>
                        <td className="text-right whitespace-nowrap">
                          {r > 0 && <Link href={href(`/rankings/${c.code}/`)} className="link text-[13px]">{w.rankings}</Link>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ))}

        <section aria-labelledby="other">
          <h2 id="other" className="text-[17px] font-semibold tracking-tight mb-3">{w.other}</h2>
          <ul className="panel divide-y divide-[var(--line-soft)] text-[14px]">
            {multi && (
              <li className="p-4" style={{ borderColor: 'var(--line-soft)' }}>
                <Link href={href('/journals/subject/multidisciplinary/')} className="font-medium hover:underline" style={{ color: 'var(--teal)' }}>{w.multi}</Link>
                <span className="ml-2 font-mono tnum text-[13px]" style={{ color: 'var(--muted)' }}>{fmt(multi.count)}</span>
                <p className="mt-1 text-[13.5px]" style={{ color: 'var(--ink-2)' }}>{w.multiNote}</p>
              </li>
            )}
            {unclassified && (
              <li className="p-4" style={{ borderColor: 'var(--line-soft)' }}>
                <Link href={href('/journals/subject/unclassified/')} className="font-medium hover:underline" style={{ color: 'var(--teal)' }}>{w.unclassified}</Link>
                <span className="ml-2 font-mono tnum text-[13px]" style={{ color: 'var(--muted)' }}>{fmt(unclassified.count)}</span>
                <p className="mt-1 text-[13.5px]" style={{ color: 'var(--ink-2)' }}>{w.unclassifiedNote}</p>
              </li>
            )}
          </ul>
        </section>
      </div>
    </div>
  )
}
