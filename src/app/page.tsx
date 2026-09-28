import Link from 'next/link'
import { HomeSearch, LiveWorksCount } from '@/components/HomeSearch'
import { getDirectory, getDirectoryCategories, getPublishers } from '@/lib/global-journals'
import { IndexGlance } from '@/components/IndexGlance'
import { getCoreCollection } from '@/lib/data'
import { getRankings, getCategories, getCategoryRanking, countOfficialQuartile, RANKING_AVAILABLE, RANKING_SNAPSHOT } from '@/lib/rankings'
import { fmtScore, fmtSnapshot } from '@/lib/evaluation/display'
import { RankingsPending } from '@/components/Evaluation'
import { getSortedAnnouncements } from '@/lib/announcements'
import { fmt } from '@/components/db'

export const metadata = {
  title: { absolute: 'Panorama Open Scholarly Index (POSI)' },
  description:
    'The Panorama Open Scholarly Index, published by Panorama Scholarly Group Ltd: publications, journals, journal rankings and certificates of indexing.',
}

const SERVICES = [
  { label: 'Certificate of indexing', href: '/certificate/', note: 'For authors of indexed publications' },
  { label: 'Verify a certificate', href: '/certificate/verify/', note: 'Check a certificate number' },
  { label: 'Journal certification', href: '/certification/', note: 'Apply for the Core Collection' },
  { label: 'Citation generator', href: '/cite/', note: 'PSG, APA, MLA and Chicago from a DOI or ISBN' },
  { label: 'PSG citation format', href: '/psg-format/', note: 'The PSG author-date standard' },
  { label: 'Logos and journal marks', href: '/logos/', note: 'POSI marks for journal websites' },
  { label: 'Data downloads', href: '/datasets/', note: 'Directory, rankings and records' },
]

const QUICK = [
  { label: 'All journals', href: '/journals/' },
  { label: 'Subject categories', href: '/subjects/' },
  { label: 'Publishers', href: '/publishers/' },
  { label: 'Open access journals', href: '/journals/open-access/' },
  { label: 'Core Collection', href: '/core-collection/' },
]

function when(d: string) {
  return new Date(`${d}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
}

function SideBlock({ title, href, children }: { title: string; href?: string; children: React.ReactNode }) {
  return (
    <section aria-label={title} style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
      <div className="flex items-center justify-between px-4 h-10" style={{ borderBottom: '1px solid var(--line)' }}>
        <h2 className="text-[13.5px] font-semibold" style={{ color: 'var(--ink)' }}>{title}</h2>
        {href && <Link href={href} className="link text-[12.5px]">View all</Link>}
      </div>
      {children}
    </section>
  )
}

export default function HomePage() {
  const news = getSortedAnnouncements().slice(0, 4)
  const coreCount = getCoreCollection().length
  const directoryTotal = getDirectory().records.length
  const { ranked, year } = getRankings()
  const cats = getCategories().filter(c => c.ranked > 0)
  const top = [...cats].sort((a, b) => b.ranked - a.ranked).slice(0, 12).map(c => ({ ...c, lead: getCategoryRanking(c.code)[0] }))
  const dirCats = getDirectoryCategories()

  const coverage: [string, React.ReactNode, string][] = [
    ['Publications', <LiveWorksCount key="w" />, '/publications/'],
    ['Indexed journals', fmt(directoryTotal), '/journals/'],
    ['Ranked journals', RANKING_AVAILABLE ? fmt(ranked.length) : 'Pending', '/rankings/'],
    ['C-Q1 journals (official)', RANKING_AVAILABLE ? fmt(countOfficialQuartile('Q1')) : 'Pending', '/rankings/'],
    ['Subject categories', fmt(cats.length), '/subjects/'],
    ['Core Collection', fmt(coreCount), '/core-collection/'],
  ]

  return (
    <div>
      <section style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--line)' }}>
        <div className="wrap py-7 md:py-9 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-end">
          <div className="min-w-0">
            <h1 className="text-[24px] md:text-[28px] font-semibold tracking-tight leading-tight" style={{ color: 'var(--ink)' }}>
              Panorama Open Scholarly Index
            </h1>
            <p className="mt-1.5 text-[14.5px]" style={{ color: 'var(--ink-2)' }}>
              Citation index, journal rankings and journal directory. Published by Panorama Scholarly Group Ltd.
            </p>
            <div className="mt-6 max-w-[860px]">
              <HomeSearch />
            </div>
            <nav aria-label="Browse" className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[13px]">
              <span style={{ color: 'var(--muted)' }}>Browse:</span>
              {QUICK.map(l => <Link key={l.href} href={l.href} className="link">{l.label}</Link>)}
            </nav>
          </div>

          <section aria-label="Coverage" style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
            <h2 className="px-4 h-9 flex items-center text-[12.5px] font-semibold" style={{ color: 'var(--ink-2)', borderBottom: '1px solid var(--line)' }}>
              Coverage
            </h2>
            <dl>
              {coverage.map(([k, v, href], i) => (
                <Link key={k} href={href} className="grid grid-cols-[1fr_auto] items-baseline gap-3 px-4 py-2 transition-colors hover:bg-[var(--hover)]" style={i ? { borderTop: '1px solid var(--line-soft)' } : undefined}>
                  <dt className="text-[13px]" style={{ color: 'var(--ink-2)' }}>{k}</dt>
                  <dd className="font-mono text-[13.5px] tnum" style={{ color: 'var(--ink)' }}>{v}</dd>
                </Link>
              ))}
            </dl>
          </section>
        </div>
      </section>

      <div className="wrap py-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-8">
          <section aria-labelledby="rankings">
            <div className="flex items-end justify-between gap-4 pb-2 mb-3" style={{ borderBottom: '2px solid var(--ink)' }}>
              <h2 id="rankings" className="text-[17px] font-semibold" style={{ color: 'var(--ink)' }}>Journal Citation Rankings {year}</h2>
              <Link href="/rankings/" className="link text-[13px]">All categories</Link>
            </div>
            <p className="text-[13px] mb-3" style={{ color: 'var(--muted)' }}>
              Journals ranked by PNCI within their PSC subject category{RANKING_SNAPSHOT ? `, snapshot ${fmtSnapshot(RANKING_SNAPSHOT)}` : ''}. Largest categories shown, with the highest-PNCI journal in each.
            </p>
            {!RANKING_AVAILABLE && <RankingsPending />}
            {RANKING_AVAILABLE && <div className="overflow-x-auto" style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
              <table className="dtable">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th className="text-right">Ranked</th>
                    <th>Highest PNCI</th>
                    <th className="text-right">PNCI</th>
                  </tr>
                </thead>
                <tbody>
                  {top.map(c => (
                    <tr key={c.code}>
                      <td className="whitespace-nowrap">
                        <span className="font-mono text-[12px] mr-2" style={{ color: 'var(--muted)' }}>{c.code}</span>
                        <Link href={`/rankings/${c.code}/`} className="link">{c.name}</Link>
                      </td>
                      <td className="text-right font-mono tnum">{fmt(c.ranked)}</td>
                      <td className="max-w-[220px] xl:max-w-[340px] truncate" title={c.lead?.title}>{c.lead?.title ?? '-'}</td>
                      <td className="text-right font-mono tnum">{fmtScore(c.lead?.pnci, '-')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>}
          </section>

          <IndexGlance records={getDirectory().records} cats={dirCats} publishers={getPublishers().slice(0, 8)} />
        </div>

        <aside className="space-y-5">
          <SideBlock title="Services">
            <ul>
              {SERVICES.map((s, i) => (
                <li key={s.href} style={i ? { borderTop: '1px solid var(--line-soft)' } : undefined}>
                  <Link href={s.href} className="block px-4 py-2.5 transition-colors hover:bg-[var(--hover)]">
                    <span className="block text-[13.5px] font-medium" style={{ color: 'var(--teal)' }}>{s.label}</span>
                    <span className="block text-[12px]" style={{ color: 'var(--muted)' }}>{s.note}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </SideBlock>

          <SideBlock title="News" href="/announcements/">
            <ul>
              {news.map((a, i) => (
                <li key={a.slug} style={i ? { borderTop: '1px solid var(--line-soft)' } : undefined}>
                  <Link href={`/announcements/${a.slug}/`} className="block px-4 py-2.5 transition-colors hover:bg-[var(--hover)]">
                    <time dateTime={a.date} className="block font-mono text-[11.5px]" style={{ color: 'var(--muted)' }}>{when(a.date)}</time>
                    <span className="block text-[13px] leading-snug mt-0.5" style={{ color: 'var(--ink)' }}>{a.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </SideBlock>

          <SideBlock title="About POSI">
            <div className="px-4 py-3 text-[13px] leading-relaxed" style={{ color: 'var(--ink-2)' }}>
              <p>
                POSI indexes every journal registered with Crossref or OpenAlex. Journals enter the Core Collection by
                certification. Rankings describe journals, not individual researchers.
              </p>
              <ul className="mt-2.5 space-y-1">
                <li><Link href="/editorial-policy/" className="link">Editorial policy</Link></li>
                <li><Link href="/methodology/" className="link">Methodology</Link></li>
                <li><Link href="/responsible-use/" className="link">Responsible use</Link></li>
              </ul>
            </div>
          </SideBlock>
        </aside>
      </div>
    </div>
  )
}
