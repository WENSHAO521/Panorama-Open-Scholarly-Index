# Panorama Open Scholarly Index (POSI)

An open-source scholarly metadata and citation visibility platform for emerging open access journals.

## About

Panorama Open Scholarly Index aggregates, normalizes, and enriches metadata from Panorama Scholarly Group journals, OJS OAI-PMH, Crossref, OpenAlex, OpenCitations, DOAJ, ROR, ORCID, and related open scholarly infrastructures.

The project aims to improve the **discoverability**, **transparency**, **metadata quality**, and **citation visibility** of emerging open access journals.

> **Important:** POSI does not provide Journal Impact Factors and does not claim to replace Web of Science, Scopus, or any commercial citation index.

## Features (v0.1)

- **Basic Search** — search across articles, journals, authors, keywords, DOI
- **Article Detail Pages** — full metadata record with citation visibility and metadata quality score
- **Journal Profiles** — journal metadata, quality scores, indexing readiness
- **DOI Lookup** — verify DOI registration, Crossref status, OpenAlex visibility
- **Metadata Quality Score (MQS)** — 0–100 score per article based on metadata completeness
- **Citation Visibility** — open citation counts via OpenAlex and Crossref

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 + TypeScript + Tailwind CSS |
| Deployment | Cloudflare Pages |
| API | Next.js Route Handlers |
| Database (Phase 1) | In-memory seed data → Cloudflare D1 |
| External APIs | OpenAlex, Crossref, OpenCitations |

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Open Data Sources

This project uses open scholarly metadata from third-party infrastructures:

- [OpenAlex](https://openalex.org) — CC0
- [Crossref](https://crossref.org) — metadata freely available
- [OpenCitations](https://opencitations.net) — CC0
- [DOAJ](https://doaj.org) — CC BY-SA
- [ROR](https://ror.org) — CC0
- [ORCID](https://orcid.org) — CC0 public records

Source identifiers and provenance are preserved where available. POSI does not claim ownership over third-party metadata.

## Data License

PSG-curated metadata: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)  
Code: [MIT License](./LICENSE)

When reusing curated metadata, please cite: *Panorama Open Scholarly Index. https://posi.panoramagroup.org*

## Project Structure

```
src/
├── app/                    # Next.js App Router pages and API routes
│   ├── api/                # Route handlers
│   ├── article/[doi]/      # Article detail page
│   ├── doi-lookup/         # DOI verification tool
│   ├── journal/[code]/     # Journal profile
│   ├── journals/           # Journal list
│   └── search/             # Search results
├── components/             # Reusable UI components
└── lib/                    # Data layer and external API clients
schema/
└── database.sql            # SQLite/D1 schema
```

## Roadmap

| Version | Milestone |
|---|---|
| v0.1 | PSG core journal search, DOI Lookup, Article Detail |
| v0.2 | OpenAlex + Crossref live queries, metadata enrichment |
| v0.3 | Metadata Quality Dashboard |
| v0.4 | Citation Visibility Reports |
| v0.5 | Journal Transparency Reports |
| v1.0 | PSG Core Scholarly Index (stable) |
| v2.0 | External OA journal submissions |
| v3.0 | Open Scholarly Index Platform |

## Disclaimer

POSI is an independent open scholarly index. It is not affiliated with or endorsed by Clarivate (Web of Science), Elsevier (Scopus), or any commercial database provider. POSI does not provide Journal Impact Factors, SCI/SSCI rankings, or any proprietary citation metric.
