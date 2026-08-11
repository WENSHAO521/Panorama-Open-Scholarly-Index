import Link from 'next/link'
import { PSG_JOURNALS, getCoreCollection } from '@/lib/data'

export const metadata = {
  title: 'About POSI | Panorama Open Scholarly Index',
  description: 'About the Panorama Open Scholarly Index (POSI) — an open scholarly indexing, journal analytics, and automated evaluation infrastructure.',
}

export default function AboutPage() {
  const coreCollectionCount = getCoreCollection().length
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div>
        <nav className="text-xs flex items-center gap-1.5 mb-5" style={{ color: 'var(--posi-muted)' }}>
          <Link href="/" className="hover:text-gray-700 transition-colors">Home</Link>
          <span>/</span>
          <span style={{ color: 'var(--posi-text)' }}>About</span>
        </nav>
        <div className="flex items-center gap-3 mb-3">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--posi-text)' }}>About POSI</h1>
          <span className="text-[10px] font-bold px-2 py-0.5 tracking-wide" style={{ background: 'var(--posi-accent)', color: '#fff' }}>
            v2.0
          </span>
        </div>
        <p className="text-sm leading-relaxed max-w-2xl" style={{ color: 'var(--posi-muted)' }}>
          The Panorama Open Scholarly Index (POSI) is an open scholarly indexing, journal analytics, and
          automated evaluation infrastructure. It provides transparent journal coverage, evidence-based
          automated ratings, open citation metrics, subject classification, and reproducible journal
          rankings. POSI's data, methodology, and calculation code are openly documented and versioned.
          External database inclusion (DOAJ, Scopus, Web of Science, PubMed) does not determine POSI
          admission, scores, rankings, or quartiles.
        </p>
      </div>

      {/* Mission */}
      <div className="bg-white p-6" style={{ border: '1px solid var(--posi-border)' }}>
        <h2 className="text-base font-bold mb-3" style={{ color: 'var(--posi-text)' }}>Mission</h2>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--posi-muted)' }}>
          POSI exists to make scholarly publishing infrastructure more transparent, reproducible, and
          machine-readable. We aggregate openly licensed metadata from multiple sources, apply automated
          evaluation methodology that no person can hand-adjust, and publish the results — data, engine,
          and methodology alike — as versioned open infrastructure. Our goal is to help researchers,
          librarians, and institutions make better-informed decisions about where to publish and what to
          cite. POSI is designed as an independent open infrastructure with its own coverage,
          methodology, ratings, and citation analytics.
        </p>
      </div>

      {/* What POSI is / is not */}
      <div id="what-posi-is" className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-5" style={{ border: '1px solid var(--posi-border)' }}>
          <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--posi-text)' }}>What POSI Is</h2>
          <ul className="space-y-2">
            {[
              'An open journal discovery and indexing infrastructure',
              'The POSI Core Collection — editorially admitted, reviewed journal coverage',
              'AJR (POSI Automated Rating) — an automated, evidence-based journal lifecycle rating system',
              'Open citation metrics (PCI/PCS) and subject-based journal rankings',
              'Open data, open methodology, and an open-source calculation engine',
              'Versioned and auditable — every figure traces to a pinned commit',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs leading-relaxed" style={{ color: 'var(--posi-muted)' }}>
                <span className="shrink-0 font-mono text-[10px] mt-0.5" style={{ color: '#1F7A4D' }}>✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div id="what-posi-is-not" className="bg-white p-5" style={{ border: '1px solid var(--posi-border)' }}>
          <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--posi-text)' }}>What POSI Is Not</h2>
          <ul className="space-y-2">
            {[
              'An accreditation authority — a POSI record is not a certification',
              'A seller of rankings or guaranteed inclusion',
              'A substitute for evaluating individual researchers, hiring, or funding decisions',
              'Influenced by external database inclusion — DOAJ/Scopus/WoS listing affects no POSI score, ranking, or quartile',
              'A certifier of any individual article\'s scientific validity',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs leading-relaxed" style={{ color: 'var(--posi-muted)' }}>
                <span className="shrink-0 font-mono text-[10px] mt-0.5" style={{ color: '#c41e3a' }}>✗</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Conflict of interest */}
      <div className="p-5" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
        <h2 className="text-sm font-bold mb-2" style={{ color: '#92400E' }}>Conflict of Interest Disclosure</h2>
        <p className="text-xs leading-relaxed" style={{ color: '#78350F' }}>
          POSI is operated by Panorama Scholarly Group Ltd. (PSG). {PSG_JOURNALS.length} of the{' '}
          {coreCollectionCount} journals in the POSI Core Collection are PSG-affiliated publications
          (see the <Link href="/coi" className="underline">full Conflict of Interest Disclosure →</Link>{' '}
          for the itemized list). PSG editors, staff, and affiliates may have
          a financial or reputational interest in the journals evaluated. POSI ratings, ranks,
          percentiles, and quartiles are generated by versioned calculation code. No publisher,
          reviewer, administrator, sponsor, or affiliated organization may manually override a
          published numerical result. Users should account for this relationship when interpreting
          scores and should not use POSI ratings as the sole basis for publication or citation
          decisions.
        </p>
      </div>

      {/* Operator */}
      <div id="operator" className="bg-white p-6" style={{ border: '1px solid var(--posi-border)' }}>
        <h2 className="text-base font-bold mb-4" style={{ color: 'var(--posi-text)' }}>Operator</h2>
        <div className="grid sm:grid-cols-2 gap-4 text-xs" style={{ color: 'var(--posi-muted)' }}>
          <div className="space-y-1">
            <p className="font-semibold" style={{ color: 'var(--posi-text)' }}>Panorama Scholarly Group Ltd.</p>
            <p>Room 1508, 15/F., Office Tower Two</p>
            <p>Grand Plaza, 625 Nathan Road</p>
            <p>Kowloon, Hong Kong</p>
          </div>
          <div className="space-y-2">
            <p>
              <span className="font-medium">Record review &amp; submissions: </span>
              <a href="mailto:posi@panorama-sg.com" className="hover:underline" style={{ color: 'var(--posi-accent)' }}>
                posi@panorama-sg.com
              </a>
            </p>
            <p>
              <span className="font-medium">Website: </span>
              <a href="https://panorama-sg.com" target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: 'var(--posi-accent)' }}>
                panorama-sg.com
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Research & Development */}
      <div className="bg-white p-6" style={{ border: '1px solid var(--posi-border)' }}>
        <h2 className="text-base font-bold mb-4" style={{ color: 'var(--posi-text)' }}>Research &amp; Development</h2>
        <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--posi-muted)' }}>
          POSI is developed under Panorama Research Institute, which is a name for PSG's internal research
          and academic development activities — not an independent academic institution, third-party
          validator, or accrediting body, and not a separate legal entity from Panorama Scholarly Group Ltd.
          Its stated focus includes scholarly publishing studies, journal indexing and evaluation, and the
          development of global scholarly communication infrastructure; POSI is listed among its active
          projects. See the <Link href="/operator" className="underline">Operator disclosure →</Link> for
          the full governance picture, including that POSI has no external advisory board or independent
          editorial committee.
        </p>
        <a
          href="https://research.panorama-sg.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs hover:underline inline-flex items-center gap-1"
          style={{ color: 'var(--posi-accent)' }}
        >
          research.panorama-sg.com →
        </a>
      </div>

      {/* Data & Methodology */}
      <div className="bg-white p-6" style={{ border: '1px solid var(--posi-border)' }}>
        <h2 className="text-base font-bold mb-3" style={{ color: 'var(--posi-text)' }}>Data &amp; Methodology</h2>
        <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--posi-muted)' }}>
          POSI aggregates metadata from openly licensed third-party infrastructure providers including
          Crossref, OpenAlex, DOAJ, OpenCitations, ROR, and ORCID. Source identifiers and provenance
          are preserved wherever available.
        </p>
        <div className="flex flex-wrap gap-3 text-xs">
          {[
            { label: 'AJR Methodology', href: '/ratings' },
            { label: 'Editorial Selection', href: '/pqf' },
            { label: 'Evidence Registry', href: '/evidence' },
            { label: 'Data Sources', href: '/data-sources' },
            { label: 'API & Export', href: '/api' },
          ].map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-1.5 font-medium transition-colors hover:text-white hover:bg-[#c41e3a]"
              style={{ border: '1px solid var(--posi-border)', color: 'var(--posi-accent)' }}
            >
              {link.label} →
            </Link>
          ))}
        </div>
      </div>

      {/* License — mirrors /open-data's three-way split exactly */}
      <div className="text-xs leading-relaxed" style={{ color: 'var(--posi-muted)' }}>
        <p className="mb-2">
          <strong style={{ color: 'var(--posi-text)' }}>POSI Engine</strong> (calculation code): MIT.{' '}
          <strong style={{ color: 'var(--posi-text)' }}>POSI-produced data</strong> (taxonomy, metric
          snapshots, rankings): <a
            href="https://creativecommons.org/licenses/by/4.0/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
            style={{ color: 'var(--posi-accent)' }}
          >CC BY 4.0</a>.{' '}
          <strong style={{ color: 'var(--posi-text)' }}>Aggregated upstream metadata</strong> (Crossref,
          OpenAlex, DOAJ, ROR, etc.): source-specific — see{' '}
          <Link href="/open-data" className="hover:underline" style={{ color: 'var(--posi-accent)' }}>Open Data →</Link>{' '}
          for the full, authoritative breakdown.
        </p>
        <p>POSI is not affiliated with Web of Science, Scopus, Clarivate, Elsevier, or DOAJ.</p>
      </div>
    </div>
  )
}
