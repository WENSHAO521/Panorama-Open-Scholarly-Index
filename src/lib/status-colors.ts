// Shared {bg, color, border} triples for status badges/pills.
//
// These exact hex values were independently copy-pasted across
// data-sources, evidence, journal/[code], policies, and source-status —
// the same duplication problem an earlier audit found and fixed for
// full-width notice boxes (see Callout.tsx), one level down for badges.
// Each page keeps its own domain-specific status labels/keys; only the
// underlying color triples are shared here.
export const STATUS_COLORS = {
  success:     { bg: '#f0fdf4', color: '#1F7A4D', border: '#bbf7d0' },
  warning:     { bg: '#fffbeb', color: '#B7791F', border: '#fde68a' },
  info:        { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  danger:      { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' },
  neutral:     { bg: '#f9fafb', color: '#6B7280', border: '#e5e7eb' },
  integrated:  { bg: '#f5f5f5', color: '#374151', border: '#e5e7eb' },
  brandDanger: { bg: '#fef2f2', color: '#c41e3a', border: '#fecaca' },
} as const
