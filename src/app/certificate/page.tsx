import Link from 'next/link'
import { CertificateTool } from '@/components/CertificateTool'
import { PageHeader } from '@/components/db'

export const metadata = {
  title: 'Indexing certificate',
  description: 'Issue a verifiable certificate of indexing for your journal publications. Free, instant, checked against Crossref, OpenAlex and the live POSI index.',
}

export default function CertificatePage() {
  return (
    <div className="wrap pb-10">
      <div className="no-print">
        <PageHeader title="Indexing certificate" crumbs={[{ label: 'POSI', href: '/' }, { label: 'Certificate' }]}>
          <p className="max-w-[68ch]">
            Enter the DOIs of your publications. Each one is checked against Crossref, OpenAlex and the POSI index, and a
            certificate is issued for every indexed journal publication, stating whether its journal is in the Core
            Collection. Anyone can verify the certificate by scanning its code. See <Link href="/docs/certificates/" className="link">how certificates work</Link>.
          </p>
        </PageHeader>
      </div>
      <CertificateTool />
    </div>
  )
}
