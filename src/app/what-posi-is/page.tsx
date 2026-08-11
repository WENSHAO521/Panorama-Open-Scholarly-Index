import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'What POSI Is | POSI',
  description: 'POSI is an open scholarly indexing, journal analytics, and automated evaluation infrastructure. Learn what POSI does and how to use it.',
}

const WHAT_IT_IS = [
  {
    title: 'An open journal discovery and indexing infrastructure',
    body: 'POSI aggregates openly licensed metadata from Crossref, OpenAlex, OpenCitations, DOAJ, ROR, and ORCID, and distinguishes clearly between Discovered (found, unreviewed) and the POSI Core Collection (editorially admitted). See Core Collection for the full coverage model.',
  },
  {
    title: 'An automated, evidence-based journal rating system',
    body: 'Early-Stage Rating computes a 100-point journal score entirely from crawled site evidence and sampled Crossref article metadata — no reviewer, editor, publisher, sponsor, or POSI administrator has a way to directly set a score, percentile, or quartile. Only the underlying evidence can be corrected, which triggers a recompute.',
  },
  {
    title: 'Open citation metrics and subject rankings',
    body: 'PCI and PCS are POSI\'s own openly-defined citation-impact metrics, computed from open data (OpenAlex, Crossref) — not licensed from or equivalent to Journal Impact Factor or CiteScore. Subject rankings and quartiles are computed within POSI\'s own subject classification (PSC).',
  },
  {
    title: 'Open data, open methodology, and an open-source calculation engine',
    body: 'POSI-produced data (taxonomy, metric snapshots, rankings) is published under CC BY 4.0; the calculation engine is MIT-licensed; aggregated upstream metadata retains its original source\'s license. Every figure traces to a pinned data and engine commit — see Open Data.',
  },
  {
    title: 'A research transparency initiative',
    body: 'POSI is designed to make scholarly publishing infrastructure more transparent, reproducible, and machine-readable. Our goal is to help researchers, librarians, and institutions make better-informed decisions about where to publish and what to cite.',
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
    audience: 'Institutions (libraries, publishing offices)',
    use: 'Use PQF as one input when assessing individual journals for collection development or OA-fund eligibility — always combined with other sources (DOAJ, Scopus, WoS). Not for ranking institutions, departments, or researchers; see Responsible Use.',
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
          The Panorama Open Scholarly Index (POSI) is an open scholarly indexing, journal analytics,
          and automated evaluation infrastructure. Here is precisely what it does, what it provides,
          and who it is designed to serve.
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
          POSI exists to make scholarly publishing infrastructure more transparent, reproducible, and
          machine-readable. We aggregate openly licensed metadata, apply automated evaluation methodology
          that no person can hand-adjust, and publish the results — data, engine, and methodology alike —
          as versioned open infrastructure. Our goal is to help the scholarly community make
          better-informed decisions without replacing or competing with established indexing services.
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
              POSI is not licensed from or affiliated with Web of Science, Scopus, or DOAJ, not an
              accreditation authority, not a peer review certifier, and not a substitute for evaluating
              individual researchers.
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
