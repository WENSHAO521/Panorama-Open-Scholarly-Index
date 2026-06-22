import { clsx } from 'clsx'

type BadgeVariant =
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
}

export function Badge({ label, variant = 'default', className }: BadgeProps) {
  return (
    <span
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
