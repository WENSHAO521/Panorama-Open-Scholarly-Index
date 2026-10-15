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

## Regression review (2026-10-15, C1 P0 item 2)

Run against the published collection of snapshot 2026-10-11-3 (`check-discovered-parity.mjs`). The count is now
289 rather than 195 because the site's daily jobs have kept writing since 10-11. Broken down by cause:

| Field | Count | Cause | Action |
|---|---|---|---|
| `crossref_checked_at` 190, `auto_pqf` 8 | 198 | Written by the site's daily jobs after the snapshot; not a data-layer loss | None. Disappears once the daily job runs in posi-engine |
| `issn_print` | 109 | Site stored the same ISSN as print and online (e.g. Molecules, online only); the data layer is correct | None. Data layer wins |
| `issn_print` | 73 | Site has a print ISSN the data layer lacks, and online ISSN equal. Often the site had print and online swapped (e.g. The Astrophysical Journal: print 1538-4357 is the online ISSN) | Decide per journal; fill `issn_print` in posi-data from the ISSN Portal |
| `issn_online` | 4 | Data layer holds an ISSN-L of a predecessor title as online ISSN: Experimental Biology and Medicine (0071-3384), Archives of Gynecology and Obstetrics (0003-9128), J Cancer Res Clin Oncol (0084-5353), Journal of Chest Surgery (0301-2859; its `website_url` is also empty) | Fix in posi-data; add to the ISSN review queue |
| `country` | 85 | Corrections made here (Wiley 35, Hindawi 44, OUP 3, other 3) were never carried upstream, as step 2 warned | Port the 85 values to posi-data |
| `country` = `VRA` | 4 | Not a country. Site-side bad value (iMetaOmics, CleanMat, Regenerative medicine and dentistry, and one more Scilight title) | Replace with the publisher's country in both stores |
| `open_access` | 5 | Four Chinese-language journals and one Indonesian law journal, `true` here, empty upstream | Confirm against DOAJ, then fill upstream |

Nothing here requires a decision from the owner beyond item 1 of the cycle plan. The country and ISSN fixes are
data-path changes and go in a separate PR on posi-data, not here.
