import Link from 'next/link'
import { ArrowRight } from '@phosphor-icons/react/dist/ssr'
import { HomeSearch, LiveWorksCount, LiveJournalsCount } from '@/components/HomeSearch'
import { getCoreCollection } from '@/lib/data'
import { getAllRecords } from '@/lib/records-data'
import { getRankings } from '@/lib/rankings'
import { toIndexRecord, collectionOf, verificationOf, VERIFICATION, type Verification } from '@/lib/records'
import { getSortedAnnouncements } from '@/lib/announcements'
import { fmt, CollectionTag, VerificationPill } from '@/components/db'
import { BENCHMARK_JOURNALS } from '@/lib/benchmark-journals'

export const metadata = {
  title: { absolute: 'POSI: Open Scholarly Index' },
  description:
    'An open scholarly database indexing every journal registered with Crossref or OpenAlex. Search publications and journals, open rankings, certificates of indexing and downloadable data.',
}

const PIPELINE = [
  { verb: 'Harvest', body: 'Journal metadata is collected from Crossref, OpenAlex, DOAJ and the ISSN Portal. Open sources only.' },
  { verb: 'Resolve', body: 'ISSNs are resolved to one permanent POSI-J id. Duplicates are merged on identifiers, never on title similarity.' },
  { verb: 'Verify', body: 'Each record gets a verification state. Nothing is marked verified because it only looks plausible.' },
  { verb: 'Compute', body: 'posi-engine computes subjects, ratings and citation indicators under versioned, published specifications.' },
  { verb: 'Publish', body: 'Everything ships as static JSON and CSV. What the site shows is exactly what you can download.' },
]

const SNIPPET = `// Every POSI file is a static asset. No key, no rate limit.
const res = await fetch("https://posi.panorama-sg.com/data/index/core.json")
const records = await res.json()

records
  .filter(r => r.v === "VERIFIED" && r.s?.startsWith("P5"))
  .map(r => [r.id, r.t, r.i[0]])`

export default function HomePage() {
  const idx = getAllRecords().map(toIndexRecord)
  const byV = idx.reduce<Record<string, number>>((a, r) => { a[r.v] = (a[r.v] ?? 0) + 1; return a }, {})
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


  return (
    <div>
      {/* Hero: search is the primary action; the cards are real records rendered from the index. */}
      <section className="wrap grid gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] items-center pt-12 pb-12 md:pt-20 md:pb-16">
        <div>
          <h1 className="text-[36px] md:text-[48px] lg:text-[54px] font-semibold leading-[1.05] tracking-tight max-w-[18ch]" style={{ color: 'var(--ink)' }}>
            Search the scholarly record, openly.
          </h1>
          <p className="mt-5 text-[17px] leading-relaxed max-w-[46ch]" style={{ color: 'var(--ink-2)' }}>
            Publications, journals and publishers from open data. Runs in your browser, every file downloadable.
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
                  <VerificationPill v={verificationOf(j)} />
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
            { label: 'Publications', value: <LiveWorksCount />, href: '/publications/', note: 'OpenAlex, live' },
            { label: 'Indexed journals', value: <LiveJournalsCount />, href: '/journals/', note: 'OpenAlex journals, live' },
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

      {/* How a record is built. */}
      <section className="wrap py-16 md:py-24">
        <h2 className="text-[26px] md:text-[30px] font-semibold tracking-tight leading-tight max-w-[22ch]" style={{ color: 'var(--ink)' }}>
          Every value says where it came from.
        </h2>
        <p className="mt-4 text-[15.5px] leading-relaxed max-w-[60ch]" style={{ color: 'var(--ink-2)' }}>
          Records follow a provenance discipline: open sources first, identifiers checked before anything is called
          verified, and declared facts kept apart from measured ones.
        </p>
        <ol className="mt-10 grid gap-px rounded-[6px] overflow-hidden md:grid-cols-5" style={{ background: 'var(--line)', border: '1px solid var(--line)' }}>
          {PIPELINE.map(p => (
            <li key={p.verb} className="p-5" style={{ background: 'var(--surface)' }}>
              <p className="text-[16px] font-semibold" style={{ color: 'var(--teal)' }}>{p.verb}</p>
              <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>{p.body}</p>
            </li>
          ))}
        </ol>

        <div className="mt-10 flex flex-wrap gap-x-8 gap-y-4">
          {(['VERIFIED', 'PARTIALLY_VERIFIED', 'NEEDS_CHECK'] as Verification[]).map(v => (
            <div key={v} className="min-w-[180px]">
              <p className="font-mono text-[22px] tnum" style={{ color: VERIFICATION[v].color }}>{fmt(byV[v] ?? 0)}</p>
              <p className="text-[13px]" style={{ color: 'var(--muted)' }}>{VERIFICATION[v].label}</p>
            </div>
          ))}
          <Link href="/docs/provenance/" className="self-end inline-flex items-center gap-1.5 text-[14px] link">
            Read the provenance model <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Open data: real code against the real files. */}
      <section style={{ background: 'var(--surface-2)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
        <div className="wrap py-16 md:py-20 grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] items-center">
          <div>
            <h2 className="text-[26px] md:text-[30px] font-semibold tracking-tight leading-tight" style={{ color: 'var(--ink)' }}>
              No API server. Just files.
            </h2>
            <p className="mt-4 text-[15.5px] leading-relaxed max-w-[48ch]" style={{ color: 'var(--ink-2)' }}>
              The index, record JSON, subject taxonomy and indicator snapshots are plain static files. Fetch them,
              mirror them, or load them into a notebook.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link href="/datasets/" className="btn btn-primary">Browse datasets</Link>
              <Link href="/docs/schema/" className="btn">Record schema</Link>
            </div>
          </div>
          <pre className="code" aria-label="Example: loading the Core Collection index"><code>{SNIPPET}</code></pre>
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
