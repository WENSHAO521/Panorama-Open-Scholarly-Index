// /data/pubmed/<NN>.json: NLM IDs of journals cited in PubMed whose ISSN
// starts with NN, plus the list's date. Built from src/lib/pubmed-journals.json
// (scripts/import-pubmed-list.mjs) so a journal page loads a small shard.
import { readFileSync } from 'fs'
import { join } from 'path'
import { scopusShard as shardOf } from '@/lib/scopus'

export const dynamic = 'force-static'
export const dynamicParams = false

// Read at build time rather than imported: typing 47,000 keys is slow for nothing.
const data: { as_of: string; list: string; d: Record<string, string> } =
  JSON.parse(readFileSync(join(process.cwd(), 'src/lib/pubmed-journals.json'), 'utf-8'))

export function generateStaticParams() {
  return Array.from({ length: 100 }, (_, i) => ({ file: `${String(i).padStart(2, '0')}.json` }))
}

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const shard = (await params).file.replace('.json', '')
  const d: Record<string, string> = {}
  for (const [k, v] of Object.entries(data.d)) if (shardOf(k) === shard) d[k] = v
  return Response.json({ as_of: data.as_of, list: data.list, d })
}
