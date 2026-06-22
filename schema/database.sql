-- Panorama Open Scholarly Index (POSI) Database Schema
-- Compatible with: SQLite, Cloudflare D1, PostgreSQL
-- Version: 0.1

CREATE TABLE journals (
    id TEXT PRIMARY KEY,
    journal_code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    short_title TEXT,
    issn_print TEXT,
    issn_online TEXT,
    issn_l TEXT,
    publisher TEXT,
    country TEXT,
    language TEXT,
    frequency TEXT,
    open_access INTEGER DEFAULT 1,
    license TEXT,
    peer_review_type TEXT,
    website_url TEXT,
    oai_base_url TEXT,
    doaj_status TEXT CHECK(doaj_status IN ('listed','pending','not_listed')),
    openalex_source_id TEXT,
    metadata_quality_score INTEGER DEFAULT 0,
    transparency_score INTEGER DEFAULT 0,
    indexing_readiness TEXT CHECK(indexing_readiness IN ('A','B','C','D','Internal Review')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE articles (
    id TEXT PRIMARY KEY,
    doi TEXT UNIQUE,
    title TEXT NOT NULL,
    subtitle TEXT,
    journal_id TEXT REFERENCES journals(id),
    volume TEXT,
    issue TEXT,
    first_page TEXT,
    last_page TEXT,
    publication_year INTEGER,
    publication_date TEXT,
    article_type TEXT,
    language TEXT DEFAULT 'English',
    abstract TEXT,
    keywords TEXT,                          -- JSON array stored as text
    license TEXT,
    pdf_url TEXT,
    html_url TEXT,
    openalex_work_id TEXT,
    crossref_status TEXT CHECK(crossref_status IN ('verified','registered','pending','not_found','conflict','broken')),
    cited_by_count INTEGER DEFAULT 0,
    reference_count INTEGER DEFAULT 0,
    is_retracted INTEGER DEFAULT 0,
    metadata_quality_score INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE authors (
    id TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    given_name TEXT,
    family_name TEXT,
    orcid TEXT UNIQUE,
    openalex_author_id TEXT,
    email_hash TEXT,
    country TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE institutions (
    id TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    ror_id TEXT UNIQUE,
    openalex_institution_id TEXT,
    country TEXT,
    institution_type TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE article_authors (
    article_id TEXT REFERENCES articles(id),
    author_id TEXT REFERENCES authors(id),
    institution_id TEXT REFERENCES institutions(id),
    author_order INTEGER NOT NULL,
    author_position TEXT CHECK(author_position IN ('first','middle','last','corresponding')),
    is_corresponding INTEGER DEFAULT 0,
    PRIMARY KEY (article_id, author_id, author_order)
);

CREATE TABLE references_raw (
    id TEXT PRIMARY KEY,
    article_id TEXT REFERENCES articles(id),
    raw_reference TEXT NOT NULL,
    parsed_doi TEXT,
    matched_openalex_work_id TEXT,
    matched_crossref_doi TEXT,
    match_confidence INTEGER DEFAULT 0 CHECK(match_confidence BETWEEN 0 AND 100),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE citation_cache (
    doi TEXT PRIMARY KEY,
    openalex_work_id TEXT,
    cited_by_count INTEGER DEFAULT 0,
    cited_by_api_url TEXT,
    source TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE external_cache (
    cache_key TEXT PRIMARY KEY,
    source TEXT NOT NULL,
    query TEXT,
    response_json TEXT,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE metadata_audit (
    id TEXT PRIMARY KEY,
    article_id TEXT REFERENCES articles(id),
    has_doi INTEGER DEFAULT 0,
    has_abstract INTEGER DEFAULT 0,
    has_keywords INTEGER DEFAULT 0,
    has_orcid INTEGER DEFAULT 0,
    has_ror INTEGER DEFAULT 0,
    has_references INTEGER DEFAULT 0,
    has_license INTEGER DEFAULT 0,
    has_funding INTEGER DEFAULT 0,
    has_ethics_statement INTEGER DEFAULT 0,
    has_data_availability INTEGER DEFAULT 0,
    score INTEGER DEFAULT 0,
    checked_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes
CREATE INDEX idx_articles_journal_id ON articles(journal_id);
CREATE INDEX idx_articles_doi ON articles(doi);
CREATE INDEX idx_articles_year ON articles(publication_year);
CREATE INDEX idx_articles_openalex ON articles(openalex_work_id);
CREATE INDEX idx_authors_orcid ON authors(orcid);
CREATE INDEX idx_article_authors_article ON article_authors(article_id);
CREATE INDEX idx_article_authors_author ON article_authors(author_id);
CREATE INDEX idx_references_article ON references_raw(article_id);
CREATE INDEX idx_external_cache_expires ON external_cache(expires_at);
