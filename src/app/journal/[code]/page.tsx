import { notFound } from 'next/navigation'
import { collectionOf } from '@/lib/records'
import { getStaticRecordJournals } from '@/lib/records-data'
import { getPcsEntry } from '@/lib/pcs'
import { getPciEntry } from '@/lib/pci'
import { getCitationStats } from '@/lib/citation-stats'
import psc from '@/lib/psc-v1.0.snapshot.json'
import { RecordView } from '@/components/RecordView'
import { getCitationRecord, getPcsValue, categoryName } from '@/lib/rankings'
import { buildJournalEvaluation } from '@/lib/evaluation/journal'
import Link from 'next/link'

// Core, Candidate and Global Benchmark records get a static page. Discovered
// records (~24k) are served by the in-browser viewer at /record/ to stay
// inside Cloudflare Pages' 20,000-file limit.
export const dynamicParams = false

export function generateStaticParams() {
  return getStaticRecordJournals().map(j => ({ code: j.journal_code }))
}

function find(code: string) {
  return getStaticRecordJournals().find(j => j.journal_code === code)
}

export async function generateMetadata(props: { params: Promise<{ code: string }> }) {
  const { code } = await props.params
  const j = find(code)
  if (!j) return { title: 'Record not found' }
  return {
    title: j.title,
    description: `POSI journal record for ${j.title}${j.issn_online ? ` (eISSN ${j.issn_online})` : ''}: identifiers, Core Collection status, PQF, AJR rating, PNCI citation ranking and provenance.`,
    alternates: { canonical: `/journal/${j.journal_code}/` },
  }
}

const PSC_NAME: Record<string, string> = Object.fromEntries(psc.categories.map(c => [c.code, c.name]))

export default async function JournalRecordPage(props: { params: Promise<{ code: string }> }) {
  const { code } = await props.params
  const j = find(code)
  if (!j) notFound()
  const record = getCitationRecord(j.posi_id)
  const pcs = getPcsEntry(j.posi_id)
  const pci = getPciEntry(j.posi_id)
  const evaluation = buildJournalEvaluation({
    journal: j, ranking: record, pci: pci?.pci ?? null, pcs: pcs?.pcs ?? getPcsValue(j.posi_id),
    categoryName: categoryName(record?.ranking_category_id ?? null),
  })

  return (
    <div className="wrap">
      <RecordView
        journal={j}
        jsonHref={`/data/journal/${j.journal_code}.json`}
        metrics={{
          pcs,
          pci,
          citationStats: getCitationStats(j.journal_code),
          pscName: j.psc_category ? PSC_NAME[j.psc_category] ?? null : null,
          evaluation,
        }}
      />
      {(j.issn_online || j.issn_print) && (
        <div className="mt-8 flex flex-wrap gap-2 pb-10">
          <Link href={`/publications/?issn=${j.issn_online ?? j.issn_print}&sort=newest`} className="btn btn-primary">Browse publications</Link>
          <Link href={`/journal/?issn=${j.issn_online ?? j.issn_print}`} className="btn">Journal profile</Link>
          {evaluation.ranking.zone != null && (
            <Link href={`/certificate/zone/?issn=${j.issn_online ?? j.issn_print}`} className="btn" prefetch={false}>Zone certificate</Link>
          )}
          {collectionOf(j) === 'core' && (
            <a href={`/api/certificate/${j.journal_code}/pdf`} className="btn" target="_blank" rel="noopener">Certification certificate (PDF)</a>
          )}
        </div>
      )}
    </div>
  )
}
