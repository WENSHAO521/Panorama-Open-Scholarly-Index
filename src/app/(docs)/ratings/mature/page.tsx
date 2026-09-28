import Link from 'next/link'
import { PageHeader } from '@/components/db'
import { AjrCommon } from '@/components/AjrPage'

export const metadata = {
  title: 'AJR-M: Mature Journal Rating',
  description: 'AJR-M rates journals 60 months or more after first publication, as an AJR Score (0–100) and an AJR Rating (A+ to D). It is never computed with the early-stage rubric.',
  alternates: { canonical: '/ratings/mature/' },
}

export default function MaturePage() {
  return (
    <div className="pb-12">
      <PageHeader title="AJR-M: Mature Journal Rating" crumbs={[{ label: 'POSI', href: '/' }, { label: 'AJR', href: '/ratings/' }, { label: 'AJR-M' }]}>
        <p className="max-w-[68ch]">For journals 60 months or more after their first publication (<code>AJR-M-1.0</code>).</p>
      </PageHeader>
      <div className="doc">
        <p>
          AJR-M weighs citation performance together with output, governance, infrastructure, reach and transparency.
          A mature journal is never scored with the <Link href="/ratings/early-stage/">AJR-E</Link> rubric. Until AJR-M
          has been run for a journal, its page shows &ldquo;AJR-M: not yet rated&rdquo;; missing evidence narrows what is
          scored and is never counted as zero.
        </p>
        <AjrCommon />
      </div>
    </div>
  )
}
