import Link from 'next/link'
import type { Metadata } from 'next'
import { HomeSearch, LiveWorksCount } from '@/components/HomeSearch'
import { getDirectory, getDirectoryCategories, getPublishers } from '@/lib/global-journals'
import { IndexGlance } from '@/components/IndexGlance'
import { getCoreCollection } from '@/lib/data'
import { getRankings, getCategories, getCategoryRanking, RANKING_AVAILABLE, RANKING_SNAPSHOT } from '@/lib/rankings'
import { fmtScore, fmtSnapshot } from '@/lib/evaluation/display'
import { getSortedAnnouncements } from '@/lib/announcements'
import { fmt } from '@/components/db'
import { getMessages, type Messages } from '@/i18n'
import type { Locale } from '@/i18n/config'
import { localizedHref, pageAlternates } from '@/i18n/alternates'
import { fill, formatDate, formatMonth, subjectName } from '@/i18n/format'
import { ArrowRight, Certificate, Database, MagnifyingGlass, Medal, Quotes, SealCheck, ShieldCheck, Stamp, TextAa } from '@phosphor-icons/react/dist/ssr'
import type { Icon } from '@phosphor-icons/react'

// The home page, shared by the root of every language (src/app/(en)/page.tsx, src/app/zh/page.tsx).

// The ranking snapshot's month; English keeps fmtSnapshot's wording.
const snapshotDate = (locale: Locale, d: string) => (locale === 'en' ? fmtSnapshot(d) : formatMonth(locale, d))

type Service = { key: keyof Messages['home']['services']['items']; href: string; icon: Icon }

// Grouped by who each service is for; the first of each group is the main task.
const SERVICE_GROUPS: { key: 'forAuthors' | 'forJournals'; items: Service[] }[] = [
  { key: 'forAuthors', items: [
    { key: 'certificate', href: '/certificate/', icon: Certificate },
    { key: 'verify', href: '/certificate/verify/', icon: SealCheck },
    { key: 'psgFormat', href: '/psg-format/', icon: TextAa },
  ] },
  { key: 'forJournals', items: [
    { key: 'certification', href: '/certification/', icon: Stamp },
    { key: 'logos', href: '/logos/', icon: Medal },
    { key: 'datasets', href: '/datasets/', icon: Database },
  ] },
]

// What the site is for, in the order a visitor meets it: check a journal, find its papers, cite them.
const PILLARS: { key: 'journal' | 'publications' | 'cite'; href: string; moreHref?: string; icon: Icon }[] = [
  { key: 'journal', href: '/journals/', moreHref: '/methodology/', icon: ShieldCheck },
  { key: 'publications', href: '/publications/', icon: MagnifyingGlass },
  { key: 'cite', href: '/cite/', moreHref: '/psg-format/', icon: Quotes },
]

const QUICK: { key: keyof Messages['home']['quick']; href: string }[] = [
  { key: 'allJournals', href: '/journals/' },
  { key: 'coreCollection', href: '/core-collection/' },
  { key: 'openAccessJournals', href: '/journals/open-access/' },
  { key: 'subjectCategories', href: '/subjects/' },
  { key: 'publishers', href: '/publishers/' },
]

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

/** The metadata of the home page in a language. */
export function homeMetadata(locale: Locale): Metadata {
  const m = getMessages(locale).home
  return {
    title: { absolute: m.metaTitle },
    description: m.metaDescription,
    alternates: pageAlternates('/', locale),
  }
}

/** The home page, in the language of the root layout it is rendered under. */
export function HomePage({ locale }: { locale: Locale }) {
  const m = getMessages(locale)
  const h = m.home
  const href = (p: string) => localizedHref(locale, p)
  const news = getSortedAnnouncements().slice(0, 4)
  const coreCount = getCoreCollection().length
  const records = getDirectory().records
  const { ranked, year } = getRankings()
  const cats = getCategories().filter(c => c.ranked > 0)
  const top = [...cats].sort((a, b) => b.ranked - a.ranked).slice(0, 12).map(c => ({ ...c, name: subjectName(locale, c.code, c.name), lead: getCategoryRanking(c.code)[0] }))
  const dirCats = getDirectoryCategories()
  const oaKnown = records.filter(r => r.oa != null).length
  const oaShare = oaKnown ? Math.round((records.filter(r => r.oa).length / oaKnown) * 100) : null

  // Only figures that exist today: a pending ranking is said once, in its own section, not as a row of "Pending".
  const stats: [string, React.ReactNode, string][] = [
    [h.stats.publications, <LiveWorksCount key="w" />, '/publications/'],
    [h.stats.indexedJournals, fmt(records.length), '/journals/'],
    [h.stats.coreJournals, fmt(coreCount), '/core-collection/'],
    ...(RANKING_AVAILABLE
      ? [[h.stats.rankedJournals, fmt(ranked.length), '/rankings/'] as [string, React.ReactNode, string]]
      : oaShare != null ? [[h.stats.openAccessJournals, `${oaShare}%`, '/journals/open-access/'] as [string, React.ReactNode, string]] : []),
  ]

  return (
    <div>
      <section style={{ background: 'var(--surface)', borderBottom: '1px solid var(--line)' }}>
        <div className="wrap pt-12 pb-10 md:pt-20 md:pb-14">
          <div className="max-w-[820px] mx-auto text-center">
            <p className="text-[13px] font-medium" style={{ color: 'var(--posi-brand)' }}>{h.eyebrow}</p>
            <h1 className="mt-3 text-[30px] md:text-[44px] font-semibold tracking-tight leading-[1.1]" style={{ color: 'var(--ink)' }}>
              {h.title}
            </h1>
            <p className="mt-4 text-[15.5px] md:text-[17px] leading-relaxed max-w-[640px] mx-auto" style={{ color: 'var(--ink-2)' }}>
              {fill(h.lead, { journals: fmt(records.length) })}
            </p>
            <div className="mt-8 text-left">
              <HomeSearch />
            </div>
            <nav aria-label={h.browse} className="mt-4 flex flex-wrap justify-center gap-2">
              {QUICK.map(l => <Link key={l.href} href={href(l.href)} className="chip h-7 px-3 text-[13px] transition-colors hover:border-[var(--posi-brand)] hover:text-[var(--posi-brand)]">{h.quick[l.key]}</Link>)}
            </nav>
          </div>

          <dl className="mt-12 max-w-[980px] mx-auto grid grid-cols-2 lg:grid-cols-4 gap-3">
            {stats.map(([k, v, to]) => (
              <Link key={k} href={href(to)} className="block rounded-[var(--radius-lg)] px-5 py-4 transition-colors hover:bg-[var(--hover)]" style={{ background: 'var(--surface-2)' }}>
                <dd className="figure text-[22px] md:text-[26px] leading-tight">{v}</dd>
                <dt className="mt-1 text-[13px]" style={{ color: 'var(--muted)' }}>{k}</dt>
              </Link>
            ))}
          </dl>
        </div>
      </section>

      <div className="wrap py-12 md:py-16 space-y-14 md:space-y-20">
        <section aria-labelledby="pillars">
          <h2 id="pillars" className="sr-only">{h.pillarsHeading}</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {PILLARS.map(p => (
              <div key={p.key} className="panel p-6 flex flex-col">
                <span aria-hidden className="h-10 w-10 grid place-items-center rounded-[var(--radius)]" style={{ background: 'var(--teal-soft)', color: 'var(--teal)' }}>
                  <p.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-[17px] font-semibold" style={{ color: 'var(--ink)' }}>{h.pillars[p.key].title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed flex-1" style={{ color: 'var(--ink-2)' }}>{h.pillars[p.key].body}</p>
                <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
                  <Link href={href(p.href)} className="btn btn-primary">{h.pillars[p.key].cta}<ArrowRight className="h-4 w-4" /></Link>
                  {p.moreHref && <Link href={href(p.moreHref)} className="link text-[13.5px]">{(h.pillars[p.key] as { more?: string }).more}</Link>}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="rankings">
          <SectionHead id="rankings" title={fill(h.rankings.title, { year })} href={href('/rankings/')} linkLabel={h.rankings.allCategories}>
            {RANKING_SNAPSHOT ? fill(h.rankings.introSnapshot, { date: snapshotDate(locale, RANKING_SNAPSHOT) }) : h.rankings.intro}
          </SectionHead>
          {!RANKING_AVAILABLE && (
            <div className="panel px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
              <p className="flex-1 text-[14px] leading-relaxed" style={{ color: 'var(--ink-2)' }}>
                <span className="font-semibold" style={{ color: 'var(--ink)' }}>{h.rankings.pendingTitle}</span>{locale === 'en' ? ' ' : ''}
                {h.rankings.pendingBody}
              </p>
              <Link href={href('/methodology/')} className="btn shrink-0">{h.rankings.howRankingsWork}</Link>
            </div>
          )}
          {RANKING_AVAILABLE && <div className="panel overflow-x-auto">
            <table className="dtable">
              <thead>
                <tr>
                  <th>{h.rankings.colCategory}</th>
                  <th className="text-right">{h.rankings.colRanked}</th>
                  <th>{h.rankings.colHighest}</th>
                  <th className="text-right">{h.rankings.colPnci}</th>
                </tr>
              </thead>
              <tbody>
                {top.map(c => (
                  <tr key={c.code}>
                    <td className="whitespace-nowrap">
                      <span className="font-mono text-[12px] mr-2" style={{ color: 'var(--muted)' }}>{c.code}</span>
                      <Link href={href(`/rankings/${c.code}/`)} className="link">{c.name}</Link>
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

        <IndexGlance locale={locale} records={records} cats={dirCats} publishers={getPublishers().slice(0, 8)} />

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <section aria-labelledby="services">
            <SectionHead id="services" title={h.services.title} />
            <div className="grid gap-6 sm:grid-cols-2">
              {SERVICE_GROUPS.map(g => (
                <div key={g.key}>
                  <h3 className="mb-2 text-[12px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>{h.services[g.key]}</h3>
                  <ul className="space-y-1">
                    {g.items.map(s => (
                      <li key={s.href}>
                        <Link href={href(s.href)} className="flex items-center gap-3 -mx-2 px-2 py-2 rounded-[var(--radius)] transition-colors hover:bg-[var(--hover)]">
                          <span aria-hidden className="h-8 w-8 shrink-0 grid place-items-center rounded-[var(--radius)]" style={{ background: 'var(--teal-soft)', color: 'var(--teal)' }}>
                            <s.icon className="h-[18px] w-[18px]" />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-[14px] font-medium leading-snug" style={{ color: 'var(--ink)' }}>{h.services.items[s.key].label}</span>
                            <span className="block text-[12.5px] leading-snug" style={{ color: 'var(--muted)' }}>{h.services.items[s.key].note}</span>
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
            <SectionHead id="news" title={h.news.title} href={href('/announcements/')} linkLabel={h.news.all} />
            <ul className="panel">
              {news.map((a, i) => (
                <li key={a.slug} style={i ? { borderTop: '1px solid var(--line-soft)' } : undefined}>
                  <Link href={href(`/announcements/${a.slug}/`)} className="flex gap-4 px-5 py-3.5 transition-colors hover:bg-[var(--hover)]">
                    <time dateTime={a.date} className={`shrink-0 ${locale === 'en' ? 'w-[92px]' : 'w-[116px]'} text-[13px] tnum`} style={{ color: 'var(--muted)' }}>{formatDate(locale, a.date)}</time>
                    <span lang={locale === 'en' || (locale === 'zh-Hans' && a.zh) ? undefined : 'en'} className="text-[14px] leading-snug" style={{ color: 'var(--ink)' }}>{locale === 'zh-Hans' && a.zh ? a.zh.title : a.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[13px] leading-relaxed" style={{ color: 'var(--muted)' }}>
              {h.policyNote}{locale === 'en' ? ' ' : ''}
              <Link href={href('/editorial-policy/')} className="link">{h.editorialPolicy}</Link> · <Link href={href('/responsible-use/')} className="link">{h.responsibleUse}</Link>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
