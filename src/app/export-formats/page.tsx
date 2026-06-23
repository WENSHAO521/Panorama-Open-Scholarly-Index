import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Export Formats | POSI',
  description: 'POSI metadata is available in JSON, CSV, BibTeX, and RIS formats. All exports include source attribution and provenance fields.',
}

const FORMATS = [
  {
    format: 'JSON',
    ext: '.json',
    mime: 'application/json',
    desc: 'Machine-readable structured data with full provenance fields. Recommended for programmatic access and data pipelines.',
    useCase: 'API consumers, data analysis, custom integrations',
    fields: ['doi', 'title', 'authors', 'journal', 'year', 'license', 'mqs', 'cvi', 'source_attribution', 'provenance'],
    param: '?format=json',
  },
  {
    format: 'CSV',
    ext: '.csv',
    mime: 'text/csv',
    desc: 'Tabular export for spreadsheet analysis. One record per row. Nested fields (authors, sources) are flattened with pipe separators.',
    useCase: 'Excel/Sheets analysis, bibliometric review, manual audit',
    fields: ['doi', 'title', 'first_author', 'co_authors', 'journal_title', 'issn', 'year', 'license', 'mqs', 'cvi'],
    param: '?format=csv',
  },
  {
    format: 'BibTeX',
    ext: '.bib',
    mime: 'application/x-bibtex',
    desc: 'Citation export compatible with Zotero, Mendeley, JabRef, and LaTeX workflows. Standard @article and @misc entry types.',
    useCase: 'Reference managers, LaTeX bibliography, citation export',
    fields: ['author', 'title', 'journal', 'year', 'volume', 'number', 'pages', 'doi', 'url', 'license'],
    param: '?format=bibtex',
  },
  {
    format: 'RIS',
    ext: '.ris',
    mime: 'application/x-research-info-systems',
    desc: 'Standardized citation format accepted by all major reference managers including EndNote, RefWorks, and Mendeley.',
    useCase: 'EndNote, RefWorks, institutional repository import',
    fields: ['TY', 'TI', 'AU', 'JO', 'PY', 'VL', 'IS', 'SP', 'EP', 'DO', 'UR', 'ER'],
    param: '?format=ris',
  },
]

const SCOPE_OPTIONS = [
  { param: 'scope=psg',    desc: 'PSG-published journals only — fully assessed, manually reviewed records' },
  { param: 'scope=all',    desc: 'Full Crossref scope — all auto-discovered records including unverified' },
  { param: 'tab=indexed',  desc: 'POSI Verified Journals — journals with at least one completed PQF review' },
]

export default function ExportFormatsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      <nav className="text-xs flex items-center gap-1.5" style={{ color: 'var(--posi-muted)' }}>
        <Link href="/" className="hover:text-gray-700">Home</Link>
        <span>/</span>
        <Link href="/api" className="hover:text-gray-700">API & Export</Link>
        <span>/</span>
        <span style={{ color: 'var(--posi-text)' }}>Export Formats</span>
      </nav>

      <div className="border-l-4 border-[#c41e3a] pl-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-mono font-bold text-[#c41e3a] border border-[#c41e3a] px-1.5 py-0.5">Export</span>
          <span className="text-[10px] font-mono text-gray-400 uppercase tracking-[0.15em]">Planned</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">Export Formats</h1>
        <p className="text-sm text-gray-500 mt-2 max-w-2xl leading-relaxed">
          POSI metadata will be exportable in four open formats. All exports preserve source attribution
          and provenance information. Export availability will be announced when the public API launches.
        </p>
      </div>

      <div className="p-4" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
        <p className="text-[11px] leading-relaxed" style={{ color: '#1d4ed8' }}>
          <strong>Export Status:</strong> Bulk exports are planned alongside the POSI public API.
          Currently, individual records are accessible via the{' '}
          <Link href="/doi-lookup" className="underline">DOI Lookup</Link>,{' '}
          <Link href="/journals" className="underline">Journal pages</Link>, and{' '}
          <Link href="/articles" className="underline">Article pages</Link>.
        </p>
      </div>

      {/* Format cards */}
      <div className="space-y-4">
        {FORMATS.map(f => (
          <section key={f.format} className="bg-white" style={{ border: '1px solid var(--posi-border)' }}>
            <div className="px-5 py-3 flex items-center gap-3" style={{ borderBottom: '1px solid var(--posi-border-light)' }}>
              <span className="text-sm font-mono font-bold" style={{ color: 'var(--posi-accent)' }}>{f.format}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5" style={{ background: 'var(--posi-bg)', color: 'var(--posi-muted)', border: '1px solid var(--posi-border)' }}>{f.ext}</span>
              <span className="text-[10px]" style={{ color: 'var(--posi-muted)', fontFamily: 'var(--font-mono)' }}>{f.mime}</span>
              <span className="ml-auto text-[10px] font-mono px-1.5 py-0.5" style={{ background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a' }}>Planned</span>
            </div>
            <div className="px-5 py-4 grid md:grid-cols-3 gap-5">
              <div className="md:col-span-2 space-y-3">
                <p className="text-xs leading-relaxed" style={{ color: 'var(--posi-muted)' }}>{f.desc}</p>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] mb-1.5" style={{ color: 'var(--posi-muted)' }}>Included Fields</p>
                  <div className="flex flex-wrap gap-1.5">
                    {f.fields.map(field => (
                      <span key={field} className="text-[10px] font-mono px-1.5 py-0.5" style={{ background: 'var(--posi-bg)', color: 'var(--posi-text)', border: '1px solid var(--posi-border-light)' }}>
                        {field}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] mb-1" style={{ color: 'var(--posi-muted)' }}>Best For</p>
                  <p className="text-[11px]" style={{ color: 'var(--posi-muted)' }}>{f.useCase}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] mb-1" style={{ color: 'var(--posi-muted)' }}>Query Parameter</p>
                  <code className="text-[10px] font-mono px-2 py-1 block" style={{ background: 'var(--posi-bg)', color: 'var(--posi-text)', border: '1px solid var(--posi-border)' }}>{f.param}</code>
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* Scope filters */}
      <section className="bg-white" style={{ border: '1px solid var(--posi-border)' }}>
        <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--posi-border-light)' }}>
          <h2 className="text-xs font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--posi-muted)' }}>Scope Filters</h2>
        </div>
        <div className="divide-y" style={{ borderColor: 'var(--posi-border-light)' }}>
          {SCOPE_OPTIONS.map(opt => (
            <div key={opt.param} className="px-5 py-3 flex items-start gap-4">
              <code className="text-[10px] font-mono shrink-0 px-2 py-0.5 mt-0.5" style={{ background: 'var(--posi-bg)', color: 'var(--posi-accent)', border: '1px solid var(--posi-border)' }}>
                {opt.param}
              </code>
              <p className="text-[11px]" style={{ color: 'var(--posi-muted)' }}>{opt.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Attribution */}
      <section className="bg-white p-5" style={{ border: '1px solid var(--posi-border)' }}>
        <h2 className="text-xs font-bold uppercase tracking-[0.1em] mb-3" style={{ color: 'var(--posi-muted)' }}>Attribution Requirements</h2>
        <div className="space-y-2 text-xs leading-relaxed" style={{ color: 'var(--posi-muted)' }}>
          <p>All POSI exports include a <code className="font-mono text-[10px] bg-gray-100 px-1">source_attribution</code> field indicating the origin of each metadata field (Crossref, OpenAlex, OAI-PMH, DOAJ, or POSI Core).</p>
          <p>When reusing POSI exports, attribute the original data sources as indicated. POSI does not claim ownership of metadata sourced from third-party registries.</p>
          <p>PQF scores are produced by POSI and should be attributed as: <em>"POSI Quality Framework (PQF), Panorama Open Scholarly Index"</em>. Licensed under CC BY 4.0.</p>
        </div>
      </section>

      <div className="flex flex-wrap gap-4 text-xs">
        <Link href="/api" style={{ color: 'var(--posi-accent)' }} className="hover:underline">API Roadmap →</Link>
        <Link href="/data-sources" style={{ color: 'var(--posi-accent)' }} className="hover:underline">Data Sources →</Link>
        <Link href="/contact" style={{ color: 'var(--posi-accent)' }} className="hover:underline">Request Bulk Access →</Link>
      </div>
    </div>
  )
}
