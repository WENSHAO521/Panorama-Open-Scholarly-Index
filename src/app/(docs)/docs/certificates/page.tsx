import Link from 'next/link'
import { PageHeader } from '@/components/db'
import { MAX_DOIS } from '@/lib/certificate'
import { ZONES_VERSION } from '@/lib/zones'

export const metadata = {
  title: 'How certificates work',
  description: 'What a POSI certificate of indexing states, how its numbers are derived, and how it is verified without a server.',
  alternates: { canonical: '/docs/certificates/' },
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

        <h2 id="zone-certificates">Zone certificates</h2>
        <p>
          A <Link href="/certificate/zone/">zone certificate</Link> (POSI 分区证书) states a journal&apos;s{' '}
          <Link href="/methodology/#zones">POSI Zone</Link> in the current Citation Ranking: the zone of its PNCI
          percentile within its PSC subject category (Zone 1: top 5%; Zone 2: top 5–20%; Zone 3: top 20–50%; Zone 4:
          lower 50%). It is available for every journal with an <strong>official</strong> zone (an official ranking in a
          category of at least 50 ranked journals), from the journal&apos;s profile page, and needs no application.
        </p>
        <ul>
          <li>The category, the zone, the citation rank, category size, percentile and Citation Quartile.</li>
          <li>The journal&apos;s title, publisher, ISSNs and POSI ID, its PNCI, and the ranking snapshot, data snapshot and zone rule (<code>{ZONES_VERSION}</code>) it was read from.</li>
        </ul>
        <p>
          The <strong>certificate number</strong> (<code>PZ-XXXX-XXXX-XXXX</code>) is the first 12 hexadecimal digits
          of SHA-256 over <code>POSI-ZONE-CERT-2|zone rule|date of issue|POSI ID|edition year|category|zone</code>.
          Verification recomputes it from the journal&apos;s current ranking record. Ranks are deliberately left out, so a
          certificate stays valid while its zone holds and stops verifying when the zone changes or the edition year
          moves on, with the next annual edition each December. The code is in <code>src/lib/zone-certificate.ts</code>.
        </p>
        <p>
          Certificates issued before 28 September 2026 stated zones of the retired PCS-based trial
          (<code>POSI-ZONES-1.0</code>, <code>POSI-ZONE-CERT-1</code>). That ranking has been withdrawn, so they no longer
          verify.
        </p>

        <h2>Appropriate use</h2>
        <p>
          A certificate records indexing status or ranking position. It is not an assessment of the quality of a publication or journal. See{' '}
          <Link href="/responsible-use/">responsible use</Link>.
        </p>
      </div>
    </div>
  )
}
