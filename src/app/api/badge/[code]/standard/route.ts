import { getJournalByCode, getCoreCollection, getCandidateJournals } from '@/lib/data'
import { badgeStandardSvg } from '@/lib/badge-svg'

// Core Collection + candidates (demoted Core Collection journals still get a
// badge — a differently-styled one, see badge-svg.ts) — auto-discovered/
// unreviewed records are excluded, badge eligibility requires at least
// having gone through PQF review once.
export async function generateStaticParams() {
  const journals = [...getCoreCollection(), ...getCandidateJournals()]
  return journals.map(j => ({ code: j.journal_code }))
}

// Any code not returned by generateStaticParams() 404s — this is the actual
// enforcement mechanism for "badges are only available to indexed journals",
// not just a UI-level notice.
export const dynamicParams = false

export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const journal = getJournalByCode(code)
  if (!journal || journal.id.startsWith('j-disc-')) {
    return new Response('Not a POSI Core Collection or candidate journal', { status: 404 })
  }
  return new Response(badgeStandardSvg(journal), {
    headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400' },
  })
}
