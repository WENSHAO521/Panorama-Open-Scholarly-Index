import Link from 'next/link'
import { PageHeader } from '@/components/db'
import { AjrCommon } from '@/components/AjrPage'

export const metadata = {
  title: 'AJR: Journal Development Ratings',
  description: 'AJR rates a journal’s lifecycle and publishing development: AJR-E for journals 12–59 months old, AJR-M from 60 months. Output is an AJR Score (0–100) and an AJR Rating from A+ to D, not a quartile.',
  alternates: { canonical: '/ratings/' },
}

export default function RatingsPage() {
  return (
    <div className="pb-12">
      <PageHeader title="AJR: Journal Development Ratings" crumbs={[{ label: 'POSI', href: '/' }, { label: 'Methodology', href: '/methodology/' }, { label: 'AJR' }]}>
        <p className="max-w-[68ch]">
          How strong is a journal&rsquo;s lifecycle and publishing-development profile? AJR answers with an AJR Score and
          an AJR Rating. Models: <Link href="/ratings/early-stage/" className="link">AJR-E</Link> and{' '}
          <Link href="/ratings/mature/" className="link">AJR-M</Link>.
        </p>
      </PageHeader>
      <div className="doc"><AjrCommon /></div>
    </div>
  )
}
