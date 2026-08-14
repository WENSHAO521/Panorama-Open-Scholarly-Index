import { Suspense } from 'react'
import Link from 'next/link'
import { PSG_JOURNALS, INDEXED_JOURNALS, SHIHARR_JOURNALS, OTHER_INDEXED_JOURNALS, getCoreCollection} from '@/lib/data'
import { getCitationStats } from '@/lib/citation-stats'
import { primarySubject } from '@/lib/subject-keywords'
import publisherCatalogMeta from '@/lib/publisher-catalog-meta.json'
import { CitationReportsTable, type CitationReportRow } from '@/components/CitationReportsTable'
import { Callout } from '@/components/Callout'

export const metadata = {
  title: 'Citation Rankings — Preview',
  description: 'Provisional open citation indicators for the POSI Core Collection — not yet official PJR PCI values or POSI Quartiles. See PJR-SPEC.md for the official methodology.',
}

const METHODOLOGY_PRINCIPLES = [
  {
    title: 'Only PCI determines Citation Rank, Percentile, and Quartile',
    body: 'PCI[Y] = citations received during Y to citable items published in Y-1 and Y-2, divided by citable items published in Y-1 and Y-2 (PJR-SPEC.md § 5-6) — computed under a formal PJR release, which has not yet been produced (no POSI-R-* release exists — see POSI-R-1.0-SPEC.md). The 2-Year Citedness figure shown here is OpenAlex\'s own summary_stats.2yr_mean_citedness, taken as-is — a source-level preview indicator only, not PCI, and it does not determine any Citation Rank, Citation Percentile, or Citation Quartile.',
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
    title: 'The Crossref figure shown here is a legacy preview, not PCS 1.0 — real PCS data is published separately',
    body: 'PCS 1.0 (POSI Citation Score, PCS-1.0-SPEC.md) is a full cursor-paginated count of Crossref\'s is-referenced-by-count across a trailing 4-year publication window — no article-sample cap. The Crossref figure shown on this page is a separate, earlier, capped-at-200-articles sample, kept labeled "Legacy Crossref Preview" (not "PCS") to avoid conflating the two. A real, spec-compliant PCS run now exists — see the dedicated POSI Citation Score page. Like 2-Year Citedness, neither figure here determines Citation Rank, Citation Percentile, or Citation Quartile.',
  },
]

export default async function CitationReportsPage() {
  // Core Collection: manually-reviewed, evidence-based. Percentile computed
  // on THIS page, within Core Collection's own `subjects` taxonomy.
  const journals = getCoreCollection()

  // Precomputed snapshot (scripts/fetch-citation-stats.mjs), same file
  // /journal/[code] reads via src/lib/citation-stats.ts — the two pages
  // used to each fetch OpenAlex/Crossref live at build time and could show
  // different figures for the same journal when this page's much larger
  // burst of concurrent requests tripped its own build timeout and the
  // single-journal page's didn't. Reading one shared file keeps them in sync.
  const withStats = journals.map(j => {
    const entry = getCitationStats(j.journal_code)
    return {
      title: j.title,
      short_title: j.short_title,
      journal_code: j.journal_code,
      subject: primarySubject(j.subjects),
      two_yr_mean_citedness: entry?.stats?.two_yr_mean_citedness ?? null,
      h_index: entry?.stats?.h_index ?? null,
      cited_by_count: entry?.stats?.cited_by_count ?? null,
      pcs_ratio: entry?.pcs?.ratio ?? null,
      pcs_window: entry?.pcs?.window ?? null,
    }
  })

  // Subject percentile: rank by 2yr mean citedness within each subject group.
  const bySubject = new Map<string, typeof withStats>()
  for (const row of withStats) {
    const key = row.subject ?? 'Uncategorized'
    if (!bySubject.has(key)) bySubject.set(key, [])
    bySubject.get(key)!.push(row)
  }

  const coreRows: CitationReportRow[] = withStats.map(row => {
    const key = row.subject ?? 'Uncategorized'
    const group = bySubject.get(key)!.filter(r => r.two_yr_mean_citedness != null)
    let subject_percentile: number | null = null
    if (row.two_yr_mean_citedness != null && group.length > 1) {
      const rank = group.filter(r => (r.two_yr_mean_citedness ?? 0) <= (row.two_yr_mean_citedness ?? 0)).length
      subject_percentile = Math.round((rank / group.length) * 100)
    }
    return { ...row, subject_percentile }
  })

  // Global Benchmark publisher-catalog expansion (2026-08 Elsevier/
  // Frontiers bulk ingestion, ~3,300 records): NOT statically imported
  // here — CitationReportsTable fetches it client-side at runtime (see
  // its own header and publisher-catalog-client.ts) instead of it being
  // baked into this page's build output. An earlier version imported it
  // at build time and produced a multi-MB static page that broke a live
  // Cloudflare Pages deployment ("Failed to publish assets").
  const withData = coreRows.filter(r => r.two_yr_mean_citedness != null).length

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">
      <nav className="text-xs flex items-center gap-1.5" style={{ color: 'var(--posi-muted)' }}>
        <Link href="/" className="hover:text-gray-700">Home</Link>
        <span>/</span>
        <Link href="/ratings" className="hover:text-gray-700">Ratings &amp; Rankings</Link>
        <span>/</span>
        <span style={{ color: 'var(--posi-text)' }}>Citation Rankings</span>
      </nav>

      <div className="border-l-4 pl-5" style={{ borderColor: 'var(--posi-warning)' }}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5" style={{ color: 'var(--posi-warning)', border: '1px solid var(--posi-warning-border)', background: 'var(--posi-warning-bg)' }}>
            PREVIEW
          </span>
          <span className="text-[10px] font-mono uppercase tracking-[0.15em]" style={{ color: 'var(--posi-muted)' }}>
            {coreRows.length} Core Collection · {publisherCatalogMeta.count} Global Benchmark
          </span>
        </div>
        <h1 className="text-2xl font-bold leading-tight" style={{ color: 'var(--posi-text)' }}>POSI Citation Rankings — Preview</h1>
        <p className="text-sm leading-relaxed mt-2 max-w-2xl" style={{ color: 'var(--posi-muted)' }}>
          Two independently-sourced, non-ranking citation indicators — OpenAlex 2-Year Citedness (a source-level
          preview indicator, not{' '}
          <Link href="/pci" className="font-semibold underline" style={{ color: 'var(--posi-text)' }}>PCI</Link>)
          and a <strong style={{ color: 'var(--posi-text)' }}>Legacy Crossref Preview</strong> — plus h-index and
          total citations, for POSI's manually-reviewed Core Collection, plus 2-Year Citedness only (no Crossref
          preview, no total-citations figure) for the Global Benchmark publisher-catalog expansion.{' '}
          <strong style={{ color: 'var(--posi-text)' }}>Only PCI determines POSI Citation Rank, Citation
          Percentile, and Citation Quartile</strong> — neither figure shown here does, for either collection, and
          no Citation Rank/Percentile/Quartile is shown for Global Benchmark journals at all. See PJR-SPEC.md for
          the official methodology, not yet in effect (no POSI-R-* release has been produced).
        </p>
      </div>

      <Callout variant="info">
        <strong>OpenAlex 2-Year Citedness</strong> and the <strong>Legacy Crossref Preview</strong> (mean
        citations per article, trailing 4-year window, currently capped at a 200-article sample — see the
        methodology section below for why this isn't yet called "PCS") are POSI's own independently-defined,
        reproducible citation indicators — two separately-sourced numbers, not one blended score, the same way
        WoS and Scopus report independently of each other. POSI does not license or use Web of Science or
        Scopus data. {withData} of {coreRows.length} Core Collection journals have a resolvable OpenAlex source
        record; journals without one show as unranked. See{' '}
        <Link href="/cvi" className="underline">Citation Visibility Index →</Link> for how POSI treats citation
        infrastructure separately from citation volume.
      </Callout>

      {/* Methodology */}
      <section className="bg-white p-5" style={{ border: '1px solid var(--posi-border)' }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--posi-muted)' }}>How This Preview Is Computed</h2>
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
        <CitationReportsTable rows={coreRows} fetchBenchmark />
      </Suspense>

      <div className="flex flex-wrap gap-5 text-xs">
        <Link href="/pcs" style={{ color: 'var(--posi-accent)' }} className="hover:underline">POSI Citation Score (real, spec-compliant PCS data) →</Link>
        <Link href="/pci" style={{ color: 'var(--posi-accent)' }} className="hover:underline">PCI &amp; PCS Positioning →</Link>
      </div>
    </div>
  )
}
