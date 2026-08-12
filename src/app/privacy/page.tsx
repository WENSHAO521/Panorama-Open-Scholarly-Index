import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | POSI',
  description: 'What data posi.panorama-sg.com collects, what it does not collect, and how to reach POSI with a privacy question.',
}

const SECTIONS = [
  {
    heading: 'What POSI Is, Technically',
    body: [
      'POSI (posi.panorama-sg.com) is a statically generated website: every page is built in advance from public journal, citation, and metadata records and served as plain files. There is no user login system, no database that stores visitor information, and no server-side application processing requests on a per-visitor basis.',
    ],
  },
  {
    heading: 'Data We Do Not Collect',
    body: [
      'POSI does not set cookies, does not use browser local storage or session storage to track you, does not run any third-party analytics or advertising script, and does not build visitor profiles. You do not need to create an account or provide any personal information to search, browse, or read any journal record on this site.',
    ],
  },
  {
    heading: 'Hosting-Level Server Logs',
    body: [
      'POSI is hosted on Cloudflare Pages. Like virtually any web host, Cloudflare’s edge network processes standard connection metadata (IP address, requested URL, timestamp, user agent) to serve pages and protect the site from abuse. POSI does not have a separate analytics layer on top of this — if this changes (for example, if we enable Cloudflare Web Analytics or a similar privacy-respecting, cookie-less tool to understand traffic during the pre-operational period), this policy will be updated first.',
    ],
  },
  {
    heading: 'Information You Choose to Send Us',
    body: [
      'The Contact and Submit Journal pages route to posi@panorama-sg.com as a plain email link (mailto:) — POSI does not operate a web form that stores your message on our servers. Whatever you include in an email to us (name, institution, journal details, correction requests) is handled the same way as any other business correspondence: used to respond to your inquiry, and not sold or shared with third parties for marketing purposes.',
    ],
  },
  {
    heading: 'Journal and Publication Metadata',
    body: [
      'The bibliographic metadata POSI indexes — journal records, article DOIs, author names as they appear in published metadata, citation counts — is sourced from public infrastructure (Crossref, OpenAlex, DOAJ, ROR, ORCID, OpenCitations) and is not personal data collected from site visitors. See ',
    ],
    links: [{ href: '/data-sources', label: 'Data Sources' }, { href: '/open-data', label: 'Open Data' }],
  },
  {
    heading: 'External Links',
    body: [
      'Journal records and citation pages link out to publisher websites, DOI resolvers, and other external services. Those sites have their own privacy practices, which POSI does not control and this policy does not cover.',
    ],
  },
  {
    heading: 'Changes to This Policy',
    body: [
      'POSI is in a pre-operational phase, and its technical infrastructure may change (for example, adding cookie-less analytics or an API with authenticated access). Material changes to what data is collected will be reflected on this page with an updated date below.',
    ],
  },
]

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      <nav className="text-xs flex items-center gap-1.5" style={{ color: 'var(--posi-muted)' }}>
        <Link href="/" className="hover:text-gray-700">Home</Link>
        <span>/</span>
        <span style={{ color: 'var(--posi-text)' }}>Privacy Policy</span>
      </nav>

      <div className="border-l-4 pl-5" style={{ borderColor: 'var(--posi-accent)' }}>
        <h1 className="text-2xl font-bold leading-tight" style={{ color: 'var(--posi-text)' }}>Privacy Policy</h1>
        <p className="text-sm leading-relaxed mt-2 max-w-2xl" style={{ color: 'var(--posi-muted)' }}>
          POSI is operated by Panorama Scholarly Group Ltd. This page describes, in plain terms,
          what data posi.panorama-sg.com collects and does not collect. It is an operational
          summary, not a substitute for independent legal advice about a specific jurisdiction.
        </p>
      </div>

      {SECTIONS.map(section => (
        <section key={section.heading} className="bg-white p-5" style={{ border: '1px solid var(--posi-border)' }}>
          <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--posi-text)' }}>{section.heading}</h2>
          {section.body.map((p, i) => (
            <p key={i} className="text-xs leading-relaxed" style={{ color: 'var(--posi-muted)' }}>
              {p}
              {section.links && section.links.map((l, j) => (
                <span key={l.href}>
                  {j > 0 && ' and '}
                  <Link href={l.href} className="hover:underline" style={{ color: 'var(--posi-accent)' }}>{l.label}</Link>
                </span>
              ))}
              {section.links ? '.' : ''}
            </p>
          ))}
        </section>
      ))}

      <section className="bg-white p-5" style={{ border: '1px solid var(--posi-border)' }}>
        <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--posi-text)' }}>Contact</h2>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--posi-muted)' }}>
          Questions about this policy can be sent to{' '}
          <a href="mailto:posi@panorama-sg.com" className="hover:underline" style={{ color: 'var(--posi-accent)', fontFamily: 'var(--font-mono)' }}>
            posi@panorama-sg.com
          </a>.
        </p>
      </section>

      <p className="text-[11px]" style={{ color: 'var(--posi-muted)', fontFamily: 'var(--font-mono)' }}>
        Last updated: 2026-08-12
      </p>

      <div className="flex flex-wrap gap-5 text-xs">
        <Link href="/terms" style={{ color: 'var(--posi-accent)' }} className="hover:underline">Terms of Use →</Link>
        <Link href="/responsible-use" style={{ color: 'var(--posi-accent)' }} className="hover:underline">Responsible Use Notice →</Link>
        <Link href="/coi" style={{ color: 'var(--posi-accent)' }} className="hover:underline">Conflict of Interest Disclosure →</Link>
      </div>

    </div>
  )
}
