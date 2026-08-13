import { Info, WarningCircle, WarningOctagon, CheckCircle } from '@phosphor-icons/react/dist/ssr'

/**
 * Shared info/warning/danger/success callout box. Replaces the pattern of
 * copy-pasting inline hex colors per page (a 2026-08 audit found the exact
 * blue '#eff6ff'/'#1d4ed8' pair hardcoded independently in 21 files and
 * the amber '#fffbeb'/'#92400e' pair in 18 more, plus several more
 * near-duplicate one-off tints for the same four semantic purposes across
 * the rest of the site) — one component, one set of tokens
 * (globals.css's --posi-info/-warning/-danger/-success and their -bg/
 * -border pairs), used everywhere a page needs to flag something to the
 * reader. A Server Component (no interactivity), safe to use from any
 * page or client component alike.
 */
const VARIANT = {
  info: { icon: Info, color: 'var(--posi-info)', bg: 'var(--posi-info-bg)', border: 'var(--posi-info-border)' },
  warning: { icon: WarningCircle, color: 'var(--posi-warning)', bg: 'var(--posi-warning-bg)', border: 'var(--posi-warning-border)' },
  danger: { icon: WarningOctagon, color: 'var(--posi-danger)', bg: 'var(--posi-danger-bg)', border: 'var(--posi-danger-border)' },
  success: { icon: CheckCircle, color: 'var(--posi-success)', bg: 'var(--posi-success-bg)', border: 'var(--posi-success-border)' },
} as const

export type CalloutVariant = keyof typeof VARIANT

export function Callout({
  variant = 'info',
  children,
  className = '',
}: {
  variant?: CalloutVariant
  children: React.ReactNode
  className?: string
}) {
  const v = VARIANT[variant]
  const Icon = v.icon
  return (
    <div
      className={`p-4 text-xs leading-relaxed flex items-start gap-2.5 ${className}`}
      style={{ background: v.bg, border: `1px solid ${v.border}` }}
    >
      <Icon className="h-3.5 w-3.5 shrink-0 mt-px" weight={variant === 'danger' ? 'fill' : 'regular'} style={{ color: v.color }} />
      <div className="min-w-0 flex-1" style={{ color: v.color }}>
        {children}
      </div>
    </div>
  )
}
