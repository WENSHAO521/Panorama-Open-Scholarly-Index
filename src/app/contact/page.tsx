import Link from 'next/link'
import type { Metadata } from 'next'
import { Envelope, MapPin, Globe } from '@phosphor-icons/react/dist/ssr'

export const metadata: Metadata = {
  title: 'Contact | POSI',
  description: 'Contact the POSI team for journal submissions, record corrections, data inquiries, and governance questions.',
}

const CONTACT_TOPICS = [
  {
    topic: 'Journal Submission',
    address: 'posi@panorama-sg.com',
    subject: 'POSI Journal Submission: [Journal Title]',
    desc: 'Submit a new open access journal record for POSI review and PQF assessment.',
    cta: { label: 'Submit Journal →', href: '/submit-journal' },
  },
  {
    topic: 'Record Correction',
    address: 'posi@panorama-sg.com',
    subject: 'POSI Record Correction: [Journal Title or ISSN]',
    desc: 'Report incorrect metadata, broken links, wrong ISSN, or outdated policy information in an existing journal record.',
    cta: null,
  },
  {
    topic: 'Data Inquiry',
    address: 'posi@panorama-sg.com',
    subject: 'POSI Data Inquiry',
    desc: 'Questions about data provenance, bulk data access, institutional data agreements, or API access for research purposes.',
    cta: { label: 'API & Export Roadmap →', href: '/api' },
  },
  {
    topic: 'Governance & COI',
    address: 'posi@panorama-sg.com',
    subject: 'POSI Governance Inquiry',
    desc: 'Questions about POSI\'s conflict of interest policy, scoring independence, or platform governance.',
    cta: { label: 'COI Disclosure →', href: '/coi' },
  },
]

export default function ContactPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      <nav className="text-xs flex items-center gap-1.5" style={{ color: 'var(--posi-muted)' }}>
        <Link href="/" className="hover:text-gray-700">Home</Link>
        <span>/</span>
        <Link href="/about" className="hover:text-gray-700">About</Link>
        <span>/</span>
        <span style={{ color: 'var(--posi-text)' }}>Contact</span>
      </nav>

      <div className="border-l-4 pl-5" style={{ borderColor: 'var(--posi-accent)' }}>
        <h1 className="text-2xl font-bold leading-tight" style={{ color: 'var(--posi-text)' }}>Contact POSI</h1>
        <p className="text-sm leading-relaxed mt-2" style={{ color: 'var(--posi-muted)' }}>
          The POSI team handles journal submissions, record corrections, data inquiries, and governance questions.
          Use the appropriate subject line to ensure your message is routed correctly.
        </p>
      </div>

      {/* Operator contact */}
      <div className="bg-white p-5" style={{ border: '1px solid var(--posi-border)' }}>
        <h2 className="text-sm font-bold mb-4" style={{ color: 'var(--posi-text)' }}>Panorama Scholarly Group Ltd.</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-start gap-2.5">
              <MapPin className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--posi-muted)' }} />
              <div className="text-xs leading-relaxed" style={{ color: 'var(--posi-muted)' }}>
                Room 1508, 15/F., Office Tower Two<br />
                Grand Plaza, 625 Nathan Road<br />
                Kowloon, Hong Kong SAR
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <Envelope className="h-4 w-4 shrink-0" style={{ color: 'var(--posi-muted)' }} />
              <a
                href="mailto:posi@panorama-sg.com"
                className="text-xs hover:underline"
                style={{ color: 'var(--posi-accent)', fontFamily: 'var(--font-mono)' }}
              >
                posi@panorama-sg.com
              </a>
            </div>
            <div className="flex items-center gap-2.5">
              <Globe className="h-4 w-4 shrink-0" style={{ color: 'var(--posi-muted)' }} />
              <a
                href="https://panorama-sg.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs hover:underline"
                style={{ color: 'var(--posi-accent)', fontFamily: 'var(--font-mono)' }}
              >
                panorama-sg.com
              </a>
            </div>
          </div>
          <div className="p-3 text-xs leading-relaxed" style={{ background: 'var(--posi-bg)', border: '1px solid var(--posi-border)' }}>
            <p style={{ color: 'var(--posi-muted)' }}>
              <strong style={{ color: 'var(--posi-text)' }}>Response time: </strong>
              We aim to acknowledge all inquiries within 2–3 business days.
              Journal submission reviews take 10–20 business days.
            </p>
          </div>
        </div>
      </div>

      {/* Contact topics */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold" style={{ color: 'var(--posi-text)' }}>Contact by Topic</h2>
        {CONTACT_TOPICS.map(item => (
          <div key={item.topic} className="bg-white p-4" style={{ border: '1px solid var(--posi-border)' }}>
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="text-xs font-bold" style={{ color: 'var(--posi-text)' }}>{item.topic}</h3>
              {item.cta && (
                <Link href={item.cta.href} className="text-[10px] hover:underline shrink-0" style={{ color: 'var(--posi-accent)' }}>
                  {item.cta.label}
                </Link>
              )}
            </div>
            <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--posi-muted)' }}>{item.desc}</p>
            <a
              href={`mailto:${item.address}?subject=${encodeURIComponent(item.subject)}`}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 text-white transition-opacity hover:opacity-80"
              style={{ background: 'var(--posi-accent)', fontFamily: 'var(--font-mono)' }}
            >
              <Envelope className="h-3 w-3" />
              Email with subject: {item.subject}
            </a>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-5 text-xs">
        <Link href="/about" style={{ color: 'var(--posi-accent)' }} className="hover:underline">About POSI →</Link>
        <Link href="/coi" style={{ color: 'var(--posi-accent)' }} className="hover:underline">Conflict of Interest →</Link>
        <Link href="/submit-journal" style={{ color: 'var(--posi-accent)' }} className="hover:underline">Submit Journal →</Link>
      </div>

    </div>
  )
}
