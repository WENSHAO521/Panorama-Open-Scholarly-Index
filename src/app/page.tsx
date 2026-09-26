import Link from 'next/link'
import { ArrowRight, Certificate, ChartBar, Database, LockOpen, Quotes, SealCheck } from '@phosphor-icons/react/dist/ssr'
import { HomeSearch, LiveWorksCount, LiveJournalsCount } from '@/components/HomeSearch'
import { getCoreCollection } from '@/lib/data'
import { getRankings, getCategories, getCategoryRanking } from '@/lib/rankings'
import { collectionOf } from '@/lib/records'
import { getSortedAnnouncements } from '@/lib/announcements'
import { fmt, CollectionTag } from '@/components/db'
import { BENCHMARK_JOURNALS } from '@/lib/benchmark-journals'

export const metadata = {
  title: { absolute: 'POSI: Open Scholarly Index' },
  description:
    'The Panorama Open Scholarly Index, published by Panorama Scholarly Group Ltd: publications, journals, journal rankings and certificates of indexing.',
}

const INDEXES = [
  {
    title: 'Citation Index',
    Icon: Quotes,
    href: '/publications/',
    cta: 'Search publications',
    body: 'Scholarly publications with authors, abstracts, sources and citation counts, linked to their journals.',
  },
  {
    title: 'Journal Metrics and Rankings',
    Icon: ChartBar,
    href: '/rankings/',
    cta: 'View rankings',
    body: 'POSI Citation Score, subject-category ranks, percentiles and quartiles, with a Core Collection of certified journals.',
  },
  {
    title: 'Open Access Journal Directory',
    Icon: LockOpen,
    href: '/journals/?oa=1',
    cta: 'Browse open access journals',
    body: 'Open access status, licensing, publication charges and DOAJ listing for every indexed journal.',
  },
]

const SERVICES = [
  { title: 'Certificate of indexing', href: '/certificate/', Icon: SealCheck, body: 'Authors receive a verifiable certificate for publications indexed in POSI.' },
  { title: 'Journal certification', href: '/certification/', Icon: Certificate, body: 'Journals apply for evaluation and admission to the Core Collection.' },
  { title: 'Data downloads', href: '/datasets/', Icon: Database, body: 'Journal records, rankings and the subject classification under CC BY 4.0.' },
]

export default function HomePage() {
  // One real record per collection, chosen deterministically.
  const samples = [
    getCoreCollection().find(j => j.posi_id && j.issn_online),
    BENCHMARK_JOURNALS.find(j => j.posi_id && j.openalex_source_id && j.issn_online),
    getCoreCollection().find(j => j.collection_status === 'candidate') ?? getCoreCollection()[1],
  ].filter((j): j is NonNullable<typeof j> => !!j)
  const news = getSortedAnnouncements().slice(0, 3)
  const coreCount = getCoreCollection().length
  const { ranked, year: rankingYear } = getRankings()
  const rankedCount = ranked.length
  const cats = getCategories().filter(c => c.ranked > 0)
  const rankedCategories = cats.length
  const topCategories = [...cats].sort((a, b) => b.ranked - a.ranked).slice(0, 6)
    .map(c => ({ ...c, top: getCategoryRanking(c.code).slice(0, 5) }))


  return (
    <div>
      {/* Hero: search is the primary action; the cards are real records rendered from the index. */}
      <section className="wrap grid gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] items-center pt-12 pb-12 md:pt-20 md:pb-16">
        <div>
          <h1 className="text-[36px] md:text-[48px] lg:text-[54px] font-semibold leading-[1.05] tracking-tight max-w-[18ch]" style={{ color: 'var(--ink)' }}>
            Search the scholarly record.
          </h1>
          <p className="mt-5 text-[17px] leading-relaxed max-w-[46ch]" style={{ color: 'var(--ink-2)' }}>
            Publications, journals, rankings and certificates of indexing. Published by Panorama Scholarly Group Ltd.
          </p>
          <div className="mt-8">
            <HomeSearch />
          </div>
        </div>

        <div className="relative w-full max-w-[460px] lg:justify-self-end" aria-label="Example records from each collection">
          {samples.map((j, i) => {
            const k = collectionOf(j)
            return (
              <Link
                key={j.journal_code}
                href={`/journal/${j.journal_code}/`}
                className="panel block p-4 transition-transform duration-200 hover:-translate-y-0.5"
                style={{ marginLeft: `${i * 28}px`, marginTop: i ? '-10px' : 0, position: 'relative', zIndex: 3 - i }}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-[12px]" style={{ color: 'var(--muted)' }}>{j.posi_id}</span>
                  <CollectionTag k={k} />
                </div>
                <p className="mt-2 font-medium leading-snug line-clamp-2" style={{ color: 'var(--ink)' }}>{j.title}</p>
                <p className="mt-0.5 text-[13px] truncate" style={{ color: 'var(--muted)' }}>{j.publisher}</p>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="font-mono text-[12px]" style={{ color: 'var(--ink-2)' }}>{j.issn_online ?? j.issn_print}</span>
                  <span className="font-mono text-[12px]" style={{ color: 'var(--muted)' }}>{fmt(j.article_count)} articles</span>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Coverage figures: publications are live from OpenAlex, the rest come from this build. */}
      <section className="wrap pb-12">
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-px rounded-[6px] overflow-hidden" style={{ background: 'var(--line)', border: '1px solid var(--line)' }}>
          {[
            { label: 'Publications', value: <LiveWorksCount />, href: '/publications/', note: 'in the Citation Index' },
            { label: 'Indexed journals', value: <LiveJournalsCount />, href: '/journals/', note: 'all subject areas' },
            { label: 'Ranked journals', value: fmt(rankedCount), href: '/rankings/', note: `${rankingYear} edition` },
            { label: 'Core Collection', value: fmt(coreCount), href: '/core-collection/', note: 'certified journals' },
          ].map(s => (
            <Link key={s.label} href={s.href} className="block p-5 transition-colors hover:bg-[var(--hover)]" style={{ background: 'var(--surface)' }}>
              <dt className="text-[13px]" style={{ color: 'var(--muted)' }}>{s.label}</dt>
              <dd className="mt-1 font-mono text-[24px] tnum" style={{ color: 'var(--ink)' }}>{s.value}</dd>
              <dd className="text-[12px]" style={{ color: 'var(--soft)' }}>{s.note}</dd>
            </Link>
          ))}
        </dl>
      </section>

      {/* The three indexes that make up POSI. */}
      <section className="wrap pb-16 md:pb-20">
        <h2 className="text-[26px] md:text-[30px] font-semibold tracking-tight leading-tight" style={{ color: 'var(--ink)' }}>
          One database, three indexes
        </h2>
        <div className="mt-8 grid gap-px rounded-[6px] overflow-hidden lg:grid-cols-3" style={{ background: 'var(--line)', border: '1px solid var(--line)' }}>
          {INDEXES.map(ix => (
            <Link key={ix.title} href={ix.href} className="group flex flex-col p-6 transition-colors hover:bg-[var(--hover)]" style={{ background: 'var(--surface)' }}>
              <ix.Icon className="h-7 w-7" style={{ color: 'var(--teal)' }} />
              <span className="mt-4 text-[18px] font-semibold" style={{ color: 'var(--ink)' }}>{ix.title}</span>
              <span className="mt-2 text-[14px] leading-relaxed" style={{ color: 'var(--muted)' }}>{ix.body}</span>
              <span className="mt-4 text-[13.5px] inline-flex items-center gap-1 group-hover:underline" style={{ color: 'var(--teal)' }}>
                {ix.cta} <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Two tiers: everything is indexed; Core is certified on application. */}
      <section style={{ borderTop: '1px solid var(--line)', background: 'var(--surface)' }}>
        <div className="wrap py-14 md:py-20 grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div>
            <h2 className="text-[26px] md:text-[30px] font-semibold tracking-tight leading-tight" style={{ color: 'var(--ink)' }}>
              Indexed by default. Certified on application.
            </h2>
            <p className="mt-4 text-[15.5px] leading-relaxed max-w-[48ch]" style={{ color: 'var(--ink-2)' }}>
              Every journal with DOIs at Crossref or a record in OpenAlex is in POSI. Journals that apply and pass the
              PQF evaluation enter the Core Collection.
            </p>
            <Link href="/certification/" className="btn btn-primary mt-6">Apply for certification</Link>
          </div>
          <div className="grid gap-px rounded-[6px] overflow-hidden sm:grid-cols-2" style={{ background: 'var(--line)', border: '1px solid var(--line)' }}>
            <Link href="/journals/" className="block p-6 transition-colors hover:bg-[var(--hover)]" style={{ background: 'var(--surface)' }}>
              <p className="text-[13px]" style={{ color: 'var(--muted)' }}>Indexed journals</p>
              <p className="mt-1 font-mono text-[28px] tnum" style={{ color: 'var(--ink)' }}><LiveJournalsCount /></p>
              <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>Searchable, ranked when citation data allows, and eligible for certificates of indexing.</p>
            </Link>
            <Link href="/core-collection/" className="block p-6 transition-colors" style={{ background: 'var(--teal-soft)' }}>
              <p className="text-[13px]" style={{ color: 'var(--teal)' }}>Core Collection</p>
              <p className="mt-1 font-mono text-[28px] tnum" style={{ color: 'var(--ink)' }}>{fmt(coreCount)}</p>
              <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: 'var(--ink-2)' }}>Certified after evidence review, with published PQF reports and lifecycle ratings.</p>
            </Link>
          </div>
        </div>
      </section>

      {/* Rankings preview: the top of the current edition, straight from the published ranking. */}
      <section className="wrap py-16 md:py-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-[26px] md:text-[30px] font-semibold tracking-tight leading-tight" style={{ color: 'var(--ink)' }}>
              Journal Rankings {rankingYear}
            </h2>
            <p className="mt-3 text-[15.5px] leading-relaxed max-w-[60ch]" style={{ color: 'var(--ink-2)' }}>
              {fmt(rankedCount)} journals ranked by POSI Citation Score within {rankedCategories} subject categories, with percentiles and PCS quartiles.
            </p>
          </div>
          <Link href="/rankings/" className="btn">All rankings <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {topCategories.map(c => (
            <div key={c.code} className="panel overflow-hidden">
              <Link href={`/rankings/${c.code}/`} className="flex items-baseline justify-between gap-3 px-4 py-3 hover:bg-[var(--hover)]" style={{ borderBottom: '1px solid var(--line-soft)' }}>
                <span className="font-medium truncate" style={{ color: 'var(--ink)' }}>{c.name}</span>
                <span className="font-mono text-[12px] shrink-0" style={{ color: 'var(--muted)' }}>{c.ranked} journals</span>
              </Link>
              <ol>
                {c.top.map(r => (
                  <li key={r.id} className="grid grid-cols-[28px_minmax(0,1fr)_auto] gap-2 items-baseline px-4 py-2 text-[13.5px]">
                    <span className="font-mono text-[12px]" style={{ color: 'var(--muted)' }}>{r.rank}</span>
                    <span className="truncate" style={{ color: 'var(--ink-2)' }}>{r.title}</span>
                    <span className="font-mono text-[12px] tnum" style={{ color: 'var(--ink)' }}>{r.pcs.toFixed(2)}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>

      {/* Services for authors and journals. */}
      <section style={{ background: 'var(--surface-2)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
        <div className="wrap py-16 md:py-20 grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div>
            <h2 className="text-[26px] md:text-[30px] font-semibold tracking-tight leading-tight" style={{ color: 'var(--ink)' }}>
              For authors and journals
            </h2>
            <p className="mt-4 text-[15.5px] leading-relaxed max-w-[46ch]" style={{ color: 'var(--ink-2)' }}>
              Official services of the Panorama Open Scholarly Index, free of charge.
            </p>
          </div>
          <ul className="grid gap-px rounded-[6px] overflow-hidden sm:grid-cols-3" style={{ background: 'var(--line)', border: '1px solid var(--line)' }}>
            {SERVICES.map(sv => (
              <li key={sv.href} style={{ background: 'var(--surface)' }}>
                <Link href={sv.href} className="flex h-full flex-col p-5 transition-colors hover:bg-[var(--hover)]">
                  <sv.Icon className="h-6 w-6" style={{ color: 'var(--teal)' }} />
                  <span className="mt-3 font-semibold" style={{ color: 'var(--ink)' }}>{sv.title}</span>
                  <span className="mt-1.5 text-[13.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>{sv.body}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Changelog and the responsible-use statement. */}
      <section className="wrap py-16 md:py-20 grid gap-12 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div>
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-[20px] font-semibold tracking-tight" style={{ color: 'var(--ink)' }}>Changelog</h2>
            <Link href="/announcements/" className="text-[14px] link">All entries</Link>
          </div>
          <ul className="mt-4">
            {news.map((a, i) => (
              <li key={a.slug} className="py-4" style={i ? { borderTop: '1px solid var(--line-soft)' } : undefined}>
                <Link href={`/announcements/${a.slug}/`} className="group grid sm:grid-cols-[110px_minmax(0,1fr)] gap-1 sm:gap-4">
                  <time dateTime={a.date} className="font-mono text-[13px]" style={{ color: 'var(--muted)' }}>{a.date}</time>
                  <span>
                    <span className="block font-medium group-hover:underline" style={{ color: 'var(--ink)' }}>{a.title}</span>
                    <span className="block mt-1 text-[13.5px] leading-relaxed line-clamp-2" style={{ color: 'var(--muted)' }}>{a.summary.replace(/\s[--]\s/g, ', ')}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <aside className="rounded-[6px] p-6 self-start" style={{ border: '1px solid var(--line)', background: 'var(--surface)' }}>
          <h2 className="text-[16px] font-semibold" style={{ color: 'var(--ink)' }}>Use these numbers responsibly</h2>
          <p className="mt-2 text-[14px] leading-relaxed" style={{ color: 'var(--muted)' }}>
            POSI indicators describe journals, not people. They must not be used for hiring, promotion or funding
            decisions about individual researchers, and they are not Journal Impact Factors.
          </p>
          <Link href="/responsible-use/" className="mt-4 inline-flex items-center gap-1.5 text-[14px] link">
            Responsible use <ArrowRight className="h-4 w-4" />
          </Link>
        </aside>
      </section>
    </div>
  )
}
