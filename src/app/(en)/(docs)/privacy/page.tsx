import Link from 'next/link'
import { PageHeader } from '@/components/db'

export const metadata = {
  title: 'Privacy policy',
  description: 'What information posi.panorama-sg.com processes, what it does not collect, and how to contact POSI about privacy.',
  alternates: { canonical: '/privacy/' },
}

export default function PrivacyPage() {
  return (
    <div className="pb-12">
      <PageHeader title="Privacy policy" crumbs={[{ label: 'POSI', href: '/' }, { label: 'Legal' }, { label: 'Privacy policy' }]}>
        <p className="max-w-[68ch]">
          POSI is published by Panorama Scholarly Group Ltd., Hong Kong SAR. This policy describes what information
          is processed when you use posi.panorama-sg.com.
        </p>
      </PageHeader>

      <div className="doc">
        <section aria-labelledby="accounts">
          <h2 id="accounts">No accounts, no tracking</h2>
          <p>
            You do not need an account to use POSI. POSI sets no cookies, runs no analytics or advertising scripts,
            and builds no visitor profiles.
          </p>
        </section>

        <section aria-labelledby="browser">
          <h2 id="browser">Information kept in your browser</h2>
          <p>
            To avoid repeating the same request, recent search results are kept in your browser’s session storage
            and are deleted when you close the tab. This information stays on your device and is not sent to POSI.
          </p>
        </section>

        <section aria-labelledby="registries">
          <h2 id="registries">Requests to scholarly registries</h2>
          <p>
            Publication search, publication pages and certificate checks send your query directly from your
            browser to OpenAlex (api.openalex.org) and Crossref (api.crossref.org), and, when those cannot answer or do not
            hold a DOI, to DataCite (api.datacite.org) and Zenodo (zenodo.org). To choose the right registry, DOI lookups also first ask doi.org (doi.org/doiRA) which agency registered the DOI. These services receive your
            query and your IP address as part of the request, under their own privacy policies. Journal search and
            journal profiles are served by POSI and do not contact these services.
          </p>
        </section>

        <section aria-labelledby="hosting">
          <h2 id="hosting">Hosting</h2>
          <p>
            POSI is hosted on Cloudflare. Cloudflare processes standard connection information, such as IP address,
            requested page, time and browser type, to deliver pages and protect the site from abuse. POSI adds no
            logging of its own.
          </p>
        </section>

        <section aria-labelledby="email">
          <h2 id="email">Information you send us</h2>
          <p>
            Certification applications, certificates and enquiries are sent by email to posi@panorama-sg.com; POSI
            has no web forms that store your message. We use what you send only to handle your request, and keep it
            as long as needed for that purpose and for the record of editorial decisions.
          </p>
          <p>
            The name, affiliation and purpose you enter when issuing a certificate are printed on the certificate in
            your browser and are not sent to POSI.
          </p>
        </section>

        <section aria-labelledby="metadata">
          <h2 id="metadata">Bibliographic metadata</h2>
          <p>
            Author names and affiliations shown with publications come from published metadata in Crossref and
            OpenAlex. To correct them, contact the publisher or the registry; see{' '}
            <Link href="/docs/data/#corrections">data sources and access</Link>.
          </p>
        </section>

        <section aria-labelledby="contact">
          <h2 id="contact">Contact and changes</h2>
          <p>
            Questions about privacy can be sent to <a href="mailto:posi@panorama-sg.com">posi@panorama-sg.com</a>.
            Changes to this policy are published on this page.
          </p>
        </section>
      </div>
    </div>
  )
}
