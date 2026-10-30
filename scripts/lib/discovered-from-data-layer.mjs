// Turns a record of the data layer's discovered-journals collection (posi-data, compose-discovered.mjs)
// into the shape the site's Journal records have always had (the former src/lib/discovered-journals.json), so pages are unchanged.
// The data layer holds the country as an ISO code; the site shows names.
import { isoToCountry } from './country-codes.mjs'

export function toSiteRecord(d) {
  return {
    id: `j-disc-${d.journal_code}`,
    journal_code: d.journal_code,
    title: d.title,
    short_title: d.short_title ?? d.title,
    issn_print: d.issn_print,
    issn_online: d.issn_online,
    publisher: d.publisher ?? '',
    country: d.country ? isoToCountry(d.country) : '',
    language: d.language ?? 'English',
    frequency: d.frequency ?? '',
    open_access: d.open_access,
    license: d.license,
    peer_review_type: d.peer_review_type,
    website_url: d.website_url ?? '',
    oai_base_url: d.oai_base_url,
    registration_country: d.registration_country,
    doaj_status: d.doaj_status,
    openalex_source_id: d.openalex_source_id ? String(d.openalex_source_id).replace(/^https?:\/\/openalex\.org\//, '') : null,
    metadata_quality_score: d.metadata_quality_score,
    transparency_score: d.transparency_score,
    indexing_readiness: d.indexing_readiness,
    pqf: d.pqf,
    article_count: d.article_count,
    auto_pqf: d.auto_pqf,
    created_at: d.created_at,
    updated_at: d.updated_at,
    subjects: d.subjects,
    crossref_checked_at: d.crossref_checked_at,
  }
}
