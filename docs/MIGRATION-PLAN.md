# Plan: make this repository front end only

Goal: every data record lives in `posi-data`, every job that changes records
runs in `posi-engine`, and this repository only displays. Status of each step
is at the end. Measured on 2026-10-11 by comparing
`src/lib/discovered-journals.json` with `posi-data/journals/discovered/*.jsonl`
(matched by ISSN):

| | Records |
|---|---|
| This repo (`discovered-journals.json`) | 25,676 |
| posi-data (`journals/discovered`) | 27,247 |
| In both | 24,917 |
| Only in posi-data | 2,330 |
| Only in this repo | 824 |
| In both, publisher differs | 1,502 |

The two stores already disagree. Moving the daily job without reconciling
first would make one of them silently win, so reconciliation comes first.

## Steps, each reversible

1. **Unique ids (done).** 32 records shared 4 ids; fixed, with a test.
2. **Reconcile (read-only report first).** In posi-data, write a script that
   produces three lists: only upstream, only here, and field-level
   differences (publisher, country, open access, ISSN roles). A person or
   Claude decides per list which side is right. The Wiley corrections made
   here (#83-#85) must be carried upstream or they will be lost.
3. **Publish from posi-data.** posi-data-delivery gets a `discovered`
   collection in the snapshot. Nothing consumes it yet.
4. **Read it at build time.** `scripts/sync-live-data.mjs` downloads the
   collection the way it downloads the global corpus. It falls back to the
   committed file when the download fails, and the build fails if the two
   differ by more than a set threshold, so a bad upstream file cannot ship.
   Run both paths side by side for a week and compare the generated
   `public/data` output.
5. **Move the jobs to posi-engine.** `daily-sync`, `doaj-sync` and
   `citation-stats` become engine workflows that open a pull request on
   posi-data (like the monthly AJR rerate), not a direct push. Needs the
   `DOAJ_API_KEY` and `POSI_DATA_TOKEN` secrets in posi-engine.
6. **Cut over.** Delete the committed record files and the three workflows
   here. Keep `data-editions.json` and small fallbacks. Update
   `docs/UPDATING.md`.

Never reassign an id, never delete a record without a `withdrawn` entry, and
keep `journal_code` stable so public URLs and certificates keep working.

## Needs from the owner

- Write access for Claude to `posi-data` and `posi-engine` (steps 2, 3, 5).
- Secrets `DOAJ_API_KEY` and `POSI_DATA_TOKEN` in posi-engine (step 5).
- A decision, per difference list in step 2, on which side is correct.

## Status (2026-10-11, end of day)

| Step | State |
|---|---|
| 1 Unique ids | done |
| 2 Reconcile | done; posi-data #59 (repairs), #60 and #62 (234 + 5 journals minted, 55 duplicates marked superseded) merged |
| 3 Publish from posi-data | done: screening collection (posi-data #61), `collections/discovered-journals.json.gz` published in snapshot 2026-10-11, validated by posi-engine |
| 4 Read it at build time | built, **off**: `POSI_DISCOVERED_FROM_DATA_LAYER=1`. `next build` passes with the flag off. The parity gate on the published collection: all 25,676 journals covered, 195 regressions, 7,995 differences where both sides have a value |
| 5 Move the jobs to posi-engine | built and run once by hand end to end (posi-engine #53, #55; it opened posi-data #63, merged): **manual only**, no schedule. Needs the `DOAJ_API_KEY` secret for fresher DOAJ data (optional) |
| 6 Cut over | not done. Left for a decision, see below |

### What is left before the website holds no records

1. **Decide which side wins where both have a value.** 7,995 journals differ: publisher spelling (1,458,
   e.g. "MDPI AG" here, "Multidisciplinary Digital Publishing Institute" in posi-data), home page URL (6,071),
   title (549), country (287), ISSN roles (76 / 135), open access (122). With the flag on, the data layer's
   value is shown. Look at `node scripts/check-discovered-parity.mjs <collection>` before turning it on.
2. **Enable the schedule** of the posi-engine `directory-sync` workflow (uncomment the cron). Each run opens one
   pull request on posi-data (branch `directory-sync`) that a person merges.
3. **Turn the flag on** in the build (Cloudflare Pages variable, and `publish-site-data.yml`), then delete the
   committed `discovered-journals.json`, `Daily Journal Sync`, `DOAJ Journal Sync` and the scripts they use.
   The committed file is the fallback until then, and gets stale once its workflows stop.
4. `citation-stats` (weekly) still writes `citation-stats.json` here; it is derived from OpenAlex and Crossref and
   can move to posi-engine the same way.

## Regressions reviewed (2026-10-15, issue #97)

Re-run of `scripts/check-discovered-parity.mjs` on the published collection (snapshot `2026-10-11-3`) against the
committed file as of 2026-10-15: 289 regressions, not 195, because the site's daily sync kept writing after the
snapshot. The 289 fall into five groups; none needs the site to keep its own copy.

| Field | Count | Reason | Handling |
|---|---|---|---|
| `crossref_checked_at` | 190 | Site was synced on 2026-10-11 or later; the snapshot predates it | Gone with the next snapshot; no action |
| `auto_pqf` | 8 | Same timing: site scored these on 2026-10-13 | Gone with the next snapshot; no action |
| `issn_print` | 186 | 109: the data layer holds the same ISSN as `issn_online` (role swap, e.g. Molecules 1420-3049, which is the print ISSN). 4: the ISSN sits in another field. 73: absent from the data layer record | Fix in posi-data as part of the ISSN-roles decision (#96). Not a site problem; ISSN values are never dropped, only mis-roled |
| `country` | 85 | 81 are "United States" / "United Kingdom" with no ISO code in the data layer; 4 are the invalid value "VRA" | Map the 81 to `US` / `GB` in posi-data; the 4 "VRA" need a person to look at the journal |
| `open_access` (5), `website_url` (1) | 6 | Data layer left null / empty | Fill from the site value in posi-data (`j-disc-issn-2460-1543`, `ddjylc`, `xwkyjdt`, `qzxb`, `nthxgkcyxb`; `j-disc-issn-2765-1606`) |

Next step is a posi-data PR for the last three rows; the parity gate's `--max-regressions` can then be set to 0
before the flag is turned on (#99).
