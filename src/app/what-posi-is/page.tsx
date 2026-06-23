import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'What POSI Is | POSI',
  description: 'POSI is an open scholarly metadata platform for journal transparency, metadata quality assessment, and citation visibility. Learn what POSI does and how to use it.',
}

const WHAT_IT_IS = [
  {
    title: 'An open metadata aggregation platform',
    body: 'POSI aggregates openly licensed metadata from Crossref, OpenAlex, DOAJ, OAI-PMH, ROR, and ORCID into a single searchable index. All records include source attribution and provenance.',
  },
  {
    title: 'A metadata quality assessment tool (PQF)',
    body: 'The POSI Quality Framework (PQF) evaluates journals across six subfactors: transparency, metadata completeness, editorial governance, technical discoverability, citation visibility, and research integrity. All criteria are binary and publicly auditable.',
  },
  {
    title: 'A discoverability layer for PSG-affiliated journals',
    body: 'POSI provides detailed journal and article records for journals published by Panorama Scholarly Group, including OAI-PMH harvested metadata, DOI coverage, and PQF scores. A conflict of interest disclosure accompanies all PSG-related records.',
  },
  {
    title: 'A freely reusable dataset under CC BY 4.0',
    body: 'All curated metadata produced by POSI is published under Creative Commons Attribution 4.0. Third-party metadata is attributed to its original source. Bulk exports are planned via a public API.',
  },
  {
    title: 'A research transparency initiative',
    body: 'POSI is designed to make scholarly publishing infrastructure more transparent and machine-readable. Our goal is to help researchers, librarians, and institutions make better-informed decisions about where to publish and what to cite.',
  },
  {
    title: 'A platform built on open infrastructure',
    body: 'POSI only aggregates data from openly licensed sources: Crossref (CC0), OpenAlex (CC0), DOAJ (CC BY-SA), ROR (CC0), ORCID (CC0). No proprietary or paywalled data sources are used.',
  },
]

const WHO_SHOULD_USE = [
  {
    audience: 'Researchers',
    use: 'Verify journal metadata quality and discoverability before submission. Check DOI coverage and open citation status.',
  },
  {
    audience: 'Librarians',
    use: 'Assess journal transparency, licensing, and editorial governance as part of collection evaluation or open access advisory work.',
  },
  {
    audience: 'Institutions',
    use: 'Use PQF scores as one signal in journal evaluation frameworks. Always combine with other sources (DOAJ, Scopus, WoS).',
  },
  {
    audience: 'Developers',
    use: 'Access structured metadata via the planned public API. Export records in JSON, CSV, BibTeX, or RIS formats.',
  },
  {
    audience: 'Journal Editors',
    use: 'Identify metadata gaps and policy improvements. Use the PQF rubric as a self-assessment checklist.',
  },
]

export default function WhatPosiIsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      <nav className="text-xs flex items-center gap-1.5" style={{ color: 'var(--posi-muted)' }}>
        <Link href="/" className="hover:text-gray-700">Home</Link>
        <span>/</span>
        <Link href="/about" className="hover:text-gray-700">About</Link>
        <span>/</span>
        <span style={{ color: 'var(--posi-text)' }}>What POSI Is</span>
      </nav>

      <div className="border-l-4 border-[#c41e3a] pl-5">
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">What POSI Is</h1>
        <p className="text-sm text-gray-500 mt-2 max-w-2xl leading-relaxed">
          The Panorama Open Scholarly Index (POSI) is an open scholarly metadata platform.
          Here is precisely what it does, what it provides, and who it is designed to serve.
        </p>
      </div>

      {/* What it is — expanded cards */}
      <div className="space-y-3">
        {WHAT_IT_IS.map((item, i) => (
          <div key={i} className="bg-white p-5" style={{ border: '1px solid var(--posi-border)', borderLeft: '3px solid #1F7A4D' }}>
            <div className="flex items-start gap-3">
              <span className="text-xs font-mono font-bold shrink-0 mt-0.5" style={{ color: '#1F7A4D' }}>✓</span>
              <div>
                <h2 className="text-sm font-semibold mb-1.5" style={{ color: 'var(--posi-text)' }}>{item.title}</h2>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--posi-muted)' }}>{item.body}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mission */}
      <section className="bg-white p-6" style={{ border: '1px solid var(--posi-border)' }}>
        <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--posi-text)' }}>Mission</h2>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--posi-muted)' }}>
          POSI exists to make scholarly publishing infrastructure more transparent and machine-readable.
          We aggregate openly licensed metadata from multiple sources, apply structured quality assessments,
          and publish the results freely under CC BY 4.0. Our goal is to help the scholarly community
          make better-informed decisions without replacing or competing with established indexing services.
        </p>
      </section>

      {/* Who should use it */}
      <section className="bg-white" style={{ border: '1px solid var(--posi-border)' }}>
        <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--posi-border-light)' }}>
          <h2 className="text-xs font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--posi-muted)' }}>Who Should Use POSI</h2>
        </div>
        <div className="divide-y" style={{ borderColor: 'var(--posi-border-light)' }}>
          {WHO_SHOULD_USE.map(row => (
            <div key={row.audience} className="px-5 py-3 flex items-start gap-4">
              <span className="text-xs font-semibold shrink-0 w-28" style={{ color: 'var(--posi-text)' }}>{row.audience}</span>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--posi-muted)' }}>{row.use}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Cross-link to What POSI Is Not */}
      <div className="p-5 bg-white" style={{ border: '1px solid var(--posi-border)' }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold mb-1" style={{ color: 'var(--posi-text)' }}>What POSI Is Not</h2>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--posi-muted)' }}>
              POSI is not a replacement for Web of Science, Scopus, or DOAJ. It is not an Impact Factor service,
              a peer review certifier, or an article validator.
            </p>
          </div>
          <Link
            href="/what-posi-is-not"
            className="px-3 py-1.5 text-xs font-medium whitespace-nowrap hover:opacity-80 transition-opacity shrink-0"
            style={{ background: 'var(--posi-bg)', color: 'var(--posi-accent)', border: '1px solid var(--posi-border)' }}
          >
            Read more →
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-xs">
        <Link href="/about" style={{ color: 'var(--posi-accent)' }} className="hover:underline">About POSI →</Link>
        <Link href="/pqf" style={{ color: 'var(--posi-accent)' }} className="hover:underline">PQF Methodology →</Link>
        <Link href="/responsible-use" style={{ color: 'var(--posi-accent)' }} className="hover:underline">Responsible Use →</Link>
      </div>
    </div>
  )
}
