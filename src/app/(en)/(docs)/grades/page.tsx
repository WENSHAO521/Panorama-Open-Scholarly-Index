import Link from 'next/link'
import { PageHeader } from '@/components/db'
import { PosiGrades } from '@/components/PosiGrades'
import { AJR_RATING_SCALE } from '@/lib/evaluation/rules'
import { ZONE_SHARE } from '@/lib/evaluation/display'

export const metadata = {
  title: 'How to read POSI grades',
  description: 'The POSI grades badge: Core Collection tier, AJR rating, Citation Quartile and POSI Zone, what each means and how it is assigned.',
  alternates: { canonical: '/grades/' },
}

const PARTS: [string, string, string, React.ReactNode][] = [
  ['Tier', 'Core · Indexed', 'Core journals applied for certification and passed PQF editorial evaluation. Every other journal registered with Crossref or OpenAlex is Indexed, including a formerly certified journal a PQF re-review found below the bar.', <Link key="t" href="/editorial-policy/#certification">Editorial policy</Link>],
  ['AJR', AJR_RATING_SCALE.map(([r]) => r).join(' · '), 'An absolute lifecycle rating from published evidence, for Core Collection journals only. Not a quartile: many journals can share a rating.', <Link key="a" href="/ratings/">AJR ratings</Link>],
  ['C-Q', 'C-Q1 · C-Q2 · C-Q3 · C-Q4', 'Citation Quartile: the journal’s PNCI percentile within its PSC subject category, in four equal bands.', <Link key="q" href="/methodology/#quartiles">Citation Quartiles</Link>],
  ['Zone', `${Object.entries(ZONE_SHARE).map(([z]) => z).join(' · ')}`, `POSI Zone: a tiered reading of the same percentile. ${Object.entries(ZONE_SHARE).map(([z, s]) => `Zone ${z} is ${s.toLowerCase()}`).join('; ')}.`, <Link key="z" href="/methodology/#zones">POSI Zones</Link>],
]

export default function GradesPage() {
  return (
    <div className="pb-12">
      <PageHeader title="How to read POSI grades" crumbs={[{ label: 'POSI', href: '/' }, { label: 'Methodology', href: '/methodology/' }, { label: 'POSI grades' }]}>
        <p className="max-w-[68ch]">
          Every journal in POSI carries one grades badge, the same on every page: its collection tier, then its AJR
          rating (Core Collection journals only), Citation Quartile and POSI Zone where they have been assigned.
        </p>
      </PageHeader>

      <div className="doc">
        <h2 id="examples">Examples</h2>
        <div className="panel p-4 space-y-3 max-w-[560px] text-[13.5px]">
          <div className="flex flex-wrap items-center gap-3">
            <PosiGrades size="md" tier="core" ajr="A−" quartile="Q1" zone={1} />
            <span style={{ color: 'var(--muted)' }}>A certified journal, rated and ranked</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <PosiGrades size="md" tier="indexed" quartile="Q3" zone={3} />
            <span style={{ color: 'var(--muted)' }}>Indexed, ranked, not rated</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <PosiGrades size="md" tier="indexed" showEmpty />
            <span style={{ color: 'var(--muted)' }}>Indexed, not yet ranked</span>
          </div>
        </div>

        <h2 id="parts">What each part means</h2>
        <div className="panel overflow-x-auto">
          <table className="dtable">
            <thead><tr><th>Part</th><th>Values</th><th>Meaning</th><th>Method</th></tr></thead>
            <tbody>
              {PARTS.map(([part, values, meaning, link]) => (
                <tr key={part}>
                  <td className="font-semibold whitespace-nowrap">{part}</td>
                  <td className="font-mono text-[12.5px] min-w-[150px]">{values}</td>
                  <td className="text-[13.5px] min-w-[240px]">{meaning}</td>
                  <td className="whitespace-nowrap text-[13px]">{link}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          A part is left out, or shown as a dash, until it has been assigned. The first Citation Ranking edition under
          PNCI-1.0 is computed in the next data cycle; until then no journal has a C-Q or Zone. A dashed border marks
          a provisional value.
        </p>

        <h2 id="not">What POSI grades are not</h2>
        <ul>
          <li>
            They are not Web of Science or Scopus labels, and are independent of both. POSI does not record whether a
            journal is in SCIE, SSCI, AHCI or ESCI; each journal page links to Clarivate’s Master Journal List to check.
            For Scopus, each journal page shows the journal’s status as stated in Elsevier’s published Scopus source
            list, with the list’s date, and links to the journal’s Scopus page. For PubMed, it shows whether the journal
            is in NLM’s list of journals cited in PubMed and links to its NLM Catalog record, which states MEDLINE indexing.
          </li>
          <li>They describe journals, not individual articles or researchers. See <Link href="/responsible-use/">responsible use</Link>.</li>
          <li>No publisher, editor or sponsor can change a grade by hand. See the <Link href="/editorial-policy/">editorial policy</Link>.</li>
        </ul>
      </div>
    </div>
  )
}
