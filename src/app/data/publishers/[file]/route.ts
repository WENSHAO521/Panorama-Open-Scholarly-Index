// Publisher details (summary, countries, subjects, journals), sharded by the
// first character of the publisher slug: /data/publishers/<0|a-z>.json.
// The /publisher/ viewer reads these for publishers without a static page.
import { getPublisherDetails } from '@/lib/records-data'
import { PUBLISHER_SHARDS, publisherShardOf } from '@/lib/publishers'

export const dynamic = 'force-static'
export const dynamicParams = false

export function generateStaticParams() {
  return PUBLISHER_SHARDS.map(s => ({ file: `${s}.json` }))
}

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params
  const shard = file.replace(/\.json$/, '')
  return Response.json(getPublisherDetails().filter(p => publisherShardOf(p.slug) === shard))
}
