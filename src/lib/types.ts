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
  article_count: number
  created_at: string
  updated_at: string
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

// POSI Early-Stage Journal Rating — a separate track from Citation Quartiles
// (Q1-Q4), for journals too young to have a real PCI citation window. See
// posi-data's EARLY-STAGE-RATING-SPEC.md (v0.2). 100% automated: no person
// has a code path to directly set a score, percentile, or quartile — only
// the underlying evidence can be corrected, which triggers a recompute. No
// P-Q1-P-Q4 quartile is assigned yet: that needs a same-cohort peer group
// within a PSC category, and PSC classification hasn't been run on any
// journal yet — subfactors/total are populated once a journal clears
// eligibility, but provisional_quartile stays null until then.
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
  // The AJR score (subfactors/total) is computed for any journal that clears
  // the minimum evidence bar, regardless of age — 'rated' and 'rated_mature'
  // both carry a real score. Age only decides the quartile track: 'rated'
  // (within 36 months of first publication) is eligible for a future
  // P-Q1-P-Q4 once a real PSC peer cohort exists; 'rated_mature' journals
  // are scored the same way but rely on Citation Q (PCI-based) instead.
  // 'not_yet_rateable': below the minimum evidence bar regardless of age (see spec §3).
  // 'unknown': first-published date could not be determined (e.g. no Crossref records).
  eligibility: 'rated' | 'rated_mature' | 'not_yet_rateable' | 'unknown'
  first_published: string | null   // earliest Crossref-registered work date for this ISSN
  months_since_launch: number | null
  subfactors: EarlyStageSubfactors | null
  total: number | null   // sum of subfactors, out of 100
  provisional_quartile: null             // always null until PSC classification + cohort data exist
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
