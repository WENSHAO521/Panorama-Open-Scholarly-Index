import Link from 'next/link'
import { PSG_JOURNALS, getCoreCollection } from '@/lib/data'
import { PageHeader } from '@/components/db'

export const metadata = {
  title: 'Conflict of interest',
  description: 'Panorama Scholarly Group publishes POSI and also publishes journals. This disclosure lists those journals and the safeguards that apply.',
  alternates: { canonical: '/coi/' },
}

export default function CoiPage() {
  const psg = PSG_JOURNALS.slice().sort((a, b) => a.title.localeCompare(b.title))
  const core = getCoreCollection().length

  return (
    <div className="pb-12">
      <PageHeader title="Conflict of interest" crumbs={[{ label: 'POSI', href: '/' }, { label: 'About', href: '/about/' }, { label: 'Conflict of interest' }]}>
        <p className="max-w-[68ch]">
          Panorama Scholarly Group Ltd. publishes POSI and also publishes academic journals. {psg.length} of
          the {core} Core Collection journals are published by Panorama Scholarly Group.
        </p>
      </PageHeader>

      <div className="doc">
        <section aria-labelledby="safeguards">
          <h2 id="safeguards">Safeguards</h2>
          <ul>
            <li>Journals published by Panorama Scholarly Group are evaluated under the same PQF criteria as every other journal, with no adjusted weighting.</li>
            <li>Ranks, percentiles and quartiles are produced by versioned calculation code from registry data. No one can change a published result by hand.</li>
            <li>Every evaluation rests on public evidence that anyone can check against the journal’s website and its Crossref and OpenAlex records.</li>
            <li>This relationship is disclosed on the about page and here, and the affected journals are listed below.</li>
          </ul>
          <p>
            Readers should take this relationship into account when interpreting results for these journals, and
            should not rely on POSI results alone when choosing where to publish.
          </p>
        </section>

        <section aria-labelledby="journals">
          <h2 id="journals">Journals published by Panorama Scholarly Group</h2>
          <div className="panel overflow-x-auto">
            <table className="dtable">
              <thead><tr><th>Journal</th><th>ISSN</th></tr></thead>
              <tbody>
                {psg.map(j => (
                  <tr key={j.id}>
                    <td><Link href={`/journal/${j.journal_code}/`} className="hover:underline" style={{ color: 'var(--teal)' }}>{j.title}</Link></td>
                    <td className="font-mono text-[12.5px] whitespace-nowrap">{j.issn_online ?? j.issn_print ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="concerns">
          <h2 id="concerns">Raising a concern</h2>
          <p>
            Concerns about the evaluation of any journal can be sent to{' '}
            <a href="mailto:posi@panorama-sg.com">posi@panorama-sg.com</a>. They are handled under the appeals
            process in the <Link href="/editorial-policy/#appeals">editorial policy</Link>.
          </p>
        </section>
      </div>
    </div>
  )
}
