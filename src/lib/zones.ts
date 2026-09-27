// POSI Zones (POSI 分区): a pyramid split of each ranking by rank position,
// alongside the equal-quarter PCS quartiles. Zone 1 is the top 5% of a
// ranking, Zone 2 the next 15%, Zone 3 the next 30%, Zone 4 the rest.
// Computed from the rank and ranking size in the current PCS-Q edition, so
// it applies unchanged to whichever edition is published. Pure code, safe
// for client components. Specification: posi-data POSI-ZONES-1.0-SPEC.md.

export type Zone = 1 | 2 | 3 | 4

export const ZONES_VERSION = 'POSI-ZONES-1.0'
/** Trial status: shown on every page that displays zones. */
export const ZONES_TRIAL = true

/** Cumulative share of a ranking at the bottom of each zone. */
export const ZONE_BOUNDS: [Zone, number][] = [[1, 0.05], [2, 0.2], [3, 0.5], [4, 1]]

/** Zone of the journal at `rank` (1 = best) in a ranking of `size` journals. */
export function zoneOf(rank: number | null | undefined, size: number | null | undefined): Zone | null {
  if (rank == null || !size || rank < 1) return null
  const p = rank / size
  return ZONE_BOUNDS.find(([, b]) => p <= b + 1e-9)![0]
}
