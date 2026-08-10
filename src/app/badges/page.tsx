import { Suspense } from 'react'
import Link from 'next/link'
import { Info } from '@phosphor-icons/react/dist/ssr'
import { PSG_JOURNALS, INDEXED_JOURNALS, SHIHARR_JOURNALS, OTHER_INDEXED_JOURNALS, getCoreCollection} from '@/lib/data'
import { BadgeLookupForm } from '@/components/BadgeLookupForm'

const SITE_URL = 'https://posi.panorama-sg.com'

// Badge responses are cached 24h (see public/_headers). The on-page EXAMPLE
// previews always hit the same fixed journal code, so a browser (or an edge
// cache) that fetched a stale/broken response before a fix ships can keep
// serving it long after the fix is live. A build-time cache-buster forces a
// fresh fetch on every new deploy — the copyable embed snippet below is left
// untouched since third-party sites should get normal caching behavior.
const BUILD_CACHE_BUST = Date.now()

export const metadata = {
  title: 'POSI Badges',
  description: 'Embeddable "POSI Verified" badges for Core Collection journals — journals that have undergone POSI review.',
}

export default function BadgesPage() {
  const journals = getCoreCollection()
    .map(j => ({ code: j.journal_code, title: j.short_title || j.title }))
    .sort((a, b) => a.title.localeCompare(b.title))

  const example = PSG_JOURNALS[0]

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">
      <nav className="text-xs flex items-center gap-1.5" style={{ color: 'var(--posi-muted)' }}>
        <Link href="/" className="hover:text-gray-700">Home</Link>
        <span>/</span>
        <span style={{ color: 'var(--posi-text)' }}>Badges</span>
      </nav>

      <div className="border-l-4 pl-5" style={{ borderColor: 'var(--posi-accent)' }}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5" style={{ color: 'var(--posi-accent)', border: '1px solid var(--posi-accent)' }}>BADGES</span>
          <span className="text-[10px] font-mono uppercase tracking-[0.15em]" style={{ color: 'var(--posi-muted)' }}>
            {journals.length} eligible journals · Core Collection
          </span>
        </div>
        <h1 className="text-2xl font-bold leading-tight" style={{ color: 'var(--posi-text)' }}>POSI Badges</h1>
        <p className="text-sm leading-relaxed mt-2 max-w-2xl" style={{ color: 'var(--posi-muted)' }}>
          Embeddable "POSI Verified" badges that Core Collection journals can display on their own website,
          linking back to their POSI journal record.
        </p>
      </div>

      <div className="p-4 text-xs leading-relaxed flex items-start gap-2.5" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
        <Info className="h-3.5 w-3.5 shrink-0 mt-px" style={{ color: '#1d4ed8' }} />
        <span style={{ color: '#1d4ed8' }}>
          <strong>Eligibility is enforced, not just requested.</strong> Badge images are generated only for journals
          in the Core Collection (manually or auto-PQF reviewed, see <Link href="/pqf#eligibility" className="underline">PQF Eligibility</Link>).
          A badge URL for any other journal code returns a 404 — there is no way to display a valid POSI badge without an actual POSI record.
        </span>
      </div>

      {/* Example preview */}
      {example && (
        <section className="bg-white p-5" style={{ border: '1px solid var(--posi-border)' }}>
          <h2 className="text-xs font-bold uppercase tracking-[0.1em] mb-3" style={{ color: 'var(--posi-muted)' }}>Example</h2>
          <div className="flex flex-wrap items-center gap-4 p-3" style={{ background: 'var(--posi-bg)' }}>
            {/* Relative paths for on-page preview — works in any environment (dev/preview/prod).
                The copyable embed snippets below use the absolute SITE_URL instead, since those
                are meant to be pasted onto a third-party site. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/badge/${example.journal_code}/standard?v=${BUILD_CACHE_BUST}`} alt="POSI badge example — standard" width={220} height={64} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/badge/${example.journal_code}/compact?v=${BUILD_CACHE_BUST}`} alt="POSI badge example — compact seal" width={140} height={90} />
            <div className="p-3" style={{ background: '#111111' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/badge/${example.journal_code}/dark?v=${BUILD_CACHE_BUST}`} alt="POSI badge example — dark" width={220} height={64} />
            </div>
          </div>
          <p className="text-[10px] mt-2" style={{ color: 'var(--posi-muted)' }}>Live example: {example.title}</p>
        </section>
      )}

      <Suspense fallback={<div className="text-xs py-8 text-center" style={{ color: 'var(--posi-muted)' }}>Loading…</div>}>
        <BadgeLookupForm journals={journals} siteUrl={SITE_URL} />
      </Suspense>

      <section className="bg-white p-5" style={{ border: '1px solid var(--posi-border)' }}>
        <h2 className="text-xs font-bold uppercase tracking-[0.1em] mb-3" style={{ color: 'var(--posi-muted)' }}>Usage Terms</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { title: 'Core Collection only', body: 'Badges are issued to journals with an official or auto-assessed PQF review. Auto-discovered, unreviewed records are not eligible.' },
            { title: 'Must link back', body: 'The badge should link to your journal\'s POSI record (the embed snippet includes this automatically) so readers can verify the record themselves.' },
            { title: 'Not an endorsement', body: 'A POSI badge reflects that a journal has a reviewed record with a PQF assessment — it is not a certification, accreditation, or guarantee of quality. See What POSI Is Not.' },
            { title: 'Revocable', body: 'If a journal record is later reclassified (e.g. moved out of the Core Collection), its badge URLs stop resolving. Badges should not be cached indefinitely by the embedding site.' },
          ].map(p => (
            <div key={p.title} className="border-l-2 pl-3" style={{ borderColor: 'var(--posi-border)' }}>
              <h3 className="text-xs font-semibold mb-1" style={{ color: 'var(--posi-text)' }}>{p.title}</h3>
              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--posi-muted)' }}>{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap gap-5 text-xs">
        <Link href="/pqf" style={{ color: 'var(--posi-accent)' }} className="hover:underline">PQF Methodology →</Link>
        <Link href="/what-posi-is-not" style={{ color: 'var(--posi-accent)' }} className="hover:underline">What POSI Is Not →</Link>
        <Link href="/journals" style={{ color: 'var(--posi-accent)' }} className="hover:underline">Browse Journals →</Link>
      </div>
    </div>
  )
}
