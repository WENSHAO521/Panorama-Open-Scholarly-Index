# POSI 2.0 architecture audit (frontend repository)

Scope: this repository, read in full for the scholarly-search path. The other three repositories were only
inspected at top level (layout, workflows, `current.json`); anything about them below is marked as such.

## Verified facts

| Topic | Finding | Where |
|---|---|---|
| Hosting | Next.js static export (`output: "export"`), Cloudflare Pages | `next.config.ts`, `wrangler.toml` |
| Literature search path | Runs in the visitor's browser: OpenAlex first, then Crossref, DataCite, Zenodo | `src/lib/openalex.ts`, `src/lib/registries.ts`, `src/lib/cite-sources.ts` |
| Server proxy for search | None. No route handler or build step calls a scholarly API for a visitor's query | grep of `src/app`; only `api/certificate` (PDF) and `data/*` (static JSON) routes exist |
| Build-time external calls | `scripts/*.mjs` (data sync, DOAJ, discovery) run in CI/prebuild, never per visitor | `package.json`, `.github/workflows` |
| Private keys in client | None found. `DOAJ_API_KEY` / `GITHUB_TOKEN` are read only by Node scripts | `grep process.env` |
| Official ranks | Frontend reads published data (`data.posi.panorama-sg.com`); README states it computes no ranks | `src/lib/data-base.ts`, `README.md` |
| Existing resilience | Session cache (10 min), retry with backoff (max 2), Retry-After, 429 session block, AbortSignal, fallback chain | `openalex.ts` |
| Privacy text | Already tells users queries and IP go directly to OpenAlex/Crossref/DataCite/Zenodo/doi.org | `src/app/(docs)/privacy/page.tsx` |

## Gaps found

1. No request time limit; a hung provider held the request until the browser gave up.
2. Identical in-flight requests were not shared.
3. Errors carried only an HTTP status; no class for timeout or key-required.
4. No CSP / `connect-src` allow-list, so nothing stopped a future proxy or analytics call.
5. No ISSN checksum or conflict detection; no tests for any registry code.
6. No DOI-based merge for results from several providers.

## Changes made (minimal, nothing rewritten)

- `src/lib/scholarly-api/errors.ts`: error classes (`unreachable`, `timeout`, `rate-limited`, `key-missing`,
  `not-found`, `unavailable`, `bad-response`). `RegistryError.kind` exposes them; `busy` now includes timeouts.
- `src/lib/openalex.ts`: 12 s timeout per attempt, one shared request per URL, abort only drops the caller's wait.
- `src/lib/scholarly-api/issn.ts`: ISSN normalisation, mod-11 check, conflict detection (invalid / foreign /
  swapped print-online), ISSN index that resolves to a journal only when unambiguous. It never edits verified data.
- `src/lib/scholarly-api/dedupe.ts`: DOI normalisation and conservative merge; citation counts kept per source,
  never summed; title/year disagreement flagged.
- `public/_headers`: CSP `connect-src` allow-list, `object-src 'none'`, `base-uri 'self'`, Referrer-Policy.
- `src/lib/scholarly-api/scholarly-api.test.ts`: 8 unit tests.

`PublicationSearch.tsx` now shows distinct messages for rate-limited, timeout and unreachable failures, and
`WorkViewer.tsx` only says "not found" for a real 404. `issn.ts` and `dedupe.ts` are tested modules not yet wired
into the UI.

## Browser observation (Chromium via Playwright, `next dev`, sandbox network)

Loading `/publications/?q=graphene` produced requests to `localhost` (27), `api.openalex.org` (2) and
`api.crossref.org` (1), and no other host; no failed requests. OpenAlex did not give usable results from this
sandbox, so the page showed its "OpenAlex is busy, results from Crossref" fallback notice. This confirms
direct browser-to-provider calls and the fallback path. It does not show the sandbox's egress IP behaviour, CORS
for DataCite/Zenodo, or the production CSP (`next dev` does not apply `_headers`).

## Production-build observation (Chromium via Playwright, static `out/`, CSP applied)

`POSI_ALLOW_PARTIAL_DATA=1 npm run build` completed (exit 0; two existing data-size budget warnings). `out/` was
served by a small local server that adds the `_headers` CSP. Hosts contacted, with zero CSP violations:

| Page | External hosts |
|---|---|
| `/publications/?q=graphene` | api.openalex.org, api.crossref.org, data.posi.panorama-sg.com |
| `/work/?id=10.5281/zenodo.3233821` | api.openalex.org, doi.org, zenodo.org, data.posi.panorama-sg.com |
| `/cite/?doi=10.1038/nature12373` | api.openalex.org, doi.org, api.crossref.org |
| `/journals/` | data.posi.panorama-sg.com only (no third-party registry) |

The CSP therefore does not block any tested flow. Not exercised: ISBN lookups (Open Library, Google Books),
batch citation, certificate checks, and Cloudflare's own `_headers` handling (the local server only emulates it).
Note for anyone repeating this: a static server must send `.txt` payloads as `text/x-component`, otherwise Next
falls back to full-page navigations and the page reloads in a loop; this was a test-server error, not a site bug.

## Not done / not verified

- DataCite was not reached in any browser run (no DataCite-registered DOI was tested); the other providers were.
- **No static build** (`next build`) was run: `prebuild` downloads large live datasets.
- The CSP was not exercised in a browser. If a page uses a host missing from `connect-src` it will fail;
  the host list came from a grep of `src/`.
- **posi-data, posi-engine, posi-data-delivery** were not audited in depth: PNCI/AJR/PQF formulas, POSI-J ID
  governance, and the ISSN history in `posi-data` are unreviewed. `current.json` + dated snapshots exist in
  delivery (verified); rollback procedure is unverified.
- BYOK, IndexedDB cache, per-type TTLs, a federated query router and a separate SDK repository were not built.
  The existing session cache and fallback chain cover the need for now; none of those justify new infrastructure.

## Suggested next steps

1. Add the Playwright request-log check to CI so a new third-party host fails the build.
3. Add ISSN-conflict regression cases from the real history in `posi-data` (needs a read of its audits).
4. Audit the three data repositories and the release/rollback path.
