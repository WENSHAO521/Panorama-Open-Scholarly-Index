import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Use | POSI',
  description: 'Terms governing use of posi.panorama-sg.com, the data license for POSI metadata, and disclaimers applicable during the pre-operational pilot phase.',
}

const SECTIONS = [
  {
    heading: 'Acceptance',
    body: 'By accessing posi.panorama-sg.com ("POSI"), you agree to these terms. POSI is operated by Panorama Scholarly Group Ltd. ("Panorama", "we", "us"), a Hong Kong SAR entity. If you do not agree, do not use the site.',
  },
  {
    heading: 'Pre-Operational Pilot Status',
    body: 'POSI is currently in a pre-operational pilot phase. Several ranking and citation methodologies (including AJR, PJR, and related quartile/percentile figures) are explicitly labeled Preview, in progress, or Public Beta on the pages where they appear, and are not yet finalized. Do not treat any score, ranking, or badge on this site as a final, official, or accredited determination until the site itself states otherwise.',
  },
  {
    heading: 'No Warranty',
    body: 'POSI data is provided "as is," aggregated and computed from third-party public sources (Crossref, OpenAlex, DOAJ, ROR, ORCID, OpenCitations, and publisher-disclosed policies) plus original scoring methodology. We make reasonable efforts toward accuracy but do not warrant that any record, score, or evidence citation is complete, current, or error-free. See the Evidence and Coverage pages for how records are sourced and verified.',
    links: [{ href: '/evidence', label: 'Evidence' }, { href: '/coverage/policy', label: 'Coverage Policy' }],
  },
  {
    heading: 'Permitted and Prohibited Use',
    body: 'What POSI scores and indicators are and are not intended to be used for — including a specific list of prohibited uses such as hiring, promotion, tenure, and funding decisions — is set out in the Responsible Use Notice, which is incorporated into these terms by reference.',
    links: [{ href: '/responsible-use', label: 'Responsible Use Notice' }],
  },
  {
    heading: 'Data License',
    body: 'Curated POSI metadata is made available under CC BY 4.0 unless a specific page states otherwise. You may reuse and redistribute it with attribution to POSI and to the underlying data sources (Crossref, OpenAlex, DOAJ) as shown in each record\'s provenance fields. This license covers the data; it does not cover the POSI name, logo, or site design.',
  },
  {
    heading: 'Conflict of Interest',
    body: 'Panorama Scholarly Group also publishes journals that appear in POSI\'s own records. This relationship, and how it is managed, is fully disclosed on the Conflict of Interest page.',
    links: [{ href: '/coi', label: 'Conflict of Interest Disclosure' }],
  },
  {
    heading: 'External Links and Third-Party Sites',
    body: 'POSI links to publisher websites, DOI resolvers, and third-party data infrastructure. We are not responsible for the content, accuracy, or availability of external sites.',
  },
  {
    heading: 'Limitation of Liability',
    body: 'To the fullest extent permitted by law, Panorama Scholarly Group Ltd. is not liable for decisions made in reliance on POSI data, including during the pre-operational pilot phase when methodology is explicitly marked as unfinished.',
  },
  {
    heading: 'Governing Law',
    body: 'These terms are governed by the laws of Hong Kong SAR, without regard to conflict-of-law principles.',
  },
  {
    heading: 'Changes',
    body: 'We may update these terms as POSI moves from pre-operational pilot to full operation. Material changes will be reflected on this page with an updated date below.',
  },
]

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      <nav className="text-xs flex items-center gap-1.5" style={{ color: 'var(--posi-muted)' }}>
        <Link href="/" className="hover:text-gray-700">Home</Link>
        <span>/</span>
        <span style={{ color: 'var(--posi-text)' }}>Terms of Use</span>
      </nav>

      <div className="border-l-4 pl-5" style={{ borderColor: 'var(--posi-accent)' }}>
        <h1 className="text-2xl font-bold leading-tight" style={{ color: 'var(--posi-text)' }}>Terms of Use</h1>
        <p className="text-sm leading-relaxed mt-2 max-w-2xl" style={{ color: 'var(--posi-muted)' }}>
          These terms govern use of posi.panorama-sg.com. They should be read together with the{' '}
          <Link href="/responsible-use" className="underline">Responsible Use Notice</Link> and{' '}
          <Link href="/coi" className="underline">Conflict of Interest Disclosure</Link>.
        </p>
      </div>

      {SECTIONS.map(section => (
        <section key={section.heading} className="bg-white p-5" style={{ border: '1px solid var(--posi-border)' }}>
          <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--posi-text)' }}>{section.heading}</h2>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--posi-muted)' }}>
            {section.body}
            {section.links && (
              <>
                {' '}
                {section.links.map((l, j) => (
                  <span key={l.href}>
                    {j > 0 && ' · '}
                    <Link href={l.href} className="hover:underline" style={{ color: 'var(--posi-accent)' }}>{l.label} →</Link>
                  </span>
                ))}
              </>
            )}
          </p>
        </section>
      ))}

      <section className="bg-white p-5" style={{ border: '1px solid var(--posi-border)' }}>
        <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--posi-text)' }}>Contact</h2>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--posi-muted)' }}>
          Questions about these terms can be sent to{' '}
          <a href="mailto:posi@panorama-sg.com" className="hover:underline" style={{ color: 'var(--posi-accent)', fontFamily: 'var(--font-mono)' }}>
            posi@panorama-sg.com
          </a>.
        </p>
      </section>

      <p className="text-[11px]" style={{ color: 'var(--posi-muted)', fontFamily: 'var(--font-mono)' }}>
        Last updated: 2026-08-12
      </p>

      <div className="flex flex-wrap gap-5 text-xs">
        <Link href="/privacy" style={{ color: 'var(--posi-accent)' }} className="hover:underline">Privacy Policy →</Link>
        <Link href="/responsible-use" style={{ color: 'var(--posi-accent)' }} className="hover:underline">Responsible Use Notice →</Link>
        <Link href="/operator" style={{ color: 'var(--posi-accent)' }} className="hover:underline">Operator Information →</Link>
      </div>

    </div>
  )
}
