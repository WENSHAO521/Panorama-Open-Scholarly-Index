// Full record JSON for every statically published record:
// /data/journal/<journal_code>.json
import { collectionOf, verificationOf, freshnessOf } from '@/lib/records'
import { getStaticRecordJournals } from '@/lib/records-data'
import { getPcsEntry } from '@/lib/pcs'
import { getPciEntry } from '@/lib/pci'
import { DATA_CUTOFF } from '@/lib/release'

export const dynamic = 'force-static'
export const dynamicParams = false

export function generateStaticParams() {
  return getStaticRecordJournals().map(j => ({ file: `${j.journal_code}.json` }))
}

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params
  const code = file.replace(/\.json$/, '')
  const j = getStaticRecordJournals().find(x => x.journal_code === code)
  if (!j) return new Response('Not found', { status: 404 })
  return Response.json({
    record: j,
    status: { collection: collectionOf(j), verification: verificationOf(j), freshness: freshnessOf(j), data_cutoff: DATA_CUTOFF },
    indicators: { pcs: getPcsEntry(j.posi_id), pci: getPciEntry(j.posi_id) },
  })
}
