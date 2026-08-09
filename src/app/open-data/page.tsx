import Link from 'next/link'
import { ArrowSquareOut } from '@phosphor-icons/react/dist/ssr'

export const metadata = {
  title: 'Open Data',
  description: 'Every journal record, ranking formula, and dataset behind POSI is public on GitHub — versioned, PR-reviewed, and reproducible from a pinned commit.',
}

const PILLARS = [
  {
    title: 'Open Data',
    body: 'Journal records, PSC subject classification, annual metric snapshots, and category rankings — plain-text, diffable, versioned in Git. Bulk machine-generated artifacts ship as checksummed GitHub Release assets rather than bloating Git history.',
    repo: { label: 'posi-data', href: 'https://github.com/WENSHAO521/posi-data' },
  },
  {
    title: 'Open Methodology',
    body: 'How PCI/PCI-5/PNCI are computed, which document types count as citable items, how ties are broken, how quartiles are assigned, how retractions are handled — fully written out, not implied by a black-box formula.',
    repo: { label: 'PJR-SPEC.md', href: 'https://github.com/WENSHAO521/posi-data/blob/master/PJR-SPEC.md' },
  },
  {
    title: 'Open Engine',
    body: 'The code that turns posi-data\'s records into rankings is itself open source and tested. Check out a pinned commit, run it against the pinned data commit, and you should get the same numbers POSI published.',
    repo: { label: 'posi-engine', href: 'https://github.com/WENSHAO521/posi-engine' },
  },
]

const AUDITS = [
  {
    name: 'Initial Journal Migration Audit v0.1',
    status: 'Published',
    desc: 'Read-only dry-run audit of the legacy journal corpus before any cleanup — 23,822 source records, 23,819 candidate entities, 0 hard identity conflicts.',
    href: 'https://github.com/WENSHAO521/posi-data/tree/master/audits/migrations/initial-journal-migration',
  },
  {
    name: 'OpenAlex Enrichment Audit v0.2',
    status: 'In progress',
    desc: 'OpenAlex Source ID / ISSN-L enrichment over the v0.1 candidate entities, and re-scoring of possible-duplicate groups using that evidence.',
    href: null,
  },
]

export default function OpenDataPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <nav className="text-xs flex items-center gap-1.5" style={{ color: 'var(--posi-muted)' }}>
        <Link href="/" className="hover:text-gray-700">Home</Link>
        <span>/</span>
        <span style={{ color: 'var(--posi-text)' }}>Open Data</span>
      </nav>

      <div className="border-l-4 pl-5" style={{ borderColor: 'var(--posi-accent)' }}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5" style={{ color: 'var(--posi-accent)', border: '1px solid var(--posi-accent)' }}>OPEN DATA</span>
        </div>
        <h1 className="text-2xl font-bold leading-tight" style={{ color: 'var(--posi-text)' }}>Open Data, Open Methodology, Open Engine</h1>
        <p className="text-sm leading-relaxed mt-2 max-w-2xl" style={{ color: 'var(--posi-muted)' }}>
          POSI does not compute its rankings behind closed doors. The data, the formulas, and the code
          are all public — this is POSI's core differentiator from proprietary indices, not a side feature.
        </p>
      </div>

      <section className="grid sm:grid-cols-3 gap-4">
        {PILLARS.map(p => (
          <div key={p.title} className="bg-white p-5" style={{ border: '1px solid var(--posi-border)' }}>
            <h2 className="text-xs font-bold uppercase tracking-[0.1em] mb-2" style={{ color: 'var(--posi-text)' }}>{p.title}</h2>
            <p className="text-[11px] leading-relaxed mb-3" style={{ color: 'var(--posi-muted)' }}>{p.body}</p>
            <a
              href={p.repo.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium hover:underline"
              style={{ color: 'var(--posi-accent)' }}
            >
              {p.repo.label} <ArrowSquareOut className="h-3 w-3" />
            </a>
          </div>
        ))}
      </section>

      <section className="bg-white" style={{ border: '1px solid var(--posi-border)' }}>
        <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--posi-border-light)', background: 'var(--posi-bg)' }}>
          <h2 className="text-xs font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--posi-muted)' }}>Migration Audits</h2>
        </div>
        <div className="divide-y" style={{ divideColor: 'var(--posi-border-light)' } as React.CSSProperties}>
          {AUDITS.map(a => (
            <div key={a.name} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold" style={{ color: 'var(--posi-text)' }}>{a.name}</p>
                  <span
                    className="text-[9px] font-medium px-1.5 py-0.5"
                    style={
                      a.status === 'Published'
                        ? { background: '#f0fdf4', color: '#1F7A4D', border: '1px solid #bbf7d0' }
                        : { background: '#fefce8', color: '#92400e', border: '1px solid #fde68a' }
                    }
                  >
                    {a.status}
                  </span>
                </div>
                <p className="text-[11px] mt-1" style={{ color: 'var(--posi-muted)' }}>{a.desc}</p>
              </div>
              {a.href && (
                <a
                  href={a.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-xs font-medium hover:underline inline-flex items-center gap-1"
                  style={{ color: 'var(--posi-accent)' }}
                >
                  View →
                </a>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white" style={{ border: '1px solid var(--posi-border)' }}>
        <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--posi-border-light)', background: 'var(--posi-bg)' }}>
          <h2 className="text-xs font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--posi-muted)' }}>License — Code and Data Are Licensed Separately</h2>
        </div>
        <table className="w-full text-xs">
          <tbody>
            {[
              { what: 'POSI Engine', desc: 'The posi-engine calculation code itself', license: 'MIT' },
              { what: 'POSI-produced data', desc: 'Taxonomy (PSC), metric snapshots, and rankings POSI computes and publishes', license: 'CC BY 4.0' },
              { what: 'Aggregated upstream metadata', desc: 'Journal records sourced from Crossref, OpenAlex, DOAJ, ROR, etc.', license: 'Source-specific — see each record\'s provenance field' },
            ].map(row => (
              <tr key={row.what} style={{ borderBottom: '1px solid var(--posi-border-light)' }}>
                <td className="px-5 py-3 font-semibold whitespace-nowrap" style={{ color: 'var(--posi-text)' }}>{row.what}</td>
                <td className="px-4 py-3" style={{ color: 'var(--posi-muted)' }}>{row.desc}</td>
                <td className="px-5 py-3 text-right font-mono font-bold whitespace-nowrap" style={{ color: 'var(--posi-accent)' }}>{row.license}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="px-5 py-3 text-[10px]" style={{ color: 'var(--posi-muted)', borderTop: '1px solid var(--posi-border-light)' }}>
          POSI does not relabel third-party open data as its own — see posi-data's{' '}
          <a href="https://github.com/WENSHAO521/posi-data/blob/master/LICENSE-DATA" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: 'var(--posi-accent)' }}>LICENSE-DATA</a>{' '}
          for the full, authoritative terms.
        </p>
      </section>

      <div className="flex flex-wrap gap-5 text-xs">
        <Link href="/core-collection" style={{ color: 'var(--posi-accent)' }} className="hover:underline">POSI Core Collection →</Link>
        <Link href="/subjects" style={{ color: 'var(--posi-accent)' }} className="hover:underline">PSC Subject Classification →</Link>
        <Link href="/citation-reports" style={{ color: 'var(--posi-accent)' }} className="hover:underline">Citation Reports →</Link>
        <Link href="/data-sources" style={{ color: 'var(--posi-accent)' }} className="hover:underline">External Data Sources →</Link>
      </div>
    </div>
  )
}
