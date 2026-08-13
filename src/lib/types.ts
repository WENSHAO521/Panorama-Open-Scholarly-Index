export interface Journal {
  id: string
  journal_code: string
  title: string
  short_title: string
  issn_print: string | null
  issn_online: string | null
  publisher: string
  country: string
  language: string
  frequency: string
  open_access: boolean
  license: string
  peer_review_type: string
  website_url: string
  cover_image_url: string | null
  oai_base_url: string | null
  registration_country: string | null
  doaj_status: 'listed' | 'application_submitted' | 'not_listed' | null
  openalex_source_id: string | null
  subjects?: string[] | null
  metadata_quality_score: number
  transparency_score: number
  indexing_readiness: 'A' | 'B' | 'C' | 'D' | 'Internal Review'
  pqf?: PqfScore | null
  auto_pqf?: PqfScore | null
  /** @deprecated use pqf */
  ojqf?: PqfScore
  early_stage_rating?: EarlyStageRating | null
  // True only for BENCHMARK_JOURNALS — an external reference corpus used to
  // validate AJR against internationally established journals. Never part
  // of the Core Collection, never a POSI admission candidate, never counted
  // in Indexed/Metric Eligible stats.
  is_external_benchmark?: boolean
  // PSC (POSI Subject Classification) — see posi-data's PSC-CROSSWALK.md.
  // Derived from OpenAlex's topic-aggregation data for the journal's ISSN,
  // mapped through an OpenAlex-field-to-PSC crosswalk. 'low' confidence
  // means the journal's top topic didn't dominate its topic distribution
  // (a real signal for multidisciplinary/generalist journals like Nature or
  // The Lancet, not a data error) — psc_category may still be set as a
  // best-guess in that case, but should be treated as unreliable.
  psc_category?: string | null
  psc_confidence?: 'high' | 'low' | null
  // undefined/'core': full Core Collection membership. 'candidate': admitted
  // once, but a PQF re-review found it below the eligibility bar (PQF total
  // < 40, "Not Eligible") — keeps its journal record and page, but is
  // excluded from Core Collection counts, rankings, badges, and
  // certificates until re-review restores it. See data.ts's
  // getCoreCollection()/getCandidateJournals().
  collection_status?: 'core' | 'candidate'
  article_count: number
  created_at: string
  updated_at: string
  // Only present on BENCHMARK_JOURNALS records added by a bulk publisher-
  // catalog ingestion (2026-08: Elsevier jnlactive.csv, Frontiers title
  // list — see posi-data's audits/migrations/). Its absence marks the
  // original ~1000-journal curated validation seed (hand-selected via
  // OpenAlex is_core/citation-activity signals, not a raw publisher
  // export) — see benchmark-journals.ts's CURATED_BENCHMARK_JOURNALS.
  source_note?: string | null
  // Only present on PUBLISHER_CATALOG_JOURNALS (source_note is set) —
  // never both this AND early_stage_rating at once. A diagnostic-only
  // citation preview (OpenAlex 2yr mean citedness + PSC classification),
  // explicitly NOT a ranking — rank/percentile/quartile are always null.
  // withdrawn from ranking use 2026-08-13 (see posi-data's
  // audits/migrations/citation-preview-correction-2026/README.md): an
  // earlier version of this field fed the raw OpenAlex figure into
  // posi-engine's real rankCategory()/rankCitationTrack() as if it were
  // PCI, which conflicts with AJR-SPEC.md § 14 (Global Benchmark
  // membership is not ranking eligibility) and with PCI's actual
  // definition (PJR-SPEC.md § 5-6). early_stage_rating stays reserved for
  // a real, evidence-based AJR score and is never populated by this
  // pathway.
  citation_preview?: CitationPreview | null
}

export interface CitationPreview {
  source: 'OpenAlex'
  metric: '2yr_mean_citedness'
  // OpenAlex's own 2yr_mean_citedness, taken as-is — NOT PCI. Only PCI
  // (PJR-SPEC.md § 5-6, a citable-items/citation-window calculation
  // computed under a formal PJR release) determines POSI Citation Rank,
  // Citation Percentile, or Citation Quartile. See /pci.
  value: number | null
  h_index: number | null
  works_count: number | null
  psc_category: string | null
  psc_confidence: 'high' | 'medium' | 'low' | 'unclassified'
  history_evidence: {
    // Real, checkable evidence of publishing activity >=5 years before
    // this preview was computed — NOT the real FPD-1.0/LIFECYCLE-1.1
    // lifecycle-stage determination, just raw evidence. false is the
    // default for missing evidence, never assumed favorably.
    has_activity_5y_ago: boolean
  }
  // Always null — this is a diagnostic preview, not a ranking. No cohort
  // was built, no rankCategory()/rankCitationTrack() call happens
  // anywhere upstream of this field.
  rank: number | null
  percentile: number | null
  quartile: 'Q1' | 'Q2' | 'Q3' | 'Q4' | null
  status: 'diagnostic_only'
  rated_at: string
  version: string
  source_note: string
}

export interface Author {
  id: string
  display_name: string
  given_name: string | null
  family_name: string | null
  orcid: string | null
  openalex_author_id: string | null
  country: string | null
  institution?: string | null
  is_corresponding?: boolean
  author_order?: number
}

export interface Article {
  id: string
  doi: string
  title: string
  subtitle: string | null
  journal_id: string
  journal_title?: string
  journal_code?: string
  volume: string | null
  issue: string | null
  first_page: string | null
  last_page: string | null
  publication_year: number
  publication_date: string | null
  article_type: string
  language: string
  abstract: string | null
  keywords: string[]
  license: string | null
  pdf_url: string | null
  html_url: string | null
  openalex_work_id: string | null
  crossref_status: 'verified' | 'registered' | 'pending' | 'not_found' | 'conflict' | 'broken' | null
  cited_by_count: number
  reference_count: number
  is_retracted: boolean
  metadata_quality_score: number
  authors: Author[]
  created_at: string
  updated_at: string
}

export interface Reference {
  key: string
  doi: string | null
  title: string | null
  author: string | null
  year: string | null
  journal: string | null
  volume: string | null
  issue: string | null
  first_page: string | null
  unstructured: string | null
}

export interface SearchResult {
  total: number
  page: number
  limit: number
  results: Article[]
  facets: SearchFacets
}

export interface SearchFacets {
  years: { value: number; count: number }[]
  journals: { value: string; label: string; count: number }[]
  document_types: { value: string; count: number }[]
  languages: { value: string; count: number }[]
  open_access: { value: string; count: number }[]
}

export interface DoiStatus {
  doi: string
  status: 'verified' | 'registered' | 'pending' | 'not_found' | 'conflict' | 'broken'
  crossref: {
    found: boolean
    title?: string
    year?: number
    journal?: string
    license?: string
  }
  openalex: {
    found: boolean
    work_id?: string
    cited_by_count?: number
    reference_count?: number
    open_access?: boolean
  }
  citation_visibility: {
    open_citation_count: number
    crossref_references_available: boolean
    doi_resolvable: boolean
  }
  metadata_conflicts: string[]
  metadata_quality_score: number
}

export interface PqfSubfactors {
  jtf: number  // Journal Transparency Factor  /25
  mqf: number  // Metadata Quality Factor      /25
  egf: number  // Editorial Governance Factor  /20
  tdf: number  // Technical Discoverability    /15
  cvf: number  // Citation Visibility Factor   /10
  rif: number  // Research Integrity Factor    /5
}

export interface PqfScore {
  total: number            // 0–100
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' | 'E'
  subfactors: PqfSubfactors
  evaluated_at: string     // ISO date string
  version: string          // e.g. "PQF v1.0"
}

/** @deprecated use PqfSubfactors */
export type OjqfSubfactors = PqfSubfactors

/** @deprecated use PqfScore */
export type OjqfScore = PqfScore

// POSI Automated Journal Rating, Early-Stage model (AJR-E) — a separate
// track from Citation Quartiles (Q1-Q4), for early-stage/mature journals per
// the AJR 1.0 Lifecycle Framework. See posi-data's AJR-SPEC.md. 100%
// automated: no person has a code path to directly set a score, percentile,
// or quartile — only the underlying evidence can be corrected, which
// triggers a recompute. No E-Q1-E-Q4 quartile is assigned yet: that needs a
// same-cohort peer group within a PSC category, and PSC classification
// hasn't been wired into ranking yet — subfactors/total are populated once
// a journal clears eligibility, but provisional_quartile stays null until
// then.
export interface EarlyStageSubfactors {
  egf: number  // Editorial Governance & Peer Review              /15
  rif: number  // Research Integrity & Publication Ethics          /15
  inf: number  // Metadata & Digital Publishing Infrastructure     /15
  pub: number  // Publishing Stability & Operational Performance   /15
  soc: number  // Scholarly Output Quality Signals                 /20
  rdc: number  // Scholarly Reach & Concentration                  /10
  trn: number  // Openness, Data & Transparency                    /10
}

export interface EarlyStageRating {
  // Lifecycle stage per AJR-SPEC.md § 1 (AJR 1.0 Lifecycle Framework).
  // 'observation' (0-11mo since first publication): too early to evaluate,
  // no score computed. 'early_stage' (12-59mo) and 'mature' (60mo+) both
  // carry a real AJR score (subfactors/total) once the minimum evidence bar
  // is cleared — 'early_stage' journals rank via E-Q1-E-Q4, 'mature'
  // journals via M-Q1-M-Q4 (scored with AJR-E for now — AJR-M's
  // citation-weighted model is not yet implemented, see AJR-SPEC.md § 13).
  // Citation Q (PCI-based) is a fully independent third track computed
  // separately (see /citation-reports) — a mature journal can carry both an
  // M-Q and a Citation Q at once, they are not mutually exclusive.
  // 'not_yet_rateable': below the minimum evidence bar regardless of age
  // (see spec §3). 'unknown': first-published date could not be determined
  // (e.g. no Crossref records).
  eligibility: 'observation' | 'early_stage' | 'mature' | 'not_yet_rateable' | 'unknown'
  first_published: string | null   // earliest Crossref-registered work date for this ISSN
  months_since_launch: number | null
  subfactors: EarlyStageSubfactors | null
  total: number | null   // sum of subfactors, out of 100
  // resolved evidence weight / applicable evidence weight x 100 (AJR-SPEC.md
  // §6) — scoped to the 12 site-content signals + sitemap.xml + robots.txt
  // (14 criteria), the ones scripts/rate-early-stage.mjs can cleanly tell
  // "confirmed absent" apart from "blocked/couldn't check" for. Low coverage
  // on a 'not_yet_rateable' journal usually means POSI's crawl was blocked
  // (see the Global Benchmark Collection's HTTP 403 finding), not that the
  // journal lacks real governance — unknown evidence is not equivalent to
  // failed criteria. null only when no ISSN exists to rate at all.
  evidence_coverage: number | null
  // E-Q1-E-Q4 (eligibility === 'early_stage') or M-Q1-M-Q4 (eligibility ===
  // 'mature') — see scripts/rank-lifecycle.mjs. null until a same-category
  // (or same-domain fallback) PSC peer cohort clears the minimum size gate
  // (RANK-1.0, posi-engine's ranking.mjs).
  provisional_quartile: 'E-Q1' | 'E-Q2' | 'E-Q3' | 'E-Q4' | 'M-Q1' | 'M-Q2' | 'M-Q3' | 'M-Q4' | null
  rated_at: string    // ISO date
  version: string     // e.g. "EARLY-STAGE-AUTO-0.1"
}

export interface Evidence {
  id: string
  journal_id?: string
  article_id?: string
  evidence_type: string
  factor: 'JTF' | 'MQF' | 'EGF' | 'TDF' | 'CVF' | 'RIF'
  criterion: string
  evidence_url: string | null
  archived_snapshot_url: string | null
  status: 'verified' | 'partial' | 'missing' | 'outdated' | 'manual_review'
  checked_at: string
  checked_by: string
  source: string
  note: string | null
}

export interface DoajJournalInfo {
  in_doaj: boolean
  has_seal: boolean
  license: string | null
  has_apc: boolean
  apc_max: { currency: string; price: number }[]
  subjects: string[]
  last_updated: string | null
  doaj_id: string | null
  publication_time_weeks: number | null
  publisher_country_code: string | null
}

export interface RorOrganization {
  id: string
  name: string
  country: string
  country_code: string
  types: string[]
  website: string | null
}

export interface MetadataQualityBreakdown {
  has_doi: boolean
  has_title: boolean
  has_abstract: boolean
  has_keywords: boolean
  has_authors: boolean
  has_orcid: boolean
  has_institution: boolean
  has_ror: boolean
  has_references: boolean
  has_license: boolean
  has_pdf_url: boolean
  has_html_url: boolean
  has_openalex: boolean
  score: number
  label: 'Excellent' | 'Good' | 'Acceptable' | 'Needs Improvement' | 'Incomplete'
}

export interface PlatformStats {
  total_journals: number
  psg_journals: number
  indexed_journals: number
  discovered_journals: number
  total_articles: number
  total_authors: number
  total_doi_records: number
  crossref_verified: number
  openalex_matched: number
  doaj_listed: number
  open_citation_records: number
  avg_metadata_quality: number
  last_updated: string
  data_version: string
}
