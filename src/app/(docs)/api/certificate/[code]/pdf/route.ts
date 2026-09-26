import { getJournalByCode, getCoreCollection, getCandidateJournals } from '@/lib/data'
import { generateCertificatePdf } from '@/lib/certificate-pdf'

// Core Collection + candidates — badges (src/app/api/badge/[code]/*/route.ts)
// stay Core-Collection-only (a badge asserts current, full membership), but
// a certificate documenting a journal's *current* POSI record is useful for
// candidates too, as long as it's visually and textually distinct from a
// full Core Collection certificate (generateCertificatePdf branches on
// collection_status) — never letting a demoted journal reuse imagery that
// reads as full membership.
export async function generateStaticParams() {
  const journals = [...getCoreCollection(), ...getCandidateJournals()]
  return journals.map(j => ({ code: j.journal_code }))
}

export const dynamicParams = false

export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const journal = getJournalByCode(code)
  if (!journal || journal.id.startsWith('j-disc-')) {
    return new Response('Not a POSI Core Collection or candidate journal', { status: 404 })
  }
  const pdfBytes = await generateCertificatePdf(journal)
  return new Response(pdfBytes as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
