import Link from 'next/link'
import { PageHeader } from '@/components/db'
import { PCS_DISCLAIMER, RANKING_BASIS } from '@/lib/evaluation/rules'

export const metadata = {
  title: 'Citation indicators: PCI, PNCI and PCS',
  description: 'POSI Citation Analytics: PCI (source citation impact), PNCI (normalized by field, year and document type; the metric of the official Citation Rankings) and PCS (a supplementary Crossref indicator).',
  alternates: { canonical: '/pci/' },
}

export default function PciPage() {
  return (
    <div className="pb-12">
      <PageHeader title="Citation indicators: PCI, PNCI and PCS" crumbs={[{ label: 'POSI', href: '/' }, { label: 'Methodology', href: '/methodology/' }, { label: 'Citation indicators' }]}>
        <p className="max-w-[68ch]">
          PCI is one component of POSI Citation Analytics. PNCI is the normalized metric used for official subject-level
          Citation Rankings. PCS provides an independent supplementary citation perspective.
        </p>
      </PageHeader>
      <div className="doc">
        <h2 id="pci">PCI — POSI Citation Impact</h2>
        <p>
          Citations to a journal&rsquo;s citable items from a two-year publication window, per item, from OpenAlex
          (<code>PCI-1.0</code>; a five-year variant, PCI-5, is computed alongside). PCI is the source citation performance
          indicator. It is not normalized by field, so it is not compared across fields, and it does not decide a rank.
        </p>
        <h2 id="pnci">PNCI — POSI Normalized Citation Indicator</h2>
        <p className="formula">PNCI = (1 / n) × Σ C<sub>i</sub> / E(field<sub>i</sub>, year<sub>i</sub>, type<sub>i</sub>)</p>
        <p>
          Each eligible item&rsquo;s citations are divided by the mean citations of all items of the same PSC field,
          publication year and document type, and the ratios are averaged over the journal&rsquo;s items. 1.00 is the
          average of the comparison group. Because every item is compared with items like it, a large journal does not
          rank higher for its size, and older items do not outweigh recent ones (<code>PNCI-1.0</code>).
        </p>
        <p><strong>{RANKING_BASIS}</strong> See the <Link href="/methodology/#ranking">ranking method</Link>.</p>
        <h2 id="pcs">PCS — POSI Citation Score</h2>
        <p>
          The mean Crossref citations of a journal&rsquo;s citable items from the four complete years before the metric year
          (<code>PCS-1.0</code>): a view of citation performance independent of OpenAlex.
        </p>
        <p><strong>{PCS_DISCLAIMER}</strong></p>
        <h2 id="reading">Reading the three together</h2>
        <ul>
          <li>The three indicators are shown side by side and never averaged or used to correct one another.</li>
          <li>Total citations are shown as a description of a journal and never decide a rank.</li>
          <li>Citation indicators measure citation performance, not every dimension of scholarly quality.</li>
        </ul>
      </div>
    </div>
  )
}
