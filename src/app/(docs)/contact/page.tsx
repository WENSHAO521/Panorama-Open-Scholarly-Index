import Link from 'next/link'
import { PageHeader } from '@/components/db'

export const metadata = {
  title: 'Contact',
  description: 'Contact the POSI editorial team about certification, record corrections, certificates and data.',
  alternates: { canonical: '/contact/' },
}

const TOPICS = [
  { topic: 'Core Collection certification', subject: 'POSI Certification: [Journal title]', body: 'Apply through the certification form, which prepares the message for you.', href: '/certification/', cta: 'Apply for certification' },
  { topic: 'Record correction', subject: 'POSI Correction: [Journal title or ISSN]', body: 'Wrong ISSN, publisher, subject category or other details on a POSI record. Registry data is corrected at Crossref or OpenAlex; see data sources.', href: '/docs/data/#corrections', cta: 'Data sources and access' },
  { topic: 'Appeal', subject: 'POSI Appeal: [Journal title]', body: 'Appeals against a certification decision, warning, suspension or delisting, with supporting evidence.', href: '/editorial-policy/#appeals', cta: 'Appeals process' },
  { topic: 'Certificates of indexing', subject: 'POSI Certificate: [Certificate number]', body: 'Questions about a certificate or its verification.', href: '/docs/certificates/', cta: 'How certificates work' },
  { topic: 'Data and licensing', subject: 'POSI Data', body: 'Bulk data, reuse and attribution.', href: '/datasets/', cta: 'Data downloads' },
]

export default function ContactPage() {
  return (
    <div className="pb-12">
      <PageHeader title="Contact" crumbs={[{ label: 'POSI', href: '/' }, { label: 'About', href: '/about/' }, { label: 'Contact' }]}>
        <p className="max-w-[68ch]">
          Write to <a href="mailto:posi@panorama-sg.com" className="link">posi@panorama-sg.com</a> with the subject line
          for your request. Enquiries are acknowledged within two to three business days.
        </p>
      </PageHeader>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] max-w-[1000px]">
        <ul className="panel divide-y" style={{ borderColor: 'var(--line-soft)' }}>
          {TOPICS.map(t => (
            <li key={t.topic} className="p-5" style={{ borderColor: 'var(--line-soft)' }}>
              <h2 className="text-[15.5px] font-semibold">{t.topic}</h2>
              <p className="mt-1 text-[14px] leading-relaxed" style={{ color: 'var(--ink-2)' }}>{t.body}</p>
              <p className="mt-2 text-[12.5px]" style={{ color: 'var(--muted)' }}>
                Subject: <span className="font-mono" style={{ color: 'var(--ink-2)' }}>{t.subject}</span>
              </p>
              <Link href={t.href} className="link mt-2 inline-block text-[13.5px]">{t.cta}</Link>
            </li>
          ))}
        </ul>

        <aside>
          <address className="not-italic panel p-5 text-[14px] leading-relaxed">
            <p className="font-semibold" style={{ color: 'var(--ink)' }}>Panorama Scholarly Group Ltd.</p>
            <p className="mt-1" style={{ color: 'var(--ink-2)' }}>
              Room 1508, 15/F., Office Tower Two, Grand Plaza<br />
              625 Nathan Road, Kowloon<br />
              Hong Kong SAR
            </p>
            <p className="mt-3"><a href="mailto:posi@panorama-sg.com" className="link">posi@panorama-sg.com</a></p>
            <p className="mt-3 text-[12.5px]" style={{ color: 'var(--muted)' }}>Certification reviews take ten to twenty business days.</p>
          </address>
        </aside>
      </div>
    </div>
  )
}
