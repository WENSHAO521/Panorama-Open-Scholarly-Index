# Panorama Open Scholarly Index (POSI)

Open scholarly metadata platform for journal transparency, metadata quality, and citation visibility. Live at [posi.panorama-sg.com](https://posi.panorama-sg.com).

> **Notice:** POSI is not a replacement for Web of Science, Scopus, or DOAJ. PQF scores indicate metadata completeness and transparency readiness only — they must not be used for researcher evaluation, hiring, promotion, or funding decisions.

---

## What POSI Does

POSI aggregates and enriches scholarly metadata from open infrastructure sources (Crossref, OpenAlex, OAI-PMH, DOAJ, ROR, ORCID) and publishes it through a public web platform and planned API.

Key functions:

- **Journal indexing** — profiles for PSG journals and third-party open access journals
- **Article metadata** — DOI-linked article records with metadata quality scoring
- **PQF assessment** — POSI Quality Factor: composite 0–100 indicator across six dimensions
- **Evidence registry** — per-journal, criterion-level evidence records
- **DOI lookup** — verify DOI registration, Crossref/OpenAlex status, citation visibility
- **Full-text search** — search articles and journals via Crossref with server-side proxy

---

## Platform Coverage

| Scope | Count |
|---|---|
| PSG journals | 12 |
| Indexed third-party journals | 18 |
| Total journals | 30 |
| Articles (live from Crossref) | auto-updated hourly |

Stats on the homepage are fetched live from Crossref every hour via ISR (`revalidate = 3600`).

---

## PQF — POSI Quality Factor

PQF is a composite, evidence-based journal quality indicator with six weighted subfactors:

| Subfactor | Weight | Assesses |
|---|---|---|
| JTF — Journal Transparency | 25 pts | Governance, APC policy, ethics, corrections |
| MQF — Metadata Quality | 25 pts | DOI, ORCID, abstracts, references, license URI |
| EGF — Editorial Governance | 20 pts | Board diversity, reviewer guidelines, COI policy |
| TDF — Technical Discoverability | 15 pts | OAI-PMH, sitemap, Schema.org, DOI resolution |
| CVF — Citation Visibility | 10 pts | OpenAlex, Crossref cited-by, OpenCitations |
| RIF — Research Integrity | 5 pts | Retraction/plagiarism/data-sharing policies |

Grades: A+ (≥90) · A (80–89) · B+ (70–79) · B (60–69) · C (50–59) · D (40–49) · E (<40)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, RSC, ISR) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 (`@tailwindcss/postcss`) |
| Icons | `@phosphor-icons/react` |
| Data | Static seed in `src/lib/data.ts` + live API fetch at render |
| External APIs | Crossref, OpenAlex, DOAJ, ISSN Portal, OAI-PMH |
| Search proxy | `/api/search` route handler (avoids browser CORS/UA issues) |
| Deployment | Vercel (ISR) |

---

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

No environment variables are required — all data comes from public APIs and the static seed file.

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── search/route.ts     # Crossref search proxy (server-side)
│   │   └── page.tsx            # API & Export documentation
│   ├── article/[doi]/          # Article detail page
│   ├── articles/               # Article database browser
│   ├── doi-lookup/             # DOI verification tool
│   ├── evidence/               # Evidence registry
│   ├── journal/[code]/         # Journal profile page
│   ├── journals/               # Journal list (tabs: PSG / Indexed / Crossref)
│   ├── pqf/                    # PQF methodology + scores table
│   ├── search/                 # Full-text search
│   └── page.tsx                # Homepage (live stats via ISR)
├── components/
│   ├── ArticleCard.tsx
│   ├── ArticleCountBadge.tsx   # Live Crossref article count
│   ├── Badge.tsx
│   ├── Footer.tsx
│   ├── JournalArticles.tsx
│   ├── JournalBrowser.tsx      # Crossref journal browser
│   ├── JournalTabs.tsx         # PSG / Indexed / All tabs
│   ├── MetadataQualityBar.tsx
│   ├── Navbar.tsx
│   ├── OjqfCard.tsx            # PQF score card
│   └── SearchBar.tsx
└── lib/
    ├── api.ts                  # Crossref, OpenAlex, DOAJ, ISSN Portal, OAI-PMH clients
    ├── data.ts                 # Static journal seed data + getStats()
    └── types.ts                # Shared TypeScript types
```

---

## Data Sources

All metadata uses openly licensed sources. Source attribution is preserved in every record.

| Source | License | Used For |
|---|---|---|
| [Crossref](https://crossref.org) | Freely available | Article metadata, DOI records, article counts |
| [OpenAlex](https://openalex.org) | CC0 | Citation counts, source matching |
| [OpenCitations](https://opencitations.net) | CC0 | Open citation records |
| [DOAJ](https://doaj.org) | CC BY-SA | OA journal status, APC data |
| [ROR](https://ror.org) | CC0 | Institution identifiers |
| [ORCID](https://orcid.org) | CC0 public records | Author identifiers |
| [ISSN Portal](https://portal.issn.org) | — | ISSN registration country |
| OAI-PMH | — | Article harvesting from OJS-based journals |

POSI does not claim ownership over third-party metadata. PQF scores and curated journal profiles are original POSI content.

---

## Indexed Publishers

**PSG Collection (12 journals)**
- Panorama Scholarly Group — Hong Kong, China

**Third-Party Indexed (18 journals)**
- SHIHARR Publishing Limited — Hong Kong, China (10 journals)
- China Architecture Culture Publishing House — Hong Kong, China (3 journals)
- ATRI International — Hong Kong, China (3 journals)
- Other indexed journals (2)

---

## Data License

| Content | License |
|---|---|
| PSG-curated journal metadata & PQF scores | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |
| Source code | [MIT License](./LICENSE) |
| Third-party metadata | Original source licenses (see above) |

Attribution for curated data: *Panorama Open Scholarly Index, Panorama Scholarly Group. https://posi.panorama-sg.com*

---

## Conflict of Interest Disclosure

Panorama Scholarly Group both operates POSI and publishes journals indexed in it. PQF scores for PSG journals are assessed using the same public criteria as all other journals. Independent third-party verification is encouraged. Full disclosure at [posi.panorama-sg.com/about](https://posi.panorama-sg.com/about).

---

## Disclaimer

POSI is an independent open scholarly index. It is not affiliated with or endorsed by Clarivate (Web of Science), Elsevier (Scopus), DOAJ, or any commercial database provider. POSI does not provide Journal Impact Factors, SCI/SSCI rankings, or any proprietary citation metric.
