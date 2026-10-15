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
| `issn_print` | 73 | Site has a print ISSN the data layer lacks, and online ISSN equal. Often the site had print and online swapped (e.g. The Astrophysical Journal: print 1538-4357 is the online ISSN) | Not fixed by posi-data #66, see "Correction" below. Of these journals, 47 are fixed in posi-data #67 (merged 2026-10-15: `journals/core` and the corpus together), 1 core journal (Monthly Notices of the Royal Astronomical Society) was skipped by the check-digit filter, 23 have no Crossref pair (`issn-unresolved.csv`, need the ISSN Portal), 5 were skipped by the filter |
| `issn_online` | 4 | Data layer holds an ISSN-L of a predecessor title as online ISSN: Experimental Biology and Medicine (0071-3384), Archives of Gynecology and Obstetrics (0003-9128), J Cancer Res Clin Oncol (0084-5353), Journal of Chest Surgery (0301-2859; its `website_url` is also empty) | Experimental Biology and Medicine, Archives of Gynecology and Obstetrics and J Cancer Res Clin Oncol are `journals/core` records with a Crossref pair; fixed in posi-data #67 (merged 2026-10-15). Journal of Chest Surgery has no pair and needs the ISSN Portal |
| `country` | 85 | Corrections made here (Wiley 35, Hindawi 44, OUP 3, other 3) were never carried upstream, as step 2 warned | Done in posi-data #66: 79 filled. Two remain in `journals/core` records, which #66 does not touch because the corpus keeps its own copy |
| `country` = `VRA` | 4 | Not a country. Site-side bad value (iMetaOmics, CleanMat, Regenerative medicine and dentistry, and one more Scilight title) | Done in posi-data #66 (Wiley titles US, Scilight titles AU, by the publisher's most common country). The site's own copy keeps `VRA` until the data layer is switched on |
| `open_access` | 5 | Four Chinese-language journals and one Indonesian law journal, `true` here, empty upstream | Checked 2026-10-15, nothing to fill: none of the five is in DOAJ (ISSN search of the DOAJ API; the same search finds Molecules). OpenAlex says `is_oa` false for the four Chinese-language journals and `true` (not in DOAJ) for Padjadjaran. The site's `true` has no DOAJ support, so the data layer's empty value stands, as for other journals DOAJ does not list (posi-data #65) |

### Correction (2026-10-15, after snapshot 2026-10-15 went live)

The first version of this review, and the description of posi-data #66, said 42 ISSN pairs were set. That was wrong for
the published data. The country repairs took effect (85 to 2 country regressions). The ISSN repairs did not:

- 48 of the 54 journals with a Crossref-verified pair are `journals/core` records. `loadJournalRecords` reads
  `journals/core` first and ignores a `journals/discovered` record with the same id, so the edits #66 wrote to
  `journals/discovered/*.jsonl` for those journals are shadowed copies. Only one journal's ISSN reached the
  published collection (`issn_print` regressions 186 to 185).
- The core copy cannot simply be edited: `corpus/global-benchmark.json` carries its own `issn_print`/`issn_online`
  for these journals and is hashed in the release manifests. Fixing a core journal's ISSN means changing
  `journals/core/<shard>/<id>.json` and the corpus together, which changes a released collection.
- `scripts/repair-from-site-regressions.mjs` should skip ids that exist in `journals/core` (as
  `repair-from-site-reconcile.mjs` does) so it stops writing shadowed copies. The 41 shadowed edits in #66 do no
  harm but mislead; a follow-up on posi-data should revert them.

Resolved the same day: posi-data #67 (merged) sets the pair in `journals/core` and `corpus/global-benchmark.json`
together for 47 of the 48 journals (the 48th, Monthly Notices of the Royal Astronomical Society, has a Crossref
electronic ISSN that fails its check digit). The release manifest POSI-R-2026.1 is not edited and the data is already a
post-release snapshot, so the change ships with the next snapshot and the December release. After #67 the
`issn_print` regressions measured locally are 138 (from 185) and the records with a regression 241 (from 284).

## Proposal: the parity gate for turning the data layer on (C1 P0 item 4)

`check-discovered-parity.mjs` exits 1 on any regression, and the collection of snapshot 2026-10-15 has 284 records
with one. Measured on that snapshot:

| Records | Why | Proposed treatment |
|---|---|---|
| 190 `crossref_checked_at` (dated 2026-10-11/12), 8 `auto_pqf` (2026-10-11/13/15); 94 records have only these | The site's daily job wrote them after the newest value the data layer holds (2026-10-11 for both fields). They arrive when `directory-sync` runs and its pull request on posi-data is merged | Not counted when the site value is dated after the newest value of that field in the data layer. Verify by re-measuring after the first merged `directory-sync` pull request: this group should go to 0 |
| 109 `issn_print` | The site stored one ISSN as print and online; the data layer is right | Count as accepted disagreements, not regressions |
| 47 `issn_print`, core journals | Fixed by posi-data #67 | Gone once the next snapshot is published |
| 23 `issn_print` | No Crossref pair | Block. Fix at the ISSN Portal, or accept after a person has looked at the list |
| 6 `issn_print` | Crossref pair has a bad check digit or duplicates another record (5 discovered records, plus Monthly Notices of the Royal Astronomical Society) | Block. They belong to the ISSN review queue |
| 5 `open_access` | DOAJ lists none of them; the site's `true` is unsupported | Count as accepted disagreements: the data layer's empty value is right |
| 2 `country`, 1 `website_url` | Core records (2), empty upstream (1) | Block until fixed or explicitly accepted |

Proposed rule: `--max-regressions` stays 0, but the script first removes the first three rows from the count (and
prints them as their own categories). The gate then passes when the remaining blocking items are 0, which after #67 is
23 + 6 + 3 = 32 records. The `discovered-parity.yml` workflow keeps running it; turning the flag on waits for it.

Order: merge the next `directory-sync` pull request on posi-data, re-run the gate, fix or accept the 36, then turn the
flag on for a week of side-by-side builds.
