// Shared {bg, color, border} triples for status badges/pills, as design
// tokens (src/styles/posi-tokens.css) so they follow Light/Dark. A status is
// always named by its label; the colour only reinforces it.
export const STATUS_COLORS = {
  success:     { bg: 'var(--posi-success-bg)', color: 'var(--posi-success)', border: 'var(--posi-success-border)' },
  warning:     { bg: 'var(--posi-warning-bg)', color: 'var(--posi-warning)', border: 'var(--posi-warning-border)' },
  info:        { bg: 'var(--posi-info-bg)',    color: 'var(--posi-info)',    border: 'var(--posi-info-border)' },
  danger:      { bg: 'var(--posi-danger-bg)',  color: 'var(--posi-danger)',  border: 'var(--posi-danger-border)' },
  neutral:     { bg: 'var(--posi-surface-soft)', color: 'var(--posi-muted)', border: 'var(--posi-border)' },
  integrated:  { bg: 'var(--posi-surface-soft)', color: 'var(--posi-text-2)', border: 'var(--posi-border)' },
  brandDanger: { bg: 'var(--posi-danger-bg)',  color: 'var(--posi-danger)',  border: 'var(--posi-danger-border)' },
} as const
