// POSI Rating Release — Phase 6 (AJR-SPEC.md § 9), scoped down from the full
// annual-frozen-release system: a single named, dated release with a
// deterministic per-journal verification code, not yet a recurring
// automated cadence (that needs a scheduled job — separate infra decision,
// not built here).
//
// DATA_CUTOFF is a real date, set once when this release was cut — it does
// NOT auto-update on every rebuild. Bumping it (and RELEASE_ID) is a
// deliberate act of cutting a new release, mirroring the "never edit a
// released version file in place" rule posi-data's own taxonomy already
// follows.

// RELEASE_ID/RELEASE_LABEL are a stable internal identifier (used by
// verificationCode()/certificate-pdf.ts, already baked into issued
// certificate PDFs) — NOT a claim that a real POSI-R release has been cut.
// posi-data's POSI-R-1.0-SPEC.md is explicit: "Not yet generated. No
// POSI-R-* release has been produced" — a real one needs a full manifest
// (release, published, data_cutoff, per-component methodology versions,
// pinned data/engine commit SHAs, journal counts, SHA256SUMS) that doesn't
// exist yet. Public-facing badges must say so — see DATA_SNAPSHOT_LABEL —
// rather than display RELEASE_LABEL as if 2026.1 were an official cut.
// Restore the "RELEASE 2026.1" badge wording once IS_OFFICIAL_RELEASE
// actually flips true.
export const RELEASE_ID = 'POSI-R-2026.1'
export const RELEASE_LABEL = '2026.1'
export const METHODOLOGY_VERSION = 'AJR Lifecycle 1.0'
export const DATA_CUTOFF = '2026-08-12'
export const IS_OFFICIAL_RELEASE = false
export const DATA_SNAPSHOT_LABEL = `DATA SNAPSHOT · ${DATA_CUTOFF}`

/**
 * Deterministic per-journal verification code — not a claim of a
 * sequentially-issued registry number, just a stable, guessable-on-purpose
 * identifier tying a journal record to this specific release. Verification
 * itself works by re-deriving this code from the journal_code and release
 * ID and checking it matches, then looking up the journal's current record
 * — see /verify.
 */
export function verificationCode(journalCode: string): string {
  return `${RELEASE_ID}-${journalCode.toUpperCase()}`
}
