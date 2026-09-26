// Small metadata files: /data/meta/{stats,psc,schema}.json
import { toIndexRecord } from '@/lib/records'
import { getAllRecords, getPublishers } from '@/lib/records-data'
import { JOURNAL_FIELDS, INDEX_KEYS } from '@/lib/schema'
import { DATA_CUTOFF, IS_OFFICIAL_RELEASE } from '@/lib/release'
import psc from '@/lib/psc-v1.0.snapshot.json'

export const dynamic = 'force-static'
export const dynamicParams = false

export function generateStaticParams() {
  return ['stats.json', 'psc.json', 'schema.json', 'publishers.json'].map(file => ({ file }))
}

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params
  if (file === 'psc.json') return Response.json(psc)
  if (file === 'publishers.json') return Response.json(getPublishers())
  if (file === 'schema.json') return Response.json({ fields: JOURNAL_FIELDS, index_keys: INDEX_KEYS })
  const idx = getAllRecords().map(toIndexRecord)
  const tally = (key: 'k' | 'v') => idx.reduce<Record<string, number>>((a, r) => { a[r[key]] = (a[r[key]] ?? 0) + 1; return a }, {})
  return Response.json({
    data_cutoff: DATA_CUTOFF,
    is_official_release: IS_OFFICIAL_RELEASE,
    records: idx.length,
    by_collection: tally('k'),
    by_verification: tally('v'),
  })
}
