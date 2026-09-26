import Link from 'next/link'
import { PageHeader } from '@/components/db'

export const metadata = {
  title: 'Terms of use',
  description: 'Terms governing use of the Panorama Open Scholarly Index at posi.panorama-sg.com.',
}

export default function TermsPage() {
  return (
    <div className="pb-12">
      <PageHeader title="Terms of use" crumbs={[{ label: 'POSI', href: '/' }, { label: 'Legal' }, { label: 'Terms of use' }]}>
        <p className="max-w-[68ch]">
          These terms govern use of posi.panorama-sg.com (&ldquo;POSI&rdquo;), published by Panorama Scholarly Group
          Ltd., Hong Kong SAR (&ldquo;we&rdquo;). By using POSI you agree to them.
        </p>
      </PageHeader>

      <div className="doc">
        <section aria-labelledby="service">
          <h2 id="service">1. The service</h2>
          <p>
            POSI is a citation index and journal directory. Its content combines metadata from Crossref and
            OpenAlex with POSI’s own classification, evaluation and rankings, produced under the published{' '}
            <Link href="/methodology/">methodology</Link> and <Link href="/editorial-policy/">editorial policy</Link>.
          </p>
        </section>

        <section aria-labelledby="license">
          <h2 id="license">2. Data and software licences</h2>
          <p>
            POSI data is licensed under CC BY 4.0: you may reuse and redistribute it with attribution to POSI.
            Third-party metadata keeps its original licence. The POSI software is licensed under the MIT License.
            The POSI name and logo are not licensed for use that suggests endorsement.
          </p>
        </section>

        <section aria-labelledby="use">
          <h2 id="use">3. Use of rankings and certificates</h2>
          <p>
            The <Link href="/responsible-use/">responsible use</Link> guidance forms part of these terms. A
            certificate of indexing states that a publication appeared in a journal indexed by POSI on the date of
            issue; it may be checked by anyone at <Link href="/certificate/verify/">certificate verification</Link>.
            Altering a certificate, or presenting indexing as Core Collection certification when it is not, is not
            permitted.
          </p>
        </section>

        <section aria-labelledby="warranty">
          <h2 id="warranty">4. No warranty</h2>
          <p>
            POSI is provided &ldquo;as is&rdquo;. We work to keep records accurate and correct errors promptly, but we
            do not warrant that any record, score or ranking is complete, current or free of error. Registry data is
            shown as the registry provides it.
          </p>
        </section>

        <section aria-labelledby="liability">
          <h2 id="liability">5. Limitation of liability</h2>
          <p>
            To the fullest extent permitted by law, Panorama Scholarly Group Ltd. is not liable for any loss arising
            from reliance on POSI data, rankings or certificates.
          </p>
        </section>

        <section aria-labelledby="links">
          <h2 id="links">6. External sites</h2>
          <p>
            POSI links to journal websites, DOI resolvers and other services. We are not responsible for their
            content or availability.
          </p>
        </section>

        <section aria-labelledby="law">
          <h2 id="law">7. Governing law and changes</h2>
          <p>
            These terms are governed by the laws of Hong Kong SAR. Changes are published on this page. Questions
            can be sent to <a href="mailto:posi@panorama-sg.com">posi@panorama-sg.com</a>.
          </p>
        </section>
      </div>
    </div>
  )
}
