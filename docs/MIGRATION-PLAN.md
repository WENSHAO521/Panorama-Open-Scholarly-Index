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

## Status (2026-10-11)

| Step | State |
|---|---|
| 1 Unique ids | done |
| 2 Reconcile | done (posi-data audit); 31 contaminated records repaired and 7,439 publishers filled (posi-data #59, merged) |
| 2b Missing journals | 234 minted, 105 held for review (posi-data #60, open) |
| 3 Publish from posi-data | built, not merged: `schema/screening.schema.json`, `screening/discovered-screening.jsonl` (25,144 of 25,676 site records paired), `collections/discovered-journals.json.gz` in the snapshot, validator support in posi-engine |
| 4 Read it at build time | **not ready.** `npm run` equivalent: `node scripts/check-discovered-parity.mjs <collection>`. Today: 12,905 identical, 3,690 cosmetic, 8,549 substantive differences, 532 site journals without a counterpart. The site must not switch until substantive differences are reviewed |
| 5 Move the jobs to posi-engine | not started; needs `DOAJ_API_KEY` and `POSI_DATA_TOKEN` in posi-engine |
| 6 Cut over | after 4 and 5 |

### What blocks step 4

- 532 site journals have no POSI counterpart: 441 are two site records for one journal that posi-data
  holds once (predecessor and successor titles); 56 match two POSI ids (a journal ingested twice, not
  marked superseded); 35 have none (the 34 held in #60 and one more).
- Substantive differences (data layer vs site): website_url 6,014 (different home page, not only
  http/slash), publisher 1,626, title 564, country 290, ISSN roles 713 / 124, open access 126.
  The data layer's values come from Crossref/OpenAlex and are not always better; each category needs a
  decision on which side wins before the site reads the collection.
