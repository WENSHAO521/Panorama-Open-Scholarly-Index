// Field dictionary for the journal record - the single place that says,
// for each published field, what it means, where it comes from, and on
// what basis it is asserted. Rendered on /docs/schema and next to every
// value on a record page.
//
// `basis` keeps declared and observed facts apart, following
// scholarly-corpus-builder's "Journal Instructions vs Observed Corpus"
// rule: what a publisher *says* about itself (declared) is never presented
// as something POSI *measured* (observed/computed).

export type Basis = 'identifier' | 'declared' | 'registry' | 'computed' | 'curated'

export const BASIS: Record<Basis, { label: string; description: string }> = {
  identifier: { label: 'Identifier', description: 'A persistent identifier, checked against the issuing registry where possible.' },
  declared: { label: 'Declared', description: 'Stated by the publisher about itself (website, author guidelines). Not independently measured.' },
  registry: { label: 'Registry', description: 'Taken as-is from an open scholarly registry (Crossref, OpenAlex, DOAJ, ISSN Portal).' },
  computed: { label: 'Computed', description: 'Calculated by posi-engine from registry data under a versioned, published specification.' },
  curated: { label: 'Curated', description: 'Assigned by a POSI collection rule (e.g. admission gate, benchmark selection).' },
}

export interface FieldDef {
  key: string
  label: string
  type: string
  basis: Basis
  source: string
  description: string
}

export const JOURNAL_FIELDS: FieldDef[] = [
  { key: 'posi_id', label: 'POSI ID', type: 'string · POSI-J-######', basis: 'identifier', source: 'posi-data registry/', description: 'Permanent POSI identifier. Never reused, never reassigned.' },
  { key: 'journal_code', label: 'Record key', type: 'string', basis: 'curated', source: 'posi-data corpus/', description: 'URL-safe key used in record paths (/journal/<code>/).' },
  { key: 'title', label: 'Title', type: 'string', basis: 'registry', source: 'ISSN Portal / Crossref', description: 'Journal title as registered with the ISSN Portal.' },
  { key: 'alternate_titles', label: 'Also known as', type: 'array · string | { title, type, lang?, until? }', basis: 'curated', source: 'posi-data corpus/', description: 'Other titles the journal is known by: former titles, translations, abbreviations, and variants such as a Crossref/OpenAlex title that lags a rename. Searchable; never the display title.' },
  { key: 'issn_online', label: 'eISSN', type: 'string · ####-####', basis: 'identifier', source: 'ISSN Portal / Crossref', description: 'Electronic ISSN. Null when none is registered - never guessed.' },
  { key: 'issn_print', label: 'pISSN', type: 'string · ####-####', basis: 'identifier', source: 'ISSN Portal / Crossref', description: 'Print ISSN. Null when none is registered.' },
  { key: 'openalex_source_id', label: 'OpenAlex source', type: 'string · S#########', basis: 'identifier', source: 'OpenAlex', description: 'OpenAlex source record the ISSN resolves to.' },
  { key: 'publisher', label: 'Publisher', type: 'string', basis: 'registry', source: 'Crossref / OpenAlex', description: 'Publisher name as registered.' },
  { key: 'registration_country', label: 'ISSN country', type: 'string', basis: 'registry', source: 'ISSN Portal', description: 'Country of ISSN registration - not necessarily where the journal operates.' },
  { key: 'country', label: 'Declared country', type: 'string', basis: 'declared', source: 'Publisher', description: 'Country the publisher states it operates from.' },
  { key: 'language', label: 'Language', type: 'string', basis: 'declared', source: 'Publisher / DOAJ', description: 'Primary publication language.' },
  { key: 'frequency', label: 'Frequency', type: 'string', basis: 'declared', source: 'Publisher', description: 'Declared publication frequency. Observed cadence may differ.' },
  { key: 'open_access', label: 'Open access', type: 'boolean | null', basis: 'registry', source: 'DOAJ / OpenAlex', description: 'Whether the journal is recorded as fully open access. null when it is not known, for example a journal DOAJ does not list and no other source describes.' },
  { key: 'license', label: 'License', type: 'string', basis: 'declared', source: 'Publisher / DOAJ', description: 'Default article license.' },
  { key: 'peer_review_type', label: 'Peer review', type: 'string', basis: 'declared', source: 'Publisher', description: 'Declared peer-review model. POSI does not observe review directly.' },
  { key: 'doaj_status', label: 'DOAJ status', type: 'enum', basis: 'registry', source: 'DOAJ', description: 'listed · application_submitted · not_listed · null (not checked).' },
  { key: 'website_url', label: 'Website', type: 'url', basis: 'declared', source: 'Publisher', description: 'Journal home page.' },
  { key: 'apc', label: 'Article processing charge', type: 'object · { amount, currency, note, source_url, checked_at }', basis: 'declared', source: 'Journal website', description: 'The APC the journal states on its own website, with the page it is stated on and the date POSI checked it. An amount of 0 means the journal states it charges no APC. Absent when POSI could not find a stated APC.' },
  { key: 'article_count', label: 'Articles', type: 'integer', basis: 'registry', source: 'Crossref', description: 'DOIs registered under the journal ISSN at the data cutoff.' },
  { key: 'psc_category', label: 'PSC subject', type: 'string · P#.##', basis: 'computed', source: 'OpenAlex topics → PSC crosswalk', description: 'POSI Subject Classification category derived from the journal’s OpenAlex topic distribution.' },
  { key: 'psc_confidence', label: 'PSC confidence', type: 'enum', basis: 'computed', source: 'posi-engine', description: 'high · low. Low means no single topic dominated - common for multidisciplinary journals.' },
  { key: 'pqf', label: 'PQF assessment', type: 'object', basis: 'computed', source: 'posi-engine (PQF v1.0)', description: 'Editorial-selection evidence score, six sub-factors. Admission gate for the Core Collection only.' },
  { key: 'early_stage_rating', label: 'AJR-E rating', type: 'object', basis: 'computed', source: 'posi-engine (AJR-E)', description: 'Lifecycle stage and, for a journal 12-59 months old where rateable, its AJR-E score and rating. Core Collection journals only. Null fields are never filled with estimates.' },
  { key: 'mature_rating', label: 'AJR-M rating', type: 'object', basis: 'computed', source: 'posi-engine (AJR-M, rate-mature.mjs)', description: 'For a journal 60 months or more old: its AJR-M rating status, score and rating where rateable, model version and rating date. Core Collection journals only; published from AJR-M-1.2.' },
  { key: 'collection', label: 'Collection', type: 'enum', basis: 'curated', source: 'posi-data', description: 'core · curated · benchmark · discovered. Only core is certified; curated is a POSI curated record outside the Core Collection.' },
  { key: 'verification', label: 'Verification', type: 'enum', basis: 'curated', source: 'Derived (see Provenance)', description: 'VERIFIED · PARTIALLY_VERIFIED · NEEDS_CHECK · REJECTED.' },
  { key: 'updated_at', label: 'Record updated', type: 'datetime', basis: 'curated', source: 'posi-data', description: 'Last time any field of the record changed.' },
]

export const FIELD_BY_KEY: Record<string, FieldDef> = Object.fromEntries(JOURNAL_FIELDS.map(f => [f.key, f]))

// Compact index file keys → full field names (documented on /datasets).
export const INDEX_KEYS: { key: string; field: string; note?: string }[] = [
  { key: 'id', field: 'posi_id' },
  { key: 'c', field: 'journal_code' },
  { key: 't', field: 'title' },
  { key: 'i', field: 'issn_online, issn_print', note: 'array, online first, de-duplicated' },
  { key: 'p', field: 'publisher' },
  { key: 'co', field: 'registration_country ?? country', note: 'normalised to an English display name' },
  { key: 's', field: 'psc_category' },
  { key: 'k', field: 'collection' },
  { key: 'v', field: 'verification' },
  { key: 'oa', field: 'open_access' },
  { key: 'd', field: 'doaj_status' },
  { key: 'n', field: 'article_count' },
  { key: 'u', field: 'updated_at', note: 'date only' },
]
