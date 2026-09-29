// The home page, shared by the English address (/) and each localized one
// (/ja/, /ko/, /zh-cn/, /zh-tw/). Interface text goes through <T>, which
// renders in the address's language at build time.

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
import { T } from '@/components/I18n'
import { CaretRight, Certificate, Database, Medal, Quotes, SealCheck, Stamp, TextAa } from '@phosphor-icons/react/dist/ssr'
import type { Icon } from '@phosphor-icons/react'
import { localeInfo, type Locale } from '@/lib/i18n/locales'

type Service = { label: string; href: string; note: string; icon: Icon }

// Grouped by who each service is for; the first of each group is the main task.
const SERVICE_GROUPS: { title: string; items: Service[] }[] = [
  { title: 'For authors', items: [
    { label: 'Certificate of indexing', href: '/certificate/', note: 'For authors of indexed publications', icon: Certificate },
    { label: 'Verify a certificate', href: '/certificate/verify/', note: 'Check a certificate number', icon: SealCheck },
    { label: 'Citation generator', href: '/cite/', note: 'PSG, APA, MLA and Chicago from a DOI or ISBN', icon: Quotes },
    { label: 'PSG citation format', href: '/psg-format/', note: 'The PSG author-date standard', icon: TextAa },
  ] },
  { title: 'For journals', items: [
    { label: 'Journal certification', href: '/certification/', note: 'Apply for the Core Collection', icon: Stamp },
    { label: 'Logos and journal marks', href: '/logos/', note: 'POSI marks for journal websites', icon: Medal },
  ] },
  { title: 'Data', items: [
    { label: 'Data downloads', href: '/datasets/', note: 'Directory, rankings and records', icon: Database },
  ] },
]

function IconBadge({ icon: I }: { icon: Icon }) {
  return (
    <span aria-hidden className="h-8 w-8 shrink-0 grid place-items-center rounded-[4px]" style={{ background: 'var(--teal-soft)', color: 'var(--teal)' }}>
      <I className="h-[18px] w-[18px]" />
    </span>
  )
}

/** Services grouped by who they are for, each with an icon, in the sidebar. */
function ServicesList() {
  return (
    <SideBlock title="Services">
      {SERVICE_GROUPS.map((g, gi) => (
        <div key={g.title} style={gi ? { borderTop: '1px solid var(--line)' } : undefined}>
          <h3 className="px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--soft)' }}><T>{g.title}</T></h3>
          <ul className="pb-1.5">
            {g.items.map(s => (
              <li key={s.href}>
                <Link href={s.href} className="group flex items-center gap-3 px-4 py-2 transition-colors hover:bg-[var(--hover)]">
                  <IconBadge icon={s.icon} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13.5px] font-medium leading-snug" style={{ color: 'var(--ink)' }}><T>{s.label}</T></span>
                    <span className="block text-[12px] leading-snug" style={{ color: 'var(--muted)' }}><T>{s.note}</T></span>
                  </span>
                  <CaretRight className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" style={{ color: 'var(--soft)' }} />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </SideBlock>
  )
}

const QUICK = [
  { label: 'All journals', href: '/journals/' },
  { label: 'Subject categories', href: '/subjects/' },
  { label: 'Publishers', href: '/publishers/' },
  { label: 'Open access journals', href: '/journals/open-access/' },
  { label: 'Core Collection', href: '/core-collection/' },
]

function when(d: string, locale: Locale) {
  const tag = locale === 'en' ? 'en-GB' : localeInfo(locale).lang
  return new Date(`${d}T00:00:00Z`).toLocaleDateString(tag, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
}

function SideBlock({ title, href, children }: { title: string; href?: string; children: React.ReactNode }) {
  return (
    <section aria-label={title} style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
      <div className="flex items-center justify-between px-4 h-10" style={{ borderBottom: '1px solid var(--line)' }}>
        <h2 className="text-[13.5px] font-semibold" style={{ color: 'var(--ink)' }}><T>{title}</T></h2>
        {href && <Link href={href} className="link text-[12.5px]"><T>View all</T></Link>}
      </div>
      {children}
    </section>
  )
}

export function HomePage({ locale }: { locale: Locale }) {
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
    ['Ranked journals', RANKING_AVAILABLE ? fmt(ranked.length) : <T key="p">Pending</T>, '/rankings/'],
    ['C-Q1 journals (official)', RANKING_AVAILABLE ? fmt(countOfficialQuartile('Q1')) : <T key="p">Pending</T>, '/rankings/'],
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
              <T>Citation index, journal rankings and journal directory. Published by Panorama Scholarly Group Ltd.</T>
            </p>
            <div className="mt-6 max-w-[860px]">
              <HomeSearch />
            </div>
            <nav aria-label="Browse" className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[13px]">
              <span style={{ color: 'var(--muted)' }}><T>Browse:</T></span>
              {QUICK.map(l => <Link key={l.href} href={l.href} className="link"><T>{l.label}</T></Link>)}
            </nav>
          </div>

          <section aria-label="Coverage" style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
            <h2 className="px-4 h-9 flex items-center text-[12.5px] font-semibold" style={{ color: 'var(--ink-2)', borderBottom: '1px solid var(--line)' }}>
              <T>Coverage</T>
            </h2>
            <dl>
              {coverage.map(([k, v, href], i) => (
                <Link key={k} href={href} className="grid grid-cols-[1fr_auto] items-baseline gap-3 px-4 py-2 transition-colors hover:bg-[var(--hover)]" style={i ? { borderTop: '1px solid var(--line-soft)' } : undefined}>
                  <dt className="text-[13px]" style={{ color: 'var(--ink-2)' }}><T>{k}</T></dt>
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
              <h2 id="rankings" className="text-[17px] font-semibold" style={{ color: 'var(--ink)' }}>
                <T vars={{ year }}>{'Journal Citation Rankings {year}'}</T>
              </h2>
              <Link href="/rankings/" className="link text-[13px]"><T>All categories</T></Link>
            </div>
            <p className="text-[13px] mb-3" style={{ color: 'var(--muted)' }}>
              {RANKING_SNAPSHOT
                ? <T vars={{ snapshot: fmtSnapshot(RANKING_SNAPSHOT) }}>{'Journals ranked by PNCI within their PSC subject category, snapshot {snapshot}. Largest categories shown, with the highest-PNCI journal in each.'}</T>
                : <T>Journals ranked by PNCI within their PSC subject category. Largest categories shown, with the highest-PNCI journal in each.</T>}
            </p>
            {!RANKING_AVAILABLE && <RankingsPending />}
            {RANKING_AVAILABLE && <div className="overflow-x-auto" style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
              <table className="dtable">
                <thead>
                  <tr>
                    <th><T>Category</T></th>
                    <th className="text-right"><T>Ranked</T></th>
                    <th><T>Highest PNCI</T></th>
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
          <ServicesList />

          <SideBlock title="News" href="/announcements/">
            <ul>
              {news.map((a, i) => (
                <li key={a.slug} style={i ? { borderTop: '1px solid var(--line-soft)' } : undefined}>
                  <Link href={`/announcements/${a.slug}/`} className="block px-4 py-2.5 transition-colors hover:bg-[var(--hover)]">
                    <time dateTime={a.date} className="block font-mono text-[11.5px]" style={{ color: 'var(--muted)' }}>{when(a.date, locale)}</time>
                    <span className="block text-[13px] leading-snug mt-0.5" style={{ color: 'var(--ink)' }}>{a.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </SideBlock>

          <SideBlock title="About POSI">
            <div className="px-4 py-3 text-[13px] leading-relaxed" style={{ color: 'var(--ink-2)' }}>
              <p>
                <T>POSI indexes every journal registered with Crossref or OpenAlex. Journals enter the Core Collection by certification. Rankings describe journals, not individual researchers.</T>
              </p>
              <ul className="mt-2.5 space-y-1">
                <li><Link href="/editorial-policy/" className="link"><T>Editorial policy</T></Link></li>
                <li><Link href="/methodology/" className="link"><T>Methodology</T></Link></li>
                <li><Link href="/responsible-use/" className="link"><T>Responsible use</T></Link></li>
              </ul>
            </div>
          </SideBlock>
        </aside>
      </div>
    </div>
  )
}
