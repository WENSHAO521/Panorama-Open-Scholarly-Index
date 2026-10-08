import Link from 'next/link'
import type { Metadata } from 'next'
import { PageHeader } from '@/components/db'

export const metadata: Metadata = {
  title: 'PSG Citation Format',
  description:
    'PSG Author-Date Citation Format - the official citation standard of Panorama Scholarly Group. Covers in-text citations, reference list rules, and examples for journals, books, datasets, software, AI tools, and multilingual sources.',
  alternates: { canonical: '/psg-format/' },
}

function Example({ children, intext }: { children: React.ReactNode; intext?: string }) {
  return (
    <>
      <div className="formula" style={{ fontSize: 13, lineHeight: 1.6, overflowX: 'visible' }}>{children}</div>
      {intext && <p className="text-[13px]">In-text: <code>{intext}</code></p>}
    </>
  )
}

function Table({ head, rows }: { head: [string, string]; rows: [string, string][] }) {
  return (
    <div className="panel overflow-x-auto">
      <table className="dtable">
        <thead><tr><th>{head[0]}</th><th>{head[1]}</th></tr></thead>
        <tbody>
          {rows.map(([a, b]) => (
            <tr key={a}><td className="font-medium whitespace-nowrap">{a}</td><td>{b}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function PsgFormatPage() {
  return (
    <div className="pb-12">
      <PageHeader
        title="PSG Author-Date Citation Format"
        crumbs={[{ label: 'POSI', href: '/' }, { label: 'Docs', href: '/docs/' }, { label: 'PSG Format' }]}
        actions={<Link href="/cite/" className="btn btn-primary">Citation generator</Link>}
      >
        <p>
          PSG Format is the author-date citation format of Panorama Scholarly Group. It follows a Chicago-style
          author-date structure with APA-informed practice for digital metadata, and adds rules for DOI
          normalisation, multilingual references, datasets, software, AI tools and reference integrity.
        </p>
      </PageHeader>

      <div className="doc">
        <div className="panel" style={{ padding: '0.75rem 1rem' }}>
          <div className="eyebrow">Core pattern</div>
          <p style={{ marginTop: 4 }} className="font-mono text-[13px]">
            Author. Year. &ldquo;Article Title.&rdquo; <em>Journal Name</em> Volume, no. Issue: Pages. https://doi.org/…
          </p>
        </div>

        <section aria-labelledby="in-text">
          <h2 id="in-text">1. In-text citations</h2>
          <p>PSG in-text citations use the author-year form in parentheses. Surnames only; no comma between author and year.</p>
          <Table
            head={['Type', 'PSG Format']}
            rows={[
              ['1 author', '(Smith 2024)'],
              ['2 authors', '(Smith and Lee 2024)'],
              ['3 authors', '(Smith, Lee, and Wang 2024)'],
              ['4 or more authors', '(Smith et al. 2024)'],
              ['With page number', '(Smith 2024, 25)'],
              ['Page range', '(Smith 2024, 25–27)'],
              ['Multiple sources', '(Chen 2021; Kim 2022; Smith 2024)'],
              ['No date', '(Smith n.d.)'],
              ['Same author, same year', '(Smith 2024a, 2024b)'],
            ]}
          />
        </section>

        <section aria-labelledby="reference-list">
          <h2 id="reference-list">2. Reference list formats</h2>

          <h3>Journal article</h3>
          <p><code>Last, First, and First Last. Year. &ldquo;Title.&rdquo; Journal Vol, no. Issue: Pages. https://doi.org/…</code></p>
          <Example intext="(Smith, Lee, and Wang 2024)">
            Smith, John A., Helen K. Lee, and Ming Wang. 2024. &ldquo;Artificial Intelligence and Administrative
            Reform in Local Government.&rdquo; <em>Journal of Public Governance and Society</em> 12, no. 2: 45–63.
            https://doi.org/10.xxxx/xxxxx
          </Example>

          <h3>Article number (no page range)</h3>
          <Example intext="(Chen and Park 2023)">
            Chen, Li, and Sungho Park. 2023. &ldquo;Digital Learning Anxiety among University Students.&rdquo;{' '}
            <em>Educational Psychology Review</em> 35, no. 2: Article 108. https://doi.org/10.xxxx/xxxxx
          </Example>

          <h3>Book</h3>
          <p><code>Last, First. Year. Book Title: Subtitle. Place: Publisher.</code></p>
          <Example intext="(Giddens 1991)">
            Giddens, Anthony. 1991. <em>Modernity and Self-Identity: Self and Society in the Late Modern Age.</em>{' '}
            Stanford: Stanford University Press.
          </Example>

          <h3>Book chapter</h3>
          <Example intext="(Lee 2022, 60)">
            Lee, Hyun K. 2022. &ldquo;Artificial Intelligence in Public Administration.&rdquo; In <em>Digital
            Governance in Asia</em>, edited by John Smith and Robert Brown, 55–78. Singapore: Springer.
            https://doi.org/10.xxxx/xxxxx
          </Example>

          <h3>Webpage</h3>
          <Example intext="(Panorama Scholarly Group 2026)">
            Panorama Scholarly Group. 2026. &ldquo;Publication Ethics.&rdquo; Accessed June 24, 2026.
            https://example.com/publication-ethics
          </Example>

          <h3>Government or institutional report</h3>
          <Example intext="(Ministry of Education 2024)">
            Ministry of Education. 2024. <em>Annual Report on Higher Education Development.</em> Seoul:
            Ministry of Education. https://example.gov/report
          </Example>

          <h3>Chinese-language source</h3>
          <p>Original-language title + English translation in square brackets. Author names romanized (Pinyin).</p>
          <Example intext="(Wang and Li 2023)">
            Wang, Ming, and Hua Li. 2023. &ldquo;数字治理背景下的公共服务改革 [Public Service Reform in the
            Context of Digital Governance].&rdquo; <em>公共行政研究 [Public Administration Research]</em> 15,
            no. 2: 45–58. https://doi.org/10.xxxx/xxxxx
          </Example>

          <h3>Korean-language source</h3>
          <Example intext="(Kim 2024)">
            Kim, Minsoo. 2024. &ldquo;공공기관의 디지털 전환과 조직성과 [Digital Transformation and
            Organizational Performance in Public Institutions].&rdquo; <em>한국행정학보 [Korean Public
            Administration Review]</em> 58, no. 1: 101–125. https://doi.org/10.xxxx/xxxxx
          </Example>

          <h3>Dataset</h3>
          <Example intext="(Lee 2024)">
            Lee, Sungho. 2024. <em>Survey Data on Digital Public Service Satisfaction in South Korea.</em>{' '}
            Data set. Zenodo. https://doi.org/10.xxxx/xxxxx
          </Example>

          <h3>Software / GitHub repository</h3>
          <Example intext="(Chen 2024)">
            Chen, Li. 2024. <em>OJS Reference Checker.</em> Source code. GitHub.
            https://github.com/example/ojs-reference-checker
          </Example>

          <h3>AI tool</h3>
          <Example intext="(OpenAI 2026)">
            OpenAI. 2026. <em>ChatGPT.</em> Large language model. https://chat.openai.com/
          </Example>
        </section>

        <section aria-labelledby="rules">
          <h2 id="rules">3. Fixed rules</h2>
          <Table
            head={['Element', 'PSG rule']}
            rows={[
              ['In-text style', 'Author-year parenthetical; no comma between author and year'],
              ['Year position', 'After author in reference list; no brackets'],
              ['Article title', 'English curly/typographic quotes “ ”; period inside closing quote'],
              ['Journal name', 'Italic (plain text: no special markup)'],
              ['Volume & issue', '12, no. 2'],
              ['Page range', '45–63 (en dash, not hyphen)'],
              ['Article number', 'Article 108'],
              ['DOI format', 'Must be https://doi.org/…'],
              ['After DOI', 'No trailing period after DOI or URL'],
              ['After URL (no DOI)', 'No trailing period'],
              ['Multilingual title', 'Original title + [English translation] in square brackets'],
              ['Author connector', 'and (not &)'],
              ['4+ authors in-text', 'et al.'],
              ['Author format (1st)', 'Last, First (inverted)'],
              ['Author format (others)', 'First Last (natural order)'],
            ]}
          />
        </section>

        <section aria-labelledby="batch">
          <h2 id="batch">4. Batch conversion</h2>
          <p>
            The <Link href="/cite/">citation generator</Link> converts 100 or more references to PSG in one run (up to
            1,000). Paste DOIs one per line, paste a reference list in APA, AMA, MLA, Chicago, IEEE, Harvard or GB/T
            style, or open a BibTeX, RIS or CSL JSON export. DOIs are looked up in Crossref in bulk, with OpenAlex as a
            fallback; references without a DOI are matched by title, and any match not confirmed by its DOI is flagged for
            checking. Output can be sorted alphabetically, copied, or downloaded.
          </p>
        </section>

        <section aria-labelledby="definition">
          <h2 id="definition">5. Official definition</h2>
          <div className="panel" style={{ padding: '1rem 1.25rem', borderLeft: '4px solid var(--teal)' }}>
            <p>
              <strong>PSG Format</strong> is the official author-date citation format of Panorama Scholarly
              Group. It uses a Chicago-style author-date structure, APA-informed digital metadata practices,
              and PSG-specific rules for DOI normalization, multilingual references, datasets, software, AI
              tools, and reference integrity.
            </p>
          </div>
        </section>

        <p className="text-[13px]" style={{ marginTop: '2.5rem' }}>
          <Link href="/cite/">Citation generator</Link> · <Link href="/editorial-policy/">Publication policies</Link> · <Link href="/about/">About POSI</Link>
        </p>
      </div>
    </div>
  )
}
