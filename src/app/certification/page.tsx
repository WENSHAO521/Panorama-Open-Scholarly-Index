import Link from 'next/link'
import { getCoreCollection } from '@/lib/data'
import { PageHeader, SectionTitle, fmt } from '@/components/db'
import { CertificationApply } from '@/components/CertificationApply'

export const metadata = {
  title: 'Apply for certification',
  description: 'Every journal with DOIs at Crossref or a record in OpenAlex is indexed by POSI. Journals apply for certification to enter the Core Collection.',
}

const PQF = [
  ['Journal transparency', 25],
  ['Metadata quality', 25],
  ['Editorial governance', 20],
  ['Technical discoverability', 15],
  ['Citation visibility', 10],
  ['Research integrity', 5],
] as const

const STEPS = [
  { verb: 'Apply', time: 'Today', body: 'Send the application below with links to your public policy pages.' },
  { verb: 'Acknowledge', time: '2 to 3 business days', body: 'POSI confirms receipt and checks that the journal is indexed and eligible.' },
  { verb: 'Evaluate', time: '10 to 15 business days', body: 'Every PQF criterion is checked against public evidence. POSI may ask for clarification.' },
  { verb: 'Decide', time: '3 to 5 business days', body: 'You receive the decision and a criterion-level evidence report, whatever the outcome.' },
]

const ELIGIBLE = [
  'Indexed: DOIs registered with Crossref, or a source record in OpenAlex',
  'Actively publishing, with a public journal website',
  'Peer review process documented publicly',
  'Editorial board listed with verifiable affiliations',
  'Fees disclosed, or no charges stated explicitly. Any business model is fine if disclosed',
  'Publication ethics, corrections and retraction policies public',
]

const NOT_ELIGIBLE = [
  'Discontinued or inactive journals',
  'Undisclosed or unverifiable editorial board',
  'False claims of indexing in DOAJ, Scopus, Web of Science or PubMed',
]

export default function CertificationPage() {
  const core = getCoreCollection().length
  return (
    <div className="wrap pb-10">
      <PageHeader title="Apply for certification" crumbs={[{ label: 'POSI', href: '/' }, { label: 'Certification' }]}>
        <p className="max-w-[68ch]">
          Every journal with DOIs at Crossref or a record in OpenAlex is already indexed by POSI. Certification is the
          next step: an evidence-based evaluation that admits the journal to the Core Collection
          ({fmt(core)} journals today). Applying is free.
        </p>
      </PageHeader>

      <section aria-labelledby="tiers" className="grid gap-px rounded-[6px] overflow-hidden md:grid-cols-2 mb-14" style={{ background: 'var(--line)', border: '1px solid var(--line)' }}>
        <div className="p-6" style={{ background: 'var(--surface)' }}>
          <h2 id="tiers" className="text-[18px] font-semibold">Indexed</h2>
          <p className="mt-1 text-[13px]" style={{ color: 'var(--muted)' }}>Automatic, no application</p>
          <ul className="mt-4 space-y-2 text-[14px]" style={{ color: 'var(--ink-2)' }}>
            <li>Searchable journal page and publications</li>
            <li>Ranked in POSI Rankings when citation data is sufficient</li>
            <li>Authors can issue certificates of indexing</li>
          </ul>
        </div>
        <div className="p-6" style={{ background: 'var(--teal-soft)' }}>
          <h2 className="text-[18px] font-semibold" style={{ color: 'var(--teal)' }}>Core Collection</h2>
          <p className="mt-1 text-[13px]" style={{ color: 'var(--muted)' }}>Certified after PQF evaluation</p>
          <ul className="mt-4 space-y-2 text-[14px]" style={{ color: 'var(--ink-2)' }}>
            <li>Everything in Indexed</li>
            <li>Curated POSI record with published evidence and PQF report</li>
            <li>Marked as Core in rankings, publications and certificates</li>
            <li>Certificate of certification for the journal</li>
          </ul>
        </div>
      </section>

      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] mb-14">
        <section aria-labelledby="eligibility">
          <SectionTitle id="eligibility">Eligibility</SectionTitle>
          <ul className="space-y-2 text-[14px]" style={{ color: 'var(--ink-2)' }}>
            {ELIGIBLE.map(e => <li key={e} className="pl-4" style={{ borderLeft: '2px solid var(--teal)' }}>{e}</li>)}
          </ul>
          <p className="mt-6 text-[13.5px] font-medium">Not eligible</p>
          <ul className="mt-2 space-y-2 text-[14px]" style={{ color: 'var(--muted)' }}>
            {NOT_ELIGIBLE.map(e => <li key={e} className="pl-4" style={{ borderLeft: '2px solid var(--line)' }}>{e}</li>)}
          </ul>
        </section>
        <section aria-labelledby="pqf">
          <SectionTitle id="pqf" aside={<Link href="/editorial-policy/#certification" className="link">Full method</Link>}>What is evaluated</SectionTitle>
          <div className="panel overflow-hidden">
            <table className="dtable">
              <thead><tr><th>PQF factor</th><th className="text-right">Points</th></tr></thead>
              <tbody>
                {PQF.map(([f, pts]) => (
                  <tr key={f}><td>{f}</td><td className="text-right font-mono tnum">{pts}</td></tr>
                ))}
                <tr><td className="font-medium">Total</td><td className="text-right font-mono tnum font-medium">100</td></tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[13px]" style={{ color: 'var(--muted)' }}>Certification is re-assessed every year. A journal may ask for an early review after documented improvements.</p>
        </section>
      </div>

      <section aria-labelledby="process" className="mb-14">
        <SectionTitle id="process">Process</SectionTitle>
        <ol className="grid gap-px rounded-[6px] overflow-hidden md:grid-cols-4" style={{ background: 'var(--line)', border: '1px solid var(--line)' }}>
          {STEPS.map(s => (
            <li key={s.verb} className="p-5" style={{ background: 'var(--surface)' }}>
              <p className="text-[16px] font-semibold" style={{ color: 'var(--teal)' }}>{s.verb}</p>
              <p className="mt-0.5 font-mono text-[12px]" style={{ color: 'var(--muted)' }}>{s.time}</p>
              <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: 'var(--ink-2)' }}>{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="apply" className="max-w-[900px]">
        <SectionTitle id="apply">Application</SectionTitle>
        <CertificationApply />
      </section>
    </div>
  )
}
