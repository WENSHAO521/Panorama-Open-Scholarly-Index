'use client'

import { useState } from 'react'
import { Copy, Check } from '@phosphor-icons/react/dist/ssr'
import { decodeHtml } from '@/lib/utils'
import type { Article } from '@/lib/types'

type CitationFormat = 'apa' | 'mla' | 'chicago' | 'gbt' | 'bibtex' | 'ris'

const FORMATS: { id: CitationFormat; label: string }[] = [
  { id: 'apa',     label: 'APA 7' },
  { id: 'mla',     label: 'MLA 9' },
  { id: 'chicago', label: 'Chicago 17' },
  { id: 'gbt',     label: 'GB/T 7714' },
  { id: 'bibtex',  label: 'BibTeX' },
  { id: 'ris',     label: 'RIS' },
]

const FORMAT_NOTES: Record<CitationFormat, string> = {
  apa:     'APA 7th Edition — Publication Manual of the American Psychological Association (7th ed.)',
  mla:     'MLA 9th Edition — MLA Handbook (9th ed.), 2021',
  chicago: 'Chicago 17th Edition Author-Date — The Chicago Manual of Style (17th ed.)',
  gbt:     'GB/T 7714-2015 — Chinese national standard for bibliographic references',
  bibtex:  'BibTeX format — for use with LaTeX reference management',
  ris:     'RIS format — compatible with Zotero, Mendeley, EndNote, and RefWorks',
}

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).map(n => `${n.charAt(0)}.`).join(' ')
}

function apaAuthor(a: Article['authors'][0]): string {
  if (a.family_name && a.given_name) return `${a.family_name}, ${initials(a.given_name)}`
  return a.display_name
}

export function generateCitationText(article: Article, format: CitationFormat): string {
  const title       = decodeHtml(article.title)
  const journal     = decodeHtml(article.journal_title ?? '')
  const year        = article.publication_year
  const vol         = article.volume
  const iss         = article.issue
  const fp          = article.first_page
  const lp          = article.last_page
  const doi         = article.doi
  const authors     = article.authors
  const pages       = fp ? (lp ? `${fp}–${lp}` : fp) : null
  const doiUrl      = doi ? `https://doi.org/${doi}` : null

  switch (format) {
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
      out += `(${year}). ${title}. `
      if (journal) out += journal
      if (vol)     out += `, ${vol}`
      if (iss)     out += `(${iss})`
      if (pages)   out += `, ${pages}`
      out += '.'
      if (doiUrl)  out += ` ${doiUrl}`
      return out
    }

    case 'mla': {
      const fmtFirst = (a: Article['authors'][0]) =>
        a.family_name && a.given_name ? `${a.family_name}, ${a.given_name}` : a.display_name
      const fmtOther = (a: Article['authors'][0]) =>
        a.given_name && a.family_name ? `${a.given_name} ${a.family_name}` : a.display_name
      let out = ''
      if      (authors.length === 1) out = `${fmtFirst(authors[0])}.`
      else if (authors.length === 2) out = `${fmtFirst(authors[0])}, and ${fmtOther(authors[1])}.`
      else if (authors.length > 2)   out = `${fmtFirst(authors[0])}, et al.`
      if (out) out += ' '
      out += `"${title}." `
      if (journal) out += journal
      if (vol)     out += `, vol. ${vol}`
      if (iss)     out += `, no. ${iss}`
      out +=  `, ${year}`
      if (pages)   out += `, pp. ${pages}`
      if (doi)     out += `, doi:${doi}`
      out += '.'
      return out
    }

    case 'chicago': {
      const fmtFirst = (a: Article['authors'][0]) =>
        a.family_name && a.given_name ? `${a.family_name}, ${a.given_name}` : a.display_name
      const fmtOther = (a: Article['authors'][0]) =>
        a.given_name && a.family_name ? `${a.given_name} ${a.family_name}` : a.display_name
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
      out += `${year}. "${title}." `
      if (journal) out += journal
      if (vol)     out += ` ${vol}`
      if (iss)     out += `, no. ${iss}`
      out += ` (${year})`
      if (pages)   out += `: ${pages}`
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
      out += `${title}[J]. `
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
        `@article{${bibKey},`,
        `  author    = {${bibAuthors || 'Unknown'}},`,
        `  title     = {${title}},`,
        `  journal   = {${journal}},`,
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
      const lines = ['TY  - JOUR', `T1  - ${title}`]
      authors.forEach(a => {
        const name = a.family_name && a.given_name
          ? `${a.family_name}, ${a.given_name}`
          : a.display_name
        lines.push(`AU  - ${name}`)
      })
      if (journal) lines.push(`JO  - ${journal}`)
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
  const [format, setFormat] = useState<CitationFormat>('apa')
  const [copied, setCopied] = useState(false)

  const text = generateCitationText(article, format)
  const isCode = format === 'bibtex' || format === 'ris'

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
    <div className="bg-white" style={{ border: '1px solid var(--posi-border)' }}>
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
                    color: 'var(--posi-accent)',
                    borderBottom: '2px solid var(--posi-accent)',
                    fontFamily: 'var(--font-mono)',
                    background: 'var(--posi-accent-light)',
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
            {f.label}
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
          className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] uppercase tracking-[0.06em] transition-colors"
          style={{
            border: '1px solid var(--posi-border)',
            color: copied ? '#1F7A4D' : 'var(--posi-muted)',
            background: copied ? '#E8F5EE' : '#ffffff',
            fontFamily: 'var(--font-mono)',
          }}
          title="Copy to clipboard"
        >
          {copied
            ? <Check className="h-3 w-3" weight="bold" />
            : <Copy className="h-3 w-3" />
          }
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      {/* Format note */}
      <div className="px-5 pb-4" style={{ borderTop: '1px solid var(--posi-border-light)' }}>
        <p className="text-[10px] pt-3" style={{ color: 'var(--posi-soft)', fontFamily: 'var(--font-mono)' }}>
          {FORMAT_NOTES[format]}
        </p>
      </div>
    </div>
  )
}
