import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'What POSI Is Not | POSI',
  description: 'POSI is not licensed from or affiliated with Web of Science, Scopus, or DOAJ, not an accreditation authority, and not a substitute for evaluating individual researchers.',
}

const WHAT_IT_IS_NOT = [
  {
    claim: 'Licensed from or affiliated with Web of Science or Scopus',
    why: 'WoS and Scopus are commercial, proprietary citation databases. POSI does not license their data, reproduce their metrics, or claim equivalence — PCI, PCS, and POSI\'s subject rankings are POSI\'s own openly-defined, reproducible metrics, computed from open data (OpenAlex, Crossref), not a free substitute for Journal Impact Factor or CiteScore.',
  },
  {
    claim: 'An accreditation authority',
    why: 'A POSI record — Discovered, Indexed, or Metric Eligible — is not a certification. It does not constitute DOAJ listing, COPE membership, peer-review verification, or any other external accreditation.',
  },
  {
    claim: 'A seller of rankings or guaranteed inclusion',
    why: 'Admission, scores, rankings, and quartiles are computed by open, versioned methodology and code. No payment, sponsorship, or relationship with POSI or Panorama Scholarly Group changes a journal\'s evidence, score, or rank.',
  },
  {
    claim: 'A peer review certifier or article validator',
    why: 'POSI does not assess the scientific quality of individual articles, verify reviewer credentials, or certify that peer review occurred for any given article. Automated evidence checks assess the existence of publicly stated policies and structural signals in published output, not scientific correctness.',
  },
  {
    claim: 'A substitute for evaluating individual researchers, hiring, or funding decisions',
    why: 'PQF, PCI/PCS, and Early-Stage Rating are journal-level and infrastructure-level metrics. None of them are designed or validated for assessing an individual researcher\'s output, and POSI explicitly asks users not to use them that way — see Responsible Use.',
  },
]

const COMPARISONS = [
  {
    service: 'Web of Science',
    operator: 'Clarivate',
    scope: 'Citation database, ~21,000 journals',
    whatItDoes: 'Citation indexing, Impact Factor, JCR',
    posiRelation: 'No overlap. POSI does not compute Impact Factors.',
  },
  {
    service: 'Scopus',
    operator: 'Elsevier',
    scope: 'Citation database, ~27,000 journals',
    whatItDoes: 'Citation indexing, CiteScore, SNIP',
    posiRelation: 'No overlap. POSI is not a citation index.',
  },
  {
    service: 'DOAJ',
    operator: 'Infrastructure Services for Open Access (IS4OA)',
    scope: 'OA journal directory, ~21,000 journals',
    whatItDoes: 'OA certification, editorial standards',
    posiRelation: 'External metadata only. DOAJ listing status contributes zero weight to POSI admission, scores, rankings, or quartiles.',
  },
  {
    service: 'Crossref',
    operator: 'Crossref',
    scope: 'DOI registration, ~150M records',
    whatItDoes: 'DOI assignment, metadata registry',
    posiRelation: 'Data source. POSI queries Crossref for DOI and article metadata.',
  },
]

export default function WhatPosiIsNotPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      <nav className="text-xs flex items-center gap-1.5" style={{ color: 'var(--posi-muted)' }}>
        <Link href="/" className="hover:text-gray-700">Home</Link>
        <span>/</span>
        <Link href="/about" className="hover:text-gray-700">About</Link>
        <span>/</span>
        <span style={{ color: 'var(--posi-text)' }}>What POSI Is Not</span>
      </nav>

      <div className="border-l-4 border-[#c41e3a] pl-5">
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">What POSI Is Not</h1>
        <p className="text-sm text-gray-500 mt-2 max-w-2xl leading-relaxed">
          Knowing what POSI does not do is as important as knowing what it does.
          These are explicit, documented limitations, not disclaimers.
        </p>
      </div>

      {/* COI warning */}
      <div className="p-4" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
        <p className="text-[11px] leading-relaxed" style={{ color: '#78350F' }}>
          <strong>Conflict of Interest:</strong> POSI is operated by Panorama Scholarly Group Ltd. (PSG),
          which also publishes the majority of journals currently evaluated on this platform.
          See the <Link href="/coi" className="underline">full COI Disclosure</Link> for details.
        </p>
      </div>

      {/* What it is not — expanded */}
      <div className="space-y-3">
        {WHAT_IT_IS_NOT.map((item, i) => (
          <div key={i} className="bg-white p-5" style={{ border: '1px solid var(--posi-border)', borderLeft: '3px solid #c41e3a' }}>
            <div className="flex items-start gap-3">
              <span className="text-xs font-mono font-bold shrink-0 mt-0.5" style={{ color: '#c41e3a' }}>✗</span>
              <div>
                <h2 className="text-sm font-semibold mb-1.5" style={{ color: 'var(--posi-text)' }}>{item.claim}</h2>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--posi-muted)' }}>{item.why}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Comparison table */}
      <section className="bg-white overflow-x-auto" style={{ border: '1px solid var(--posi-border)' }}>
        <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--posi-border-light)' }}>
          <h2 className="text-xs font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--posi-muted)' }}>POSI vs. Other Services</h2>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ background: 'var(--posi-bg)', borderBottom: '1px solid var(--posi-border-light)' }}>
              <th className="text-left px-5 py-2.5 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>Service</th>
              <th className="text-left px-4 py-2.5 font-semibold uppercase tracking-[0.07em] hidden sm:table-cell" style={{ color: 'var(--posi-muted)' }}>Operator</th>
              <th className="text-left px-4 py-2.5 font-semibold uppercase tracking-[0.07em] hidden md:table-cell" style={{ color: 'var(--posi-muted)' }}>Primary Function</th>
              <th className="text-left px-4 py-2.5 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>POSI Relationship</th>
            </tr>
          </thead>
          <tbody>
            {COMPARISONS.map(row => (
              <tr key={row.service} style={{ borderBottom: '1px solid var(--posi-border-light)' }}>
                <td className="px-5 py-3 font-semibold" style={{ color: 'var(--posi-text)' }}>{row.service}</td>
                <td className="px-4 py-3 hidden sm:table-cell" style={{ color: 'var(--posi-muted)' }}>{row.operator}</td>
                <td className="px-4 py-3 hidden md:table-cell" style={{ color: 'var(--posi-muted)' }}>{row.whatItDoes}</td>
                <td className="px-4 py-3" style={{ color: 'var(--posi-muted)' }}>{row.posiRelation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Use guidance */}
      <section className="bg-white p-5" style={{ border: '1px solid var(--posi-border)' }}>
        <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--posi-text)' }}>How to Use POSI Appropriately</h2>
        <ul className="space-y-2">
          {[
            'Do not use PQF scores as the sole basis for journal selection, hiring decisions, or research evaluation.',
            'Always verify journal credentials against DOAJ, Scopus, or Web of Science for publication decisions.',
            'Treat PQF scores for PSG-published journals with awareness of the structural conflict of interest.',
            'Use POSI alongside, not instead of, established indexing and accreditation services.',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-xs leading-relaxed" style={{ color: 'var(--posi-muted)' }}>
              <span className="shrink-0 font-mono mt-0.5" style={{ color: 'var(--posi-accent)' }}>-</span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-wrap gap-4 text-xs">
        <Link href="/what-posi-is" style={{ color: 'var(--posi-accent)' }} className="hover:underline">What POSI Is →</Link>
        <Link href="/responsible-use" style={{ color: 'var(--posi-accent)' }} className="hover:underline">Responsible Use Notice →</Link>
        <Link href="/coi" style={{ color: 'var(--posi-accent)' }} className="hover:underline">Conflict of Interest Disclosure →</Link>
      </div>
    </div>
  )
}
