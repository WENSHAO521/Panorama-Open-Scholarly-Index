import { clsx } from 'clsx'

export type BadgeVariant =
  | 'oa'
  | 'license'
  | 'verified'
  | 'registered'
  | 'pending'
  | 'not_found'
  | 'conflict'
  | 'broken'
  | 'mqs-excellent'
  | 'mqs-good'
  | 'mqs-acceptable'
  | 'mqs-needs'
  | 'mqs-incomplete'
  | 'indexing-a'
  | 'indexing-b'
  | 'indexing-c'
  | 'indexing-d'
  | 'doaj-listed'
  | 'doaj-pending'
  | 'doaj-not'
  | 'core-collection'
  | 'published'
  | 'status-pending'
  | 'preview'
  | 'eligible'
  | 'not-eligible'
  | 'observation-stage'
  | 'early-stage'
  | 'mature-stage'
  | 'discovered'
  | 'indexed'
  | 'benchmark'
  | 'not-rateable'
  | 'provisional'
  | 'blocked'
  | 'default'

const TONE = {
  success: 'bg-[var(--posi-success-bg)] text-[var(--posi-success)] ring-1 ring-[var(--posi-success-border)]',
  warning: 'bg-[var(--posi-warning-bg)] text-[var(--posi-warning)] ring-1 ring-[var(--posi-warning-border)]',
  caution: 'bg-[var(--posi-caution-bg)] text-[var(--posi-caution)] ring-1 ring-[var(--posi-caution-border)]',
  danger: 'bg-[var(--posi-danger-bg)] text-[var(--posi-danger)] ring-1 ring-[var(--posi-danger-border)]',
  info: 'bg-[var(--posi-info-bg)] text-[var(--posi-info)] ring-1 ring-[var(--posi-info-border)]',
  brand: 'bg-[var(--posi-brand-soft)] text-[var(--posi-brand)] ring-1 ring-[var(--posi-brand-line)]',
  neutral: 'bg-[var(--posi-surface-soft)] text-[var(--posi-muted)] ring-1 ring-[var(--posi-border)]',
} as const

// Every variant maps to one tone. Tone only tints the pill: the label text is
// the status (never colour alone), so keep one variant per meaning and let
// the label differ ("Core Collection", "Official", "Provisional", "Unranked").
const VARIANT_STYLES: Record<BadgeVariant, string> = {
  oa: TONE.success,
  license: TONE.neutral,
  verified: TONE.success,
  registered: TONE.brand,
  pending: TONE.caution,
  not_found: TONE.neutral,
  conflict: TONE.caution,
  broken: TONE.danger,
  'mqs-excellent': TONE.success,
  'mqs-good': TONE.success,
  'mqs-acceptable': TONE.brand,
  'mqs-needs': TONE.caution,
  'mqs-incomplete': TONE.danger,
  'indexing-a': TONE.success,
  'indexing-b': TONE.brand,
  'indexing-c': TONE.caution,
  'indexing-d': TONE.danger,
  'doaj-listed': TONE.success,
  'doaj-pending': TONE.caution,
  'doaj-not': TONE.neutral,
  'core-collection': TONE.brand,
  published: TONE.success,
  'status-pending': TONE.warning,
  preview: TONE.info,
  eligible: TONE.success,
  'not-eligible': TONE.danger,
  'observation-stage': TONE.neutral,
  'early-stage': TONE.caution,
  'mature-stage': TONE.warning,
  discovered: TONE.info,
  indexed: TONE.success,
  benchmark: TONE.info,
  'not-rateable': TONE.warning,
  provisional: TONE.warning,
  blocked: TONE.danger,
  default: TONE.neutral,
}

export function mqsVariant(score: number): BadgeVariant {
  if (score >= 90) return 'mqs-excellent'
  if (score >= 75) return 'mqs-good'
  if (score >= 60) return 'mqs-acceptable'
  if (score >= 40) return 'mqs-needs'
  return 'mqs-incomplete'
}

export function mqsLabel(score: number): string {
  if (score >= 90) return 'Excellent'
  if (score >= 75) return 'Good'
  if (score >= 60) return 'Acceptable'
  if (score >= 40) return 'Needs Improvement'
  return 'Incomplete'
}

interface BadgeProps {
  label: string
  variant?: BadgeVariant
  className?: string
  // Supplementary detail only (§28 of the Stage 2 brief: fundamental status/
  // reasoning must be readable without hover) - `label` itself must always
  // carry the real, readable status; `title` is for the extra rule/citation
  // a reader can optionally hover for, never the only place a reason lives.
  title?: string
}

export function Badge({ label, variant = 'default', className, title }: BadgeProps) {
  return (
    <span
      title={title}
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded-[2px] text-xs font-medium',
        VARIANT_STYLES[variant],
        className
      )}
    >
      {label}
    </span>
  )
}
