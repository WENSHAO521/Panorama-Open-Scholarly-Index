import { type NextRequest, NextResponse } from 'next/server'
import { crossrefSearch } from '@/lib/api'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const q        = sp.get('q') ?? ''
  const scope    = (sp.get('scope') ?? 'all') as 'all' | 'psg'
  const page     = Number(sp.get('page') ?? '1')
  const rows     = Number(sp.get('rows') ?? '20')
  const yearFrom = sp.get('yearFrom') ? Number(sp.get('yearFrom')) : undefined
  const yearTo   = sp.get('yearTo')   ? Number(sp.get('yearTo'))   : undefined
  const issn     = sp.get('issn') ?? undefined

  try {
    const result = await crossrefSearch(q, { page, rows, yearFrom, yearTo, scope, issn })
    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    })
  } catch {
    return NextResponse.json({ total: 0, items: [] }, { status: 500 })
  }
}
