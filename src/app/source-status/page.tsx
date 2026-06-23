import Link from 'next/link'
import type { Metadata } from 'next'
import { getStats } from '@/lib/data'

export const metadata: Metadata = {
  title: 'Source Status | POSI',
  description: 'Sync status of all POSI data sources: Crossref, OpenAlex, DOAJ, OAI-PMH, ROR, ORCID, and OpenCitations.',
}

const SOURCES = [
  {
    name: 'POSI Core',
    type: 'Internal',
    use: 'Journal records, PQF assessments, policy evidence',
    status: 'Primary',
    sync: 'last_updated' as const,
    notes: 'Manually curated. Updated on each editorial assessment cycle.',
  },
  {
    name: 'DOAJ',
    type: 'External OA',
    use: 'Journal verification, OA status, license data',
    status: 'Integrated',
    sync: 'last_updated' as const,
    notes: 'Periodic sync via DOAJ public API. Used for journal-level OA status.',
  },
  {
    name: 'Crossref',
    type: 'External',
    use: 'DOI records, article metadata, reference lists',
    status: 'Live',
    sync: 'Real-time',
    notes: 'Real-time queries via Crossref REST API. DOI lookups resolved on demand.',
  },
  {
    name: 'OpenAlex',
    type: 'External',
    use: 'Citation visibility, source matching, author IDs',
    status: 'Live',
    sync: 'Real-time',
    notes: 'Real-time queries via OpenAlex API. Used for CVI and author disambiguation.',
  },
  {
    name: 'OAI-PMH',
    type: 'Harvest',
    use: 'Article harvesting from OJS-based platforms',
    status: 'Integrated',
    sync: 'last_updated' as const,
    notes: 'Periodic harvest from journal OAI-PMH endpoints. Protocol: Dublin Core.',
  },
  {
    name: 'ROR',
    type: 'External',
    use: 'Institution identifier resolution',
    status: 'Integrated',
    sync: 'Periodic',
    notes: 'Used for author affiliation disambiguation. Synced against ROR data dump.',
  },
  {
    name: 'ORCID',
    type: 'External',
    use: 'Author identifier linking',
    status: 'Integrated',
    sync: 'Real-time',
    notes: 'ORCID identifiers resolved via public ORCID API where present in metadata.',
  },
  {
    name: 'OpenCitations',
    type: 'External',
    use: 'Open citation links and cited-by counts',
    status: 'Planned',
    sync: 'Not yet active',
    notes: 'Integration planned. Will provide open citation links for CVF scoring.',
  },
]

const STATUS_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  Primary:    { bg: '#fef2f2', color: '#c41e3a', border: '#fecaca' },
  Live:       { bg: '#f0fdf4', color: '#1F7A4D', border: '#bbf7d0' },
  Integrated: { bg: '#f5f5f5', color: '#374151', border: '#e5e7eb' },
  Planned:    { bg: '#f9fafb', color: '#6B7280', border: '#e5e7eb' },
}

export default function SourceStatusPage() {
  const stats = getStats()

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      <nav className="text-xs flex items-center gap-1.5" style={{ color: 'var(--posi-muted)' }}>
        <Link href="/" className="hover:text-gray-700">Home</Link>
        <span>/</span>
        <Link href="/data-sources" className="hover:text-gray-700">Data Sources</Link>
        <span>/</span>
        <span style={{ color: 'var(--posi-text)' }}>Source Status</span>
      </nav>

      <div className="border-l-4 border-[#c41e3a] pl-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-mono font-bold text-[#c41e3a] border border-[#c41e3a] px-1.5 py-0.5">Status</span>
          <span className="text-[10px] font-mono text-gray-400 uppercase tracking-[0.15em]">Live Overview</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">Source Status</h1>
        <p className="text-sm text-gray-500 mt-2 max-w-2xl leading-relaxed">
          Sync status and operational health of all data sources integrated into POSI.
          Live sources are queried in real time. Integrated sources are synced periodically.
          Planned sources are documented but not yet active.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-gray-200" style={{ border: '1px solid var(--posi-border)' }}>
        {[
          { label: 'Journal Records', value: stats.total_journals.toLocaleString() },
          { label: 'DOI Records',     value: stats.total_doi_records.toLocaleString() },
          { label: 'Author Records',  value: stats.total_authors.toLocaleString() },
          { label: 'Last Sync',       value: stats.last_updated },
        ].map(s => (
          <div key={s.label} className="bg-white px-4 py-4 text-center">
            <p className="text-lg font-bold font-mono" style={{ color: 'var(--posi-text)' }}>{s.value}</p>
            <p className="text-[10px] uppercase tracking-[0.12em] mt-0.5" style={{ color: 'var(--posi-muted)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Status table */}
      <section className="bg-white overflow-x-auto" style={{ border: '1px solid var(--posi-border)' }}>
        <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--posi-border-light)', background: 'var(--posi-bg)' }}>
          <h2 className="text-xs font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--posi-muted)' }}>All Sources</h2>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ background: 'var(--posi-bg)', borderBottom: '1px solid var(--posi-border-light)' }}>
              <th className="text-left px-5 py-2.5 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>Source</th>
              <th className="text-left px-4 py-2.5 font-semibold uppercase tracking-[0.07em] hidden sm:table-cell" style={{ color: 'var(--posi-muted)' }}>Type</th>
              <th className="text-left px-4 py-2.5 font-semibold uppercase tracking-[0.07em] hidden md:table-cell" style={{ color: 'var(--posi-muted)' }}>Primary Use</th>
              <th className="text-center px-4 py-2.5 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>Status</th>
              <th className="text-right px-5 py-2.5 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>Last Sync</th>
            </tr>
          </thead>
          <tbody>
            {SOURCES.map(row => {
              const syncValue = row.sync === 'last_updated' ? stats.last_updated : row.sync
              const style = STATUS_STYLE[row.status] ?? STATUS_STYLE.Planned
              return (
                <tr key={row.name} style={{ borderBottom: '1px solid var(--posi-border-light)' }}>
                  <td className="px-5 py-3">
                    <p className="font-semibold" style={{ color: 'var(--posi-text)' }}>{row.name}</p>
                    <p className="text-[10px] mt-0.5 hidden md:block" style={{ color: 'var(--posi-muted)' }}>{row.notes}</p>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell" style={{ color: 'var(--posi-muted)' }}>{row.type}</td>
                  <td className="px-4 py-3 hidden md:table-cell" style={{ color: 'var(--posi-muted)' }}>{row.use}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-[10px] font-medium px-1.5 py-0.5" style={{ background: style.bg, color: style.color, border: `1px solid ${style.border}` }}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-[10px]" style={{ color: 'var(--posi-muted)' }}>{syncValue}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>

      {/* Status legend */}
      <div className="grid sm:grid-cols-2 gap-3">
        {Object.entries(STATUS_STYLE).map(([key, style]) => (
          <div key={key} className="flex items-start gap-3 p-3 bg-white" style={{ border: '1px solid var(--posi-border)' }}>
            <span className="text-[10px] font-medium px-1.5 py-0.5 shrink-0 mt-0.5" style={{ background: style.bg, color: style.color, border: `1px solid ${style.border}` }}>
              {key}
            </span>
            <p className="text-[11px] leading-relaxed" style={{ color: 'var(--posi-muted)' }}>
              {key === 'Primary'    && 'Internal POSI data. Manually curated and updated on each assessment cycle.'}
              {key === 'Live'       && 'Real-time connection. Queries are resolved on demand via the source\'s public API.'}
              {key === 'Integrated' && 'Periodic sync. Data is harvested or imported on a scheduled basis.'}
              {key === 'Planned'    && 'Integration documented but not yet active. No data from this source is currently used.'}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-4 text-xs">
        <Link href="/data-sources" style={{ color: 'var(--posi-accent)' }} className="hover:underline">Data Sources Overview →</Link>
        <Link href="/api" style={{ color: 'var(--posi-accent)' }} className="hover:underline">API Roadmap →</Link>
      </div>
    </div>
  )
}
