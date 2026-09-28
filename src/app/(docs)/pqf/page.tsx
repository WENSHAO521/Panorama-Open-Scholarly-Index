import Link from 'next/link'
import { PageHeader } from '@/components/db'
import { PQF_DISCLAIMER, PQF_STATUS_BANDS, PQF_STATUS_LABEL } from '@/lib/evaluation/rules'

export const metadata = {
  title: 'PQF: Core Collection eligibility',
  description: 'The POSI Quality Framework (PQF) decides Core Collection eligibility: a 0–100 score and a status of Eligible, Review Required, Insufficient Evidence or Not Eligible. PQF is not a ranking.',
  alternates: { canonical: '/pqf/' },
}

const FACTORS = [
  ['JTF', 'Journal transparency', 25],
  ['MQF', 'Metadata quality', 25],
  ['EGF', 'Editorial governance', 20],
  ['TDF', 'Technical discoverability', 15],
  ['CVF', 'Citation visibility', 10],
  ['RIF', 'Research integrity', 5],
] as const

export default function PqfPage() {
  return (
    <div className="pb-12">
      <PageHeader title="PQF: Core Collection eligibility" crumbs={[{ label: 'POSI', href: '/' }, { label: 'Methodology', href: '/methodology/' }, { label: 'PQF' }]}>
        <p className="max-w-[68ch]">
          The POSI Quality Framework answers one question: can the journal enter, or remain in, the Core Collection?
        </p>
      </PageHeader>
      <div className="doc">
        <p><strong>{PQF_DISCLAIMER}</strong></p>
        <h2 id="score">Score</h2>
        <p>Six factors, 100 points in all. Each criterion is met or not met, on published evidence.</p>
        <div className="panel overflow-x-auto max-w-[480px]">
          <table className="dtable">
            <thead><tr><th>Factor</th><th className="text-right">Points</th></tr></thead>
            <tbody>{FACTORS.map(([c, n, pts]) => <tr key={c}><td><span className="font-mono text-[12.5px] mr-2">{c}</span>{n}</td><td className="text-right font-mono">{pts}</td></tr>)}</tbody>
          </table>
        </div>
        <h2 id="status">Status</h2>
        <div className="panel overflow-x-auto max-w-[480px]">
          <table className="dtable">
            <thead><tr><th>PQF score</th><th>Status</th></tr></thead>
            <tbody>
              {PQF_STATUS_BANDS.map(([s, min], i) => (
                <tr key={s}><td className="font-mono text-[13px]">{i === 0 ? `≥ ${min}` : min === 0 ? `< ${PQF_STATUS_BANDS[i - 1][1]}` : `${min}–${(PQF_STATUS_BANDS[i - 1][1] - 0.01).toFixed(2)}`}</td><td>{PQF_STATUS_LABEL[s]}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <h2 id="use">Use</h2>
        <ul>
          <li>PQF is never used to rank journals, to assign Citation Quartiles or POSI Zones, or to claim academic influence.</li>
          <li>It may be used as a filter, for example PQF ≥ 70, never as a default sort order.</li>
          <li>The letter grades kept in older PQF records are not published.</li>
        </ul>
        <p>
          Admission, review and appeals: <Link href="/editorial-policy/#certification">editorial policy</Link>. How PQF
          fits with AJR and the Citation Ranking: <Link href="/methodology/#architecture">methodology</Link>.
        </p>
      </div>
    </div>
  )
}
