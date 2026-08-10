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

export const RELEASE_ID = 'POSI-R-2026-PILOT'
export const RELEASE_LABEL = 'Pilot 2026'
export const METHODOLOGY_VERSION = 'AJR Lifecycle 1.0'
export const DATA_CUTOFF = '2026-08-10'

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
