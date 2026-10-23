import Link from 'next/link'
import { HomeSearch, LiveWorksCount } from '@/components/HomeSearch'
import { getDirectory, getDirectoryCategories, getPublishers } from '@/lib/global-journals'
import { IndexGlance } from '@/components/IndexGlance'
import { getCoreCollection } from '@/lib/data'
import { getRankings, getCategories, getCategoryRanking, RANKING_AVAILABLE, RANKING_SNAPSHOT } from '@/lib/rankings'
import { fmtScore, fmtSnapshot } from '@/lib/evaluation/display'
import { getSortedAnnouncements } from '@/lib/announcements'
import { fmt } from '@/components/db'
import { ArrowRight, Certificate, Database, MagnifyingGlass, Medal, Quotes, SealCheck, ShieldCheck, Stamp, TextAa } from '@phosphor-icons/react/dist/ssr'
import type { Icon } from '@phosphor-icons/react'

export const metadata = {
  title: { absolute: 'Panorama Open Scholarly Index (POSI)' },
  description:
    'The Panorama Open Scholarly Index, published by Panorama Scholarly Group Ltd: publications, journals, journal rankings and certificates of indexing.',
  alternates: { canonical: '/' },
}

type Service = { label: string; href: string; note: string; icon: Icon }

// Grouped by who each service is for; the first of each group is the main task.
const SERVICE_GROUPS: { title: string; items: Service[] }[] = [
  { title: 'For authors', items: [
    { label: 'Certificate of indexing', href: '/certificate/', note: 'For authors of indexed publications', icon: Certificate },
    { label: 'Verify a certificate', href: '/certificate/verify/', note: 'Check a certificate number', icon: SealCheck },
    { label: 'PSG citation format', href: '/psg-format/', note: 'The PSG author-date standard', icon: TextAa },
  ] },
  { title: 'For journals', items: [
    { label: 'Journal certification', href: '/certification/', note: 'Apply for the Core Collection', icon: Stamp },
    { label: 'Logos and journal marks', href: '/logos/', note: 'POSI marks for journal websites', icon: Medal },
    { label: 'Data downloads', href: '/datasets/', note: 'Directory, rankings and records', icon: Database },
  ] },
]

// What the site is for, in the order a visitor meets it: check a journal, find its papers, cite them.
const PILLARS: { title: string; body: string; href: string; cta: string; more?: [string, string]; icon: Icon }[] = [
  {
    title: 'Check a journal',
    body: 'Every journal gets one page with its POSI grades and flags: Core Collection, AJR rating, citation quartile and zone, open access and DOAJ status, and a quick check in Web of Science, Scopus and PubMed.',
    href: '/journals/', cta: 'Search journals', more: ['How journals are graded', '/methodology/'], icon: ShieldCheck,
  },
  {
    title: 'Search publications',
    body: 'One search across OpenAlex, Crossref, DataCite and Zenodo, merged and de-duplicated, with filters by year, access and type. Paste a DOI to open the record directly.',
    href: '/publications/', cta: 'Search publications', icon: MagnifyingGlass,
  },
  {
    title: 'Cite and export',
    body: 'Turn a DOI or ISBN into a reference in PSG, APA, MLA or Chicago, or export search results as RIS or BibTeX for your reference manager.',
    href: '/cite/', cta: 'Open the citation generator', more: ['The PSG format', '/psg-format/'], icon: Quotes,
  },
]

const QUICK = [
  { label: 'All journals', href: '/journals/' },
  { label: 'Core Collection', href: '/core-collection/' },
  { label: 'Open access journals', href: '/journals/open-access/' },
  { label: 'Subject categories', href: '/subjects/' },
  { label: 'Publishers', href: '/publishers/' },
]

function when(d: string) {
  return new Date(`${d}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
}

function SectionHead({ id, title, href, linkLabel, children }: { id: string; title: string; href?: string; linkLabel?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="flex items-end justify-between gap-4">
        <h2 id={id} className="text-[22px] font-semibold tracking-tight" style={{ color: 'var(--ink)' }}>{title}</h2>
        {href && <Link href={href} className="link text-[13.5px] shrink-0">{linkLabel}</Link>}
      </div>
      {children && <p className="mt-1 text-[14px]" style={{ color: 'var(--muted)' }}>{children}</p>}
    </div>
  )
}

export default function HomePage() {
  const news = getSortedAnnouncements().slice(0, 4)
  const coreCount = getCoreCollection().length
  const records = getDirectory().records
  const { ranked, year } = getRankings()
  const cats = getCategories().filter(c => c.ranked > 0)
  const top = [...cats].sort((a, b) => b.ranked - a.ranked).slice(0, 12).map(c => ({ ...c, lead: getCategoryRanking(c.code)[0] }))
  const dirCats = getDirectoryCategories()
  const oaKnown = records.filter(r => r.oa != null).length
  const oaShare = oaKnown ? Math.round((records.filter(r => r.oa).length / oaKnown) * 100) : null

  // Only figures that exist today: a pending ranking is said once, in its own section, not as a row of "Pending".
  const stats: [string, React.ReactNode, string][] = [
    ['Publications', <LiveWorksCount key="w" />, '/publications/'],
    ['Indexed journals', fmt(records.length), '/journals/'],
    ['Core Collection journals', fmt(coreCount), '/core-collection/'],
    ...(RANKING_AVAILABLE
      ? [['Ranked journals', fmt(ranked.length), '/rankings/'] as [string, React.ReactNode, string]]
      : oaShare != null ? [['Open access journals', `${oaShare}%`, '/journals/open-access/'] as [string, React.ReactNode, string]] : []),
  ]

  return (
    <div>
      <section style={{ background: 'var(--surface)', borderBottom: '1px solid var(--line)' }}>
        <div className="wrap pt-12 pb-10 md:pt-20 md:pb-14">
          <div className="max-w-[820px] mx-auto text-center">
            <p className="text-[13px] font-medium" style={{ color: 'var(--posi-brand)' }}>Panorama Open Scholarly Index</p>
            <h1 className="mt-3 text-[30px] md:text-[44px] font-semibold tracking-tight leading-[1.1]" style={{ color: 'var(--ink)' }}>
              Find, check and cite scholarly journals
            </h1>
            <p className="mt-4 text-[15.5px] md:text-[17px] leading-relaxed max-w-[640px] mx-auto" style={{ color: 'var(--ink-2)' }}>
              An open index of {fmt(records.length)} journals with POSI grades and quality flags, publications merged from
              four open sources, and ready-to-use citations. Free, with no account.
            </p>
            <div className="mt-8 text-left">
              <HomeSearch />
            </div>
            <nav aria-label="Browse" className="mt-4 flex flex-wrap justify-center gap-2">
              {QUICK.map(l => <Link key={l.href} href={l.href} className="chip h-7 px-3 text-[13px] transition-colors hover:border-[var(--posi-brand)] hover:text-[var(--posi-brand)]">{l.label}</Link>)}
            </nav>
          </div>

          <dl className="mt-12 max-w-[980px] mx-auto grid grid-cols-2 lg:grid-cols-4 gap-3">
            {stats.map(([k, v, href]) => (
              <Link key={k} href={href} className="block rounded-[var(--radius-lg)] px-5 py-4 transition-colors hover:bg-[var(--hover)]" style={{ background: 'var(--surface-2)' }}>
                <dd className="figure text-[22px] md:text-[26px] leading-tight">{v}</dd>
                <dt className="mt-1 text-[13px]" style={{ color: 'var(--muted)' }}>{k}</dt>
              </Link>
            ))}
          </dl>
        </div>
      </section>

      <div className="wrap py-12 md:py-16 space-y-14 md:space-y-20">
        <section aria-labelledby="pillars">
          <h2 id="pillars" className="sr-only">What POSI does</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {PILLARS.map(p => (
              <div key={p.title} className="panel p-6 flex flex-col">
                <span aria-hidden className="h-10 w-10 grid place-items-center rounded-[var(--radius)]" style={{ background: 'var(--teal-soft)', color: 'var(--teal)' }}>
                  <p.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-[17px] font-semibold" style={{ color: 'var(--ink)' }}>{p.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed flex-1" style={{ color: 'var(--ink-2)' }}>{p.body}</p>
                <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
                  <Link href={p.href} className="btn btn-primary">{p.cta}<ArrowRight className="h-4 w-4" /></Link>
                  {p.more && <Link href={p.more[1]} className="link text-[13.5px]">{p.more[0]}</Link>}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="rankings">
          <SectionHead id="rankings" title={`Journal Citation Rankings ${year}`} href="/rankings/" linkLabel="All categories">
            Journals ranked by PNCI within their PSC subject category{RANKING_SNAPSHOT ? `, snapshot ${fmtSnapshot(RANKING_SNAPSHOT)}` : ''}.
          </SectionHead>
          {!RANKING_AVAILABLE && (
            <div className="panel px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
              <p className="flex-1 text-[14px] leading-relaxed" style={{ color: 'var(--ink-2)' }}>
                <span className="font-semibold" style={{ color: 'var(--ink)' }}>The first ranking edition is in preparation.</span>{' '}
                It is computed from item-level citation data in the next data cycle; until then journal pages show their grades,
                flags and supplementary citation figures.
              </p>
              <Link href="/methodology/" className="btn shrink-0">How rankings work</Link>
            </div>
          )}
          {RANKING_AVAILABLE && <div className="panel overflow-x-auto">
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

        <IndexGlance records={records} cats={dirCats} publishers={getPublishers().slice(0, 8)} />

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <section aria-labelledby="services">
            <SectionHead id="services" title="Services" />
            <div className="grid gap-6 sm:grid-cols-2">
              {SERVICE_GROUPS.map(g => (
                <div key={g.title}>
                  <h3 className="mb-2 text-[12px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>{g.title}</h3>
                  <ul className="space-y-1">
                    {g.items.map(s => (
                      <li key={s.href}>
                        <Link href={s.href} className="flex items-center gap-3 -mx-2 px-2 py-2 rounded-[var(--radius)] transition-colors hover:bg-[var(--hover)]">
                          <span aria-hidden className="h-8 w-8 shrink-0 grid place-items-center rounded-[var(--radius)]" style={{ background: 'var(--teal-soft)', color: 'var(--teal)' }}>
                            <s.icon className="h-[18px] w-[18px]" />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-[14px] font-medium leading-snug" style={{ color: 'var(--ink)' }}>{s.label}</span>
                            <span className="block text-[12.5px] leading-snug" style={{ color: 'var(--muted)' }}>{s.note}</span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section aria-labelledby="news">
            <SectionHead id="news" title="News" href="/announcements/" linkLabel="All news" />
            <ul className="panel">
              {news.map((a, i) => (
                <li key={a.slug} style={i ? { borderTop: '1px solid var(--line-soft)' } : undefined}>
                  <Link href={`/announcements/${a.slug}/`} className="flex gap-4 px-5 py-3.5 transition-colors hover:bg-[var(--hover)]">
                    <time dateTime={a.date} className="shrink-0 w-[92px] text-[13px] tnum" style={{ color: 'var(--muted)' }}>{when(a.date)}</time>
                    <span className="text-[14px] leading-snug" style={{ color: 'var(--ink)' }}>{a.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[13px] leading-relaxed" style={{ color: 'var(--muted)' }}>
              POSI indexes every journal registered with Crossref or OpenAlex; journals enter the Core Collection by certification.
              Rankings describe journals, not individual researchers.{' '}
              <Link href="/editorial-policy/" className="link">Editorial policy</Link> · <Link href="/responsible-use/" className="link">Responsible use</Link>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
