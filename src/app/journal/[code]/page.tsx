import { notFound } from 'next/navigation'
import { collectionOf } from '@/lib/records'
import { getStaticRecordJournals } from '@/lib/records-data'
import { getPcsEntry } from '@/lib/pcs'
import { getPciEntry } from '@/lib/pci'
import { getCitationStats } from '@/lib/citation-stats'
import psc from '@/lib/psc-v1.0.snapshot.json'
import { RecordView } from '@/components/RecordView'
import { getJournalRanking, categoryName } from '@/lib/rankings'
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
    description: `POSI journal record for ${j.title}${j.issn_online ? ` (eISSN ${j.issn_online})` : ''}: identifiers, declared and registry metadata, indicators and provenance.`,
  }
}

const PSC_NAME: Record<string, string> = Object.fromEntries(psc.categories.map(c => [c.code, c.name]))

export default async function JournalRecordPage(props: { params: Promise<{ code: string }> }) {
  const { code } = await props.params
  const j = find(code)
  if (!j) notFound()

  return (
    <div className="wrap">
      <RecordView
        journal={j}
        jsonHref={`/data/journal/${j.journal_code}.json`}
        metrics={{
          pcs: getPcsEntry(j.posi_id),
          pci: getPciEntry(j.posi_id),
          citationStats: getCitationStats(j.journal_code),
          pscName: j.psc_category ? PSC_NAME[j.psc_category] ?? null : null,
          ranking: (() => { const r = getJournalRanking(j.posi_id); return r ? { ...r, catName: categoryName(r.cat) } : null })(),
        }}
      />
      {(j.issn_online || j.issn_print) && (
        <div className="mt-8 flex flex-wrap gap-2 pb-10">
          <Link href={`/publications/?issn=${j.issn_online ?? j.issn_print}&sort=newest`} className="btn btn-primary">Browse publications</Link>
          <Link href={`/journal/?issn=${j.issn_online ?? j.issn_print}`} className="btn">Journal profile</Link>
          {collectionOf(j) === 'core' && (
            <a href={`/api/certificate/${j.journal_code}/pdf`} className="btn" target="_blank" rel="noopener">Certification certificate (PDF)</a>
          )}
        </div>
      )}
    </div>
  )
}
