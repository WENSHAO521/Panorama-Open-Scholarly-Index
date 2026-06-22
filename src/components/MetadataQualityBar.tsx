import { mqsLabel, mqsVariant } from './Badge'
import { clsx } from 'clsx'

const BAR_COLOR: Record<string, string> = {
  'mqs-excellent': 'bg-green-500',
  'mqs-good': 'bg-emerald-500',
  'mqs-acceptable': 'bg-teal-500',
  'mqs-needs': 'bg-amber-500',
  'mqs-incomplete': 'bg-red-500',
}

interface MetadataQualityBarProps {
  score: number
  showLabel?: boolean
  className?: string
}

export function MetadataQualityBar({ score, showLabel = true, className }: MetadataQualityBarProps) {
  const variant = mqsVariant(score)
  const label = mqsLabel(score)
  const barColor = BAR_COLOR[variant]

  return (
    <div className={clsx('space-y-1', className)}>
      {showLabel && (
        <div className="flex justify-between items-center text-xs text-gray-600">
          <span>Metadata Quality</span>
          <span className="font-medium">{score}/100 — {label}</span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div
          className={clsx('h-1.5 rounded-full transition-all', barColor)}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}
