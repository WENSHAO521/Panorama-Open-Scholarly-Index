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

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  oa: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  license: 'bg-gray-100 text-gray-600 ring-1 ring-gray-200',
  verified: 'bg-green-50 text-green-700 ring-1 ring-green-200',
  registered: 'bg-teal-50 text-teal-700 ring-1 ring-teal-200',
  pending: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  not_found: 'bg-gray-100 text-gray-500 ring-1 ring-gray-200',
  conflict: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
  broken: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  'mqs-excellent': 'bg-green-50 text-green-700 ring-1 ring-green-200',
  'mqs-good': 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  'mqs-acceptable': 'bg-teal-50 text-teal-700 ring-1 ring-teal-200',
  'mqs-needs': 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  'mqs-incomplete': 'bg-red-50 text-red-700 ring-1 ring-red-200',
  'indexing-a': 'bg-green-50 text-green-700 ring-1 ring-green-200',
  'indexing-b': 'bg-teal-50 text-teal-700 ring-1 ring-teal-200',
  'indexing-c': 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  'indexing-d': 'bg-red-50 text-red-700 ring-1 ring-red-200',
  'doaj-listed': 'bg-green-50 text-green-700 ring-1 ring-green-200',
  'doaj-pending': 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  'doaj-not': 'bg-gray-100 text-gray-500 ring-1 ring-gray-200',
  'core-collection': 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  // Token-driven variants (share globals.css's --posi-* semantic tokens with
  // Callout.tsx, rather than another one-off hardcoded tint) — the unified
  // status vocabulary from the Stage 1 brief (§29): Published / Pending /
  // Preview / Eligible / Not Eligible / Observation / Early Stage / Mature /
  // Discovered / Indexed can all be expressed here without a page defining
  // its own raw color. Stage 1 only *added* these variants for the
  // homepage's new sections — existing pages still using status-colors.ts's
  // raw {bg,color,border} triples or their own local color maps (evidence,
  // data-sources, journal/[code], policies, source-status) are unchanged;
  // migrating them onto this component is Stage 2 work, not done here.
  published: 'bg-[var(--posi-success-bg)] text-[var(--posi-success)] ring-1 ring-[var(--posi-success-border)]',
  'status-pending': 'bg-[var(--posi-warning-bg)] text-[var(--posi-warning)] ring-1 ring-[var(--posi-warning-border)]',
  preview: 'bg-[var(--posi-info-bg)] text-[var(--posi-info)] ring-1 ring-[var(--posi-info-border)]',
  eligible: 'bg-[var(--posi-success-bg)] text-[var(--posi-success)] ring-1 ring-[var(--posi-success-border)]',
  'not-eligible': 'bg-[var(--posi-danger-bg)] text-[var(--posi-danger)] ring-1 ring-[var(--posi-danger-border)]',
  'observation-stage': 'bg-gray-100 text-gray-500 ring-1 ring-gray-200',
  'early-stage': 'bg-[var(--posi-danger-bg)] text-[var(--posi-accent)] ring-1 ring-[var(--posi-danger-border)]',
  'mature-stage': 'bg-[var(--posi-warning-bg)] text-[var(--posi-warning)] ring-1 ring-[var(--posi-warning-border)]',
  discovered: 'bg-[var(--posi-info-bg)] text-[var(--posi-info)] ring-1 ring-[var(--posi-info-border)]',
  indexed: 'bg-[var(--posi-success-bg)] text-[var(--posi-success)] ring-1 ring-[var(--posi-success-border)]',
  // Stage 2 additions (rankings/journal-profile surfaces) — additive only,
  // reuse the same semantic tokens as their nearest sibling above rather
  // than introducing new raw colors. Kept as distinct variants (not aliased
  // to 'discovered'/'mature-stage'/'not-eligible') so the label text stays
  // the only thing that differs — never conflate "Global Benchmark" with
  // "Discovered", or "Blocked" with "Not Eligible", by reusing one variant
  // name for two different meanings.
  benchmark: 'bg-[var(--posi-info-bg)] text-[var(--posi-info)] ring-1 ring-[var(--posi-info-border)]',
  'not-rateable': 'bg-[var(--posi-warning-bg)] text-[var(--posi-warning)] ring-1 ring-[var(--posi-warning-border)]',
  provisional: 'bg-[var(--posi-warning-bg)] text-[var(--posi-warning)] ring-1 ring-[var(--posi-warning-border)]',
  blocked: 'bg-[var(--posi-danger-bg)] text-[var(--posi-danger)] ring-1 ring-[var(--posi-danger-border)]',
  default: 'bg-gray-100 text-gray-600 ring-1 ring-gray-200',
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
  // reasoning must be readable without hover) — `label` itself must always
  // carry the real, readable status; `title` is for the extra rule/citation
  // a reader can optionally hover for, never the only place a reason lives.
  title?: string
}

export function Badge({ label, variant = 'default', className, title }: BadgeProps) {
  return (
    <span
      title={title}
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium',
        VARIANT_STYLES[variant],
        className
      )}
    >
      {label}
    </span>
  )
}
