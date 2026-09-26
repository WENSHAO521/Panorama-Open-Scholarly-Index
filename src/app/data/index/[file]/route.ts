// Static index files: /data/index/{core,benchmark,discovered}.{json,csv}
// Generated at build time from the vendored corpus — there is no server.
import { toIndexRecord, type IndexRecord, type Collection } from '@/lib/records'
import { getAllRecords } from '@/lib/records-data'

const GROUPS: Record<string, Collection[]> = {
  core: ['core', 'candidate'],
  benchmark: ['benchmark'],
  discovered: ['discovered'],
}

export const dynamic = 'force-static'
export const dynamicParams = false

export function generateStaticParams() {
  return Object.keys(GROUPS).flatMap(g => [{ file: `${g}.json` }, { file: `${g}.csv` }])
}

function rows(group: string): IndexRecord[] {
  const cols = GROUPS[group]
  return getAllRecords().map(toIndexRecord).filter(r => cols.includes(r.k))
}

const CSV_COLUMNS: [string, (r: IndexRecord) => unknown][] = [
  ['posi_id', r => r.id], ['journal_code', r => r.c], ['title', r => r.t],
  ['issn', r => r.i.join(' ')], ['publisher', r => r.p], ['country', r => r.co],
  ['psc_category', r => r.s], ['collection', r => r.k], ['verification', r => r.v],
  ['open_access', r => r.oa], ['doaj_status', r => r.d], ['article_count', r => r.n], ['updated', r => r.u],
]

function csvCell(v: unknown): string {
  if (v === null || v === undefined) return ''
  const s = String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params
  const [group, ext] = file.split('.')
  const data = rows(group)
  if (ext === 'csv') {
    const body = [CSV_COLUMNS.map(c => c[0]).join(','), ...data.map(r => CSV_COLUMNS.map(([, f]) => csvCell(f(r))).join(','))].join('\n')
    return new Response(body, { headers: { 'Content-Type': 'text/csv; charset=utf-8' } })
  }
  return Response.json(data)
}
