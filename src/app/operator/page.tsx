import Link from 'next/link'
import type { Metadata } from 'next'
import { MapPin, Envelope, Globe, Buildings } from '@phosphor-icons/react/dist/ssr'

export const metadata: Metadata = {
  title: 'Operator Information | POSI',
  description: 'POSI is operated by Panorama Scholarly Group Ltd., Room 1508, Grand Plaza, Kowloon, Hong Kong SAR.',
}

const ROLES = [
  {
    role: 'Platform Operator',
    name: 'Panorama Scholarly Group Ltd.',
    responsibility: 'Owns and operates the POSI platform, infrastructure, and public API. Responsible for data accuracy, uptime, and platform policy.',
  },
  {
    role: 'Editorial Assessment',
    name: 'POSI Editorial Team',
    responsibility: 'Responsible for PQF assessments, evidence review, journal submissions, and record corrections. Reachable at posi@panorama-sg.com.',
  },
  {
    role: 'Data Infrastructure',
    name: 'Open Infrastructure Partners',
    responsibility: 'Crossref, OpenAlex, DOAJ, ROR, ORCID, and OAI-PMH endpoints supply the underlying metadata. POSI is not affiliated with any of these organizations.',
  },
]

const GOVERNANCE_NOTES = [
  'POSI does not have an external advisory board or independent editorial committee.',
  'PQF scores are assigned by PSG staff using documented, publicly available criteria.',
  'No third-party auditor currently verifies PQF assessments.',
  'Users are encouraged to verify PQF criteria independently from public journal sources.',
  'A full conflict of interest disclosure accompanies all PSG-published journal records.',
]

export default function OperatorPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      <nav className="text-xs flex items-center gap-1.5" style={{ color: 'var(--posi-muted)' }}>
        <Link href="/" className="hover:text-gray-700">Home</Link>
        <span>/</span>
        <Link href="/about" className="hover:text-gray-700">About</Link>
        <span>/</span>
        <span style={{ color: 'var(--posi-text)' }}>Operator Information</span>
      </nav>

      <div className="border-l-4 border-[#c41e3a] pl-5">
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">Operator Information</h1>
        <p className="text-sm text-gray-500 mt-2 max-w-2xl leading-relaxed">
          Details about the organization that operates the POSI platform,
          including contact information, governance structure, and responsible parties.
        </p>
      </div>

      {/* Main operator card */}
      <div className="bg-white p-6" style={{ border: '1px solid var(--posi-border)' }}>
        <div className="flex items-start gap-3 mb-5">
          <Buildings className="h-5 w-5 shrink-0 mt-0.5" style={{ color: 'var(--posi-accent)' }} />
          <h2 className="text-base font-bold" style={{ color: 'var(--posi-text)' }}>Panorama Scholarly Group Ltd.</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-start gap-2.5">
              <MapPin className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--posi-muted)' }} />
              <div className="text-xs leading-relaxed" style={{ color: 'var(--posi-muted)' }}>
                Room 1508, 15/F., Office Tower Two<br />
                Grand Plaza, 625 Nathan Road<br />
                Kowloon, Hong Kong SAR<br />
                China
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
          <div className="space-y-3 text-xs" style={{ color: 'var(--posi-muted)' }}>
            <div>
              <p className="font-semibold mb-0.5" style={{ color: 'var(--posi-text)' }}>Jurisdiction</p>
              <p>Hong Kong SAR, China</p>
            </div>
            <div>
              <p className="font-semibold mb-0.5" style={{ color: 'var(--posi-text)' }}>ISSN Registration Country</p>
              <p>Germany (via ISSN International Centre)</p>
            </div>
            <div>
              <p className="font-semibold mb-0.5" style={{ color: 'var(--posi-text)' }}>Response Time</p>
              <p>2-3 business days (acknowledgement). Journal reviews: 10-20 business days.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Roles & responsibilities */}
      <section className="bg-white" style={{ border: '1px solid var(--posi-border)' }}>
        <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--posi-border-light)' }}>
          <h2 className="text-xs font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--posi-muted)' }}>Roles & Responsibilities</h2>
        </div>
        <div className="divide-y" style={{ borderColor: 'var(--posi-border-light)' }}>
          {ROLES.map(r => (
            <div key={r.role} className="px-5 py-4">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5" style={{ background: 'var(--posi-bg)', color: 'var(--posi-accent)', border: '1px solid var(--posi-border)' }}>
                  {r.role}
                </span>
                <span className="text-xs font-semibold" style={{ color: 'var(--posi-text)' }}>{r.name}</span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--posi-muted)' }}>{r.responsibility}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Governance notes */}
      <section className="bg-white p-5" style={{ border: '1px solid var(--posi-border)' }}>
        <h2 className="text-xs font-bold uppercase tracking-[0.1em] mb-3" style={{ color: 'var(--posi-muted)' }}>Governance Notes</h2>
        <ul className="space-y-2">
          {GOVERNANCE_NOTES.map((note, i) => (
            <li key={i} className="flex items-start gap-2 text-xs leading-relaxed" style={{ color: 'var(--posi-muted)' }}>
              <span className="shrink-0 font-mono mt-0.5" style={{ color: 'var(--posi-accent)' }}>-</span>
              {note}
            </li>
          ))}
        </ul>
      </section>

      {/* COI link */}
      <div className="p-4" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
        <p className="text-[11px] leading-relaxed" style={{ color: '#78350F' }}>
          <strong>Conflict of Interest:</strong> Panorama Scholarly Group operates POSI and also publishes
          the majority of journals currently indexed and evaluated on the platform.
          This is a structural conflict of interest that users should account for when interpreting scores.{' '}
          <Link href="/coi" className="underline">Read the full COI Disclosure →</Link>
        </p>
      </div>

      <div className="flex flex-wrap gap-4 text-xs">
        <Link href="/about" style={{ color: 'var(--posi-accent)' }} className="hover:underline">About POSI →</Link>
        <Link href="/coi" style={{ color: 'var(--posi-accent)' }} className="hover:underline">Conflict of Interest Disclosure →</Link>
        <Link href="/contact" style={{ color: 'var(--posi-accent)' }} className="hover:underline">Contact →</Link>
      </div>
    </div>
  )
}
