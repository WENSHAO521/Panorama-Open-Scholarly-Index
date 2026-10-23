import Link from 'next/link'
import { PageHeader } from '@/components/db'

export const metadata = {
  title: 'Privacy policy',
  description: 'How posi.panorama-sg.com handles personal data: cookieless visit statistics, hosting, registry requests made from your browser, email, your rights and how to contact POSI.',
  alternates: { canonical: '/privacy/' },
}

const td = 'text-[13.5px] align-top'

export default function PrivacyPage() {
  return (
    <div className="pb-12">
      <PageHeader title="Privacy policy" crumbs={[{ label: 'POSI', href: '/' }, { label: 'Legal' }, { label: 'Privacy policy' }]}>
        <p className="max-w-[68ch]">
          This policy explains what personal data is processed when you use posi.panorama-sg.com (&ldquo;POSI&rdquo;),
          why, for how long, who else receives it, and the rights you have. Last updated 23 October 2026.
        </p>
      </PageHeader>

      <div className="doc">
        <section aria-labelledby="controller">
          <h2 id="controller">1. Who is responsible</h2>
          <p>
            POSI is published by Panorama Scholarly Group Ltd., Hong Kong SAR (&ldquo;we&rdquo;, &ldquo;us&rdquo;), which
            is the data user under the Hong Kong Personal Data (Privacy) Ordinance (Cap. 486) and the controller for the
            purposes of the EU and UK General Data Protection Regulation. Privacy enquiries:{' '}
            <a href="mailto:posi@panorama-sg.com">posi@panorama-sg.com</a>.
          </p>
        </section>

        <section aria-labelledby="summary">
          <h2 id="summary">2. In short</h2>
          <ul>
            <li>You can use all of POSI without an account, and we do not ask who you are.</li>
            <li>POSI sets no cookies of its own and runs no advertising, cross-site tracking or visitor profiling.</li>
            <li>We count visits with Cloudflare Web Analytics, which is cookieless and records no search terms.</li>
            <li>Publication searches go from your browser directly to public scholarly registries, not through POSI.</li>
            <li>We do not sell, rent or trade personal data.</li>
          </ul>
        </section>

        <section aria-labelledby="data">
          <h2 id="data">3. What we process and why</h2>

          <h3>3.1 Visit statistics</h3>
          <p>
            POSI uses Cloudflare Web Analytics to understand which pages are used and how quickly they load. When a
            page opens, a small script sends the page path, the referring page, the browser and operating system
            type, the screen size, the country derived from the connection, and page-load timings. It sets no
            cookies, uses no local storage, does not fingerprint your device and does not follow you across other
            sites. The query part of a page address, where your search terms appear, is not sent. We see the results
            only as aggregated counts; we do not use them to identify anyone.
          </p>

          <h3>3.2 Hosting and security</h3>
          <p>
            POSI is served by Cloudflare. To deliver pages and protect the site against abuse, Cloudflare processes
            standard connection data such as IP address, requested address, time, and browser type. Where it needs to
            distinguish people from automated traffic, Cloudflare may set a strictly necessary security cookie. POSI
            itself keeps no server logs.
          </p>

          <h3>3.3 Information kept in your browser</h3>
          <p>
            Two things are stored on your own device and are never sent to us: your light or dark theme choice
            (local storage, until you clear it), and recent publication search results (session storage, deleted when
            you close the tab) so that the same request is not repeated.
          </p>

          <h3>3.4 Requests your browser makes to scholarly registries</h3>
          <p>
            Publication search, publication pages, citation export and certificate checks send your query directly
            from your browser to public services, not through POSI. Each of them receives the query and your IP
            address and handles them under its own privacy policy:
          </p>
          <div className="panel overflow-x-auto">
            <table className="dtable">
              <thead><tr><th>Service</th><th>Used for</th></tr></thead>
              <tbody>
                <tr><td className={td}>OpenAlex (api.openalex.org)</td><td className={td}>Publication search and details, certificate checks</td></tr>
                <tr><td className={td}>Crossref (api.crossref.org)</td><td className={td}>DOI metadata and search, and fallback when OpenAlex cannot answer</td></tr>
                <tr><td className={td}>DataCite (api.datacite.org), Zenodo (zenodo.org)</td><td className={td}>DOIs registered outside Crossref</td></tr>
                <tr><td className={td}>doi.org</td><td className={td}>Finding which agency registered a DOI</td></tr>
                <tr><td className={td}>Open Library (openlibrary.org), Google Books (googleapis.com)</td><td className={td}>Book details when you cite by ISBN</td></tr>
              </tbody>
            </table>
          </div>
          <p>
            Journal search, journal profiles, rankings and the methodology pages are served by POSI and contact none
            of these services.
          </p>

          <h3>3.5 Information you send us</h3>
          <p>
            Certification applications, corrections and other enquiries reach us by email at posi@panorama-sg.com;
            POSI has no web forms that store what you write. We use your name, email address, affiliation and
            message only to handle your request and, for editorial matters, to keep a record of the decision made.
          </p>
          <p>
            The name, affiliation and purpose you type when issuing a certificate are placed on the certificate in
            your browser and are not sent to us.
          </p>

          <h3>3.6 Bibliographic metadata</h3>
          <p>
            Author names, ORCID iDs and affiliations shown with publications come from metadata that publishers have
            made public through Crossref and OpenAlex. POSI displays it to describe the scholarly record. To correct
            it, contact the publisher or the registry; see <Link href="/docs/data/#corrections">data sources and access</Link>.
            You may also write to us and we will point you to the right source.
          </p>
        </section>

        <section aria-labelledby="basis">
          <h2 id="basis">4. Legal basis</h2>
          <p>
            Where the GDPR applies, we rely on our legitimate interests in operating, securing and improving a
            public scholarly index (sections 3.1, 3.2 and 3.6), and on taking the steps you ask for when you write to
            us (section 3.5). Storage on your device (section 3.3) is limited to what is strictly necessary for the
            feature you use. Personal data is collected only for these purposes and is not used for any other.
          </p>
        </section>

        <section aria-labelledby="retention">
          <h2 id="retention">5. How long we keep it</h2>
          <ul>
            <li>Visit statistics: kept by Cloudflare in aggregated form for a limited period under its retention rules.</li>
            <li>Connection and security data: kept by Cloudflare only as long as needed to deliver and protect the service.</li>
            <li>Email: for as long as your request is open, and afterwards only where it documents an editorial decision.</li>
            <li>Browser storage: under your control; clearing your browser data removes it.</li>
          </ul>
        </section>

        <section aria-labelledby="recipients">
          <h2 id="recipients">6. Who receives it</h2>
          <p>
            Cloudflare, Inc. acts as our service provider for hosting, security and visit statistics, under its data
            processing terms. Our email provider stores the messages you send us. We disclose personal data
            otherwise only where the law requires it. The registries in section 3.4 receive requests from your
            browser directly, as independent providers.
          </p>
        </section>

        <section aria-labelledby="transfers">
          <h2 id="transfers">7. International transfers</h2>
          <p>
            Cloudflare runs a global network, so data may be processed outside Hong Kong and outside your own country.
            Where the GDPR applies, such transfers rely on Cloudflare&rsquo;s certification under the EU&ndash;US Data
            Privacy Framework or on the European Commission&rsquo;s standard contractual clauses.
          </p>
        </section>

        <section aria-labelledby="rights">
          <h2 id="rights">8. Your rights</h2>
          <p>
            You may ask whether we hold personal data about you, ask for a copy, and ask us to correct it. Where the
            GDPR applies you may also ask us to erase or restrict it, object to processing based on our legitimate
            interests, and receive data you gave us in a portable form. Write to{' '}
            <a href="mailto:posi@panorama-sg.com">posi@panorama-sg.com</a>; we reply within 40 days, the period set by the
            Hong Kong Ordinance, and sooner where the GDPR requires one month. Because POSI does not identify
            visitors, we usually hold no data about you beyond what you have emailed us.
          </p>
          <p>
            You may also complain to the Office of the Privacy Commissioner for Personal Data, Hong Kong, or to the data
            protection authority where you live or work.
          </p>
        </section>

        <section aria-labelledby="security">
          <h2 id="security">9. Security</h2>
          <p>
            POSI is a static site served only over HTTPS, with a content security policy that limits which outside
            services a page may contact. It has no user database to breach.
          </p>
        </section>

        <section aria-labelledby="children">
          <h2 id="children">10. Children</h2>
          <p>
            POSI is a research tool for adults and is not directed at children. We do not knowingly collect personal
            data from children.
          </p>
        </section>

        <section aria-labelledby="changes">
          <h2 id="changes">11. Changes to this policy</h2>
          <p>
            We publish any change on this page and update the date at the top. A change that affects how your data is
            used is also announced in <Link href="/announcements/">News</Link>.
          </p>
        </section>

        <section aria-labelledby="contact">
          <h2 id="contact">12. Contact</h2>
          <p>
            Panorama Scholarly Group Ltd., Hong Kong SAR &middot;{' '}
            <a href="mailto:posi@panorama-sg.com">posi@panorama-sg.com</a>
          </p>
        </section>
      </div>
    </div>
  )
}
