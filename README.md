# Panorama Open Scholarly Index (POSI) — website

POSI is a citation index, journal evaluation system and journal directory
published by Panorama Scholarly Group Ltd. This repository is the source of
the public website, <https://posi.panorama-sg.com>: a Next.js static export
that reads published data and displays it. It computes no scores or ranks of
its own.

## What the site covers

| Area | Description |
|---|---|
| Journals | Every scholarly journal registered with Crossref or described by OpenAlex (about 158,000), by PSC subject category, each with a profile page |
| Core Collection | Journals certified after editorial evaluation (PQF) |
| Journal evaluation | PQF eligibility, AJR lifecycle rating, PCI / PNCI / PCS citation indicators |
| Citation Rankings | Journals ranked by PNCI within PSC categories: rank, percentile, Citation Quartile (C-Q1 to C-Q4), POSI Zone |
| Publications | Publication search over OpenAlex with citation export |
| Certificates | Verifiable certificates of indexing, Core Collection certificates, zone certificates |
| Data | Downloadable directory, rankings and records (CC BY 4.0) |

## POSI Journal Evaluation Architecture 1.0

Five layers, each answering one question, never mixed
([POSI-EVAL-1.0-SPEC.md](https://github.com/WENSHAO521/posi-data/blob/master/POSI-EVAL-1.0-SPEC.md)):

| Layer | Question | Published as |
|---|---|---|
| **PQF** | Can the journal enter or remain in the Core Collection? | Score 0–100 + Eligible / Review Required / Insufficient Evidence / Not Eligible |
| **AJR** | How strong is its lifecycle and publishing development? | Observation, AJR-E (12–59 months) or AJR-M (60+ months): AJR Score + AJR Rating A+ … D. Core Collection journals only |
| **PCI / PNCI / PCS** | What does citation evidence show? | Citation indicators |
| **Citation Ranking** | Where does it rank within its PSC category? | Rank, percentile and Citation Quartile C-Q1 … C-Q4, from **PNCI** only |
| **POSI Zones** | POSI's selective grouping | Zone 1 (top 5%) … Zone 4, from the same percentile |

PQF is not a ranking, AJR is not a quartile, and PCS decides no rank. The
methodology, with every formula and threshold, is at
[/methodology/](https://posi.panorama-sg.com/methodology/).

## How the site gets its data

```
posi-engine ──release──▶ posi-data ──snapshot──▶ posi-data-delivery ──HTTPS──▶ this site (build time)
 (computes)              (canonical data)        (data.posi.panorama-sg.com)
```

- `scripts/sync-live-data.mjs` (runs as `prebuild`) downloads the Citation
  Ranking edition, the PCS values and the global journal corpus, and builds
  the journal profile shards (`public/data/j/`) and the title search index
  (`public/data/jt/`). It never fails the build: without network access it
  falls back to the committed `src/lib/citation-ranking.json` and
  `src/lib/pcs-q.json`.
- `scripts/sync-corpus.mjs` refreshes the small committed collections (Core
  Collection, curated Global Benchmark, PCS, PCI). PCI is reported for Core
  Collection journals only. The `data-sync` workflow
  runs it every 20 minutes and commits changes, which rebuilds the site.

## Code map

| Path | Role |
|---|---|
| `src/lib/evaluation/` | The single evaluation rule module: `getAJRRating`, `getPQFStatus`, `calculateMidRank`, `calculatePercentile`, `calculateCitationQuartile`, `calculatePOSIZone`, `getCitationRankingStatus`, display formats, the journal evaluation assembler and build-time invariant checks |
| `src/lib/rankings.ts` | Loads and validates the Citation Ranking edition; an inconsistent edition fails the build |
| `src/components/Evaluation.tsx` | Evaluation panel (Core Collection → PQF → AJR → Citation Performance) and C-Q / Zone badges |
| `src/components/RankingTable.tsx` | Ranking table with PSC, quartile, zone, AJR, lifecycle and status filters |
| `src/app/` | Pages and static data routes (`/data/journal/`, `/data/journals/`, …) |

Pages display results; they never hard-code a threshold or recompute a rank.

## Development

Requirements: Node.js 22 and npm.

```bash
npm ci
npm run dev        # local server
npm run lint
npm run typecheck
npm test           # evaluation rules and invariants (node --test)
npm run build      # static export to out/
```

This project uses a recent Next.js release; read the guides in
`node_modules/next/dist/docs/` before changing framework code (see
`AGENTS.md`).

## Data API

| Path | Contents |
|---|---|
| `/data/journal/<code>.json` | Full record, status and `evaluation` (pqf, ajr, citations, ranking) |
| `https://data.posi.panorama-sg.com/downloads/rankings/citation-<year>.json` / `.csv` | Citation Ranking edition: versions, snapshot date, thresholds, file list; the CSV has the ranked journals |
| `…/downloads/rankings/citation-<year>-all.csv` | Every journal of the edition, all statuses |
| `…/downloads/rankings/citation-<year>-<category>.json` | One PSC category |

Ranking downloads are published by posi-data-delivery (`scripts/build-downloads.mjs`), not built into this site; the old `/data/rankings/` paths redirect there.

## Related repositories

- [posi-engine](https://github.com/WENSHAO521/posi-engine): calculation engine
- [posi-data](https://github.com/WENSHAO521/posi-data): canonical data and specifications
- [posi-data-delivery](https://github.com/WENSHAO521/posi-data-delivery): public, versioned data layer

## Licensing

- Source code: MIT License (see `LICENSE`).
- POSI data: CC BY 4.0. Third-party metadata keeps its original licence.
- Bundled fonts: SIL Open Font License 1.1.

## Responsible use

POSI evaluations describe journals, not individual articles or researchers,
and should not be the sole basis for hiring, promotion or funding decisions.
Citation indicators measure citation performance, not every dimension of
scholarly quality. See [Responsible use](https://posi.panorama-sg.com/responsible-use/).

## Contact

Panorama Scholarly Group Ltd., Hong Kong SAR. <posi@panorama-sg.com>
