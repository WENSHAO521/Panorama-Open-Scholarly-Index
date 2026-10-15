// /data/scopus/<NN>.json: the Scopus source list entries whose ISSN starts
// with NN, plus the list's date. Built from src/lib/scopus-sources.json so a
// journal page loads ~25 KB instead of the whole list.
import { readFileSync } from 'fs'
import { join } from 'path'
import { scopusShard, type ScopusEntry } from '@/lib/scopus'

export const dynamic = 'force-static'
export const dynamicParams = false

// Read at build time rather than imported: typing 76,000 keys is slow for nothing.
const data: { as_of: string; list: string; d: Record<string, ScopusEntry> } =
  JSON.parse(readFileSync(join(process.cwd(), 'src/lib/scopus-sources.json'), 'utf-8'))

export function generateStaticParams() {
  return Array.from({ length: 100 }, (_, i) => ({ file: `${String(i).padStart(2, '0')}.json` }))
}

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const shard = (await params).file.replace('.json', '')
  const d: Record<string, ScopusEntry> = {}
  for (const [k, v] of Object.entries(data.d)) if (scopusShard(k) === shard) d[k] = v
  return Response.json({ as_of: data.as_of, list: data.list, d })
}
