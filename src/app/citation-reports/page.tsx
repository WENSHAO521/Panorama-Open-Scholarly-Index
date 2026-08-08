import { Suspense } from 'react'
import Link from 'next/link'
import { Info } from '@phosphor-icons/react/dist/ssr'
import { PSG_JOURNALS, INDEXED_JOURNALS, SHIHARR_JOURNALS, OTHER_INDEXED_JOURNALS } from '@/lib/data'
import { openAlexGetSourceStats, crossrefGetCitationScore } from '@/lib/api'
import { primarySubject } from '@/lib/subject-keywords'
import { CitationReportsTable, type CitationReportRow } from '@/components/CitationReportsTable'

export const metadata = {
  title: 'Citation Reports',
  description: 'POSI Citation Impact (PCI): journal-level citation impact metrics computed from open citation data for the POSI-reviewed collection.',
}

const METHODOLOGY_PRINCIPLES = [
  {
    title: 'One source for citation counts',
    body: 'PCI is OpenAlex\'s 2-year mean citedness, taken as-is. OpenAlex already aggregates and deduplicates citation data from Crossref and other registries into a single graph — POSI does not separately re-count Crossref citations and add them on top, which would double-count the same citation event.',
  },
  {
    title: 'DOI/Crossref = article inventory, not citation count',
    body: 'Crossref (the DOI registry) is used to verify how many articles a journal has published — the "Articles" figure shown on journal records. It is not used as a second citation-counting source.',
  },
  {
    title: 'One DOI per cited work',
    body: 'A dataset or preprint deposited on Zenodo (or a similar archive) under its own DOI is treated as supplementary evidence, not a separate citable record — unless it is explicitly linked to the journal article\'s DOI as a version/supplement. This prevents the same underlying work from being counted twice under two DOIs.',
  },
  {
    title: 'No proprietary blending',
    body: 'POSI does not run its own citation-counting pipeline or combine raw counts into a custom formula. It displays OpenAlex\'s published metric with full source attribution — the same open-data-only stance applied to CVI.',
  },
  {
    title: 'PCS is Crossref-sourced, not a PCI recomputation',
    body: 'PCS (mean citations per article across a trailing 4-year publication window, capped at a 200-article sample) is computed directly from Crossref\'s own is-referenced-by-count — a different database and a different window than PCI\'s OpenAlex figure. The two are published side by side, not averaged together.',
  },
]

// A single slow/hanging OpenAlex lookup must never block static generation.
function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([p, new Promise<T>(res => setTimeout(() => res(fallback), ms))])
}

export default async function CitationReportsPage() {
  const TIMEOUT_MS = 4000
  // Scope: only the reviewed/verified collection (PSG + manually-indexed).
  // Auto-discovered, unreviewed records are deliberately excluded — citation
  // impact ranking is a Core Collection feature, not extended to unverified data.
  const journals = [...PSG_JOURNALS, ...INDEXED_JOURNALS, ...SHIHARR_JOURNALS, ...OTHER_INDEXED_JOURNALS]

  const withStats = await Promise.all(
    journals.map(async j => {
      const issn = j.issn_online ?? j.issn_print
      const [stats, pcs] = await Promise.all([
        issn ? withTimeout(openAlexGetSourceStats(issn).catch(() => null), TIMEOUT_MS, null) : null,
        issn ? withTimeout(crossrefGetCitationScore(issn).catch(() => null), TIMEOUT_MS, null) : null,
      ])
      return {
        title: j.title,
        short_title: j.short_title,
        journal_code: j.journal_code,
        subject: primarySubject(j.subjects),
        two_yr_mean_citedness: stats?.two_yr_mean_citedness ?? null,
        h_index: stats?.h_index ?? null,
        cited_by_count: stats?.cited_by_count ?? null,
        pcs_ratio: pcs?.ratio ?? null,
        pcs_window: pcs?.window ?? null,
      }
    })
  )

  // Subject percentile: rank by 2yr mean citedness within each subject group.
  const bySubject = new Map<string, typeof withStats>()
  for (const row of withStats) {
    const key = row.subject ?? 'Uncategorized'
    if (!bySubject.has(key)) bySubject.set(key, [])
    bySubject.get(key)!.push(row)
  }

  const rows: CitationReportRow[] = withStats.map(row => {
    const key = row.subject ?? 'Uncategorized'
    const group = bySubject.get(key)!.filter(r => r.two_yr_mean_citedness != null)
    let subject_percentile: number | null = null
    if (row.two_yr_mean_citedness != null && group.length > 1) {
      const rank = group.filter(r => (r.two_yr_mean_citedness ?? 0) <= (row.two_yr_mean_citedness ?? 0)).length
      subject_percentile = Math.round((rank / group.length) * 100)
    }
    return { ...row, subject_percentile }
  })

  const withData = rows.filter(r => r.two_yr_mean_citedness != null).length

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">
      <nav className="text-xs flex items-center gap-1.5" style={{ color: 'var(--posi-muted)' }}>
        <Link href="/" className="hover:text-gray-700">Home</Link>
        <span>/</span>
        <Link href="/journals" className="hover:text-gray-700">Journals</Link>
        <span>/</span>
        <span style={{ color: 'var(--posi-text)' }}>Citation Reports</span>
      </nav>

      <div className="border-l-4 pl-5" style={{ borderColor: 'var(--posi-accent)' }}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5" style={{ color: 'var(--posi-accent)', border: '1px solid var(--posi-accent)' }}>
            PCI
          </span>
          <span className="text-[10px] font-mono uppercase tracking-[0.15em]" style={{ color: 'var(--posi-muted)' }}>
            {rows.length} journals · Core Collection
          </span>
        </div>
        <h1 className="text-2xl font-bold leading-tight" style={{ color: 'var(--posi-text)' }}>POSI Citation Reports</h1>
        <p className="text-sm leading-relaxed mt-2 max-w-2xl" style={{ color: 'var(--posi-muted)' }}>
          Two independently-sourced citation metrics — <Link href="/pci" className="font-semibold underline" style={{ color: 'var(--posi-text)' }}>PCI</Link> (OpenAlex, JIF-style)
          and <strong style={{ color: 'var(--posi-text)' }}>PCS</strong> (Crossref, CiteScore-style) — plus h-index, total citations,
          and subject percentile, for POSI's manually-reviewed Core Collection, ranked within subject.
        </p>
      </div>

      <div className="p-4 text-xs leading-relaxed flex items-start gap-2.5" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
        <Info className="h-3.5 w-3.5 shrink-0 mt-px" style={{ color: '#1d4ed8' }} />
        <span style={{ color: '#1d4ed8' }}>
          <strong>PCI</strong> (OpenAlex 2yr mean citedness) and <strong>PCS</strong> (Crossref mean citations per article,
          trailing 4-year window) are POSI's open stand-ins for a Journal Impact Factor and a CiteScore, respectively —
          two separately-sourced numbers, not one blended score, the same way WoS and Scopus report independently of
          each other. POSI does not license or use Web of Science or Scopus data. {withData} of {rows.length} journals
          have a resolvable OpenAlex source record; journals without one show as unranked. See{' '}
          <Link href="/cvi" className="underline">Citation Visibility Index →</Link> for how POSI treats citation
          infrastructure separately from citation volume.
        </span>
      </div>

      {/* Methodology */}
      <section className="bg-white p-5" style={{ border: '1px solid var(--posi-border)' }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--posi-muted)' }}>How PCI Is Computed</h2>
          <Link href="/pci" className="text-[10px] hover:underline" style={{ color: 'var(--posi-accent)' }}>Full positioning statement →</Link>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {METHODOLOGY_PRINCIPLES.map(p => (
            <div key={p.title} className="border-l-2 pl-3" style={{ borderColor: 'var(--posi-border)' }}>
              <h3 className="text-xs font-semibold mb-1" style={{ color: 'var(--posi-text)' }}>{p.title}</h3>
              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--posi-muted)' }}>{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      <Suspense fallback={<div className="text-xs py-8 text-center" style={{ color: 'var(--posi-muted)' }}>Loading citation reports…</div>}>
        <CitationReportsTable rows={rows} />
      </Suspense>
    </div>
  )
}
