'use client'

import { useState } from 'react'
import { Copy, Check } from '@phosphor-icons/react/dist/ssr'
import { decodeHtml } from '@/lib/utils'
import type { Article } from '@/lib/types'
import { psgArticle, psgDataset, psgInText } from '@/lib/psg'
import { footnoteArticle, footnoteDataset } from '@/lib/footnote'
import { cleanTitle, initials, plausibleYear, spaceInitials, splitName, titleStop } from '@/lib/cite-text'
import type { Locale } from '@/i18n/config'
import { useLocale } from '@/i18n/LocaleProvider'

export type CitationFormat = 'psg' | 'apa' | 'mla' | 'chicago' | 'footnote' | 'gbt' | 'bibtex' | 'ris'

export const FORMATS: { id: CitationFormat; label: string }[] = [
  { id: 'psg',     label: 'PSG Format' },
  { id: 'apa',     label: 'APA 7' },
  { id: 'mla',     label: 'MLA 9' },
  { id: 'chicago', label: 'Chicago 17' },
  { id: 'footnote', label: 'Footnote' },
  { id: 'gbt',     label: 'GB/T 7714' },
  { id: 'bibtex',  label: 'BibTeX' },
  { id: 'ris',     label: 'RIS' },
]

const FORMAT_NOTES: Record<CitationFormat, string> = {
  psg:     'PSG Author-Date Citation Format - official citation standard of Panorama Scholarly Group',
  apa:     'APA 7th Edition - Publication Manual of the American Psychological Association (7th ed.)',
  mla:     'MLA 9th Edition - MLA Handbook (9th ed.), 2021',
  chicago: 'Chicago 17th Edition Author-Date - The Chicago Manual of Style (17th ed.)',
  footnote: 'Footnote - Chicago 17th Edition Notes-Bibliography: the full note the first time a work is cited, the short note after',
  gbt:     'GB/T 7714-2015 - Chinese national standard for bibliographic references',
  bibtex:  'BibTeX format - for use with LaTeX reference management',
  ris:     'RIS format - compatible with Zotero, Mendeley, EndNote, and RefWorks',
}

// The interface around a citation in each language; the citation text itself follows its style and is not translated.
const en = {
  notes: FORMAT_NOTES,
  footnote: 'Footnote', inText: 'In-text Citation', shortNote: 'Short note', copy: 'Copy', copied: 'Copied', copyTitle: 'Copy to clipboard',
}
export const CITATION_WORDS: Record<Locale, typeof en> = {
  en,
  'zh-Hans': {
    notes: {
      psg:     'PSG 著者-出版年引文格式：Panorama Scholarly Group 的官方引文标准',
      apa:     'APA 第 7 版：《美国心理学会出版手册》（第 7 版）',
      mla:     'MLA 第 9 版：《MLA 手册》（第 9 版），2021 年',
      chicago: 'Chicago 第 17 版著者-出版年制：《芝加哥格式手册》（第 17 版）',
      footnote: '脚注：Chicago 第 17 版注释-参考文献体系。首次引用时使用完整注释，再次引用时使用简注',
      gbt:     'GB/T 7714-2015：中国国家标准《信息与文献 参考文献著录规则》',
      bibtex:  'BibTeX 格式：用于 LaTeX 参考文献管理',
      ris:     'RIS 格式：兼容 Zotero、Mendeley、EndNote 与 RefWorks',
    },
    footnote: '脚注', inText: '文内引用', shortNote: '简注', copy: '复制', copied: '已复制', copyTitle: '复制到剪贴板',
  },
}

/** The label of a format's tab: the style's own name, except the footnote, which is translated. */
export function formatLabel(f: { id: CitationFormat; label: string }, locale: Locale): string {
  return f.id === 'footnote' ? CITATION_WORDS[locale].footnote : f.label
}

/** Given and family names; OpenAlex and DataCite give only a display name, which is split here. */
function namesOf(a: Article['authors'][0]): { given: string; family: string } | null {
  return a.family_name && a.given_name ? { given: a.given_name, family: a.family_name } : splitName(a.display_name)
}

function apaAuthor(a: Article['authors'][0]): string {
  const n = namesOf(a)
  return n ? `${n.family}, ${initials(n.given)}` : a.display_name
}

const personOf = (a: Article['authors'][0]) => {
  const n = namesOf(a)
  return n ? { family: n.family, given: spaceInitials(n.given), name: a.display_name } : { family: null, given: null, name: a.display_name }
}

export function generateShortNote(article: Article): string {
  const people = article.authors.map(personOf)
  const title = decodeHtml(article.title)
  return resourceKind(article)
    ? footnoteDataset({ authors: people, title, kind: '' }).short
    : footnoteArticle({ authors: people, title }).short
}

export function generatePsgInText(authors: Article['authors'], year: number | string | null): string {
  return psgInText(authors.map(personOf), year)
}

/** `yearLabel` replaces the year in PSG output, e.g. "2024a" when a batch holds two works by one author in 2024. */
/** Data sets and software come from DataCite / Zenodo; they are cited by what they are, not as journal articles. */
function resourceKind(a: Article): { psg: string; apa: string; gbt: string; bibtex: string; ris: string } | null {
  if (/data ?set/i.test(a.article_type)) return { psg: 'Data set', apa: 'Data set', gbt: 'DS', bibtex: 'misc', ris: 'DATA' }
  if (/software|source code/i.test(a.article_type)) return { psg: 'Source code', apa: 'Computer software', gbt: 'CP', bibtex: 'misc', ris: 'COMP' }
  return null
}

export function generateCitationText(article: Article, format: CitationFormat, yearLabel?: string): string {
  const title       = cleanTitle(decodeHtml(article.title))
  const journal     = decodeHtml(article.journal_title ?? '')
  const year        = plausibleYear(article.publication_year) ? article.publication_year : 'n.d.'
  const vol         = article.volume
  const iss         = article.issue
  const fp          = article.first_page
  const lp          = article.last_page
  const doi         = article.doi
  const authors     = article.authors
  const pages       = fp ? (lp && lp !== fp ? `${fp}-${lp}` : fp) : null
  const pagesDash   = pages?.replace('-', '–') ?? null  // APA, MLA and Chicago print ranges with an en dash
  const doiUrl      = doi ? `https://doi.org/${doi}` : null

  const res = resourceKind(article)

  switch (format) {

    case 'psg':
      if (res) return psgDataset({ authors: authors.map(personOf), year: yearLabel ?? year, title, kind: res.psg, publisher: journal, doi })
      return psgArticle({ authors: authors.map(personOf), year: yearLabel ?? year, title, journal, volume: vol, issue: iss, pages, doi })

    case 'footnote':
      if (res) return footnoteDataset({ authors: authors.map(personOf), year, title, kind: res.psg, publisher: journal, doi }).full
      return footnoteArticle({ authors: authors.map(personOf), year, title, journal, volume: vol, issue: iss, pages, doi }).full

    case 'apa': {
      const names = authors.map(apaAuthor)
      let authorStr = ''
      if (names.length === 1) {
        authorStr = names[0]
      } else if (names.length <= 20) {
        authorStr = names.slice(0, -1).join(', ') + ', & ' + names[names.length - 1]
      } else {
        authorStr = names.slice(0, 19).join(', ') + ', ... ' + names[names.length - 1]
      }
      let out = authorStr ? `${authorStr} ` : ''
      out += `(${year}). ${res ? `${title} [${res.apa}].` : titleStop(title)} `
      if (journal) out += journal
      if (vol)     out += `, ${vol}`
      if (iss)     out += `(${iss})`
      if (pages)   out += `, ${pagesDash}`
      out += '.'
      if (doiUrl)  out += ` ${doiUrl}`
      return out
    }

    case 'mla': {
      const fmtFirst = (a: Article['authors'][0]) => { const n = personOf(a); return n.family ? `${n.family}, ${n.given}` : a.display_name }
      const fmtOther = (a: Article['authors'][0]) => { const n = personOf(a); return n.family ? `${n.given} ${n.family}` : a.display_name }
      let out = ''
      if      (authors.length === 1) out = `${fmtFirst(authors[0])}.`
      else if (authors.length === 2) out = `${fmtFirst(authors[0])}, and ${fmtOther(authors[1])}.`
      else if (authors.length > 2)   out = `${fmtFirst(authors[0])}, et al.`
      if (out) out += ' '
      out += `"${titleStop(title)}" `
      if (journal) out += journal
      if (vol)     out += `, vol. ${vol}`
      if (iss)     out += `, no. ${iss}`
      out +=  `, ${year}`
      if (pages)   out += `, pp. ${pagesDash}`
      if (doi)     out += `, doi:${doi}`
      out += '.'
      return out
    }

    case 'chicago': {
      const fmtFirst = (a: Article['authors'][0]) => { const n = personOf(a); return n.family ? `${n.family}, ${n.given}` : a.display_name }
      const fmtOther = (a: Article['authors'][0]) => { const n = personOf(a); return n.family ? `${n.given} ${n.family}` : a.display_name }
      let authorStr = ''
      if (authors.length === 1) {
        authorStr = fmtFirst(authors[0])
      } else if (authors.length === 2) {
        authorStr = `${fmtFirst(authors[0])}, and ${fmtOther(authors[1])}`
      } else if (authors.length > 2) {
        const rest = authors.slice(1, -1).map(fmtOther)
        authorStr = [fmtFirst(authors[0]), ...rest].join(', ') + ', and ' + fmtOther(authors[authors.length - 1])
      }
      let out = authorStr ? `${authorStr}. ` : ''
      out += `${year}. "${titleStop(title)}" `
      if (journal) out += journal
      if (vol)     out += ` ${vol}`
      if (iss)     out += `, no. ${iss}`
      if (pages)   out += `: ${pagesDash}`
      out += '.'
      if (doiUrl)  out += ` ${doiUrl}.`
      return out
    }

    case 'gbt': {
      const displayed = authors.slice(0, 3)
      const nameList  = displayed.map(a =>
        a.display_name || `${a.family_name ?? ''}${a.given_name ? ' ' + a.given_name : ''}`.trim()
      )
      const authorStr = nameList.join(', ') + (authors.length > 3 ? ', 等' : '')
      let out = authorStr ? `${authorStr}. ` : ''
      out += `${title}[${res ? res.gbt : 'J'}]. `
      if (journal) out += journal
      out += `, ${year}`
      if (vol)     out += `, ${vol}`
      if (iss)     out += `(${iss})`
      if (pages)   out += `: ${pages}`
      out += '.'
      if (doi)     out += ` DOI: ${doi}.`
      return out
    }

    case 'bibtex': {
      const first   = authors[0]
      const nameKey = (first?.family_name ?? first?.display_name ?? 'unknown').toLowerCase().replace(/[^a-z]/g, '').slice(0, 12)
      const wordKey = title.split(/\s+/)[0].toLowerCase().replace(/[^a-z]/g, '').slice(0, 8)
      const bibKey  = `${nameKey}${year}${wordKey}`
      const bibAuthors = authors
        .map(a => a.family_name && a.given_name ? `${a.family_name}, ${a.given_name}` : a.display_name)
        .join(' and ')
      const bibPages = fp ? (lp ? `${fp}--${lp}` : fp) : null
      const lines = [
        `@${res ? res.bibtex : 'article'}{${bibKey},`,
        `  author    = {${bibAuthors || 'Unknown'}},`,
        `  title     = {${title}},`,
        res ? `  publisher = {${journal}},` : `  journal   = {${journal}},`,
        `  year      = {${year}},`,
      ]
      if (vol)      lines.push(`  volume    = {${vol}},`)
      if (iss)      lines.push(`  number    = {${iss}},`)
      if (bibPages) lines.push(`  pages     = {${bibPages}},`)
      if (doi)      lines.push(`  doi       = {${doi}},`)
      if (doiUrl)   lines.push(`  url       = {${doiUrl}},`)
      lines.push('}')
      return lines.join('\n')
    }

    case 'ris': {
      const lines = [`TY  - ${res ? res.ris : 'JOUR'}`, `T1  - ${title}`]
      authors.forEach(a => {
        const name = a.family_name && a.given_name
          ? `${a.family_name}, ${a.given_name}`
          : a.display_name
        lines.push(`AU  - ${name}`)
      })
      if (journal) lines.push(`${res ? 'PB' : 'JO'}  - ${journal}`)
      lines.push(`PY  - ${year}`)
      if (vol)  lines.push(`VL  - ${vol}`)
      if (iss)  lines.push(`IS  - ${iss}`)
      if (fp)   lines.push(`SP  - ${fp}`)
      if (lp)   lines.push(`EP  - ${lp}`)
      if (doi)  lines.push(`DO  - ${doi}`)
      if (doiUrl) lines.push(`UR  - ${doiUrl}`)
      lines.push('ER  - ')
      return lines.join('\n')
    }
  }
}

interface Props {
  article: Article
}

export function CitationFormatter({ article }: Props) {
  const locale = useLocale()
  const w = CITATION_WORDS[locale]
  const [format, setFormat] = useState<CitationFormat>('psg')
  const [copied, setCopied] = useState(false)

  const text = generateCitationText(article, format)
  const isCode = format === 'bibtex' || format === 'ris'
  // PSG adds an in-text citation; a footnote adds the short note used after the first citation.
  const second = format === 'psg'
    ? { label: w.inText, text: generatePsgInText(article.authors, plausibleYear(article.publication_year) ? article.publication_year : null) }
    : format === 'footnote' ? { label: w.shortNote, text: generateShortNote(article) } : null

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const el = document.createElement('textarea')
      el.value = text
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="panel">
      {/* Format tabs */}
      <div className="flex overflow-x-auto scroll-contain scrollbar-none" style={{ borderBottom: '1px solid var(--posi-border)' }}>
        {FORMATS.map(f => (
          <button
            key={f.id}
            onClick={() => setFormat(f.id)}
            className="shrink-0 px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.06em] transition-colors"
            style={
              format === f.id
                ? {
                    color: 'var(--posi-brand)',
                    borderBottom: '2px solid var(--posi-brand)',
                    fontFamily: 'var(--font-mono)',
                    background: 'var(--posi-brand-soft)',
                    marginBottom: '-1px',
                  }
                : {
                    color: 'var(--posi-muted)',
                    fontFamily: 'var(--font-mono)',
                    borderBottom: '2px solid transparent',
                    marginBottom: '-1px',
                  }
            }
          >
            {formatLabel(f, locale)}
          </button>
        ))}
      </div>

      {/* Citation output */}
      <div className="relative p-5">
        <pre
          className="text-sm leading-relaxed whitespace-pre-wrap break-words pr-20"
          style={{
            fontFamily: isCode ? 'var(--font-mono)' : 'var(--font-body)',
            color: 'var(--posi-text)',
            fontSize: '0.8125rem',
          }}
        >
          {text}
        </pre>

        <button
          onClick={handleCopy}
          className="btn btn-sm absolute top-4 right-4"
          style={copied ? { color: 'var(--verified)', background: 'var(--verified-soft)' } : undefined}
          title={w.copyTitle}
        >
          {copied
            ? <Check className="h-3 w-3" weight="bold" />
            : <Copy className="h-3 w-3" />
          }
          {copied ? w.copied : w.copy}
        </button>
      </div>

      {/* PSG in-text citation, or the short form of a footnote */}
      {second?.text && (
        <div className="px-5 pb-4 pt-0" style={{ borderTop: '1px solid var(--posi-border-light)' }}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] mt-3 mb-1.5" style={{ color: 'var(--posi-muted)', fontFamily: 'var(--font-mono)' }}>
            {second.label}
          </p>
          <p className="text-sm font-mono" style={{ color: 'var(--posi-text)' }}>{second.text}</p>
        </div>
      )}

      {/* Format note */}
      <div className="px-5 pb-4" style={{ borderTop: '1px solid var(--posi-border-light)' }}>
        <p className="text-[10px] pt-3" style={{ color: 'var(--posi-soft)', fontFamily: 'var(--font-mono)' }}>
          {w.notes[format]}
        </p>
      </div>
    </div>
  )
}
