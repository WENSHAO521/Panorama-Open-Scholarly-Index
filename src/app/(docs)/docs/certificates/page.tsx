import Link from 'next/link'
import { PageHeader } from '@/components/db'
import { MAX_DOIS } from '@/lib/certificate'

export const metadata = {
  title: 'How certificates work',
  description: 'What a POSI certificate of indexing states, how its numbers are derived, and how it is verified without a server.',
}

export default function CertificatesDoc() {
  return (
    <div className="pb-10 max-w-[820px]">
      <PageHeader title="How certificates work" crumbs={[{ label: 'Docs', href: '/docs/' }, { label: 'Certificates' }]}>
        <p>
          A certificate of indexing states that specific publications are indexed in the Panorama Open Scholarly Index,
          and whether each one appeared in a Core Collection journal. <Link href="/certificate/" className="link">Issue one here</Link>.
          It is free and immediate.
        </p>
      </PageHeader>

      <div className="prose-doc">
        <h2 style={{ marginTop: 0 }}>What POSI indexes</h2>
        <p>
          POSI indexes every journal with DOIs registered at Crossref or a source record in OpenAlex. A publication is
          indexed when Crossref holds its DOI as a journal article under a journal ISSN or, for DOIs Crossref does not
          hold, when OpenAlex records it with a journal as its source. Books, chapters, datasets and preprints are not
          journal publications and are not certified.
        </p>
        <p>
          Within the index, journals that applied for certification and passed the PQF editorial evaluation form the{' '}
          <Link href="/core-collection/">Core Collection</Link>. The certificate names each publication&apos;s journal
          status: <strong>Core Collection</strong> or <strong>Indexed</strong>.
        </p>

        <h2>What the certificate contains</h2>
        <ul>
          <li>A certificate number, the date of issue and the data snapshot the check ran against.</li>
          <li>The requester, affiliation and purpose, exactly as typed by the person issuing it. These are not verified.</li>
          <li>For each indexed publication: title, authors, journal, volume, issue, pages, year, DOI, ISSN, the registry it was indexed through, an accession number, the journal status and the registry citation count on the date of issue.</li>
          <li>A QR code and address for verification.</li>
        </ul>
        <p>Up to {MAX_DOIS} DOIs can be checked at once. DOIs that are not indexed are counted but not listed. Certificates are issued in English.</p>

        <h2>How the numbers are made</h2>
        <p>
          The <strong>certificate number</strong> (<code>PC-XXXX-XXXX-XXXX</code>) is the first 12 hexadecimal digits of
          SHA-256 over <code>POSI-CERT-2|date of issue|snapshot|DOIs</code>, with DOIs lower-cased and sorted. The{' '}
          <strong>accession number</strong> (<code>POSI-A-XXXXX-XXXXX</code>) is the first 10 hexadecimal digits of
          SHA-256 over the lower-cased DOI, so a publication keeps the same accession number whatever happens to its
          journal. Both are deterministic and can be recomputed by anyone; the code is in <code>src/lib/certificate.ts</code>.
        </p>

        <h2>How verification works</h2>
        <p>Verification does not depend on a register of issued certificates. It re-derives each certificate from its contents:</p>
        <ul>
          <li>The certificate number is recomputed from the date, snapshot and DOI list in the link. A mismatch means the certificate was altered.</li>
          <li>Every DOI is re-checked against Crossref, OpenAlex and the current POSI index. Changes since issue, such as a journal leaving the Core Collection, are reported.</li>
        </ul>
        <p>
          Because the facts are checked again every time, a certificate claiming a publication is indexed when it is not
          fails verification, whoever produced it. Printed names and purposes are not part of the link and are not
          verified; relying parties should confirm identity separately.
        </p>

        <h2>Appropriate use</h2>
        <p>
          A certificate records indexing status. It is not an assessment of the quality of a publication or journal. See{' '}
          <Link href="/responsible-use/">responsible use</Link>.
        </p>
      </div>
    </div>
  )
}
