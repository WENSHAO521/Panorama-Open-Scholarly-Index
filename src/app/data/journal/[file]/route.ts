// Full record JSON for every statically published record:
// /data/journal/<journal_code>.json
import { collectionOf, verificationOf, freshnessOf } from '@/lib/records'
import { getStaticRecordJournals } from '@/lib/records-data'
import { getPcsEntry } from '@/lib/pcs'
import { getPciEntry } from '@/lib/pci'
import { DATA_CUTOFF } from '@/lib/release'
import { getCitationRecord, getPcsValue, categoryName } from '@/lib/rankings'
import { buildJournalEvaluation } from '@/lib/evaluation/journal'

export const dynamic = 'force-static'
export const dynamicParams = false

export function generateStaticParams() {
  return getStaticRecordJournals().map(j => ({ file: `${j.journal_code}.json` }))
}

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params
  const code = file.replace(/\.json$/, '')
  const j = getStaticRecordJournals().find(x => x.journal_code === code)
  if (!j) return new Response('Not found', { status: 404 })
  const pcs = getPcsEntry(j.posi_id)
  // PCI and AJR are Core Collection indicators: no other journal reports them.
  const core = collectionOf(j) === 'core'
  const pci = core ? getPciEntry(j.posi_id) : null
  const record = core ? j : { ...j, early_stage_rating: undefined, mature_rating: undefined }
  const ranking = getCitationRecord(j.posi_id)
  return Response.json({
    record,
    status: { collection: collectionOf(j), verification: verificationOf(j), freshness: freshnessOf(j), data_cutoff: DATA_CUTOFF },
    // POSI-EVAL-1.0 evaluation (posi-data schema/evaluation.schema.json).
    evaluation: buildJournalEvaluation({ journal: j, ranking, pci: pci?.pci ?? null, pcs: pcs?.pcs ?? getPcsValue(j.posi_id), categoryName: categoryName(ranking?.ranking_category_id ?? null) }),
    // Source records of the PCS and PCI indicators, unchanged. In `record`,
    // pqf.grade and early_stage_rating's quartile/cohort fields are deprecated
    // (POSI-EVAL-1.0): kept for existing consumers, not an evaluation result.
    indicators: { pcs, pci },
  })
}
