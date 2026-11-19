import Link from 'next/link'
import type { Metadata } from 'next'
import { HomeSearch, LiveWorksCount } from '@/components/HomeSearch'
import { getDirectory, getDirectoryCategories, getPublishers } from '@/lib/global-journals'
import { IndexGlance } from '@/components/IndexGlance'
import { getCoreCollection } from '@/lib/data'
import { publisherHref } from '@/lib/publishers'
import { ajrOf } from '@/lib/evaluation/journal'
import { countryNameIn } from '@/i18n/places'
import type { Journal } from '@/lib/types'
import { getRankings, getCategories, getCategoryRanking, RANKING_AVAILABLE, RANKING_SNAPSHOT } from '@/lib/rankings'
import { fmtScore, fmtSnapshot } from '@/lib/evaluation/display'
import { getSortedAnnouncements } from '@/lib/announcements'
import { fmt } from '@/components/db'
import { getMessages, type Messages } from '@/i18n'
import type { Locale } from '@/i18n/config'
import { localizedHref, pageAlternates } from '@/i18n/alternates'
import { fill, formatDate, formatMonth, subjectName } from '@/i18n/format'
import { ArrowRight, Certificate, Database, Medal, SealCheck, Stamp, TextAa } from '@phosphor-icons/react/dist/ssr'
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
const PILLARS: { key: 'journal' | 'publications' | 'cite'; href: string; moreHref?: string }[] = [
  { key: 'journal', href: '/journals/', moreHref: '/methodology/' },
  { key: 'publications', href: '/publications/' },
  { key: 'cite', href: '/cite/', moreHref: '/psg-format/' },
]

/**
 * The journal shown on the home page's catalogue card: a Core Collection
 * journal with a PQF score, an AJR rating and a Latin-script title, picked by
 * the build day so the card changes with each daily build. Real data only.
 */
function cardJournal(): { j: Journal; ajr: string } | null {
  const pool: { j: Journal; ajr: string }[] = []
  for (const j of getCoreCollection()) {
    const ajr = ajrOf(j).rating
    if (ajr && j.pqf && j.issn_online && j.posi_id && /^[\x20-\x7e]+$/.test(j.title)) pool.push({ j, ajr })
  }
  if (!pool.length) return null
  const day = Math.floor(Date.now() / 86_400_000)
  return pool[day % pool.length]
}

/** The Panorama Scholarly Group logo: its block mark (ink follows the colour scheme, the red stays) and wordmark. */
function PsgLogo() {
  return (
    <span className="inline-flex items-center gap-3" style={{ color: 'var(--ink)' }}>
      <svg viewBox="88 88 214 226" className="h-11 w-auto" aria-hidden="true">
        <g transform="translate(100, 100)">
          <rect x="0" y="0" width="30" height="200" fill="currentColor" />
          <path d="M30 0 H120 C150 0, 150 70, 120 70 H30 Z" fill="#CC0000" />
          <path d="M0 100 H120 V130 H30 V150 H120 V200 H0 V170 H90 V150 H0 Z" fill="currentColor" />
          <path d="M150 200 H50 V170 H150 V50 H180 V200 Z" fill="currentColor" />
          <rect x="160" y="10" width="30" height="30" fill="#CC0000" />
        </g>
      </svg>
      <span className="leading-none">
        <span className="block font-display text-[20px]" style={{ fontWeight: 600, letterSpacing: '-0.02em' }}>PANORAMA</span>
        <span className="block mt-1 text-[9px] font-medium" style={{ letterSpacing: '0.15em', color: 'var(--muted)' }}>SCHOLARLY GROUP</span>
      </span>
    </span>
  )
}

/** POSI's publisher and its publishing partner, with the conflict-of-interest note that has to go with them. */
function Partners({ locale, m }: { locale: Locale; m: Messages['home']['partners'] }) {
  const href = (p: string) => localizedHref(locale, p)
  const atri = getPublishers().find(p => /^Asia Technology Research Institute$/i.test(p.name))
  const items: { key: string; role: string; to: string; external?: boolean; logo: React.ReactNode }[] = [
    { key: 'psg', role: m.publisher, to: 'https://panorama-sg.com/', external: true, logo: <PsgLogo /> },
    {
      key: 'atri', role: m.partner, to: atri ? href(publisherHref(atri)) : href('/publishers/'),
      // eslint-disable-next-line @next/next/no-img-element -- a small static logo; the site is a static export without image optimisation
      logo: <img src="/partners/atri-logo.webp" alt="Asia Technology Research Institute" width={110} height={48} className="partner-raster h-12 w-auto" />,
    },
  ]
  return (
    <section aria-labelledby="partners" className="pt-12 md:pt-16 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:items-center" style={{ borderTop: '1px solid var(--line)' }}>
      <div>
        <h2 id="partners" className="font-display text-[24px] md:text-[28px] leading-tight" style={{ color: 'var(--ink)' }}>{m.title}</h2>
        <p className="mt-3 text-[14px] leading-relaxed max-w-[440px]" style={{ color: 'var(--muted)' }}>
          {m.note}{locale === 'en' ? ' ' : ''}<Link href={href('/coi/')} className="link">{m.coi}</Link>
        </p>
      </div>
      <ul className="grid sm:grid-cols-2 gap-px rounded-[var(--radius-lg)] overflow-hidden" style={{ background: 'var(--line)', border: '1px solid var(--line)' }}>
        {items.map(i => (
          <li key={i.key} style={{ background: 'var(--surface)' }}>
            <a href={i.to} {...(i.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className="flex h-full flex-col justify-between gap-6 p-6 transition-colors hover:bg-[var(--hover)]">
              <span className="flex h-12 items-center">{i.logo}</span>
              <span className="text-[13px]" style={{ color: 'var(--muted)' }}>{i.role}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** A Core Collection journal set as a library catalogue card: the home page's one rich moment. */
function CatalogueCard({ locale, m }: { locale: Locale; m: Messages['home']['card'] }) {
  const pick = cardJournal()
  if (!pick) return null
  const { j, ajr } = pick
  const country = countryNameIn(locale, j.registration_country ?? j.country)
  const rows: [string, React.ReactNode][] = [
    [m.collection, m.core],
    [m.pqf, <><span className="tnum">{j.pqf!.total}</span><span style={{ color: 'var(--muted)' }}> / 100</span></>],
    [m.ajr, ajr],
    [m.articles, <span key="a" className="tnum">{fmt(j.article_count)}</span>],
  ]
  return (
    <figure className="catalogue relative mx-auto w-full max-w-[520px]" aria-label={m.label}>
      {/* the card behind, slightly turned, so the front one reads as one of a drawer */}
      <div className="relative">
      <div aria-hidden className="catalogue-card catalogue-back absolute inset-0" />
      <Link href={localizedHref(locale, `/journal/${j.journal_code}/`)} className="catalogue-card catalogue-front relative block px-6 pt-5 pb-12 sm:px-8 sm:pt-6">
        <div className="flex items-baseline justify-between gap-4 font-mono text-[12px]" style={{ color: 'var(--muted)' }}>
          <span>{j.psc_category ? `${j.psc_category} · ` : ''}{j.posi_id}</span>
          <span>ISSN {j.issn_online}</span>
        </div>
        <div className="catalogue-rule mt-3" aria-hidden />
        <p lang="en" className="mt-4 font-display text-[26px] sm:text-[30px] leading-[1.12]" style={{ color: 'var(--ink)' }}>{j.title}</p>
        <p className="mt-2 text-[14px]" style={{ color: 'var(--ink-2)' }}>{j.publisher}{country ? ` · ${country}` : ''}</p>
        <dl className="mt-6 grid sm:grid-cols-2 gap-x-6">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-baseline justify-between gap-3 py-2" style={{ borderTop: '1px solid var(--line)' }}>
              <dt className="text-[13px]" style={{ color: 'var(--muted)' }}>{k}</dt>
              <dd className="text-[14px] font-medium text-right" style={{ color: 'var(--ink)' }}>{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-5 inline-flex items-center gap-1.5 text-[14px] font-medium" style={{ color: 'var(--posi-brand)' }}>
          {m.open}<ArrowRight className="h-4 w-4" aria-hidden />
        </p>
        <span aria-hidden className="catalogue-hole" />
      </Link>
      </div>
      <figcaption className="mt-4 text-center text-[13px]" style={{ color: 'var(--muted)' }}>{m.label} · {m.note}</figcaption>
    </figure>
  )
}

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
        <h2 id={id} className="font-display text-[24px] md:text-[28px] leading-tight" style={{ color: 'var(--ink)' }}>{title}</h2>
        {href && <Link href={href} className="link text-[14px] shrink-0 pb-1">{linkLabel}</Link>}
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
      <section>
        <div className="wrap pt-12 pb-12 md:pt-20 md:pb-16">
          <div className="grid gap-12 lg:gap-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-center">
            <div className="min-w-0">
              <h1 className="home-title text-[40px] md:text-[60px] leading-[1.04]" style={{ color: 'var(--ink)' }}>
                {h.title}
              </h1>
              <p className="mt-5 text-[17px] md:text-[18px] leading-relaxed max-w-[560px]" style={{ color: 'var(--ink-2)' }}>
                {fill(h.lead, { journals: fmt(records.length) })}
              </p>
              <div className="mt-8 max-w-[600px]">
                <HomeSearch />
              </div>
              <nav aria-label={h.browse} className="mt-5 flex flex-wrap items-baseline gap-x-4 gap-y-2 text-[14px]">
                <span style={{ color: 'var(--muted)' }}>{h.browse}</span>
                {QUICK.map(l => <Link key={l.href} href={href(l.href)} className="link">{h.quick[l.key]}</Link>)}
              </nav>
            </div>
            <CatalogueCard locale={locale} m={h.card} />
          </div>

          <dl className="stat-strip mt-14 md:mt-20 grid grid-cols-2 lg:grid-cols-4">
            {stats.map(([k, v, to]) => (
              <Link key={k} href={href(to)} className="block group">
                <dd className="figure text-[28px] md:text-[32px] leading-none transition-colors group-hover:text-[var(--posi-brand)]">{v}</dd>
                <dt className="mt-2 text-[13px]" style={{ color: 'var(--muted)' }}>{k}</dt>
              </Link>
            ))}
          </dl>
        </div>
      </section>

      <div className="wrap pb-16 space-y-16 md:space-y-24">
        <section aria-labelledby="pillars" className="pt-12 md:pt-16" style={{ borderTop: '1px solid var(--line)' }}>
          <h2 id="pillars" className="sr-only">{h.pillarsHeading}</h2>
          <div className="grid gap-10 md:gap-12 md:grid-cols-3">
            {PILLARS.map(p => (
              <div key={p.key} className="flex flex-col">
                <h3 className="font-display text-[22px] leading-tight" style={{ color: 'var(--ink)' }}>{h.pillars[p.key].title}</h3>
                <p className="mt-3 text-[15px] leading-relaxed flex-1" style={{ color: 'var(--ink-2)' }}>{h.pillars[p.key].body}</p>
                <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[14px]">
                  <Link href={href(p.href)} className="inline-flex items-center gap-1.5 font-medium transition-colors hover:text-[var(--posi-brand-hover)]" style={{ color: 'var(--posi-brand)' }}>{h.pillars[p.key].cta}<ArrowRight className="h-4 w-4" aria-hidden /></Link>
                  {p.moreHref && <Link href={href(p.moreHref)} className="transition-colors hover:text-[var(--ink)]" style={{ color: 'var(--muted)' }}>{(h.pillars[p.key] as { more?: string }).more}</Link>}
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
                <span className="font-medium" style={{ color: 'var(--ink)' }}>{h.rankings.pendingTitle}</span>{locale === 'en' ? ' ' : ''}
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

        <Partners locale={locale} m={h.partners} />

        <div className="grid gap-12 lg:gap-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <section aria-labelledby="services">
            <SectionHead id="services" title={h.services.title} />
            <div className="grid gap-6 sm:grid-cols-2">
              {SERVICE_GROUPS.map(g => (
                <div key={g.key}>
                  <h3 className="mb-2 text-[13px] font-medium" style={{ color: 'var(--muted)' }}>{h.services[g.key]}</h3>
                  <ul>
                    {g.items.map(s => (
                      <li key={s.href}>
                        <Link href={href(s.href)} className="flex items-start gap-3 py-3 transition-colors hover:text-[var(--posi-brand)]" style={{ borderTop: '1px solid var(--line)' }}>
                          <s.icon aria-hidden className="mt-0.5 h-[18px] w-[18px] shrink-0" style={{ color: 'var(--muted)' }} />
                          <span className="min-w-0">
                            <span className="block text-[15px] font-medium leading-snug">{h.services.items[s.key].label}</span>
                            <span className="block mt-0.5 text-[13px] leading-snug" style={{ color: 'var(--muted)' }}>{h.services.items[s.key].note}</span>
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
                  <Link href={href(`/announcements/${a.slug}/`)} className="flex gap-4 px-5 py-4 transition-colors hover:bg-[var(--hover)]">
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
