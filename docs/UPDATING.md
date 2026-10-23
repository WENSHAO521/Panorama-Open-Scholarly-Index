# Updating POSI data

How data reaches the site, who owns each file, and the routine for every
kind of update. Start every round with `npm run status`.

## 1. The four repositories

```
posi-engine ──release──▶ posi-data ──snapshot──▶ posi-data-delivery ──HTTPS──▶ this site
 computes                 canonical data          data.posi.panorama-sg.com      displays
```

| Repository | Role | You change it when |
|---|---|---|
| `posi-engine` | Computes indicators, ratings, rankings; publishes GitHub releases | A formula, harvest or rating step is wrong |
| `posi-data` | Source of truth: records, specs, schemas, releases. Rankings and metrics are generated, never hand-edited | A Core Collection / Global Benchmark record, an identity, a spec or a taxonomy changes |
| `posi-data-delivery` | Read-only snapshots, generated from posi-data. Nothing is edited by hand | Almost never |
| this repo | The website, plus the records only it owns (section 2) | A discovered-journal record is wrong, or the site's code changes |

Rule: **fix a record where it is owned.** A fix to synced data made here is
overwritten by the next sync.

## 2. Who owns each file in `src/lib/`

The target is a front end that holds no records of its own. Today (see `docs/MIGRATION-PLAN.md` for the
steps and their state):

| File | Owner | Refreshed by | Cadence |
|---|---|---|---|
| `discovered-journals.json` (~25,700 records) | **moving to posi-data** (identity in `journals/discovered`, screening in `screening/`); until the site is switched this committed copy is what the site shows | `directory-sync` in posi-engine writes posi-data; `daily-sync` / `doaj-sync` here are manual only since 2026-10-23 (#97), so this copy no longer changes | daily; full DOAJ 1st and 16th |
| `withdrawn-journals.json` | this repo | by hand; an entry removes a journal from indexing | on demand |
| `citation-stats.json` | this repo, for now | `citation-stats` (OpenAlex, Crossref) | weekly, Monday |
| `scopus-sources.json`, `pubmed-journals.json` | this repo | `scripts/import-*` by hand | on demand |
| `core-collection.json`, `global-benchmark.json`, `pcs.json`, `pci.json`, `citation-rankings.json` | posi-data, via posi-data-delivery | `data-sync` | every 20 min; Core ratings change monthly (AJR rerate, 7th) |
| `ranking-titles.json`, `data-editions.json` | derived | `data-sync` | every 20 min |
| `citation-ranking.json`, `pcs-q.json` | fallbacks only | the build downloads the real editions | yearly (December) |
| `psc-v1.0.snapshot.json` | posi-data taxonomy | by hand when PSC changes | rare |

The build (`prebuild`: `sync-live-data.mjs`) downloads the global corpus and the ranking edition itself, and,
with `POSI_DISCOVERED_FROM_DATA_LAYER=1`, the discovered journals from the data layer. `publish-site-data`
rebuilds the site's data files and publishes them to `data.posi.panorama-sg.com/site/v1/` whenever master moves.

### Discovered journals: where a change goes

| Change | Where |
|---|---|
| A wrong publisher, country, website, open access, ISSN role, or a duplicate record | posi-data `journals/discovered` (script it, as `scripts/fill-from-site.mjs` does), PR, validator |
| A journal that is missing | posi-engine `directory-sync` finds it; or ingest it into posi-data with `scripts/ingest-crossref-publisher.mjs` |
| Two ids for one journal | `registry/superseded-ids.csv` in posi-data (append only) |
| A score (auto-PQF, quality) | posi-engine `scripts/directory/`; the result is `screening/discovered-screening.jsonl` in posi-data |
| A journal URL that must keep working after a merge | `journal_code_aliases` in the screening record; the build writes the redirect |

## 3. Calendar

| When | What happens | Where |
|---|---|---|
| Every 20 min | posi-data imports a new global-index release (:02) → delivery snapshot (:08) → this repo's data-sync (:14) | all three |
| Daily 02:00 UTC | discover journals, fill publishers, score metadata and auto-PQF | this repo |
| 1st, 16th | full DOAJ sync | this repo |
| 3rd | Crossref publisher sync | posi-engine |
| 4th–6th | monthly journal directory release (`journals-YYYY-MM`) | posi-engine |
| 7th | AJR rerate of the Core Collection; opens PR `ajr-rerate/YYYY-MM` in posi-data, **needs review and merge** | posi-engine → posi-data |
| Monday | citation stats | this repo |
| 1st–3rd December | yearly Citation Ranking edition and POSI-R release | posi-engine → posi-data |

## 4. The update round

1. **Status.** `npm run status`. FAIL blocks everything else; WARN is
   explained in its line.
2. **Watch the human gates.** The only step that waits for a person is the
   posi-data PR `ajr-rerate/YYYY-MM` (7th). If it is open, review it; the
   Core Collection does not change until it is merged.
3. **Check the pipeline.** Latest runs of the workflows above are green,
   and `data-editions.json` matches `current.json` on the data layer. A
   stuck stage upstream (delivery not following posi-data, posi-data not
   importing a release) is fixed upstream, not here.
4. **Fix records.** Corrections (wrong publisher, ISSN, title, open-access
   status, duplicates) go through section 5.
5. **Close.** Run the checks in section 6, push, report what changed.

## 5. Making a data correction

1. State the evidence for each change (Crossref, DOAJ, the journal's site)
   and what you will leave alone. Past examples: #83 (publisher of 30
   records), #84 (open access `null` when DOAJ does not list a journal), #85
   (swapped print/online ISSN).
2. Script the change against `src/lib/discovered-journals.json`; do not
   hand-edit 25,000 records. Keep the file's existing formatting so the diff
   shows only changed records.
3. Missing is `null`, never a guess: a journal absent from DOAJ is not shown
   to be subscription-only.
4. Never reuse or reassign ids. A record that moves keeps its identity.
5. Verify with the checks below, commit with the evidence in the message.

A record that belongs to the Core Collection or Global Benchmark is corrected
in `posi-data` (`corpus/`, `journals/`), with `registry/` kept consistent.

## 6. Checks before pushing

```bash
npm run status       # no FAIL
npm run lint
npm run typecheck
npm test
npm run build        # only if code or data shape changed
```

## 7. What not to do

- Do not edit `rankings/`, `metrics/` in posi-data, or anything in
  posi-data-delivery by hand.
- Do not copy the global editions into this repo; they are downloaded at
  build time on purpose.
- Do not commit with `--no-verify`, force-push, or skip a failing check.
- Do not turn a missing value into a default, or invent a score.
- Releases (`POSI-R-*`) are cut once a year in December; between releases
  data ships as post-release snapshots.
