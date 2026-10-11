# POSI 2.0 architecture audit and maintenance guide

Audit of the four POSI repositories against the POSI 2.0 brief (static-first, browser-side scholarly search,
visitor-IP-first, multi-repository data). Dated 2026-10-11. Each statement is marked **verified** (read in code
or observed), **inferred**, or **not verified**.

## 1. Summary

The existing system already follows the brief's main principles. Literature search runs in the visitor's
browser against the registries; official data is computed in posi-engine, stored in posi-data, published
as immutable snapshots by posi-data-delivery and read by the static site. No rewrite, new repository, proxy or
database is justified. The work done here closes specific gaps: request time limits, error classes, a CSP
network allow-list, ISSN integrity checks, and tests for each.

## 2. Architecture

```
 Official data (build/CI time)                         Literature search (visitor's browser)

 posi-engine ──writes──▶ posi-data ──snapshot──▶ posi-data-delivery        api.openalex.org
 (computes PNCI, AJR,    (canonical records,     (current.json →           api.crossref.org
  PQF, ranks; validates   POSI-J ids, registry,   manifest + SHA256SUMS,   api.datacite.org
  posi-data in CI)        audits)                 data.posi.panorama-sg.com)  zenodo.org, doi.org
                                                       │                          ▲
                                                       ▼ HTTPS (build + browser)  │ fetch() from the browser,
                                              posi.panorama-sg.com (static export) ┘ visitor's own IP
```

The two paths do not meet: no search result is written to posi-data, and no page recomputes a published rank.
**Verified** for the frontend (`src/lib/openalex.ts`, `registries.ts`, `cite-sources.ts`; no route handler calls
a registry). Data flow between the data repos: **verified** from their workflows and READMEs.

| Repository | Role | Contract it publishes |
|---|---|---|
| posi-engine | Computation, validation (`scripts/validate-against-schema.mjs`), directory sync | Writes posi-data through PRs; its validator gates posi-data's CI |
| posi-data | Source of truth: journals, POSI-J ids (`registry/`, append-only), metrics, rankings, audits | `schema/*.schema.json`, `registry/journal-id-map.csv`, `superseded-ids.csv` |
| posi-data-delivery | Immutable snapshots, every 20 min when data changed | `current.json` → `snapshots/<id>/manifest.json` + `SHA256SUMS`; `site/v1/`; `ranking-<year>` releases |
| frontend | Display only; browser-side search | Reads `data.posi.panorama-sg.com`; static `/data/*` routes (CORS open) |

**Release order:** engine change → posi-data PR (validated by the engine's validator) → delivery snapshot →
site rebuild. **Rollback (verified mechanism, not exercised):** snapshots are immutable, so restoring data
means pointing `current.json` back at the previous snapshot id; ranking archives are never replaced
(`ranking-<year>-r1` …). A bad site build is rolled back in Cloudflare Pages.

## 3. Visitor-IP-first: findings

| Check | Result |
|---|---|
| Search requests sent from the browser, not a POSI server | **Verified** in code and in Chromium (§6) |
| Any POSI proxy, API route or edge function for search | **None found** |
| Private keys in client code | **None.** `DOAJ_API_KEY` and `GITHUB_TOKEN` are read by Node scripts in CI only; a unit test now fails if a key-shaped literal appears in `src/` |
| Analytics or tracking | None (no script, no cookie); privacy page already says so |
| Privacy notice on direct third-party requests | Already present and accurate (`/privacy/`) |
| CSP | **Added**: `connect-src` allow-list (§5) |
| BYOK | Not needed: none of the registries used require a key for this traffic |

## 4. Gaps found and what was done

| Gap | Change | Repo |
|---|---|---|
| No request time limit | 12 s per attempt; caller abort still wins | frontend `openalex.ts` |
| Identical requests not shared | One in-flight request per URL | frontend `openalex.ts` |
| Every failure shown alike | `RegistryError.kind`: unreachable (network or CORS, which browsers cannot tell apart), timeout, rate-limited, key-missing, not-found, unavailable, bad-response; search page has distinct messages; publication page says "not found" only on a real 404 | frontend |
| No browser network allow-list | CSP `connect-src`, `object-src 'none'`, `base-uri 'self'` (Referrer-Policy is already sent by Cloudflare) | frontend `public/_headers` |
| ISSN match took the first or last record on a shared ISSN; no normalisation | `matchIssn` now normalises and returns no match when ISSNs point to two records. Same result as before for all 1,037 Core/Benchmark ISSNs; unhyphenated ISSNs now match | frontend `use-posi-issn.ts` |
| No DOI merge rule | `dedupe.ts`: merge by normalised DOI; strict title+year otherwise; per-source citation counts, never summed; conflicts flagged. Tested, not yet used by a page (search shows one provider at a time, so there is nothing to merge yet) | frontend |
| No ISSN integrity gate on canonical data | Validator check: wrong check digit, or ISSN on two live POSI-J ids. Known findings come from a review queue; new ones fail CI | posi-engine, posi-data |

### ISSN findings in posi-data (28,518 records; not corrected, queued for review)

`posi-data/audits/data-quality/issn-integrity/open-issues.csv` lists 9 items, each with evidence and a
suggested action:

- 4 check-digit failures (the ones the initial migration already logged, never fixed);
- 4 journals minted twice (same title; two pairs also share an OpenAlex source id);
- 1 contamination: POSI-J-000143 (Frontiers in Environmental Science) carries the ISSN `2813-5067` and website
  of Frontiers in Environmental Engineering (POSI-J-000173). Its id is keyed on its own ISSN-L `2296-665X`, so the
  permanent id is right and only attributes are wrong.

### Legacy directory copy in the frontend

`src/lib/discovered-journals.json` (25,676 journals) is still written by this repo's scripts
(`discover-journals.mjs`, `auto-pqf.mjs`), so the site holds journal data and computes auto-PQF outside
posi-engine. posi-engine #53 moved these jobs to `posi-engine/scripts/directory/`, writing to posi-data with
ISSNs and Core records never overwritten. In the frontend copy: 16 ISSNs fail the check digit
(e.g. International Journal of Dermatology `1365-4362` for the real `1365-4632`) and 550 ISSNs sit on more than one
record. **Recommendation:** finish the move, then serve the directory from delivery's `site/v1/` and retire the
copy and the frontend scripts. Not done here: it changes the data path of a live page and belongs in its own PR.

## 5. Browser verification (Chromium via Playwright)

Static `out/` from `POSI_ALLOW_PARTIAL_DATA=1 npm run build` (exit 0), served locally with the `_headers` CSP.

| Page | External hosts contacted | CSP violations |
|---|---|---|
| `/publications/?q=graphene` | api.openalex.org, api.crossref.org, data.posi.panorama-sg.com | 0 |
| `/work/?id=10.5281/zenodo.3233821` | api.openalex.org, doi.org, zenodo.org, data.posi.panorama-sg.com | 0 |
| `/cite/?doi=10.1038/nature12373` | api.openalex.org, doi.org, api.crossref.org | 0 |
| `/journals/` | data.posi.panorama-sg.com only | 0 |
| `/work/?id=10.5061/dryad.2rbnzs7jp` (DataCite DOI) | api.openalex.org (429), doi.org, api.datacite.org (200) | 0 |
| `/cite/?doi=10.5061/dryad.2rbnzs7jp` | api.openalex.org (429), doi.org, api.datacite.org (200) | 0 |
| `/cite/` with ISBN 9780262033848 typed in | openlibrary.org, api.crossref.org; book found | 0 |

From the sandbox, OpenAlex answered 429 and the search page showed its Crossref fallback notice. So the
fallback works in a real browser, and journal pages do not depend on any third-party registry.

A unit test now checks that every host the browser code calls is in `connect-src`. It fails when a host is
removed, which I checked by removing one; `certificate-pdf.ts` is exempt because it runs only at build time.

Note for repeating this: a local static server must send `.txt` files as `text/x-component`, otherwise Next
falls back to full-page navigations and pages reload in a loop. That was a fault of the test server, not of the site.

## 6. Not verified / known limits

- Google Books (the ISBN fallback), batch citation and certificate checks were not exercised.
- Cloudflare's own handling of `_headers` was not tested: branch previews are behind Cloudflare Access, so their
  headers cannot be read without logging in. Production (checked 2026-10-11) sends no CSP today, so this one will
  not stack with another; it already sends `Referrer-Policy: strict-origin-when-cross-origin`, so `_headers` does
  not repeat it. After merge, check `curl -sI https://posi.panorama-sg.com/ | grep -i content-security`.
- PNCI / AJR / PQF formulas were not reviewed or changed (out of scope by design).
- Not built, by decision: IndexedDB cache, per-type TTLs, BYOK, a query router across providers, a separate SDK
  repository. The session cache and fallback chain cover current needs.

## 7. Maintaining the boundary

- Add a third-party host only after reading its terms and checking CORS. Add it to `connect-src` in
  `public/_headers`; the unit test will fail until you do.
- Never route a visitor's search through a POSI server or a Worker. If a registry refuses browser requests,
  show the `unreachable` message and link to the registry.
- ISSN or identity corrections go to posi-data with evidence. Close a row in `open-issues.csv` by fixing the
  record or superseding the duplicate id. A new ISSN finding fails posi-data's CI until it is fixed or queued.
- Tests: frontend `npm test`; posi-engine `npm test`, and `node scripts/validate-against-schema.mjs <posi-data>`.
