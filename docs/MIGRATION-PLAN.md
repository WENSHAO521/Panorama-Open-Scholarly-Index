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

## Status (2026-10-11, evening)

| Step | State |
|---|---|
| 1 Unique ids | done |
| 2 Reconcile | done; posi-data #59 (repairs) merged |
| 2b Missing journals | posi-data #60 merged: 234 minted; 5 more minted and 55 duplicates marked superseded in #62 |
| 3 Publish from posi-data | posi-data #61 merged: screening collection and `collections/discovered-journals.json.gz` in the snapshot; posi-engine #52 validates it. #62 completes the coverage |
| 4 Read it at build time | built, **off by default**: `POSI_DISCOVERED_FROM_DATA_LAYER=1` makes `sync-live-data.mjs` use the collection (refused if it covers under 99% of the committed journals, repeats an id or lacks a title; any failure keeps the committed file); `append-alias-redirects.mjs` redirects the codes of journals that had two. The weekly `discovered-parity` workflow reports the comparison |
| 5 Move the jobs to posi-engine | not started: needs `DOAJ_API_KEY` and `POSI_DATA_TOKEN` in posi-engine, and can only be proven by a real run |
| 6 Cut over | after 5; turn the flag on, then stop committing the file |

Parity with #62: every one of the 25,676 site journals is covered (470 codes are redirected to a journal
that had two), 13,231 records identical, 3,783 cosmetic, 7,995 where both sides have a value and differ (the
data layer wins), 195 where the data layer is empty and the site is not (166 are ISSN roles on
`journals/core` records, which are left to a change that also updates `corpus/`).
