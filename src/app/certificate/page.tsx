import Link from 'next/link'
import { CertificateTool } from '@/components/CertificateTool'
import { PageHeader } from '@/components/db'

export const metadata = {
  title: 'Indexing certificate',
  description: 'Issue a verifiable certificate (论文收录检索证明) stating that your publications appear in POSI Core Collection journals. Free, instant, checked against Crossref and the live index.',
}

export default function CertificatePage() {
  return (
    <div className="wrap pb-10">
      <div className="no-print">
        <PageHeader title="Indexing certificate" crumbs={[{ label: 'POSI', href: '/' }, { label: 'Certificate' }]}>
          <p className="max-w-[68ch]">
            论文收录检索证明. Enter the DOIs of your publications. Each one is checked against Crossref and the POSI
            Core Collection, and a bilingual certificate is issued for those that are indexed. Anyone can verify it by
            scanning its code. See <Link href="/docs/certificates/" className="link">how certificates work</Link>.
          </p>
        </PageHeader>
      </div>
      <CertificateTool />
    </div>
  )
}
