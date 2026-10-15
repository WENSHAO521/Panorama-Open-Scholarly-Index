import Link from 'next/link'
import { PageHeader } from '@/components/db'
import { AjrCommon } from '@/components/AjrPage'

export const metadata = {
  title: 'AJR-E: Early-stage Journal Rating',
  description: 'AJR-E rates journals 12–59 months after first publication on seven evidence-based dimensions, as an AJR Score (0–100) and an AJR Rating (A+ to D).',
  alternates: { canonical: '/ratings/early-stage/' },
}

const DIMENSIONS = [
  ['Editorial governance and peer review', 15], ['Research integrity and publication ethics', 15], ['Metadata and digital publishing infrastructure', 15],
  ['Publishing stability and operational performance', 15], ['Scholarly output quality signals', 20], ['Scholarly reach and concentration', 10], ['Openness, data and transparency', 10],
] as const

export default function EarlyStagePage() {
  return (
    <div className="pb-12">
      <PageHeader title="AJR-E: Early-stage Journal Rating" crumbs={[{ label: 'POSI', href: '/' }, { label: 'AJR', href: '/ratings/' }, { label: 'AJR-E' }]}>
        <p className="max-w-[68ch]">For journals 12–59 months after their first publication (<code>AJR-E-1.2</code> from the October 2026 rerate; <code>AJR-E-1.1</code> before).</p>
      </PageHeader>
      <div className="doc">
        <h2 id="dimensions">Dimensions</h2>
        <div className="panel overflow-x-auto max-w-[560px]">
          <table className="dtable">
            <thead><tr><th>Dimension</th><th className="text-right">Points</th></tr></thead>
            <tbody>{DIMENSIONS.map(([d, p]) => <tr key={d}><td>{d}</td><td className="text-right font-mono">{p}</td></tr>)}</tbody>
          </table>
        </div>
        <p>
          A score is published when the evidence coverage is sufficient: from 80% it is official, from 60% provisional
          (shown and marked). Below that, or with too small an article sample, the journal is not rated and the reason
          is shown. Scores are computed from evidence only; no score is set by hand.
        </p>
        <AjrCommon />
        <p><Link href="/ratings/mature/">AJR-M</Link> applies from 60 months.</p>
      </div>
    </div>
  )
}
