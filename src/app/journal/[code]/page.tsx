import { notFound } from 'next/navigation'
import { collectionOf } from '@/lib/records'
import { getStaticRecordJournals } from '@/lib/records-data'
import { getPcsEntry } from '@/lib/pcs'
import { getPciEntry } from '@/lib/pci'
import { getCitationStats } from '@/lib/citation-stats'
import psc from '@/lib/psc-v1.0.snapshot.json'
import { RecordView } from '@/components/RecordView'
import { getCitationRecord, getPcsValue, categoryName } from '@/lib/rankings'
import { getRankingHistory } from '@/lib/ranking-editions'
import { buildJournalEvaluation } from '@/lib/evaluation/journal'
import Link from 'next/link'
import { Certificate, ChartLine, FilePdf } from '@phosphor-icons/react/dist/ssr'
import { dataUrl } from '@/lib/data-base'

// Core, other curated and Global Benchmark records get a static page. Discovered
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
    description: `POSI journal record for ${j.title}${j.issn_online ? ` (eISSN ${j.issn_online})` : ''}: identifiers, Core Collection status, PQF, AJR rating (Core Collection journals), PNCI citation ranking and provenance.`,
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

  const issn = j.issn_online ?? j.issn_print

  return (
    <div className="wrap pb-12">
      <RecordView
        journal={j}
        jsonHref={dataUrl(`journal/${j.journal_code}.json`)}
        metrics={{
          pcs,
          pci,
          citationStats: getCitationStats(j.journal_code),
          pscName: j.psc_category ? PSC_NAME[j.psc_category] ?? null : null,
          evaluation,
          rankingHistory: getRankingHistory(j.posi_id),
        }}
        links={issn && (
          <>
            <Link href={`/journal/?issn=${issn}`} className="btn btn-primary w-full justify-start"><ChartLine className="h-4 w-4" /> Publications and citations by year</Link>
            {evaluation.ranking.zone != null && (
              <Link href={`/certificate/zone/?issn=${issn}`} className="btn w-full justify-start" prefetch={false}><Certificate className="h-4 w-4" /> Zone certificate</Link>
            )}
            {collectionOf(j) === 'core' && (
              <a href={`/api/certificate/${j.journal_code}/pdf`} className="btn w-full justify-start" target="_blank" rel="noopener"><FilePdf className="h-4 w-4" /> Certification certificate (PDF)</a>
            )}
          </>
        )}
      />
    </div>
  )
}
