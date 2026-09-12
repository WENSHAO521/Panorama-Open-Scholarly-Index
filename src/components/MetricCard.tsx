// One tile in the homepage "Current POSI Coverage" grid. Every value shown
// here must come from a real computed count (see src/lib/site-metrics.ts) —
// the `scope` line exists specifically so a reader always knows which
// population/denominator a number describes (Core Collection vs. Global
// Benchmark vs. Discovered vs. taxonomy size), per the "never show a number
// without a denominator" rule this component was built to enforce.
import Link from 'next/link'

export function MetricCard({
  value,
  label,
  scope,
  href,
}: {
  value: string
  label: string
  scope: string
  href?: string
}) {
  const content = (
    <>
      <p
        className="font-bold leading-none"
        style={{
          fontFamily: 'var(--font-mono)',
          fontVariantNumeric: 'tabular-nums',
          fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
          color: 'var(--posi-text)',
        }}
      >
        {value}
      </p>
      <p
        className="text-[10px] font-bold uppercase tracking-[0.14em] mt-3"
        style={{ color: 'var(--posi-muted)', fontFamily: 'var(--font-mono)' }}
      >
        {label}
      </p>
      <p className="text-xs leading-snug mt-1.5" style={{ color: 'var(--posi-soft)' }}>
        {scope}
      </p>
    </>
  )

  const className = 'block p-6 h-full transition-colors duration-300 hover:bg-[#fafafa]'
  const style = { background: 'var(--posi-surface)' }

  if (href) {
    return (
      <Link href={href} className={className} style={style}>
        {content}
      </Link>
    )
  }
  return (
    <div className={className} style={style}>
      {content}
    </div>
  )
}
