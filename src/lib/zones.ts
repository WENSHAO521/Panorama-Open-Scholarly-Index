// POSI Zones (POSI-ZONES-2.0, POSI-EVAL-1.0-SPEC.md § 8): a selective reading
// of the Citation Ranking, from the same PNCI mid-rank percentile as the
// Citation Quartile, within PSC categories only. The zones themselves are
// computed by posi-engine and read from the edition; this module only names
// them. The earlier PCS-Q rank-share trial (POSI-ZONES-1.0) is retired.

import { calculatePOSIZone, ZONES_VERSION as VERSION, type PosiZone } from './evaluation/rules'
import { ZONE_SHARE } from './evaluation/display'

export type Zone = PosiZone

export const ZONES_VERSION = VERSION
export const ZONES: Zone[] = [1, 2, 3, 4]
export { ZONE_SHARE, calculatePOSIZone }
