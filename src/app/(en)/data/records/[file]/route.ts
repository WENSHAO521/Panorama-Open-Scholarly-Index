// Full records for Discovered journals, sharded by a hash of the record key:
// /data/records/discovered-<00-63>.json. Discovered records have
// no statically generated page (Cloudflare Pages' 20,000-file limit); the
// /record/ viewer reads these shards in the browser instead.
import { DISCOVERED_JOURNALS } from '@/lib/data'
import { shardOf, RECORD_SHARDS } from '@/lib/records'

const SHARDS = Array.from({ length: RECORD_SHARDS }, (_, i) => String(i).padStart(2, '0'))

export const dynamic = 'force-static'
export const dynamicParams = false

export function generateStaticParams() {
  return SHARDS.map(s => ({ file: `discovered-${s}.json` }))
}

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params
  const shard = file.replace(/^discovered-/, '').replace(/\.json$/, '')
  return Response.json(DISCOVERED_JOURNALS.filter(j => shardOf(j.journal_code) === shard))
}
