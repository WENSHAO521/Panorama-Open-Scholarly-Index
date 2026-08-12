# POSI Public Beta — Launch Baseline

Not a rating release (see `posi-data/PJR-SPEC.md` for what a real PJR release
manifest looks like). This is a lightweight record of the exact technical
state POSI's public beta / trial operation started from, kept for rollback
and "what changed since launch" reference.

## Launch

- **Status:** POSI Public Beta · Trial Operation
- **Launch date:** 2026-08-12
- **Rating release in effect:** `POSI-R-2026-PILOT` ("Pilot 2026"), methodology `AJR Lifecycle 1.0`, data cutoff `2026-08-10` — see `src/lib/release.ts`
- **PSC version:** 1.0 (48 categories, levels 1–2 only)

## Repo state at launch

| Repo | Branch | Commit | Notes |
|---|---|---|---|
| `Panorama-Open-Scholarly-Index` (website) | `master` | `26c989058ef0bf98877aa6aa56c27682e0a03d10` | Deployed to production via Cloudflare Pages on push to `master` |
| `posi-data` | `master` | `0a484f531c92da71a09b88d2d410aba5bcca78b1` | Unchanged by the Framework 1.0 work — see below |
| `posi-engine` | `master` | `a76ba162e2ed0da6826e0fe4172a9f8fbc493fba` | Unchanged by the Framework 1.0 work — see below |

## Explicitly not part of this launch

The "POSI Journal Evaluation & Ranking Framework 1.0" methodology overhaul
(AJR-E 1.1, AJR-M 1.0, Evidence Coverage model, PSC confidence gating,
lifecycle date-boundary fix) is **not** part of this launch baseline. It
lives in two open, unmerged pull requests:

- `posi-engine` PR #1 — https://github.com/WENSHAO521/posi-engine/pull/1
- `posi-data` PR #1 — https://github.com/WENSHAO521/posi-data/pull/1

Deliberately not merged before launch — see PR descriptions for the open
methodology questions (PSC `medium`-confidence threshold, whether Citation Q
gets an L1 peer-cohort fallback, a few AJR-E/AJR-M sub-formula details) that
need a decision outside of launch-day time pressure. Citation metrics
(PCI/PCI-5/PNCI) for the ~1000-journal seed corpus are additionally blocked
on OpenAlex's `/works` endpoint now requiring paid credits — parked until
that's resolved, tracked in the same PRs.

## What's live at launch

- Lifecycle classification (Observation / Early-Stage / Mature)
- AJR-E rating + evidence, for Core Collection + Global Benchmark journals with sufficient evidence
- PQF editorial-selection assessment
- Mature Track: interim AJR-E rubric applied to mature journals, explicitly labeled preview — M-Q and Citation Q both show "Not released", not a substitute value
- Citation Reports: OpenAlex 2-year mean citedness shown as an explicit, labeled preview — not official PCI
- Core Collection, Global Benchmark Collection, Coverage Policy, Coverage Changes (empty log)
- Announcements

## Rollback

If a launch-day regression needs reverting, redeploy website commit
`26c989058ef0bf98877aa6aa56c27682e0a03d10`'s *parent* (`9eeb2728f535ac9315c025c699cd64254f9edd14`)
via Cloudflare Pages — that was the last commit before this file's own
pre-launch batch of changes.
