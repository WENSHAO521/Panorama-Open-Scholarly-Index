import Link from 'next/link'
import { getCoreCollection } from '@/lib/data'
import { getJournalRanking, categoryName } from '@/lib/rankings'
import { countryName } from '@/lib/records'
import { ajrOf } from '@/lib/evaluation/journal'
import { getPQFStatus, PQF_DISCLAIMER } from '@/lib/evaluation/rules'
import { fmtScore, pqfStatusLabel } from '@/lib/evaluation/display'
import { QuartileBadge, ZoneBadge } from '@/components/Evaluation'
import { PageHeader, fmt } from '@/components/db'

export const metadata = {
  title: 'Core Collection',
  description: 'Journals certified for the POSI Core Collection after editorial evaluation under the POSI Quality Framework.',
}

export default function CoreCollectionPage() {
  const journals = getCoreCollection().slice().sort((a, b) => a.title.localeCompare(b.title))
  const rows = journals.map(j => ({ j, r: getJournalRanking(j.posi_id) }))
  const ranked = rows.filter(x => x.r?.rank != null).length

  return (
    <div className="pb-12">
      <PageHeader
        title="Core Collection"
        crumbs={[{ label: 'POSI', href: '/' }, { label: 'Journals', href: '/journals/' }, { label: 'Core Collection' }]}
        actions={<Link href="/certification/" className="btn btn-primary">Apply for certification</Link>}
      >
        <p className="max-w-[68ch]">
          Journals that applied for certification and passed editorial evaluation under the POSI Quality Framework.
          Every other journal registered with Crossref or OpenAlex is indexed in the{' '}
          <Link href="/journals/" className="link">journal directory</Link>. Admission criteria are set out in the{' '}
          <Link href="/editorial-policy/#certification" className="link">editorial policy</Link>.
        </p>
      </PageHeader>

      <dl className="grid grid-cols-2 sm:grid-cols-3 gap-px rounded-[2px] overflow-hidden max-w-[640px]" style={{ background: 'var(--line)', border: '1px solid var(--line)' }}>
        {[
          ['Certified journals', fmt(journals.length)],
          ['With a Citation Ranking', fmt(ranked)],
          ['Publishers', fmt(new Set(journals.map(j => j.publisher)).size)],
        ].map(([k, v]) => (
          <div key={k} className="p-4" style={{ background: 'var(--surface)' }}>
            <dt className="text-[12.5px]" style={{ color: 'var(--muted)' }}>{k}</dt>
            <dd className="mt-1 font-mono text-[20px] tnum">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="panel overflow-x-auto mt-8">
        <table className="dtable">
          <thead>
            <tr>
              <th>Journal</th>
              <th>Publisher</th>
              <th>ISSN</th>
              <th>Subject</th>
              <th>PQF</th>
              <th>AJR</th>
              <th className="text-right">PNCI</th>
              <th>Citation Quartile</th>
              <th>POSI Zone</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ j, r }) => (
              <tr key={j.id}>
                <td className="min-w-[240px]">
                  <Link href={`/journal/${j.journal_code}/`} className="font-medium hover:underline" style={{ color: 'var(--teal)' }}>{j.title}</Link>
                </td>
                <td className="text-[13.5px]" style={{ color: 'var(--ink-2)' }}>
                  {j.publisher}
                  {countryName(j.registration_country || j.country) && <span style={{ color: 'var(--muted)' }}>, {countryName(j.registration_country || j.country)}</span>}
                </td>
                <td className="font-mono text-[12.5px] whitespace-nowrap">{j.issn_online ?? j.issn_print ?? '-'}</td>
                <td className="text-[13px]">{j.psc_category ? categoryName(j.psc_category) ?? j.psc_category : <span style={{ color: 'var(--muted)' }}>Not yet classified</span>}</td>
                <td className="text-[13px] whitespace-nowrap">{pqfStatusLabel(getPQFStatus((j.pqf ?? j.ojqf)?.total))}</td>
                <td className="text-[13px] whitespace-nowrap">{(() => { const a = ajrOf(j); return a.rating ? `${a.model} · Rating ${a.rating}` : <span style={{ color: 'var(--muted)' }}>{a.lifecycle === 'observation' ? 'Observation' : a.model === 'AJR-M' ? 'AJR-M not yet rated' : 'Not rated'}</span> })()}</td>
                <td className="text-right font-mono tnum text-[13px]">{fmtScore(r?.pnci, '-')}</td>
                <td><QuartileBadge q={r?.q} provisional={r?.status === 'provisional'} /></td>
                <td><ZoneBadge z={r?.zone} status={r?.zoneStatus} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[12.5px]" style={{ color: 'var(--muted)' }}>
        PQF shows the Core Collection eligibility status. {PQF_DISCLAIMER} AJR is the lifecycle rating (A+ to D).
        Citation Quartile (C-Q1 to C-Q4) and POSI Zone come from the journal&rsquo;s PNCI percentile within its PSC
        category. See <Link href="/methodology/" className="link">methodology</Link>.
      </p>
    </div>
  )
}
