# Panorama Open Scholarly Index (POSI)

Open scholarly indexing, lifecycle-based automated journal ratings, subject rankings, and citation analytics — built from versioned evidence and reproducible methodology. Live at [posi.panorama-sg.com](https://posi.panorama-sg.com).

> **Notice:** POSI is not affiliated with or endorsed by Web of Science, Scopus, or DOAJ. POSI's PCI/PCI-5/PNCI figures are not Journal Impact Factors. Automated scores and rankings must not be used for individual researcher evaluation, hiring, promotion, or funding decisions — see [Responsible Use](https://posi.panorama-sg.com/responsible-use).

---

## What POSI Does

This repo is the **display layer only** — a static-exported Next.js site that reads pre-computed data from [posi-data](https://github.com/WENSHAO521/posi-data) (the canonical data store) and [posi-engine](https://github.com/WENSHAO521/posi-engine) (the calculation engine). It does not compute scores, rankings, or classifications itself.

- **Core Collection** — journals admitted through POSI's published editorial selection criteria (PQF admission gate), fully indexed with article-level metadata and evidence.
- **Global Benchmark Collection** — a large external validation corpus (curated seed + a 2026-08 bulk publisher-catalog expansion), used to check POSI's methodology against real-world data at scale — never a POSI admission candidate.
- **AJR (POSI Automated Rating)** — lifecycle-staged, evidence-based journal ratings: **AJR-E** (Early-Stage, 12–59 months) and **AJR-M** (Mature, 60+ months), each ranked within same-subject PSC peer cohorts as E-Q1–E-Q4 / M-Q1–M-Q4. AJR-M's methodology is implemented but has not yet been run against real evidence/citation data for any journal — pages say so explicitly rather than substituting the Early-Stage rubric.
- **Citation Q** — an independent, PCI-based citation-impact quartile track, separate from AJR-E/AJR-M. Not yet computed for any journal (no PJR release has been produced — PCI requires one). Global Benchmark journals instead show a **citation preview**: OpenAlex's 2-year mean citedness, explicitly diagnostic-only, never a rank, percentile, or quartile.
- **PSC (POSI Subject Classification)** — an OpenAlex-topic-derived subject taxonomy used to form fair, same-field peer cohorts for every ranking track.
- **PQF (POSI Quality Framework)** — the evidence-based admission gate for the Core Collection (Journal Transparency, Metadata Quality, Editorial Governance, Technical Discoverability, Citation Visibility, Research Integrity).
- **Permanent identity** — every journal POSI has resolved carries a stable `POSI-J-######` id (see posi-data's `registry/`), verifiable at `/verify`.

100% automated, rules-driven scoring — no reviewer, editor, publisher, sponsor, or POSI administrator has a code path to directly set a score, rank, percentile, or quartile. Only evidence can be corrected.

---

## Platform Coverage (2026-08)

| Scope | Count |
|---|---|
| Core Collection (admitted, fully indexed) | 31 |
| Global Benchmark Collection (external validation corpus) | 4,289 |
| Discovered journal records (found via DOAJ/Crossref/OpenAlex, not yet reviewed) | 23,796 |
| Permanent `POSI-J-######` identities minted | 26,000+ |

Discovered Journal Records are found, not indexed — POSI has a record of them, that is not the same as POSI reviewing or admitting them. See [Open Data](https://posi.panorama-sg.com/open-data) for exact current counts; the numbers above are a snapshot, not live.

---

## Status: Formally Launched, Data Coverage Expanding

POSI is live and formally launched, not a beta or trial that could be discontinued. What's still in progress is *coverage*, not the platform: some lifecycle ratings, citation metrics, and subject rankings remain under methodological validation and aren't yet available for every journal — pages that aren't finalized say so explicitly (e.g. "Preview" or "Not Yet Available") rather than showing a placeholder as if it were final. Every public-facing badge reflects this too: pages show a **data snapshot date**, not a `RELEASE` label — no `POSI-R-*` platform release has been produced yet (see posi-data's `POSI-R-1.0-SPEC.md`), and none is claimed until one actually is. See [About](https://posi.panorama-sg.com/about) and [Terms](https://posi.panorama-sg.com/terms).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router, RSC) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Icons | `@phosphor-icons/react` |
| Rendering | **Static export** (`output: "export"`) — every page is pre-rendered to `out/` at build time, no server runtime |
| Data | Two tiers — see below |
| Deployment | Cloudflare Pages (see `wrangler.toml`) |

This repo has **no database and no live server-side computation**. Every score, rank, and classification a visitor sees was computed in posi-engine against posi-data. Data reaches this site in two tiers, chosen per collection size:

- **Small, statically bundled** — `src/lib/core-collection.json` and `src/lib/global-benchmark.json` (the curated Global Benchmark seed only), synced deliberately via `scripts/sync-corpus.mjs`. Baked into the build; a visitor never fetches these separately.
- **Large, fetched live at runtime** — the ~3,300-record Global Benchmark publisher-catalog expansion is fetched client-side directly from [`data.posi.panorama-sg.com`](https://github.com/WENSHAO521/posi-data-delivery) (`src/lib/publisher-catalog-client.ts`), a dedicated public data layer. It is **not vendored into this repo or this deployment in any form** — an earlier version copied it into `public/data/` as a same-origin static asset, which still meant multi-MB JSON shipped with every Cloudflare Pages deploy; moving it to its own origin removes that entirely. See [Related Repositories](#related-repositories).

---

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). No environment variables are required — the small collections are vendored in `src/lib/`, and the publisher-catalog fetch reads live from `data.posi.panorama-sg.com` even in local dev.

To pull the latest data-layer snapshot into `src/lib/`:

```bash
node scripts/sync-corpus.mjs
```

Reads `data.posi.panorama-sg.com/current.json`, follows its manifest pointer, and syncs the two small collections from whatever snapshot is currently published — deliberately not automatic on every build, so this repo's git history only grows when a sync is actually intended. Review the diff, then commit.

To build the static site:

```bash
npm run build   # outputs to out/
```

---

## Related Repositories

- [posi-data](https://github.com/WENSHAO521/posi-data) — canonical, versioned journal/classification/citation-metric data. The source of truth for everything POSI publishes.
- [posi-engine](https://github.com/WENSHAO521/posi-engine) — the PSC classifier, PCI/PCI-5/PNCI calculators, and AJR-E/AJR-M/lifecycle/ranking engine that reads posi-data and produces the numbers this repo displays.
- [posi-data-delivery](https://github.com/WENSHAO521/posi-data-delivery) — the public, versioned, read-only data layer this repo actually reads from at build time (`scripts/sync-corpus.mjs`) and at runtime (`src/lib/publisher-catalog-client.ts`), served over HTTPS at `data.posi.panorama-sg.com`. A generated public mirror of posi-data's `corpus/`, not itself a source of truth — see that repo's README for the current.json → manifest → collection fetch pattern and its immutable-snapshot discipline.

---

## Data Sources

All metadata uses openly licensed sources. Source attribution is preserved in every record.

| Source | License | Used For |
|---|---|---|
| [Crossref](https://crossref.org) | Freely available | Article metadata, DOI records, article counts |
| [OpenAlex](https://openalex.org) | CC0 | Citation counts, subject/topic data, source matching |
| [OpenCitations](https://opencitations.net) | CC0 | Open citation records |
| [DOAJ](https://doaj.org) | CC BY-SA | OA journal status, APC data |
| [ROR](https://ror.org) | CC0 | Institution identifiers |
| [ORCID](https://orcid.org) | CC0 public records | Author identifiers |
| [ISSN Portal](https://portal.issn.org) | — | ISSN registration country |

POSI does not claim ownership over third-party metadata.

---

## Data License

| Content | License |
|---|---|
| POSI-curated journal metadata, PQF/AJR scores, PSC classifications | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |
| Source code (this repo) | [MIT License](./LICENSE) |
| Third-party metadata | Original source licenses (see above) |

Attribution for curated data: *Panorama Open Scholarly Index, Panorama Scholarly Group. https://posi.panorama-sg.com*

---

## Conflict of Interest Disclosure

Panorama Scholarly Group both operates POSI and publishes journals indexed in it. Those journals are assessed using the same public criteria as every other journal. Independent third-party verification is encouraged. Full disclosure at [posi.panorama-sg.com/coi](https://posi.panorama-sg.com/coi).

---

## Disclaimer

POSI is an independent open scholarly index. It is not affiliated with or endorsed by Clarivate (Web of Science), Elsevier (Scopus), DOAJ, or any commercial database provider. POSI does not provide Journal Impact Factors, SCI/SSCI rankings, or any proprietary citation metric.
