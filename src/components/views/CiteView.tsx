'use client'

// The citation generator (/cite/), in every language it is published in.

import { useState, useEffect, useRef, FormEvent, ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import {
  MagnifyingGlass, XCircle, Copy, Check,
  BookOpen, Globe, PencilSimple, Plus, Trash, Newspaper, UploadSimple,
} from '@phosphor-icons/react/dist/ssr'
import { CitationFormatter } from '@/components/CitationFormatter'
import { BatchRun } from '@/components/BatchConverter'
import { parseInput, MAX_BATCH } from '@/lib/cite-parse'
import type { RefEntry } from '@/lib/cite-parse'
import { psgArticle, psgBook, psgWebpage, psgInText, PLAIN } from '@/lib/psg'
import type { PsgFmt } from '@/lib/psg'
import { titleStop } from '@/lib/cite-text'
import { footnoteArticle, footnoteBook, footnoteWebpage, type FootnotePair } from '@/lib/footnote'
import { crossrefSearchMany, doiAgencies, openAlexGetArticle, registryGetWork, fetchBookByIsbn } from '@/lib/cite-sources'
import type { BookInfo } from '@/lib/cite-sources'
import { decodeHtml } from '@/lib/utils'
import type { Article } from '@/lib/types'
import Link from 'next/link'
import { PageHeader } from '@/components/db'
import type { Locale } from '@/i18n/config'
import { useLocale } from '@/i18n/LocaleProvider'
import { localizedHref } from '@/i18n/alternates'
import { fill } from '@/i18n/format'

// The page's words in every language. Citations themselves stay in the style's own language (English), so only
// the interface around them is translated.
const en = {
  title: 'Citation generator', services: 'Services',
  lead: 'Enter a DOI, ISBN or web address, or fill in the details by hand. Citations are produced in PSG, APA, MLA and Chicago styles. Paste several lines to convert many at once: DOIs, titles, or references in APA, AMA, MLA, Chicago, IEEE, Harvard or GB/T style, or open a BibTeX / RIS file.',
  psgFormat: 'PSG Format', psgSpec: 'PSG Format specification',
  inputLabel: 'DOI, ISBN, URL, or article title',
  inputPlaceholder: 'A DOI, ISBN, web address or article title.\nPaste one per line to convert many at once.',
  loading: 'Loading…', generate: 'Generate', generateCitations: 'Generate Citations',
  openFile: 'Open .bib / .ris / .txt / .json file',
  hints: [
    ['DOI', 'any Crossref DOI, e.g. 10.63802/afs.2024.008'],
    ['ISBN', '10 or 13 digits, e.g. 9780374528379'],
    ['URL', 'any web address, e.g. https://example.com/page'],
    ['Title', 'article title, with author or journal if you have it'],
    ['Many', 'one per line, any mix of the above, or a BibTeX / RIS / CSL JSON file (up to 1,000)'],
  ],
  copy: 'Copy', copied: 'Copied',
  fmt: { psg: 'PSG Format', apa: 'APA 7th', mla: 'MLA 9th', chicago: 'Chicago 17th', footnote: 'Footnote (Chicago notes)' } as Record<string, string>,
  inText: 'In-text', shortNote: 'Short note',
  authors: 'Authors', add: 'Add', given: 'Given name(s)', family: 'Family name',
  articleTitle: 'Article Title', articleTitlePh: 'Title of the article', journal: 'Journal Name', journalPh: 'Name of the journal',
  year: 'Year', volume: 'Volume', issue: 'Issue', pages: 'Pages', doiOptional: 'DOI (optional)',
  bookTitle: 'Book Title', bookTitlePh: 'Title of the book', subtitle: 'Subtitle', subtitlePh: 'Subtitle (if any)',
  edition: 'Edition', editionPh: 'e.g. 2nd', publisher: 'Publisher', publisherPh: 'Publisher name',
  place: 'Place of Publication', placePh: 'City, Country', isbnOptional: 'ISBN (optional)',
  authorOrg: 'Author / Organization', authorOrgPh: '"Smith, John" or "WHO"', orgNotPerson: 'Organization (not a person)',
  pageTitle: 'Page Title', pageTitlePh: 'Title of the webpage', siteName: 'Website / Publisher Name', siteNamePh: 'e.g. WHO',
  monthDay: 'Month & Day (optional)', monthDayPh: 'June 25', accessDate: 'Access Date', accessDatePh: 'June 25, 2026',
  errNothing: 'Nothing to convert - no entries found.',
  errTooMany: 'At most {max} entries at a time (found {n}).',
  errInput: 'Enter a DOI (10.xxx/…), ISBN (9780…), a URL, or an article title.',
  errDoi: 'No article metadata found for this DOI in Crossref, Zenodo, DataCite or OpenAlex.',
  errTitle: 'No articles found for this title. Try more words from the title, or enter the details manually below',
  errIsbn: 'No book found for this ISBN. Enter details manually below',
  errLookup: 'Lookup failed. Check the format and try again.',
  tabArticle: 'Journal Article', tabBook: 'Book', tabWebsite: 'Website',
  notFound: 'Not Found', selectArticle: 'Select the article to cite', selectForBatch: 'Select for batch conversion',
  convertSelected: 'Convert {n} selected', convertNone: 'Convert selected', tickHint: 'Tick several to convert them together, or click one title for all citation styles.',
  articleFound: 'Article Found', via: 'via {source}', more: ' +{n} more', vol: 'Vol. {v}', no: 'No. {v}',
  bookFound: 'Book Found', webpageCitation: 'Webpage Citation', noDoi: 'No DOI found. Fill in details to generate citations in all formats.',
  url: 'URL', authorOrOrg: 'Author or Organization', organization: 'Organization', pageTitlePh2: 'Title of the page',
  websiteName: 'Website Name', websiteNamePh: 'Site name', webpage: 'Webpage', editDetails: 'Edit details',
  hideManual: 'Hide manual entry', showManual: 'Or enter details manually', untitled: 'Untitled',
}
const WORDS: Record<Locale, typeof en> = {
  en,
  'zh-Hans': {
    title: '引文生成器', services: '服务',
    lead: '输入 DOI、ISBN 或网址，也可手动填写文献信息，即可生成 PSG、APA、MLA 与 Chicago 格式的引文。如需批量转换，可粘贴多行内容：DOI、标题，或 APA、AMA、MLA、Chicago、IEEE、Harvard、GB/T 格式的参考文献，也可直接打开 BibTeX / RIS 文件。',
    psgFormat: 'PSG 引文格式', psgSpec: 'PSG 引文格式规范',
    inputLabel: 'DOI、ISBN、网址或论文标题',
    inputPlaceholder: '输入 DOI、ISBN、网址或论文标题。\n每行一条，可一次批量转换多条。',
    loading: '加载中…', generate: '生成', generateCitations: '生成引文',
    openFile: '打开 .bib / .ris / .txt / .json 文件',
    hints: [
      ['DOI', '任意 Crossref DOI，例如 10.63802/afs.2024.008'],
      ['ISBN', '10 位或 13 位，例如 9780374528379'],
      ['网址', '任意网页地址，例如 https://example.com/page'],
      ['标题', '论文标题，如有作者或期刊名可一并输入'],
      ['批量', '每行一条，可混合上述各类，或 BibTeX / RIS / CSL JSON 文件（最多 1,000 条）'],
    ],
    copy: '复制', copied: '已复制',
    fmt: { psg: 'PSG 引文格式', apa: 'APA 第 7 版', mla: 'MLA 第 9 版', chicago: 'Chicago 第 17 版', footnote: '脚注（Chicago 注释体）' },
    inText: '文内引用', shortNote: '简注',
    authors: '作者', add: '添加', given: '名', family: '姓',
    articleTitle: '论文标题', articleTitlePh: '论文标题', journal: '期刊名称', journalPh: '期刊名称',
    year: '年份', volume: '卷', issue: '期', pages: '页码', doiOptional: 'DOI（选填）',
    bookTitle: '书名', bookTitlePh: '图书书名', subtitle: '副书名', subtitlePh: '副书名（如有）',
    edition: '版次', editionPh: '例如 2nd', publisher: '出版者', publisherPh: '出版者名称',
    place: '出版地', placePh: '城市, 国家', isbnOptional: 'ISBN（选填）',
    authorOrg: '作者／机构', authorOrgPh: '"Smith, John" 或 "WHO"', orgNotPerson: '机构（非个人）',
    pageTitle: '网页标题', pageTitlePh: '网页标题', siteName: '网站／发布者名称', siteNamePh: '例如 WHO',
    monthDay: '月、日（选填）', monthDayPh: 'June 25', accessDate: '访问日期', accessDatePh: 'June 25, 2026',
    errNothing: '没有可转换的内容：未识别到任何条目。',
    errTooMany: '每次最多转换 {max} 条（当前 {n} 条）。',
    errInput: '请输入 DOI（10.xxx/…）、ISBN（9780…）、网址或论文标题。',
    errDoi: '在 Crossref、Zenodo、DataCite 与 OpenAlex 中均未找到该 DOI 的文献元数据。',
    errTitle: '未找到与该标题匹配的文献。请输入更完整的标题，或在下方手动填写信息。',
    errIsbn: '未找到该 ISBN 对应的图书，请在下方手动填写信息。',
    errLookup: '查询失败，请检查输入格式后重试。',
    tabArticle: '期刊论文', tabBook: '图书', tabWebsite: '网页',
    notFound: '未找到', selectArticle: '请选择要引用的文献', selectForBatch: '选中以批量转换',
    convertSelected: '转换所选 {n} 条', convertNone: '转换所选条目', tickHint: '勾选多条可一并转换；点击某一标题可查看该文献的全部引文格式。',
    articleFound: '已找到文献', via: '来源：{source}', more: ' 等 {n} 人', vol: '第 {v} 卷', no: '第 {v} 期',
    bookFound: '已找到图书', webpageCitation: '网页引文', noDoi: '未找到 DOI。请填写以下信息，以生成各种格式的引文。',
    url: '网址', authorOrOrg: '作者或机构', organization: '机构', pageTitlePh2: '网页标题',
    websiteName: '网站名称', websiteNamePh: '网站名称', webpage: '网页', editDetails: '修改信息',
    hideManual: '收起手动填写', showManual: '或手动填写文献信息', untitled: '未命名',
  },
}

function useWords() { return WORDS[useLocale()] }

// ── Types ──────────────────────────────────────────────────────────────────────

interface ManualAuthor { first: string; last: string }
type ManualSourceType = 'article' | 'book' | 'website'

interface ManualArticleForm {
  authors: ManualAuthor[]
  year: string; title: string; journal: string
  volume: string; issue: string; pages: string; doi: string
}

interface ManualBookForm {
  authors: ManualAuthor[]
  year: string; title: string; subtitle: string
  edition: string; publisher: string; place: string; isbn: string
}

interface ManualWebsiteForm {
  authorName: string; isOrg: boolean
  year: string; monthDay: string
  title: string; siteName: string
  accessDate: string; url: string
}

interface CitPair { html: string; plain: string; intext: string }
interface AllCitations { psg: CitPair; apa: CitPair; mla: CitPair; chicago: CitPair; footnote: CitPair }

type InputKind = 'doi' | 'isbn' | 'url-doi' | 'url-manual' | 'search'
type Source = 'crossref' | 'openalex' | 'zenodo' | 'datacite'

type AutoResult =
  | { type: 'article'; article: Article; source: Source }
  | { type: 'book'; citations: AllCitations; book: BookInfo }
  | { type: 'search'; query: string; results: Article[] }
  | { type: 'webpage-form'; url: string }
  | { type: 'webpage-result'; citations: AllCitations; title: string }

// ── Author formatting helpers ─────────────────────────────────────────────────

const EMPTY_AUTHOR: ManualAuthor = { first: '', last: '' }

function initials(first: string): string {
  return first.split(/\s+/).filter(Boolean).map(n => n[0].toUpperCase() + '.').join(' ')
}

/** Adds a closing full stop unless the text already ends with one (initials). */
function endStop(t: string): string {
  return t.endsWith('.') ? t : `${t}.`
}

function apaFmt({ first, last }: ManualAuthor): string {
  if (!last && !first) return ''
  if (!last) return initials(first)
  if (!first) return last
  return `${last}, ${initials(first)}`
}

function apaAuthors(authors: ManualAuthor[]): string {
  const v = authors.filter(a => a.last || a.first)
  if (!v.length) return ''
  if (v.length === 1) return apaFmt(v[0])
  if (v.length === 2) return `${apaFmt(v[0])}, & ${apaFmt(v[1])}`
  if (v.length <= 20) return v.slice(0, -1).map(apaFmt).join(', ') + ', & ' + apaFmt(v[v.length - 1])
  return v.slice(0, 19).map(apaFmt).join(', ') + ', . . . ' + apaFmt(v[v.length - 1])
}

function mlaFmt({ first, last }: ManualAuthor, isFirst: boolean): string {
  if (!last && !first) return ''
  if (!last) return first
  if (!first) return last
  return isFirst ? `${last}, ${first}` : `${first} ${last}`
}

function mlaAuthors(authors: ManualAuthor[]): string {
  const v = authors.filter(a => a.last || a.first)
  if (!v.length) return ''
  if (v.length === 1) return mlaFmt(v[0], true)
  if (v.length === 2) return `${mlaFmt(v[0], true)}, and ${mlaFmt(v[1], false)}`
  return `${mlaFmt(v[0], true)}, et al.`
}

function chicagoAuthors(authors: ManualAuthor[]): string {
  const v = authors.filter(a => a.last || a.first)
  if (!v.length) return ''
  if (v.length === 1) return mlaFmt(v[0], true)
  if (v.length === 2) return `${mlaFmt(v[0], true)}, and ${mlaFmt(v[1], false)}`
  if (v.length === 3) return `${mlaFmt(v[0], true)}, ${mlaFmt(v[1], false)}, and ${mlaFmt(v[2], false)}`
  return `${mlaFmt(v[0], true)}, et al.`
}

function apaIntext(authors: ManualAuthor[], year: string): string {
  const v = authors.filter(a => a.last || a.first)
  const y = year || 'n.d.'
  if (!v.length) return `(${y})`
  const nm = v.length === 1 ? v[0].last : v.length === 2
    ? `${v[0].last} & ${v[1].last}` : `${v[0].last} et al.`
  return `(${nm}, ${y})`
}

function chicagoIntext(authors: ManualAuthor[], year: string): string {
  const v = authors.filter(a => a.last || a.first)
  const y = year || 'n.d.'
  if (!v.length) return `(${y})`
  const nm = v.length === 1 ? v[0].last : v.length === 2
    ? `${v[0].last} and ${v[1].last}` : `${v[0].last} et al.`
  return `(${nm} ${y})`
}

function mlaIntext(authors: ManualAuthor[], pages: string): string {
  const v = authors.filter(a => a.last || a.first)
  const pg = pages ? fmtPages(pages).split('-')[0] : ''
  if (!v.length) return pg ? `(${pg})` : ''
  const nm = v.length === 1 ? v[0].last : v.length === 2
    ? `${v[0].last} and ${v[1].last}` : `${v[0].last} et al.`
  return pg ? `(${nm} ${pg})` : `(${nm})`
}

function fmtPages(p: string): string {
  return p.trim().replace(/\s*[---]+\s*/, '-')
}

function cp(html: string, intext: string): CitPair {
  return { html, plain: html.replace(/<\/?em>/g, ''), intext }
}

function parseAuthorStr(s: string): ManualAuthor {
  const t = s.trim()
  if (t.includes(',')) {
    const i = t.indexOf(',')
    return { last: t.slice(0, i).trim(), first: t.slice(i + 1).trim() }
  }
  const parts = t.split(/\s+/)
  if (parts.length === 1) return { last: t, first: '' }
  return { first: parts.slice(0, -1).join(' '), last: parts[parts.length - 1] }
}

// ── PSG builders (layout rules live in @/lib/psg) ─────────────────────────────

const escHtml = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const HTML_FMT: PsgFmt = { em: t => `<em>${t}</em>`, esc: escHtml }

const psgPeople = (authors: ManualAuthor[]) =>
  authors.filter(a => a.first || a.last).map(a => ({ given: a.first.trim() || null, family: a.last.trim() || null }))

/** The same PSG builder rendered twice: HTML for display, plain text for copying. */
function psgPair(build: (f: PsgFmt) => string, intext: string): CitPair {
  return { html: build(HTML_FMT), plain: build(PLAIN), intext }
}

function buildPsgArticle(f: ManualArticleForm): CitPair {
  const people = psgPeople(f.authors)
  return psgPair(fmt => psgArticle({
    authors: people, year: f.year, title: f.title, journal: f.journal,
    volume: f.volume, issue: f.issue, pages: f.pages ? fmtPages(f.pages) : '', doi: f.doi,
  }, fmt), psgInText(people, f.year))
}

function buildPsgBook(f: ManualBookForm): CitPair {
  const people = psgPeople(f.authors)
  return psgPair(fmt => psgBook({ ...f, authors: people }, fmt), psgInText(people, f.year))
}

function buildPsgWebsite(f: ManualWebsiteForm): CitPair {
  const name = f.authorName.trim()
  // A person is entered as "Smith, John" and cited by surname; an organisation is cited by its full name.
  const cited = f.isOrg ? name : parseAuthorStr(name).last
  return psgPair(
    fmt => psgWebpage({ author: name, year: f.year, title: f.title, accessDate: f.accessDate, url: f.url }, fmt),
    `(${cited || 'Author'} ${f.year || 'n.d.'})`,
  )
}

// ── APA 7th builders ──────────────────────────────────────────────────────────

function buildApaArticle(f: ManualArticleForm): CitPair {
  const auth = apaAuthors(f.authors)
  const y = f.year || 'n.d.'
  const pg = f.pages ? fmtPages(f.pages) : ''
  let h = auth ? `${endStop(auth)} ` : ''
  h += `(${y}). ${titleStop(f.title || 'Untitled')} `
  h += `<em>${f.journal || 'Journal'}</em>`
  if (f.volume) h += `, <em>${f.volume}</em>`
  if (f.issue) h += `(${f.issue})`
  if (pg) h += `, ${pg}`
  h += '.'
  if (f.doi) h += ` https://doi.org/${f.doi.replace(/^https?:\/\/doi\.org\//i, '')}`
  return cp(h, apaIntext(f.authors, f.year))
}

function buildApaBook(f: ManualBookForm): CitPair {
  const auth = apaAuthors(f.authors)
  const y = f.year || 'n.d.'
  const ft = f.subtitle ? `${f.title}: ${f.subtitle}` : f.title
  let h = auth ? `${endStop(auth)} ` : ''
  h += `(${y}). <em>${ft || 'Untitled'}</em>`
  if (f.edition) h += ` (${f.edition} ed.)`
  h += '.'
  if (f.publisher) h += ` ${f.publisher}.`
  return cp(h, apaIntext(f.authors, f.year))
}

function buildApaWebsite(f: ManualWebsiteForm): CitPair {
  let authStr = f.authorName
  if (!f.isOrg && f.authorName.includes(',')) {
    const [last, ...rest] = f.authorName.split(',')
    authStr = apaFmt({ last: last.trim(), first: rest.join(',').trim() })
  }
  const dateStr = f.monthDay ? `${f.year}, ${f.monthDay}` : f.year || 'n.d.'
  let h = authStr ? `${authStr}. ` : ''
  h += `(${dateStr}). ${titleStop(f.title || 'Untitled')}`
  if (f.siteName) h += ` <em>${f.siteName}</em>.`
  if (f.url) h += ` ${f.url}`
  const nm = f.isOrg ? f.authorName : f.authorName.split(',')[0].trim()
  return cp(h, `(${nm || 'Author'}, ${f.year || 'n.d.'})`)
}

// ── MLA 9th builders ──────────────────────────────────────────────────────────

function buildMlaArticle(f: ManualArticleForm): CitPair {
  const auth = mlaAuthors(f.authors)
  const pg = f.pages ? fmtPages(f.pages) : ''
  let h = auth ? `${endStop(auth)} ` : ''
  h += `"${titleStop(f.title || 'Untitled')}" <em>${f.journal || 'Journal'}</em>`
  if (f.volume) h += `, vol. ${f.volume}`
  if (f.issue) h += `, no. ${f.issue}`
  if (f.year) h += `, ${f.year}`
  if (pg) h += `, pp. ${pg}`
  const doi = f.doi.replace(/^https?:\/\/doi\.org\//i, '')
  if (doi) h += `, doi.org/${doi}`
  h += '.'
  return cp(h, mlaIntext(f.authors, f.pages))
}

function buildMlaBook(f: ManualBookForm): CitPair {
  const auth = mlaAuthors(f.authors)
  const ft = f.subtitle ? `${f.title}: ${f.subtitle}` : f.title
  let h = auth ? `${endStop(auth)} ` : ''
  h += `<em>${ft || 'Untitled'}</em>.`
  if (f.edition) h += ` ${f.edition} ed.,`
  if (f.publisher) h += ` ${f.publisher},`
  if (f.year) h += ` ${f.year}`
  h += '.'
  return cp(h, mlaIntext(f.authors, ''))
}

function buildMlaWebsite(f: ManualWebsiteForm): CitPair {
  const auth = f.isOrg ? f.authorName : (() => {
    if (!f.authorName.includes(',')) return f.authorName
    const [last, ...rest] = f.authorName.split(',')
    return `${last.trim()}, ${rest.join(',').trim()}`
  })()
  let h = auth ? `${endStop(auth)} ` : ''
  h += `"${titleStop(f.title || 'Untitled')}" `
  if (f.siteName) h += `<em>${f.siteName}</em>, `
  const dateStr = f.monthDay ? `${f.monthDay} ${f.year}` : f.year || 'n.d.'
  h += `${dateStr},`
  if (f.url) h += ` ${f.url}`
  h += '.'
  const nm = f.isOrg ? f.authorName : f.authorName.split(',')[0].trim()
  return cp(h, `(${nm || 'Author'})`)
}

// ── Chicago 17th (author-date) builders ───────────────────────────────────────

function buildChicagoArticle(f: ManualArticleForm): CitPair {
  const auth = chicagoAuthors(f.authors)
  const y = f.year || 'n.d.'
  const pg = f.pages ? fmtPages(f.pages) : ''
  let h = auth ? `${endStop(auth)} ` : ''
  h += `${y}. "${titleStop(f.title || 'Untitled')}" <em>${f.journal || 'Journal'}</em>`
  if (f.volume) h += ` ${f.volume}`
  if (f.issue) h += ` (${f.issue})`
  if (pg) h += `: ${pg}`
  h += '.'
  if (f.doi) h += ` https://doi.org/${f.doi.replace(/^https?:\/\/doi\.org\//i, '')}`
  return cp(h, chicagoIntext(f.authors, f.year))
}

function buildChicagoBook(f: ManualBookForm): CitPair {
  const auth = chicagoAuthors(f.authors)
  const y = f.year || 'n.d.'
  const ft = f.subtitle ? `${f.title}: ${f.subtitle}` : f.title
  let h = auth ? `${endStop(auth)} ` : ''
  h += `${y}. <em>${ft || 'Untitled'}</em>.`
  if (f.edition) h += ` ${f.edition} ed.`
  if (f.place && f.publisher) h += ` ${f.place}: ${f.publisher}.`
  else if (f.publisher) h += ` ${f.publisher}.`
  return cp(h, chicagoIntext(f.authors, f.year))
}

function buildChicagoWebsite(f: ManualWebsiteForm): CitPair {
  const auth = f.authorName
  const y = f.year || 'n.d.'
  let h = auth ? `${endStop(auth)} ` : ''
  h += `${y}. "${titleStop(f.title || 'Untitled')}"`
  if (f.siteName) h += ` ${f.siteName}.`
  if (f.accessDate) h += ` Accessed ${f.accessDate}.`
  if (f.url) h += ` ${f.url}.`
  const nm = f.isOrg ? auth : auth.split(',')[0].trim()
  return cp(h, `(${nm || 'Author'} ${y})`)
}

// ── Footnote (Chicago notes-bibliography) builders; the short note takes the in-text slot ──

/** The same footnote builder rendered twice: HTML for display, plain text for copying. */
function notePair(build: (f: PsgFmt) => FootnotePair): CitPair {
  const html = build(HTML_FMT), plain = build(PLAIN)
  return { html: html.full, plain: plain.full, intext: plain.short }
}

function buildFootnoteArticle(f: ManualArticleForm): CitPair {
  return notePair(fmt => footnoteArticle({
    authors: psgPeople(f.authors), year: f.year, title: f.title, journal: f.journal,
    volume: f.volume, issue: f.issue, pages: f.pages ? fmtPages(f.pages) : '', doi: f.doi,
  }, fmt))
}

function buildFootnoteBook(f: ManualBookForm): CitPair {
  return notePair(fmt => footnoteBook({ ...f, authors: psgPeople(f.authors) }, fmt))
}

function buildFootnoteWebsite(f: ManualWebsiteForm): CitPair {
  const published = f.monthDay && f.year ? `${f.monthDay}, ${f.year}` : f.monthDay || f.year
  return notePair(fmt => footnoteWebpage({
    author: f.authorName, isOrg: f.isOrg, title: f.title, siteName: f.siteName, published, accessDate: f.accessDate, url: f.url,
  }, fmt))
}

// ── All-format builders ───────────────────────────────────────────────────────

function buildAllArticle(f: ManualArticleForm): AllCitations {
  return { psg: buildPsgArticle(f), apa: buildApaArticle(f), mla: buildMlaArticle(f), chicago: buildChicagoArticle(f), footnote: buildFootnoteArticle(f) }
}
function buildAllBook(f: ManualBookForm): AllCitations {
  return { psg: buildPsgBook(f), apa: buildApaBook(f), mla: buildMlaBook(f), chicago: buildChicagoBook(f), footnote: buildFootnoteBook(f) }
}
function buildAllWebsite(f: ManualWebsiteForm): AllCitations {
  return { psg: buildPsgWebsite(f), apa: buildApaWebsite(f), mla: buildMlaWebsite(f), chicago: buildChicagoWebsite(f), footnote: buildFootnoteWebsite(f) }
}

function bookInfoToForm(b: BookInfo): ManualBookForm {
  return {
    authors: b.authors.map(parseAuthorStr),
    year: b.year ?? '',
    title: b.title,
    subtitle: b.subtitle ?? '',
    edition: '',
    publisher: b.publisher ?? '',
    place: b.place ?? '',
    isbn: b.isbn,
  }
}

// ── Misc helpers ──────────────────────────────────────────────────────────────

function detectInput(raw: string): { kind: InputKind; payload: string } | null {
  const s = raw.trim()
  if (!s) return null
  const doiOrgMatch = s.match(/doi\.org\/(10\.\d{4,}\/[^\s?&#]+)/)
  if (doiOrgMatch) return { kind: 'doi', payload: doiOrgMatch[1] }
  if (/^10\.\d{4,}\/\S+/.test(s)) return { kind: 'doi', payload: s }
  if (/^https?:\/\//i.test(s)) {
    const doiInUrl = s.match(/10\.\d{4,}\/[^\s?&#]+/)
    if (doiInUrl) return { kind: 'url-doi', payload: doiInUrl[0] }
    return { kind: 'url-manual', payload: s }
  }
  const digits = s.replace(/[-\s]/g, '')
  if (/^\d{9}[\dX]$/i.test(digits) || /^\d{13}$/.test(digits)) return { kind: 'isbn', payload: digits }
  if (/^10\./.test(s)) return { kind: 'doi', payload: s }
  return s.length >= 6 ? { kind: 'search', payload: s } : null
}

function domainFromUrl(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, '').split('.')[0].replace(/^\w/, c => c.toUpperCase()) }
  catch { return '' }
}

function todayFormatted(): string {
  return new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

// ── UI sub-components ─────────────────────────────────────────────────────────

function CopyBtn({ text }: { text: string }) {
  const w = useWords()
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={async () => {
        try { await navigator.clipboard.writeText(text) } catch { /* ignore */ }
        setCopied(true); setTimeout(() => setCopied(false), 2000)
      }}
      className="btn btn-sm"
      style={copied ? { color: 'var(--verified)', background: 'var(--verified-soft)' } : undefined}
    >
      {copied ? <Check className="h-3 w-3" weight="bold" /> : <Copy className="h-3 w-3" />}
      {copied ? w.copied : w.copy}
    </button>
  )
}

const FMT_COLORS: Record<string, [string, string]> = {
  psg: ['var(--teal-soft)', 'var(--teal)'],
  apa: ['var(--info-soft)', 'var(--info)'],
  mla: ['var(--verified-soft)', 'var(--verified)'],
  chicago: ['var(--check-soft)', 'var(--check)'],
}

function CitCard({ fmt, pair }: { fmt: string; pair: CitPair }) {
  const w = useWords()
  const [bg, color] = FMT_COLORS[fmt] ?? ['var(--surface-2)', 'var(--ink-2)']
  return (
    <div className="panel">
      <div className="px-4 py-2.5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--posi-border)', background: bg }}>
        <span className="text-[10px] font-mono font-bold uppercase tracking-[0.15em]" style={{ color }}>
          {w.fmt[fmt] ?? fmt}
        </span>
        <CopyBtn text={pair.plain} />
      </div>
      <div className="p-5">
        <p
          className="text-[13px] leading-relaxed text-justify"
          style={{ fontFamily: 'var(--font-body)', color: 'var(--posi-text)' }}
          dangerouslySetInnerHTML={{ __html: pair.html }}
        />
      </div>
      <div className="px-5 pb-4 pt-3" style={{ borderTop: '1px solid var(--posi-border-light)' }}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] mb-1" style={{ color: 'var(--posi-muted)', fontFamily: 'var(--font-mono)' }}>
          {fmt === 'footnote' ? w.shortNote : w.inText}
        </p>
        <p className="text-sm font-mono" style={{ color: 'var(--posi-text)' }}>{pair.intext}</p>
      </div>
    </div>
  )
}

function MultiFormatCards({ citations }: { citations: AllCitations }) {
  return (
    <div className="space-y-3">
      {(['psg', 'apa', 'mla', 'chicago', 'footnote'] as const).map(fmt => (
        <CitCard key={fmt} fmt={fmt} pair={citations[fmt]} />
      ))}
    </div>
  )
}

const inputCls = "input"

function FL({ children }: { children: React.ReactNode }) {
  return <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--posi-muted)' }}>{children}</label>
}

function FInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={inputCls} />
}

function AuthorList({ authors, onChange }: { authors: ManualAuthor[]; onChange: (a: ManualAuthor[]) => void }) {
  const w = useWords()
  const update = (i: number, f: keyof ManualAuthor, v: string) =>
    onChange(authors.map((a, idx) => idx === i ? { ...a, [f]: v } : a))
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <FL>{w.authors}</FL>
        <button type="button" onClick={() => onChange([...authors, { ...EMPTY_AUTHOR }])}
          className="flex items-center gap-1 text-[10px] px-2 py-1"
          style={{ border: '1px solid var(--posi-border)', color: 'var(--posi-muted)', fontFamily: 'var(--font-mono)' }}>
          <Plus className="h-3 w-3" /> {w.add}
        </button>
      </div>
      {authors.map((a, i) => (
        <div key={i} className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <FInput value={a.first} onChange={e => update(i, 'first', e.target.value)} placeholder={w.given} className={inputCls} />
          <div className="flex gap-2 items-center sm:flex-1">
            <FInput value={a.last} onChange={e => update(i, 'last', e.target.value)} placeholder={w.family} className={inputCls} />
            {authors.length > 1 && (
              <button type="button" onClick={() => onChange(authors.filter((_, idx) => idx !== i))}
                className="p-1.5 hover:opacity-70 shrink-0" style={{ color: 'var(--posi-muted)' }}>
                <Trash className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function GenBtn({ disabled }: { disabled?: boolean }) {
  const w = useWords()
  return (
    <button type="submit" disabled={disabled}
      className="btn btn-primary w-full justify-center">
      {w.generateCitations}
    </button>
  )
}

// ── Manual entry forms ────────────────────────────────────────────────────────

function ArticleForm({
  form, setForm, onSubmit,
}: { form: ManualArticleForm; setForm: (f: ManualArticleForm) => void; onSubmit: FormEvent<HTMLFormElement> extends never ? never : (e: FormEvent<HTMLFormElement>) => void }) {
  const w = useWords()
  const s = (k: keyof ManualArticleForm) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value })
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <AuthorList authors={form.authors} onChange={authors => setForm({ ...form, authors })} />
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <FL>{w.articleTitle} <span style={{ color: 'var(--teal)' }}>*</span></FL>
          <FInput value={form.title} onChange={s('title')} placeholder={w.articleTitlePh} required />
        </div>
        <div>
          <FL>{w.journal} <span style={{ color: 'var(--teal)' }}>*</span></FL>
          <FInput value={form.journal} onChange={s('journal')} placeholder={w.journalPh} required />
        </div>
        <div>
          <FL>{w.year}</FL>
          <FInput value={form.year} onChange={s('year')} placeholder="2024" />
        </div>
        <div>
          <FL>{w.volume}</FL>
          <FInput value={form.volume} onChange={s('volume')} placeholder="12" />
        </div>
        <div>
          <FL>{w.issue}</FL>
          <FInput value={form.issue} onChange={s('issue')} placeholder="3" />
        </div>
        <div>
          <FL>{w.pages}</FL>
          <FInput value={form.pages} onChange={s('pages')} placeholder="45-67" />
        </div>
        <div>
          <FL>{w.doiOptional}</FL>
          <FInput value={form.doi} onChange={s('doi')} placeholder="10.xxxx/xxxxx" />
        </div>
      </div>
      <GenBtn disabled={!form.title.trim() || !form.journal.trim()} />
    </form>
  )
}

function BookForm({
  form, setForm, onSubmit,
}: { form: ManualBookForm; setForm: (f: ManualBookForm) => void; onSubmit: (e: FormEvent<HTMLFormElement>) => void }) {
  const w = useWords()
  const s = (k: keyof ManualBookForm) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value })
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <AuthorList authors={form.authors} onChange={authors => setForm({ ...form, authors })} />
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <FL>{w.bookTitle} <span style={{ color: 'var(--teal)' }}>*</span></FL>
          <FInput value={form.title} onChange={s('title')} placeholder={w.bookTitlePh} required />
        </div>
        <div>
          <FL>{w.subtitle}</FL>
          <FInput value={form.subtitle} onChange={s('subtitle')} placeholder={w.subtitlePh} />
        </div>
        <div>
          <FL>{w.year}</FL>
          <FInput value={form.year} onChange={s('year')} placeholder="2024" />
        </div>
        <div>
          <FL>{w.edition}</FL>
          <FInput value={form.edition} onChange={s('edition')} placeholder={w.editionPh} />
        </div>
        <div>
          <FL>{w.publisher}</FL>
          <FInput value={form.publisher} onChange={s('publisher')} placeholder={w.publisherPh} />
        </div>
        <div>
          <FL>{w.place}</FL>
          <FInput value={form.place} onChange={s('place')} placeholder={w.placePh} />
        </div>
        <div>
          <FL>{w.isbnOptional}</FL>
          <FInput value={form.isbn} onChange={s('isbn')} placeholder="9780xxxxxxxxxxxx" />
        </div>
      </div>
      <GenBtn disabled={!form.title.trim()} />
    </form>
  )
}

function WebsiteForm({
  form, setForm, onSubmit,
}: { form: ManualWebsiteForm; setForm: (f: ManualWebsiteForm) => void; onSubmit: (e: FormEvent<HTMLFormElement>) => void }) {
  const w = useWords()
  const s = (k: keyof ManualWebsiteForm) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value })
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <FL>{w.authorOrg} <span style={{ color: 'var(--teal)' }}>*</span></FL>
          <FInput value={form.authorName} onChange={s('authorName')} placeholder={w.authorOrgPh} required />
          <label className="flex items-center gap-1.5 mt-1.5 cursor-pointer">
            <input type="checkbox" checked={form.isOrg}
              onChange={e => setForm({ ...form, isOrg: e.target.checked })} className="w-3 h-3" />
            <span className="text-[10px]" style={{ color: 'var(--posi-muted)' }}>{w.orgNotPerson}</span>
          </label>
        </div>
        <div>
          <FL>{w.pageTitle} <span style={{ color: 'var(--teal)' }}>*</span></FL>
          <FInput value={form.title} onChange={s('title')} placeholder={w.pageTitlePh} required />
        </div>
        <div>
          <FL>{w.siteName}</FL>
          <FInput value={form.siteName} onChange={s('siteName')} placeholder={w.siteNamePh} />
        </div>
        <div>
          <FL>{w.year}</FL>
          <FInput value={form.year} onChange={s('year')} placeholder="2024" />
        </div>
        <div>
          <FL>{w.monthDay}</FL>
          <FInput value={form.monthDay} onChange={s('monthDay')} placeholder={w.monthDayPh} />
        </div>
        <div>
          <FL>{w.accessDate}</FL>
          <FInput value={form.accessDate} onChange={s('accessDate')} placeholder={w.accessDatePh} />
        </div>
        <div className="sm:col-span-2">
          <FL>{w.url}</FL>
          <FInput value={form.url} onChange={s('url')} placeholder="https://example.com/page" type="url" />
        </div>
      </div>
      <GenBtn disabled={!form.authorName.trim() || !form.title.trim()} />
    </form>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

const DEFAULT_A_FORM: ManualArticleForm = {
  authors: [{ ...EMPTY_AUTHOR }],
  year: '', title: '', journal: '', volume: '', issue: '', pages: '', doi: '',
}
const DEFAULT_B_FORM: ManualBookForm = {
  authors: [{ ...EMPTY_AUTHOR }],
  year: '', title: '', subtitle: '', edition: '', publisher: '', place: '', isbn: '',
}

export function CiteView() {
  const locale = useLocale()
  const w = WORDS[locale]
  const citeHref = (doi: string) => `${localizedHref(locale, '/cite/')}?doi=${encodeURIComponent(doi)}`
  const router = useRouter()
  const [batch, setBatch] = useState<{ id: number; entries: RefEntry[] } | null>(null)
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [input, setInput] = useState('')
  const [autoResult, setAutoResult] = useState<AutoResult | null>(null)
  const lookupCount = useRef(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Manual entry
  const [showManual, setShowManual] = useState(false)
  const manualRef = useRef<HTMLDivElement>(null)
  const [manualType, setManualType] = useState<ManualSourceType>('article')
  const [manualResult, setManualResult] = useState<{ citations: AllCitations; label: string } | null>(null)

  // Form state
  const [aForm, setAForm] = useState<ManualArticleForm>(DEFAULT_A_FORM)
  const [bForm, setBForm] = useState<ManualBookForm>(DEFAULT_B_FORM)
  const [wForm, setWForm] = useState<ManualWebsiteForm>({
    authorName: '', isOrg: false, year: String(new Date().getFullYear()),
    monthDay: '', title: '', siteName: '', accessDate: todayFormatted(), url: '',
  })

  // Webpage auto-detect form
  const [wpForm, setWpForm] = useState({ author: '', is_org: false, year: String(new Date().getFullYear()), title: '', site_name: '', access_date: todayFormatted(), url: '' })

  // A ?doi= link runs the lookup once, after the first render.
  useEffect(() => {
    const urlDoi = new URLSearchParams(window.location.search).get('doi')
    if (!urlDoi) return
    const t = setTimeout(() => { setInput(urlDoi); doLookup(urlDoi) }, 0)
    return () => clearTimeout(t)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function runBatch(entries: RefEntry[]) {
    ++lookupCount.current
    setLoading(false); setAutoResult(null)
    if (!entries.length) { setBatch(null); setError(w.errNothing); return }
    if (entries.length > MAX_BATCH) { setBatch(null); setError(fill(w.errTooMany, { max: MAX_BATCH, n: entries.length })); return }
    setError(null)
    setBatch({ id: Date.now(), entries })
  }

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    const text = await f.text()
    setInput(text)
    doLookup(text)
  }

  async function doLookup(raw: string) {
    const parsed = parseInput(raw)
    if (parsed.format !== 'text' || parsed.entries.length > 1) { runBatch(parsed.entries); return }
    setBatch(null)
    const detected = detectInput(raw)
    if (!detected) { setError(w.errInput); return }
    const myId = ++lookupCount.current
    setLoading(true); setError(null); setAutoResult(null)
    try {
      if (detected.kind === 'doi' || detected.kind === 'url-doi') {
        const doi = detected.payload
        // OpenAlex and the registry that holds the DOI (asked after doi.org names it) run side by side.
        const [oa, hit] = await Promise.all([
          openAlexGetArticle(doi).catch(() => null),
          doiAgencies([doi]).then(ag => registryGetWork(doi, ag.get(doi.toLowerCase()))).catch(() => null),
        ])
        if (myId !== lookupCount.current) return
        let article: Article | null = null
        let src: Source = 'crossref'
        if (hit) {
          // The registry's record is authoritative; OpenAlex fills what it lacks.
          article = { ...hit.article }
          src = hit.registry === 'Crossref' ? 'crossref' : hit.registry === 'Zenodo' ? 'zenodo' : 'datacite'
          if (oa) {
            if (!article.abstract && oa.abstract) article = { ...article, abstract: oa.abstract }
            if (!article.keywords.length && oa.keywords.length) article = { ...article, keywords: oa.keywords }
            if (oa.cited_by_count > article.cited_by_count) article = { ...article, cited_by_count: oa.cited_by_count }
            if (oa.openalex_work_id) article = { ...article, openalex_work_id: oa.openalex_work_id }
          }
        } else if (oa) { article = oa; src = 'openalex' }
        if (!article) { setError(w.errDoi); return }
        setAutoResult({ type: 'article', article, source: src })
        router.replace(citeHref(doi), { scroll: false })
      } else if (detected.kind === 'search') {
        const results = await crossrefSearchMany(detected.payload)
        if (myId !== lookupCount.current) return
        if (!results.length) { setError(w.errTitle); return }
        setPicked(new Set()); setAutoResult({ type: 'search', query: detected.payload, results })
      } else if (detected.kind === 'isbn') {
        const book = await fetchBookByIsbn(detected.payload)
        if (myId !== lookupCount.current) return
        if (!book?.title) {
          setError(w.errIsbn)
          setShowManual(true)
          setManualType('book')
          setBForm(f => ({ ...f, isbn: detected.payload }))
          setTimeout(() => manualRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
          return
        }
        const citations = buildAllBook(bookInfoToForm(book))
        setAutoResult({ type: 'book', citations, book })
      } else {
        if (myId !== lookupCount.current) return
        const url = detected.payload
        setWpForm({ author: '', is_org: false, year: String(new Date().getFullYear()), title: '', site_name: domainFromUrl(url), access_date: todayFormatted(), url })
        setAutoResult({ type: 'webpage-form', url })
      }
    } catch {
      if (myId !== lookupCount.current) return
      setError(w.errLookup)
    } finally {
      if (myId === lookupCount.current) setLoading(false)
    }
  }

  function handleWpSubmit(e: FormEvent) {
    e.preventDefault()
    const f: ManualWebsiteForm = {
      authorName: wpForm.author, isOrg: wpForm.is_org, year: wpForm.year,
      monthDay: '', title: wpForm.title, siteName: wpForm.site_name,
      accessDate: wpForm.access_date, url: wpForm.url,
    }
    setAutoResult({ type: 'webpage-result', citations: buildAllWebsite(f), title: wpForm.title })
  }

  function handleManualArticle(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setManualResult({ citations: buildAllArticle(aForm), label: `${w.tabArticle} - ${aForm.title || w.untitled}` })
  }
  function handleManualBook(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setManualResult({ citations: buildAllBook(bForm), label: `${w.tabBook} - ${bForm.title || w.untitled}` })
  }
  function handleManualWebsite(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setManualResult({ citations: buildAllWebsite(wForm), label: `${w.tabWebsite} - ${wForm.title || w.untitled}` })
  }

  const TABS: { key: ManualSourceType; label: string; icon: React.ReactNode }[] = [
    { key: 'article', label: w.tabArticle, icon: <Newspaper className="h-3.5 w-3.5" /> },
    { key: 'book', label: w.tabBook, icon: <BookOpen className="h-3.5 w-3.5" /> },
    { key: 'website', label: w.tabWebsite, icon: <Globe className="h-3.5 w-3.5" /> },
  ]

  return (
    <div className="wrap pb-12">
     <div className="max-w-[860px]">
      <PageHeader
        locale={locale}
        title={w.title}
        crumbs={[{ label: 'POSI', href: localizedHref(locale, '/') }, { label: w.services }, { label: w.title }]}
        actions={<Link href={localizedHref(locale, '/psg-format/')} className="btn">{w.psgFormat}</Link>}
      >
        <p>{w.lead}</p>
      </PageHeader>

      <div className="space-y-6">
      {/* Auto-lookup input */}
      <form onSubmit={e => { e.preventDefault(); doLookup(input) }}
        className="panel p-6">
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--posi-text)' }}>
          {w.inputLabel}
        </label>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-start">
          <textarea value={input} onChange={e => setInput(e.target.value)} rows={input.includes('\n') ? 8 : 3}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doLookup(input) } }}
            placeholder={w.inputPlaceholder}
            className="input flex-1 h-auto py-2 resize-y" />
          <button type="submit" disabled={loading || !input.trim()}
            className="btn btn-primary justify-center sm:self-start">
            <MagnifyingGlass className="h-4 w-4" />
            {loading ? w.loading : w.generate}
          </button>
        </div>
        <label className="btn btn-sm mt-2 cursor-pointer">
          <UploadSimple className="h-3 w-3" /> {w.openFile}
          <input type="file" accept=".bib,.bibtex,.ris,.txt,.json,text/plain" className="hidden" onChange={onFile} />
        </label>
        <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2">
          {w.hints.map(([k, v]) => (
            <p key={k} className="text-xs" style={{ color: 'var(--posi-muted)' }}>
              <span className="font-mono font-medium" style={{ color: 'var(--posi-text)' }}>{k}</span> - {v}
            </p>
          ))}
        </div>
      </form>

      {/* Loading */}
      {loading && (
        <div className="panel p-6 animate-pulse">
          <div className="h-4 rounded w-3/4 mb-3" style={{ background: 'var(--posi-bg)' }} />
          <div className="h-3 rounded w-1/2 mb-2" style={{ background: 'var(--posi-bg)' }} />
          <div className="h-3 rounded w-1/3" style={{ background: 'var(--posi-bg)' }} />
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="p-5" style={{ background: 'var(--rejected-soft)', border: '1px solid var(--posi-danger-border)' }}>
          <div className="flex items-start gap-3">
            <XCircle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: 'var(--rejected)' }} />
            <div>
              <p className="text-sm font-semibold mb-1" style={{ color: 'var(--rejected)' }}>{w.notFound}</p>
              <p className="text-xs leading-relaxed text-justify" style={{ color: 'var(--rejected)' }}>{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Many entries */}
      {batch && <BatchRun key={batch.id} entries={batch.entries} />}

      {/* Title search results */}
      {!loading && autoResult?.type === 'search' && (
        <div className="panel">
          <p className="px-5 py-3 text-xs font-mono" style={{ borderBottom: '1px solid var(--posi-border)', color: 'var(--posi-muted)' }}>
            {w.selectArticle}
          </p>
          <ul className="divide-y divide-[var(--line-soft)]">
            {autoResult.results.map(a => (
              <li key={a.doi}>
                <div className="flex items-start gap-3 px-5 py-3 hover:bg-[var(--surface-2)]">
                <input type="checkbox" className="mt-1.5 w-3.5 h-3.5 shrink-0" aria-label={w.selectForBatch}
                  checked={picked.has(a.doi)}
                  onChange={e => setPicked(p => { const n = new Set(p); if (e.target.checked) n.add(a.doi); else n.delete(a.doi); return n })} />
                <button type="button" className="flex-1 text-left"
                  onClick={() => { setAutoResult({ type: 'article', article: a, source: 'crossref' }); router.replace(citeHref(a.doi), { scroll: false }) }}>
                  <span className="block text-sm font-medium" style={{ color: 'var(--posi-text)' }}>{decodeHtml(a.title)}</span>
                  <span className="block text-xs mt-0.5" style={{ color: 'var(--posi-muted)' }}>
                    {a.authors.slice(0, 3).map(x => x.display_name).join('; ')}{a.authors.length > 3 ? ' et al.' : ''}
                    {a.journal_title ? ` · ${decodeHtml(a.journal_title)}` : ''} · {a.publication_year}
                  </span>
                </button>
                </div>
              </li>
            ))}
          </ul>
          <div className="px-5 py-3 flex items-center gap-3" style={{ borderTop: '1px solid var(--posi-border)' }}>
            <button type="button" disabled={!picked.size}
              onClick={() => runBatch(autoResult.results.filter(a => picked.has(a.doi)).map(a => ({ raw: a.doi, source: 'text' as const, doi: a.doi, authors: [] })))}
              className="btn btn-primary">
              {picked.size ? fill(w.convertSelected, { n: picked.size }) : w.convertNone}
            </button>
            <span className="text-[11px]" style={{ color: 'var(--posi-muted)' }}>{w.tickHint}</span>
          </div>
        </div>
      )}

      {/* Article result */}
      {!loading && autoResult?.type === 'article' && (
        <div className="space-y-4">
          <div className="panel p-5">
            <div className="flex items-center gap-2 mb-3">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--posi-brand)', fontFamily: 'var(--font-mono)' }}>{w.articleFound}</p>
              <span className="text-[9px] px-1.5 py-0.5 uppercase tracking-[0.1em]"
                style={{ fontFamily: 'var(--font-mono)', background: autoResult.source === 'openalex' ? 'var(--verified-soft)' : 'var(--surface-2)', color: autoResult.source === 'openalex' ? 'var(--verified)' : 'var(--muted)', border: `1px solid ${autoResult.source === 'openalex' ? 'var(--posi-success-border)' : 'var(--line)'}` }}>
                {fill(w.via, { source: { openalex: 'OpenAlex', zenodo: 'Zenodo', datacite: 'DataCite', crossref: 'Crossref' }[autoResult.source] })}
              </span>
            </div>
            <h2 className="text-sm font-semibold leading-snug mb-2" style={{ color: 'var(--posi-text)' }}>
              {decodeHtml(autoResult.article.title)}
            </h2>
            {autoResult.article.authors.length > 0 && (
              <p className="text-xs mb-2" style={{ color: 'var(--posi-muted)' }}>
                {autoResult.article.authors.slice(0, 5).map(a => a.display_name).join('; ')}
                {autoResult.article.authors.length > 5 && <span style={{ color: 'var(--posi-soft)' }}>{fill(w.more, { n: autoResult.article.authors.length - 5 })}</span>}
              </p>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-mono" style={{ color: 'var(--posi-muted)' }}>
              {autoResult.article.journal_title && <span>{decodeHtml(autoResult.article.journal_title)}</span>}
              {autoResult.article.volume && <span>{fill(w.vol, { v: autoResult.article.volume })}</span>}
              {autoResult.article.issue && <span>{fill(w.no, { v: autoResult.article.issue })}</span>}
              <span>{autoResult.article.publication_year}</span>
            </div>
            {autoResult.article.doi && (
              <div className="mt-3">
                <a href={`https://doi.org/${autoResult.article.doi}`} target="_blank" rel="noopener noreferrer"
                  className="text-xs flex items-center gap-1 hover:underline" style={{ color: 'var(--posi-brand)' }}>
                  {autoResult.article.doi}
                </a>
              </div>
            )}
          </div>
          <CitationFormatter article={autoResult.article} />
        </div>
      )}

      {/* Book result (ISBN found) */}
      {!loading && autoResult?.type === 'book' && (
        <div className="space-y-4">
          <div className="panel p-5">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="h-4 w-4" style={{ color: 'var(--posi-brand)' }} />
              <p className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--posi-brand)', fontFamily: 'var(--font-mono)' }}>{w.bookFound}</p>
            </div>
            <h2 className="text-sm font-semibold leading-snug mb-1" style={{ color: 'var(--posi-text)' }}>
              {autoResult.book.title}{autoResult.book.subtitle && <span style={{ color: 'var(--posi-muted)' }}>: {autoResult.book.subtitle}</span>}
            </h2>
            {autoResult.book.authors.length > 0 && (
              <p className="text-xs mb-2" style={{ color: 'var(--posi-muted)' }}>{autoResult.book.authors.join('; ')}</p>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-mono" style={{ color: 'var(--posi-muted)' }}>
              {autoResult.book.year && <span>{autoResult.book.year}</span>}
              {autoResult.book.publisher && <span>{autoResult.book.publisher}</span>}
              {autoResult.book.place && <span>{autoResult.book.place}</span>}
              <span>ISBN {autoResult.book.isbn}</span>
            </div>
          </div>
          <MultiFormatCards citations={autoResult.citations} />
        </div>
      )}

      {/* Webpage form */}
      {!loading && autoResult?.type === 'webpage-form' && (
        <div className="panel p-5">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="h-4 w-4" style={{ color: 'var(--posi-brand)' }} />
            <p className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--posi-brand)', fontFamily: 'var(--font-mono)' }}>{w.webpageCitation}</p>
          </div>
          <p className="text-xs mb-4" style={{ color: 'var(--posi-muted)' }}>{w.noDoi}</p>
          <form onSubmit={handleWpSubmit} className="space-y-3">
            <div>
              <FL>{w.url}</FL>
              <input value={wpForm.url} readOnly className={inputCls} style={{ background: 'var(--surface-2)' }} />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <FL>{w.authorOrOrg} <span style={{ color: 'var(--teal)' }}>*</span></FL>
                <FInput value={wpForm.author} onChange={e => setWpForm(f => ({ ...f, author: e.target.value }))} placeholder={w.authorOrgPh} required />
                <label className="flex items-center gap-1.5 mt-1.5 cursor-pointer">
                  <input type="checkbox" checked={wpForm.is_org} onChange={e => setWpForm(f => ({ ...f, is_org: e.target.checked }))} className="w-3 h-3" />
                  <span className="text-[10px]" style={{ color: 'var(--posi-muted)' }}>{w.organization}</span>
                </label>
              </div>
              <div>
                <FL>{w.pageTitle} <span style={{ color: 'var(--teal)' }}>*</span></FL>
                <FInput value={wpForm.title} onChange={e => setWpForm(f => ({ ...f, title: e.target.value }))} placeholder={w.pageTitlePh2} required />
              </div>
              <div>
                <FL>{w.websiteName}</FL>
                <FInput value={wpForm.site_name} onChange={e => setWpForm(f => ({ ...f, site_name: e.target.value }))} placeholder={w.websiteNamePh} />
              </div>
              <div>
                <FL>{w.year}</FL>
                <FInput value={wpForm.year} onChange={e => setWpForm(f => ({ ...f, year: e.target.value }))} placeholder="2026" />
              </div>
              <div className="sm:col-span-2">
                <FL>{w.accessDate}</FL>
                <FInput value={wpForm.access_date} onChange={e => setWpForm(f => ({ ...f, access_date: e.target.value }))} placeholder={w.accessDatePh} />
              </div>
            </div>
            <button type="submit" disabled={!wpForm.author.trim() || !wpForm.title.trim()}
              className="btn btn-primary w-full justify-center">
              {w.generateCitations}
            </button>
          </form>
        </div>
      )}

      {/* Webpage result */}
      {!loading && autoResult?.type === 'webpage-result' && (
        <div className="space-y-4">
          <div className="panel p-4">
            <div className="flex items-center gap-2 mb-1">
              <Globe className="h-3.5 w-3.5" style={{ color: 'var(--posi-muted)' }} />
              <p className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--posi-muted)', fontFamily: 'var(--font-mono)' }}>{w.webpage}</p>
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--posi-text)' }}>{autoResult.title}</p>
          </div>
          <MultiFormatCards citations={autoResult.citations} />
          <button onClick={() => setAutoResult({ type: 'webpage-form', url: autoResult.citations.psg.plain.match(/https?:\/\/\S+/)?.[0] ?? '' })}
            className="text-xs hover:underline" style={{ color: 'var(--posi-brand)' }}>
            {w.editDetails}
          </button>
        </div>
      )}

      {/* ── Manual Entry Section ─────────────────────────────────────────────── */}
      <div ref={manualRef}>
        <button
          onClick={() => setShowManual(v => !v)}
          className="flex items-center gap-2 text-sm font-medium transition-colors"
          style={{ color: showManual ? 'var(--posi-brand)' : 'var(--posi-muted)' }}
        >
          <PencilSimple className="h-4 w-4" />
          {showManual ? w.hideManual : w.showManual}
        </button>

        {showManual && (
          <div className="mt-4 panel">
            {/* Source type tabs */}
            <div className="flex" style={{ borderBottom: '1px solid var(--posi-border)' }}>
              {TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => { setManualType(tab.key); setManualResult(null) }}
                  className="flex items-center gap-1.5 px-4 py-3 text-xs font-medium transition-colors"
                  style={{
                    borderBottom: manualType === tab.key ? '2px solid var(--teal)' : '2px solid transparent',
                    color: manualType === tab.key ? 'var(--teal)' : 'var(--posi-muted)',
                    marginBottom: '-1px',
                  }}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            <div className="p-6 space-y-6">
              {manualType === 'article' && (
                <ArticleForm form={aForm} setForm={f => { setAForm(f); setManualResult(null) }} onSubmit={handleManualArticle} />
              )}
              {manualType === 'book' && (
                <BookForm form={bForm} setForm={f => { setBForm(f); setManualResult(null) }} onSubmit={handleManualBook} />
              )}
              {manualType === 'website' && (
                <WebsiteForm form={wForm} setForm={f => { setWForm(f); setManualResult(null) }} onSubmit={handleManualWebsite} />
              )}

              {/* Manual result */}
              {manualResult && (
                <div className="space-y-3">
                  <p className="text-xs font-mono font-medium" style={{ color: 'var(--posi-muted)' }}>
                    {manualResult.label}
                  </p>
                  <MultiFormatCards citations={manualResult.citations} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <p className="text-[13px]" style={{ color: 'var(--muted)' }}>
        <Link href={localizedHref(locale, '/psg-format/')} className="link">{w.psgSpec}</Link>
      </p>
      </div>
     </div>
    </div>
  )
}
