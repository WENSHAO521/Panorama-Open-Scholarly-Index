import Link from 'next/link'
import { PageHeader } from '@/components/db'
import { MAX_DOIS } from '@/lib/certificate'

export const metadata = {
  title: 'How certificates work',
  description: 'What a POSI indexing certificate states, how its number and accession numbers are derived, and how verification works without a server.',
}

export default function CertificatesDoc() {
  return (
    <div className="pb-10 max-w-[820px]">
      <PageHeader title="How certificates work" crumbs={[{ label: 'Docs', href: '/docs/' }, { label: 'Certificates' }]}>
        <p>
          An indexing certificate (论文收录检索证明) states that specific publications appeared in journals indexed in
          the POSI Core Collection. <Link href="/certificate/" className="link">Issue one here</Link>; it is free and immediate.
        </p>
      </PageHeader>

      <div className="prose-doc">
        <h2 style={{ marginTop: 0 }}>What counts as indexed</h2>
        <p>
          A publication is indexed when its DOI is registered with Crossref under an ISSN belonging to a journal in the
          POSI Core Collection. Only the Core Collection counts. Core Candidates under re-review, the Global Benchmark
          (an external validation corpus) and Discovered records (found in registries, never reviewed) are not indexed
          by POSI and are never certified. See the <Link href="/coverage/policy/">coverage policy</Link>.
        </p>

        <h2>What the certificate contains</h2>
        <ul>
          <li>A certificate number, the issue date and the data snapshot the check ran against.</li>
          <li>The requester, affiliation and purpose, exactly as typed by the person issuing it. These are not verified.</li>
          <li>For each indexed publication: title, authors, journal, volume, issue, pages, year, DOI, the journal&apos;s POSI-J id, a POSI accession number and the Crossref citation count on the issue date.</li>
          <li>A QR code and address for verification.</li>
        </ul>
        <p>Up to {MAX_DOIS} DOIs can be checked at once. DOIs that are not indexed are counted but not listed.</p>

        <h2>How the numbers are made</h2>
        <p>
          The <strong>certificate number</strong> (<code>PC-XXXX-XXXX-XXXX</code>) is the first 12 hexadecimal digits of
          SHA-256 over the string <code>POSI-CERT-1|issue date|snapshot|DOIs</code>, with DOIs lower-cased and sorted.
          The <strong>accession number</strong> (<code>POSI-A-&lt;journal&gt;-&lt;8 hex&gt;</code>) combines the
          journal&apos;s POSI-J number with the first 8 hexadecimal digits of SHA-256 over the DOI. Both are
          deterministic: anyone can recompute them. The code lives in <code>src/lib/certificate.ts</code>.
        </p>

        <h2>How verification works</h2>
        <p>
          POSI has no server and keeps no register of issued certificates. Verification therefore does not look a
          certificate up. It re-derives it:
        </p>
        <ul>
          <li>The certificate number is recomputed from the date, snapshot and DOI list in the link. A mismatch means the certificate was altered.</li>
          <li>Every DOI is re-checked against Crossref and the current POSI index. A publication whose journal has left the Core Collection since issue is reported as changed.</li>
        </ul>
        <p>
          Because the facts are checked again every time, a certificate claiming a publication is indexed when it is not
          fails verification no matter who produced it. Printed names and purposes are not part of the link and are not
          verified; relying parties should confirm identity separately.
        </p>

        <h2>Appropriate use</h2>
        <p>
          A certificate records indexing status. It is not an assessment of the quality of a paper or journal, and POSI
          indicators must not be used to evaluate individual researchers. See{' '}
          <Link href="/responsible-use/">responsible use</Link>.
        </p>
      </div>
    </div>
  )
}
