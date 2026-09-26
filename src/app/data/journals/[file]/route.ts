// Static journal directory files:
//   /data/journals/index.json            categories with counts and file names
//   /data/journals/<category>.json       every journal in a PSC category
//   /data/journals/<category>--<a-z|0>.json  per-letter parts of very large groups
import { getDirectory, getDirectoryCategories, getCategoryJournals, categoryFiles, letterOf } from '@/lib/global-journals'

export const dynamic = 'force-static'
export const dynamicParams = false

export function generateStaticParams() {
  return [{ file: 'index.json' }, ...getDirectoryCategories().filter(c => c.count > 0).flatMap(c => categoryFiles(c.code).map(file => ({ file })))]
}

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params
  if (file === 'index.json') {
    const { records, source } = getDirectory()
    return Response.json({
      total: records.length,
      core: records.filter(r => r.core).length,
      source,
      categories: getDirectoryCategories().map(c => ({ ...c, files: c.count ? categoryFiles(c.code) : [] })),
    })
  }
  const m = file.match(/^(.+?)(?:--([a-z0]))?\.json$/)!
  const rows = getCategoryJournals(m[1])
  return Response.json(m[2] ? rows.filter(r => letterOf(r.t) === m[2]) : rows)
}
