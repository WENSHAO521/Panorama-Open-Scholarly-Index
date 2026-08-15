import { ALL_JOURNALS } from '@/lib/data'

export async function generateStaticParams() {
  // Exclude discovered journals (j-disc- prefix) to stay within Cloudflare Pages'
  // 20,000-file deployment limit. Discovered journals link to their external website.
  return ALL_JOURNALS
    .filter(j => !j.id.startsWith('j-disc-'))
    .map(j => ({ code: j.journal_code }))
}

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowSquareOut, Globe, FileText, Users, Barcode, ChartBar } from '@phosphor-icons/react/dist/ssr'
import { getJournalByCode } from '@/lib/data'
import { crossrefGetJournalWorks, crossrefFetchJournal, doajGetJournal, issnGetCountry } from '@/lib/api'
import { getCitationStats } from '@/lib/citation-stats'
import { getPcsEntry } from '@/lib/pcs'
import { isEarlyStageV1_1 } from '@/lib/early-stage'
import type { DoajJournalInfo } from '@/lib/types'
import { Badge } from '@/components/Badge'
import { MetadataQualityBar } from '@/components/MetadataQualityBar'
import { OjqfCard } from '@/components/OjqfCard'
import { JournalArticles } from '@/components/JournalArticles'
import { ArticleCountBadge } from '@/components/ArticleCountBadge'
import { CitationImpactCard } from '@/components/CitationImpactCard'
import { JournalProfileTabs } from '@/components/JournalProfileTabs'

export async function generateMetadata(props: { params: Promise<{ code: string }> }) {
  const { code } = await props.params
  const journal = getJournalByCode(code)
  if (!journal) return { title: 'Journal Not Found' }
  const isPsg = journal.publisher?.toLowerCase().includes('panorama')
  const recordType = journal.id.startsWith('j-disc-')
    ? 'Auto-discovered Journal Record'
    : 'POSI Verified Journal Record'
  return {
    title: `${journal.title} | POSI Journal Record`,
    description: `${recordType}. ${isPsg ? 'Published by Panorama Scholarly Group. ' : ''}eISSN: ${journal.issn_online ?? '—'}. Browse PQF assessment, policy evidence, and metadata quality data.`,
  }
}

const ISO_COUNTRY: Record<string, string> = {
  AF:'Afghanistan',AR:'Argentina',AT:'Austria',AU:'Australia',BE:'Belgium',BR:'Brazil',
  CA:'Canada',CH:'Switzerland',CN:'China',CZ:'Czech Republic',DE:'Germany',DK:'Denmark',
  EG:'Egypt',ES:'Spain',FI:'Finland',FR:'France',GB:'United Kingdom',GR:'Greece',
  HR:'Croatia',HU:'Hungary',ID:'Indonesia',IE:'Ireland',IL:'Israel',IN:'India',
  IR:'Iran',IT:'Italy',JP:'Japan',KR:'South Korea',MX:'Mexico',MY:'Malaysia',
  NL:'Netherlands',NO:'Norway',NZ:'New Zealand',PH:'Philippines',PL:'Poland',
  PT:'Portugal',RO:'Romania',RS:'Serbia',RU:'Russia',SA:'Saudi Arabia',SE:'Sweden',
  SG:'Singapore',SI:'Slovenia',SK:'Slovakia',TH:'Thailand',TR:'Turkey',
  TW:'Taiwan',UA:'Ukraine',US:'United States',ZA:'South Africa',
}

function weeksToFrequency(weeks: number | null | undefined): string | null {
  if (weeks === null || weeks === undefined) return null
  if (weeks <= 1) return 'Weekly'
  if (weeks <= 2) return 'Biweekly'
  if (weeks <= 5) return 'Monthly'
  if (weeks <= 9) return 'Bimonthly'
  if (weeks <= 16) return 'Quarterly'
  if (weeks <= 22) return 'Triannual'
  if (weeks <= 30) return 'Biannual'
  return 'Annual'
}

const INDEXING_LABEL: Record<string, string> = {
  A: 'A — High Readiness',
  B: 'B — Moderate Readiness',
  C: 'C — Developing',
  D: 'D — Early Stage',
  'Internal Review': 'Internal Review',
}

const INDEXING_VARIANT = {
  A: 'indexing-a' as const,
  B: 'indexing-b' as const,
  C: 'indexing-c' as const,
  D: 'indexing-d' as const,
  'Internal Review': 'default' as const,
}

// A single slow/hanging external journal site (OAI-PMH or Crossref) must never
// block static generation of its page past the host's per-page build timeout.
function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([p, new Promise<T>(res => setTimeout(() => res(fallback), ms))])
}

// Shared between the legacy (`eligibility === 'mature'`) and AJR-E-1.1
// (`lifecycle_stage === 'mature'`) branches below — identical presentation
// either way: AJR-M is implemented but has not been run against real data
// for any journal yet, so a mature journal never shows an AJR-E-scored
// total (AJR-M-1.0-SPEC.md forbids scoring mature journals with the
// early-stage rubric).
function MatureRatingCard({ monthsSinceLaunch }: { monthsSinceLaunch: number | null }) {
  return (
    <div className="bg-white p-4" style={{ border: '1px solid var(--posi-border)' }}>
      <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--posi-muted)' }}>
          POSI Automated Rating (AJR-M)
        </h2>
        <span className="text-[9px] font-mono px-1.5 py-0.5" style={{ color: '#92400e', border: '1px solid #92400e', background: '#fffbeb' }}>
          PENDING DATA
        </span>
      </div>
      <p className="text-[10px] leading-relaxed p-2" style={{ color: '#92400e', background: '#fffbeb', border: '1px solid #fde68a' }}>
        This journal is mature (60+ months since first publication). AJR-M 1.0 methodology is implemented
        (<code className="font-mono">src/ajr-mature.mjs</code>, see AJR-M-1.0-SPEC.md) but has not been run
        against real evidence/citation data for any journal yet — no AJR-M score or M-Q exists to show. A
        mature journal is never scored with the AJR-E rubric (the early-stage 100-point evidence model),
        so no interim score is shown here — see{' '}
        <Link href="/ratings/mature" className="underline">Mature Rankings</Link>.
      </p>
      <p className="text-[10px] leading-relaxed mt-2" style={{ color: 'var(--posi-muted)' }}>
        {monthsSinceLaunch} months since first published.
      </p>
      <a
        href="https://github.com/WENSHAO521/posi-data/blob/master/AJR-M-1.0-SPEC.md"
        target="_blank"
        rel="noopener noreferrer"
        className="block text-[10px] hover:underline mt-2"
        style={{ color: 'var(--posi-accent)' }}
      >
        Methodology →
      </a>
    </div>
  )
}

export default async function JournalPage(props: { params: Promise<{ code: string }> }) {
  const { code } = await props.params
  const journal = getJournalByCode(code)
  if (!journal) notFound()

  let total = 0
  let articles: import('@/lib/types').Article[] = []
  let doaj: DoajJournalInfo | null = null
  let publisherLocation: string | null = null

  // Discovered journals already have metadata from data.ts — skip redundant API calls
  const isDiscovered = journal.id.startsWith('j-disc-')
  // A journal demoted from Core Collection after a PQF re-review (see
  // data.ts's getCoreCollection()) keeps its full record and rating tabs —
  // only Core Collection member privileges (certificate, badge, the
  // "Core Collection" pill) are withheld.
  const isCandidate = journal.collection_status === 'candidate'
  // Citation impact display is a Core Collection feature: shown only for the manually
  // curated collection (PSG/indexed), never inferred from DOAJ listing status —
  // DOAJ is external metadata, not a POSI admission or ranking signal.
  const showCitationImpact = !isDiscovered
  // Precomputed snapshot (scripts/fetch-citation-stats.mjs) instead of a live
  // OpenAlex/Crossref fetch — keeps this figure identical to /citation-reports's,
  // which reads the same file. See src/lib/citation-stats.ts.
  const citationEntry = showCitationImpact ? getCitationStats(journal.journal_code) : null
  const citationStats = citationEntry?.stats ?? null
  // Real PCS-1.0 value (PCS-1.0-SPEC.md), joined by posi-data's posi_id —
  // independent of citationStats/citationEntry above (Crossref-sourced,
  // not OpenAlex), so it can be real and shown even when this journal has
  // no resolvable OpenAlex source record.
  const pcsEntry = showCitationImpact ? getPcsEntry(journal.posi_id) : null

  const [doajResult, crMeta, issnCountry] = await Promise.all([
    // Skip DOAJ if journal is already auto-scored (all its info is in data.ts)
    !isDiscovered && journal.issn_online ? doajGetJournal(journal.issn_online).catch(() => null) : null,
    // Skip Crossref meta for discovered journals (article_count comes from data.ts)
    !isDiscovered && journal.issn_online ? crossrefFetchJournal(journal.issn_online).catch(() => null) : null,
    // Skip ISSN country lookup for discovered journals (registration_country already in data.ts)
    !isDiscovered && !journal.registration_country && journal.issn_online ? issnGetCountry(journal.issn_online).catch(() => null) : null,
  ])
  doaj = doajResult
  const doajCountry = doajResult?.publisher_country_code ? (ISO_COUNTRY[doajResult.publisher_country_code] ?? doajResult.publisher_country_code) : null
  publisherLocation = journal.registration_country ?? issnCountry ?? crMeta?.publisher_location ?? doajCountry ?? null
  const frequency = journal.frequency || weeksToFrequency(doajResult?.publication_time_weeks) || null

  // Article listing sourced from Crossref (DOI registry) — skip for discovered
  // journals, whose article_count already comes from data.ts.
  // Wrapped in withTimeout: a slow/hanging Crossref response must not stall the build.
  if (!isDiscovered && journal.issn_online) {
    const cr = await withTimeout(
      crossrefGetJournalWorks(journal.issn_online, { page: 1, rows: 20 }).catch(() => ({ total: 0, items: [] })),
      12000,
      { total: 0, items: [] }
    )
    total = crMeta?.total_dois ?? cr.total
    articles = cr.items
  }
  if (isDiscovered) {
    total = journal.article_count
  }

  // ─── Tab panels — see src/components/JournalProfileTabs.tsx. Panels are
  // omitted entirely (not passed as null) for content that doesn't apply to
  // a given journal (auto-discovered records skip Lifecycle/Citation/
  // Evidence/Metadata/History), which also lets the tab UI itself collapse
  // to a plain view when only one panel remains.

  const overviewPanel = (
    <div className="grid md:grid-cols-3 gap-5 items-start">
      <div className="bg-white p-4" style={{ border: '1px solid var(--posi-border)' }}>
        <h2 className="text-[10px] font-bold uppercase tracking-[0.12em] mb-3" style={{ color: 'var(--posi-muted)' }}>Coverage</h2>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span style={{ color: 'var(--posi-muted)' }}>POSI Journal Code</span>
            <span className="font-mono" style={{ color: 'var(--posi-text)' }}>{journal.journal_code}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: 'var(--posi-muted)' }}>Core Collection</span>
            <span
              className="font-semibold"
              style={{ color: !isDiscovered && !isCandidate ? '#1F7A4D' : isCandidate ? '#B45309' : '#6B7280' }}
              title={isCandidate ? 'Admitted once, but a PQF re-review found it below the eligibility bar — pending re-review, not full Core Collection membership.' : undefined}
            >
              {isCandidate ? 'Candidate' : !isDiscovered ? 'Yes' : 'No'}
            </span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: 'var(--posi-muted)' }}>PSC Category</span>
            <span style={{ color: 'var(--posi-text)' }}>
              {journal.psc_category ? (
                <>
                  {journal.psc_category}
                  {journal.psc_confidence === 'low' && <span className="ml-1 opacity-60" title="Low-confidence classification">*</span>}
                </>
              ) : (
                <span style={{ color: 'var(--posi-muted)' }}>Not yet classified</span>
              )}
            </span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: 'var(--posi-muted)' }}>Coverage Since</span>
            <span style={{ color: 'var(--posi-text)' }}>{journal.created_at?.slice(0, 10) ?? '—'}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: 'var(--posi-muted)' }}>Total Articles</span>
            <ArticleCountBadge issn={journal.issn_online ?? null} fallback={total || journal.article_count} />
          </div>
          {journal.openalex_source_id && (
            <a
              href={`https://openalex.org/sources/${journal.openalex_source_id}`}
              className="block text-[11px] hover:underline mt-1 transition-colors"
              style={{ color: 'var(--posi-accent)' }}
              target="_blank"
              rel="noopener noreferrer"
            >
              View on OpenAlex →
            </a>
          )}
          {!isDiscovered && (
            <Link
              href={`/badges?code=${journal.journal_code}`}
              className="block text-[11px] hover:underline mt-1 transition-colors"
              style={{ color: isCandidate ? '#B45309' : 'var(--posi-accent)' }}
            >
              {isCandidate ? 'Get POSI Candidate Badge →' : 'Get POSI Badge →'}
            </Link>
          )}
          {!isDiscovered && (
            <a
              href={`/api/certificate/${journal.journal_code}/pdf`}
              download={`POSI-${isCandidate ? 'Candidate-Record' : 'Core-Collection-Certificate'}-${journal.journal_code}.pdf`}
              className="block text-[11px] hover:underline mt-1 transition-colors"
              style={{ color: isCandidate ? '#B45309' : 'var(--posi-accent)' }}
            >
              {isCandidate ? 'Download Candidate Record (PDF) →' : 'Download Certificate (PDF) →'}
            </a>
          )}
        </div>
      </div>

      <div className="md:col-span-2">
        <JournalArticles
          issn={journal.issn_online ?? null}
          journalCode={journal.journal_code}
          initialArticles={articles}
          initialTotal={total}
        />
      </div>
    </div>
  )

  // LAYER 2 (formerly): Automated Rating (AJR) — 100% automated (see
  // posi-data/AJR-SPEC.md §11): no reviewer, editor, publisher, or POSI
  // staff has a way to directly set this score — only the underlying
  // evidence can be corrected, which triggers a recompute. Lifecycle stage
  // decides the quartile track, not whether a score exists: 'early_stage'
  // journals (12-59 months since first publication) are eligible for a
  // future E-Q1-E-Q4 once a real PSC peer cohort exists; 'mature' journals
  // are scored via AJR-M (AJR-M-1.0-SPEC.md, implemented but not yet run
  // against real data — see MatureRatingCard above) and separately may
  // carry an independent Citation Q (see AJR-SPEC.md §1, §4). A mature
  // journal is never scored with the AJR-E rubric — AJR-M-1.0-SPEC.md is
  // explicit about this — so even though early_stage_rating.total/
  // subfactors may still be populated for a mature-eligible record (an
  // interim AJR-E figure from earlier in POSI's history), it is
  // deliberately never displayed here as this journal's current score.
  //
  // Two real record shapes exist (see types.ts's EarlyStageRating union,
  // and posi-data's audits/ratings/ajr-e-1.1-rerate-core30-2026/README.md):
  // legacy (single `eligibility` field) and AJR-E-1.1 (`lifecycle_stage` +
  // `rating_status`, only on Core Collection records as of 2026-08-14).
  // Each branch reads its own record's real fields — no cross-shape
  // assumptions.
  const rating = journal.early_stage_rating
  const lifecyclePanel = isDiscovered || !rating ? null : isEarlyStageV1_1(rating) ? (
    rating.lifecycle_stage === 'mature' ? (
      <MatureRatingCard monthsSinceLaunch={rating.months_since_launch} />
    ) : (rating.rating_status === 'official' || rating.rating_status === 'provisional') && rating.subfactors ? (
      <div className="bg-white p-4" style={{ border: '1px solid var(--posi-border)' }}>
        <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--posi-muted)' }}>
            POSI Automated Rating (AJR-E)
          </h2>
          {rating.rating_status === 'official' ? (
            <span className="text-[9px] font-mono px-1.5 py-0.5" style={{ color: '#1F7A4D', border: '1px solid #bbf7d0', background: '#f0fdf4' }}>
              100% AUTOMATED
            </span>
          ) : (
            <span
              className="text-[9px] font-mono px-1.5 py-0.5"
              style={{ color: '#B45309', border: '1px solid #fde68a', background: '#fffbeb' }}
              title="Real score, shown, but evidence coverage is below the threshold AJR-SPEC.md § 6 requires for E-Q ranking eligibility."
            >
              PROVISIONAL
            </span>
          )}
        </div>
        <div className="flex items-baseline justify-between">
          <p className="text-2xl font-bold" style={{ color: 'var(--posi-text)' }}>
            {rating.total}<span className="text-xs font-normal" style={{ color: 'var(--posi-muted)' }}> / 100</span>
          </p>
          {rating.evidence_coverage != null && (
            <span
              className="text-[10px] font-mono"
              style={{ color: rating.evidence_coverage >= 80 ? '#1F7A4D' : rating.evidence_coverage >= 60 ? '#B45309' : '#6B7280' }}
              title="Resolved evidence weight ÷ applicable evidence weight — see AJR-SPEC.md §6"
            >
              Evidence Coverage {rating.evidence_coverage}%
            </span>
          )}
        </div>
        <p className="text-[10px] leading-relaxed mt-1" style={{ color: 'var(--posi-muted)' }}>
          {rating.months_since_launch} months since first published. Computed entirely
          from crawled site evidence and sampled Crossref article metadata — no manual score, percentile,
          or quartile adjustment is possible for this or any journal.{' '}
          {rating.rating_status === 'provisional'
            ? 'This score is provisional — evidence coverage is below the threshold AJR-SPEC.md § 6 requires for E-Q ranking eligibility, so it is shown but not ranking-eligible.'
            : rating.quartile
              ? `Ranked ${rating.quartile_label ?? rating.quartile} within its PSC peer cohort.`
              : 'No E-Q1–E-Q4 quartile assigned yet — no same-cohort PSC peer group large enough to rank against exists yet.'}
        </p>
        <div className="grid grid-cols-4 gap-1 mt-2.5 text-center">
          {[
            ['EGF', rating.subfactors.egf, 15],
            ['RIF', rating.subfactors.rif, 15],
            ['INF', rating.subfactors.inf, 15],
            ['PUB', rating.subfactors.pub, 15],
            ['SOC', rating.subfactors.soc, 20],
            ['RDC', rating.subfactors.rdc, 10],
            ['TRN', rating.subfactors.trn, 10],
          ].map(([label, val, max]) => (
            <div key={label as string} className="px-1 py-1.5" style={{ background: 'var(--posi-bg)' }}>
              <p className="text-[8px] font-mono" style={{ color: 'var(--posi-muted)' }}>{label}</p>
              <p className="text-xs font-mono font-semibold" style={{ color: 'var(--posi-text)' }}>{val}/{max}</p>
            </div>
          ))}
        </div>
        <a
          href="https://github.com/WENSHAO521/posi-data/blob/master/EARLY-STAGE-RATING-SPEC.md"
          target="_blank"
          rel="noopener noreferrer"
          className="block text-[10px] hover:underline mt-2"
          style={{ color: 'var(--posi-accent)' }}
        >
          Methodology (AJR-E-1.1) →
        </a>
      </div>
    ) : (
      // rating_status 'not_rateable' (in the Early-Stage window, failed a
      // mandatory-evidence gate) or 'not_applicable' (not currently in the
      // Early-Stage window) — not_rateable_reason is always populated for
      // both, with the real, journal-specific reason (see types.ts), so it
      // is shown directly instead of reconstructed hardcoded prose.
      <div className="bg-white p-4" style={{ border: '1px solid var(--posi-border)' }}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--posi-muted)' }}>
            POSI Automated Rating (AJR-E)
          </h2>
          {rating.evidence_coverage != null && (
            <span
              className="text-[10px] font-mono"
              style={{ color: rating.evidence_coverage >= 80 ? '#1F7A4D' : rating.evidence_coverage >= 60 ? '#B45309' : '#6B7280' }}
              title="Resolved evidence weight ÷ applicable evidence weight — see AJR-SPEC.md §6"
            >
              Evidence Coverage {rating.evidence_coverage}%
            </span>
          )}
        </div>
        <p className="text-xs font-semibold" style={{ color: rating.rating_status === 'not_rateable' ? '#B45309' : 'var(--posi-muted)' }}>
          {rating.rating_status === 'not_rateable' ? 'Not Rateable'
            : rating.lifecycle_stage === 'observation' ? 'Observation Stage'
            : rating.lifecycle_stage === 'unknown' ? 'Unknown'
            : 'Not Applicable'}
        </p>
        <p className="text-[10px] leading-relaxed mt-1" style={{ color: 'var(--posi-muted)' }}>
          {rating.not_rateable_reason ?? 'AJR-E does not currently apply to this record.'}
        </p>
      </div>
    )
  ) : (
    rating.eligibility === 'mature' ? (
      <MatureRatingCard monthsSinceLaunch={rating.months_since_launch} />
    ) : rating.eligibility === 'early_stage' && rating.subfactors ? (
      <div className="bg-white p-4" style={{ border: '1px solid var(--posi-border)' }}>
        <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--posi-muted)' }}>
            POSI Automated Rating (AJR-E)
          </h2>
          <span className="text-[9px] font-mono px-1.5 py-0.5" style={{ color: '#1F7A4D', border: '1px solid #bbf7d0', background: '#f0fdf4' }}>
            100% AUTOMATED
          </span>
        </div>
        <div className="flex items-baseline justify-between">
          <p className="text-2xl font-bold" style={{ color: 'var(--posi-text)' }}>
            {rating.total}<span className="text-xs font-normal" style={{ color: 'var(--posi-muted)' }}> / 100</span>
          </p>
          {rating.evidence_coverage != null && (
            <span
              className="text-[10px] font-mono"
              style={{ color: rating.evidence_coverage >= 80 ? '#1F7A4D' : rating.evidence_coverage >= 60 ? '#B45309' : '#6B7280' }}
              title="Resolved evidence weight ÷ applicable evidence weight — see AJR-SPEC.md §6"
            >
              Evidence Coverage {rating.evidence_coverage}%
            </span>
          )}
        </div>
        <p className="text-[10px] leading-relaxed mt-1" style={{ color: 'var(--posi-muted)' }}>
          {rating.months_since_launch} months since first published. Computed entirely
          from crawled site evidence and sampled Crossref article metadata — no manual score, percentile,
          or quartile adjustment is possible for this or any journal. No E-Q1–E-Q4 quartile is assigned yet
          (needs a same-cohort PSC peer group, not yet built).
        </p>
        <div className="grid grid-cols-4 gap-1 mt-2.5 text-center">
          {[
            ['EGF', rating.subfactors.egf, 15],
            ['RIF', rating.subfactors.rif, 15],
            ['INF', rating.subfactors.inf, 15],
            ['PUB', rating.subfactors.pub, 15],
            ['SOC', rating.subfactors.soc, 20],
            ['RDC', rating.subfactors.rdc, 10],
            ['TRN', rating.subfactors.trn, 10],
          ].map(([label, val, max]) => (
            <div key={label as string} className="px-1 py-1.5" style={{ background: 'var(--posi-bg)' }}>
              <p className="text-[8px] font-mono" style={{ color: 'var(--posi-muted)' }}>{label}</p>
              <p className="text-xs font-mono font-semibold" style={{ color: 'var(--posi-text)' }}>{val}/{max}</p>
            </div>
          ))}
        </div>
        <a
          href="https://github.com/WENSHAO521/posi-data/blob/master/EARLY-STAGE-RATING-SPEC.md"
          target="_blank"
          rel="noopener noreferrer"
          className="block text-[10px] hover:underline mt-2"
          style={{ color: 'var(--posi-accent)' }}
        >
          Methodology →
        </a>
      </div>
    ) : (
      <div className="bg-white p-4" style={{ border: '1px solid var(--posi-border)' }}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--posi-muted)' }}>
            POSI Automated Rating (AJR)
          </h2>
          {rating.evidence_coverage != null && (
            <span
              className="text-[10px] font-mono"
              style={{ color: rating.evidence_coverage >= 80 ? '#1F7A4D' : rating.evidence_coverage >= 60 ? '#B45309' : '#6B7280' }}
              title="Resolved evidence weight ÷ applicable evidence weight — see AJR-SPEC.md §6"
            >
              Evidence Coverage {rating.evidence_coverage}%
            </span>
          )}
        </div>
        <p className="text-xs font-semibold" style={{ color: rating.eligibility === 'not_yet_rateable' ? '#B45309' : 'var(--posi-muted)' }}>
          {rating.eligibility === 'observation' && 'Observation Stage'}
          {rating.eligibility === 'not_yet_rateable' && 'Not Yet Rateable'}
          {rating.eligibility === 'unknown' && 'Unknown'}
        </p>
        <p className="text-[10px] leading-relaxed mt-1" style={{ color: 'var(--posi-muted)' }}>
          {rating.eligibility === 'observation' &&
            `This journal is ${rating.months_since_launch ?? '<12'} months since first publication — too early for AJR (needs 12+ months). Not a quality signal either way.`}
          {rating.eligibility === 'not_yet_rateable' &&
            'Below the minimum evidence bar for AJR — often because POSI\'s crawl was blocked (HTTP 403) by the site, not necessarily missing governance. Unknown evidence is not equivalent to failed criteria.'}
          {rating.eligibility === 'unknown' &&
            'First-publication date could not be determined (e.g. no Crossref records) — AJR cannot run without it.'}
        </p>
      </div>
    )
  )

  // LAYER 3 (formerly): Citation Analytics — Core Collection feature, see
  // showCitationImpact above. OpenAlex citedness is a provisional preview
  // (see /citation-reports), not an official PJR PCI value; pcsEntry (below)
  // is real PCS-1.0 data and renders even when citationStats is null, since
  // PCS is Crossref-sourced, not OpenAlex.
  const citationPanel = !showCitationImpact ? null : (citationStats || pcsEntry) ? (
    <CitationImpactCard stats={citationStats} pcsEntry={pcsEntry} />
  ) : (
    <div className="bg-white p-4" style={{ border: '1px solid var(--posi-border)' }}>
      <h2 className="text-[10px] font-bold uppercase tracking-[0.12em] mb-1" style={{ color: 'var(--posi-muted)' }}>Citation Analytics</h2>
      <p className="text-[10px] leading-relaxed" style={{ color: 'var(--posi-muted)' }}>
        No resolvable OpenAlex source record for this journal's ISSN — citation figures unavailable.
      </p>
    </div>
  )

  // Policy Evidence Summary — moved out of the old "Methodology & Evidence"
  // scroll section into its own Evidence tab.
  const evidencePanel = isDiscovered ? null : (() => {
    const pqf = journal.pqf ?? journal.ojqf
    const jtf = pqf?.subfactors.jtf ?? 0
    const score = journal.transparency_score ?? 0
    const policies: { label: string; status: 'verified' | 'partial' | 'candidate' | 'missing' | 'not_checked' }[] = [
      { label: 'Aim & Scope',           status: score >= 70 ? 'verified' : 'partial' },
      { label: 'Editorial Board',       status: jtf >= 15 ? 'partial' : 'candidate' },
      { label: 'Peer Review Policy',    status: jtf >= 15 ? 'partial' : 'candidate' },
      { label: 'APC Policy',            status: score >= 60 ? 'verified' : 'partial' },
      { label: 'Open Access Policy',    status: score >= 70 ? 'verified' : 'partial' },
      { label: 'Copyright / License',   status: score >= 65 ? 'verified' : 'partial' },
      { label: 'Publication Ethics',    status: jtf >= 12 ? 'partial' : 'candidate' },
      { label: 'Corrections Policy',    status: jtf >= 10 ? 'candidate' : 'missing' },
      { label: 'AI Use Policy',         status: 'not_checked' },
    ]
    const STATUS_CFG = {
      verified:   { label: 'Verified',     color: '#1F7A4D', bg: '#f0fdf4', border: '#bbf7d0' },
      partial:    { label: 'Partial',       color: '#B7791F', bg: '#fffbeb', border: '#fde68a' },
      candidate:  { label: 'Candidate',    color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
      missing:    { label: 'Missing',       color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' },
      not_checked:{ label: 'Not checked',  color: '#6B7280', bg: '#f9fafb', border: '#e5e7eb' },
    }
    return (
      <div className="bg-white" style={{ border: '1px solid var(--posi-border)' }}>
        <div className="px-4 py-2.5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--posi-border-light)', background: 'var(--posi-bg)' }}>
          <span className="text-[9px] font-bold uppercase tracking-[0.15em]" style={{ color: 'var(--posi-muted)', fontFamily: 'var(--font-mono)' }}>Policy Coverage Estimate</span>
          <Link href="/policies" className="text-[10px] hover:underline" style={{ color: 'var(--posi-accent)' }}>
            Full breakdown →
          </Link>
        </div>
        <div className="p-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5">
          {policies.map(p => {
            const cfg = STATUS_CFG[p.status]
            return (
              <div key={p.label} className="px-2 py-1.5" style={{ border: '1px solid var(--posi-border-light)', background: 'var(--posi-bg)' }}>
                <p className="text-[10px] leading-snug mb-1" style={{ color: 'var(--posi-muted)' }}>{p.label}</p>
                <span className="text-[10px] font-medium px-1 py-0.5" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                  {cfg.label}
                </span>
              </div>
            )
          })}
        </div>
        <div className="px-4 py-2 text-[10px]" style={{ borderTop: '1px solid var(--posi-border-light)', color: 'var(--posi-muted)' }}>
          Policy evidence is based on publicly available information at the time of assessment.{' '}
          <a href={`mailto:posi@panorama-sg.com?subject=Policy correction: ${journal.short_title}`} className="underline" style={{ color: 'var(--posi-accent)' }}>
            Report a correction
          </a>
        </div>
      </div>
    )
  })()

  // Quality Scores, Discoverability Score, DOAJ detail, legacy subject tags,
  // and the PQF card — moved out of the old "Methodology & Evidence" scroll
  // section into their own Metadata tab.
  const metadataPanel = isDiscovered ? null : (
    <div className="space-y-4">
      {(journal.pqf ?? journal.ojqf)
        ? <OjqfCard score={(journal.pqf ?? journal.ojqf)!} journalCode={journal.journal_code} />
        : journal.auto_pqf
          ? <OjqfCard score={journal.auto_pqf} journalCode={journal.journal_code} isAuto />
          : null
      }

      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white p-4" style={{ border: '1px solid var(--posi-border)' }}>
          <h3 className="text-[10px] font-bold uppercase tracking-[0.12em] mb-3 flex items-center gap-1.5" style={{ color: 'var(--posi-muted)' }}>
            <ChartBar className="h-3.5 w-3.5" />
            Quality Scores
          </h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-[11px] mb-1" style={{ color: 'var(--posi-muted)' }}>
                <span>Metadata Quality (MQS)</span>
                <span className="font-mono font-medium">{journal.metadata_quality_score}/100</span>
              </div>
              <MetadataQualityBar score={journal.metadata_quality_score} showLabel={false} />
            </div>
            <div>
              <div className="flex justify-between text-[11px] mb-1" style={{ color: 'var(--posi-muted)' }}>
                <span>Transparency Score (JTS)</span>
                <span className="font-mono font-medium">{journal.transparency_score}/100</span>
              </div>
              <div className="w-full h-1.5" style={{ background: 'var(--posi-bg)' }}>
                <div className="h-1.5" style={{ width: `${journal.transparency_score}%`, background: 'var(--posi-accent)' }} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4" style={{ border: '1px solid var(--posi-border)' }}>
          <h3 className="text-[10px] font-bold uppercase tracking-[0.12em] mb-3" style={{ color: 'var(--posi-muted)' }}>
            Discoverability Score
          </h3>
          <div className="text-center py-1">
            <span className="text-5xl font-bold font-mono" style={{ color: 'var(--posi-text)' }}>{journal.indexing_readiness}</span>
          </div>
          <div className="mt-2 text-center">
            <Badge
              label={INDEXING_LABEL[journal.indexing_readiness]}
              variant={INDEXING_VARIANT[journal.indexing_readiness] || 'default'}
            />
          </div>
          <p className="text-[10px] mt-2 text-center leading-relaxed" style={{ color: 'var(--posi-muted)' }}>
            Technical readiness for OAI-PMH, sitemap, DOI resolution, and Schema.org
          </p>
        </div>

        <div className="bg-white p-4" style={{ border: '1px solid var(--posi-border)' }}>
          <h3 className="text-[10px] font-bold uppercase tracking-[0.12em] mb-0.5" style={{ color: 'var(--posi-muted)' }}>
            DOAJ (External Reference)
          </h3>
          <p className="text-[10px] mb-3" style={{ color: 'var(--posi-muted)' }}>
            Independent OA directory — not part of POSI's own review, admission, or ranking.
          </p>
          {doaj ? (
            <div className="space-y-2 text-xs">
              {doaj.has_seal && (
                <div className="flex justify-between items-center">
                  <span style={{ color: 'var(--posi-muted)' }}>DOAJ Seal</span>
                  <span className="font-semibold" style={{ color: '#1F7A4D' }}>✓</span>
                </div>
              )}
              {doaj.license && (
                <div className="flex justify-between items-center">
                  <span style={{ color: 'var(--posi-muted)' }}>License</span>
                  <span className="font-mono" style={{ color: 'var(--posi-text)' }}>{doaj.license}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span style={{ color: 'var(--posi-muted)' }}>APC</span>
                <span style={{ color: 'var(--posi-text)' }}>
                  {doaj.has_apc
                    ? doaj.apc_max.length
                      ? doaj.apc_max.map(a => `${a.currency} ${a.price}`).join(', ')
                      : 'Yes'
                    : 'No charge'}
                </span>
              </div>
              {doaj.doaj_id && (
                <a
                  href={`https://doaj.org/toc/${doaj.doaj_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-[11px] hover:underline mt-1 transition-colors"
                  style={{ color: 'var(--posi-accent)' }}
                >
                  View on DOAJ →
                </a>
              )}
            </div>
          ) : (
            <a
              href={`https://doaj.org/search/journals?source=%7B%22query%22%3A%7B%22query_string%22%3A%7B%22query%22%3A%22${journal.issn_online}%22%7D%7D%7D`}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-[11px] hover:underline transition-colors"
              style={{ color: 'var(--posi-accent)' }}
            >
              Search on DOAJ →
            </a>
          )}
          {(journal.subjects?.length ?? 0) > 0 && (
            <>
              <p className="text-[9px] uppercase tracking-[0.1em] mt-3 mb-1.5" style={{ color: 'var(--posi-muted)' }}>Legacy Subject Tags (LCC via DOAJ)</p>
              <div className="flex flex-wrap gap-1.5">
                {journal.subjects!.map(s => (
                  <span
                    key={s}
                    className="text-[10px] px-1.5 py-0.5 leading-snug"
                    style={{ background: 'var(--posi-bg)', border: '1px solid var(--posi-border)', color: 'var(--posi-text)' }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )

  // No annual frozen rating releases exist yet (AJR-SPEC.md §9 Phase 6) — a
  // real per-year history table would need at least two release snapshots
  // to show. Honest placeholder rather than a fabricated table.
  const historyPanel = isDiscovered ? null : (
    <div className="bg-white p-6 text-center" style={{ border: '1px solid var(--posi-border)' }}>
      <p className="text-xs font-semibold" style={{ color: 'var(--posi-text)' }}>No rating history yet</p>
      <p className="text-[11px] leading-relaxed mt-2 max-w-md mx-auto" style={{ color: 'var(--posi-muted)' }}>
        POSI has not yet published its first annual frozen rating release, so there is only ever one
        current AJR score on record — nothing to compare it against yet. Year-over-year history will
        appear here starting with the first PJR release.
      </p>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">
      {/* Breadcrumb */}
      <nav className="text-xs flex items-center gap-1.5" style={{ color: 'var(--posi-muted)' }}>
        <Link href="/" className="transition-colors hover:text-gray-700">Home</Link>
        <span>/</span>
        <Link href="/journals" className="transition-colors hover:text-gray-700">Journal Records</Link>
        <span>/</span>
        <span style={{ color: 'var(--posi-text)' }}>{journal.short_title}</span>
      </nav>

      {/* COI notice — PSG journals only */}
      {journal.publisher?.toLowerCase().includes('panorama') && !journal.id.startsWith('j-disc-') && (
        <div
          className="px-4 py-3 text-xs leading-relaxed"
          style={{ background: '#fefce8', border: '1px solid #fde68a', borderLeft: '3px solid #d97706' }}
        >
          <strong style={{ color: '#92400e' }}>Conflict of Interest: </strong>
          <span style={{ color: '#78350f' }}>
            This journal is affiliated with the organization that operates POSI. Its PQF score, citation
            metrics (PCI/PCS), and Automated Rating are nevertheless calculated by the same published
            methodology and versioned calculation engine applied to every eligible journal. No publisher,
            editor, reviewer, sponsor, or POSI administrator can directly alter its numerical score,
            percentile, or quartile; independent verification is encouraged.
          </span>{' '}
          <Link href="/about" className="underline" style={{ color: '#92400e' }}>Governance disclosure →</Link>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-5" style={{ border: '1px solid var(--posi-border)' }}>
        <div className="flex items-start gap-4">
          {journal.cover_image_url && (
            <img
              src={journal.cover_image_url}
              alt={`${journal.short_title} cover`}
              className="w-16 shrink-0 object-cover"
              style={{ aspectRatio: '210/297', border: '1px solid var(--posi-border)' }}
            />
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold leading-tight" style={{ color: 'var(--posi-text)' }}>{journal.title}</h1>
            <p className="text-xs mt-1" style={{ color: 'var(--posi-muted)' }}>{journal.publisher} · {journal.country}</p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <Badge label="OA" variant="oa" />
              <Badge label={journal.license} variant="license" />
              {!isDiscovered && !isCandidate && <Badge label="Core Collection" variant="core-collection" />}
              {isCandidate && <Badge label="Candidate" variant="pending" />}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 pt-4" style={{ borderTop: '1px solid var(--posi-border-light)' }}>
          {[
            journal.issn_print && journal.issn_online
              ? { icon: Barcode, label: 'ISSN', value: `p ${journal.issn_print} / e ${journal.issn_online}` }
              : journal.issn_online
                ? { icon: Barcode, label: 'eISSN', value: journal.issn_online }
                : { icon: Barcode, label: 'pISSN', value: journal.issn_print || 'N/A' },
            ...(publisherLocation ? [{ icon: Globe, label: 'ISSN Reg.', value: publisherLocation }] : []),
            ...(frequency ? [{ icon: FileText, label: 'Frequency', value: frequency }] : []),
            { icon: Users, label: 'Peer Review', value: journal.peer_review_type },
            { icon: Globe, label: 'Language', value: journal.language },
          ].map(item => (
            <div key={item.label} className="flex items-start gap-2">
              <item.icon className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: 'var(--posi-muted)' }} />
              <div>
                <p className="text-[10px] uppercase tracking-[0.08em]" style={{ color: 'var(--posi-muted)' }}>{item.label}</p>
                <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--posi-text)' }}>{item.value}</p>
              </div>
            </div>
          ))}
        </div>

        {journal.website_url && (
          <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--posi-border-light)' }}>
            <a
              href={journal.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs hover:underline transition-colors"
              style={{ color: 'var(--posi-accent)' }}
            >
              <ArrowSquareOut className="h-3.5 w-3.5" />
              {journal.website_url}
            </a>
          </div>
        )}
      </div>

      {/* Tabbed profile body — see src/components/JournalProfileTabs.tsx.
          Panels are computed above from the same data fetched for the old
          single-scroll layout; this only changes presentation. */}
      <JournalProfileTabs
        panels={{
          overview: overviewPanel,
          lifecycle: lifecyclePanel,
          citation: citationPanel,
          evidence: evidencePanel,
          metadata: metadataPanel,
          history: historyPanel,
        }}
      />
    </div>
  )
}
