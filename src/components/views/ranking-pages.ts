// The parameters and metadata of the Citation Ranking's category and edition pages, shared by the English routes and
// their translations so both build the same pages.
import type { Metadata } from 'next'
import { getCategories } from '@/lib/rankings'
import { editionCategories, getEdition, getEditionList } from '@/lib/ranking-editions'
import type { Locale } from '@/i18n/config'
import { pageAlternates } from '@/i18n/alternates'
import { subjectName } from '@/i18n/format'

const zh = (l: Locale) => l === 'zh-Hans'

// Every PSC category and "all", ranked or not, so no category URL ever 404s.
export function categoryParams() {
  return [{ code: 'all' }, ...getCategories().map(c => ({ code: c.code }))]
}

export function categoryMetadata(code: string, locale: Locale): Metadata {
  const path = `/rankings/${code}/`
  if (code === 'all') return zh(locale)
    ? { title: '引文排名：全部类别', description: '所有期刊在各自 PSC 类别内按 PNCI 排名，合并列出；名次均为类别内名次。', alternates: pageAlternates(path, locale) }
    : { title: 'Citation Rankings, all categories', description: 'Every journal ranked by PNCI within its PSC category, listed together; ranks are category ranks.', alternates: pageAlternates(path, locale) }
  const c = getCategories().find(x => x.code === code)
  if (!c) return {}
  if (zh(locale)) {
    const name = subjectName(locale, c.code, c.name)
    return { title: `${name}期刊引文排名`, description: `${name}（${c.code}）类别期刊按 PNCI 排名，附引文百分位、引文分区（C-Q1 至 C-Q4）与 POSI Zone。`, alternates: pageAlternates(path, locale) }
  }
  return { title: `${c.name} journal citation ranking`, description: `Journals in ${c.name} (${c.code}) ranked by PNCI, with citation percentile, Citation Quartile (C-Q1 to C-Q4) and POSI Zone.`, alternates: pageAlternates(path, locale) }
}

// Every edition has a permanent address, the current one included.
export function editionParams() {
  return getEditionList().map(e => ({ year: String(e.year) }))
}

export function editionMetadata(year: string, locale: Locale): Metadata {
  const alternates = pageAlternates(`/rankings/edition/${year}/`, locale)
  return zh(locale)
    ? { title: `${year} 年期刊引文排名`, description: `POSI 引文排名 ${year} 年版本：期刊在其 PSC 学科类别内按 PNCI 排名，按发布时原样保存。`, alternates }
    : { title: `Journal Citation Rankings ${year}`, description: `The ${year} edition of the POSI Citation Ranking: journals ranked by PNCI within their PSC subject category, as published.`, alternates }
}

export function editionCategoryParams() {
  return getEditionList().flatMap(info => {
    const e = getEdition(info.year)
    return e ? [{ year: String(info.year), code: 'all' }, ...editionCategories(e).map(c => ({ year: String(info.year), code: c.code }))] : []
  })
}

export function editionCategoryMetadata(year: string, code: string, locale: Locale): Metadata {
  const e = getEdition(Number(year))
  const c = e ? editionCategories(e).find(x => x.code === code) : null
  const alternates = pageAlternates(`/rankings/edition/${year}/${code}/`, locale)
  if (zh(locale)) {
    const name = code === 'all' ? '全部类别' : c ? subjectName(locale, c.code, c.name) : code
    return { title: `${year} 年引文排名：${name}`, description: `POSI ${year} 年${name}引文排名，按发布时原样保存。`, alternates }
  }
  const name = code === 'all' ? 'all categories' : c?.name ?? code
  return { title: `Citation Ranking ${year}, ${name}`, description: `The ${year} POSI Citation Ranking for ${name}, as published.`, alternates }
}
