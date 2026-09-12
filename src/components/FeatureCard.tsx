// Generalized Link-card used by the homepage's "How POSI Works", "Explore
// POSI", and "Open Infrastructure" sections — extracted from what was
// previously three near-identical hand-rolled card blocks (each with its
// own copy of the badge/title/desc/cta markup and hover treatment) into one
// component, per the "don't build near-duplicate cards" rule.
import Link from 'next/link'

export function FeatureCard({
  badge,
  title,
  desc,
  href,
  cta,
}: {
  badge?: string
  title: string
  desc: string
  href: string
  cta: string
}) {
  const external = href.startsWith('http')
  const className = 'tactile p-7 h-full flex flex-col transition-all duration-300 hover:bg-[#fafafa] hover:-translate-y-0.5 hover:shadow-[0_16px_32px_-20px_rgba(17,17,17,0.3)] group'
  // Explicit background required: these cards sit in a `gap-px` grid whose
  // container background is the divider color (var(--posi-border)) — a
  // card with no background of its own renders as a solid gray block
  // instead of a white card with hairline gray dividers between cards
  // (only found via a real rendered screenshot, not static markup).
  const style = { background: 'var(--posi-surface)' }

  const inner = (
    <>
      {badge && (
        <div className="mb-5">
          <span
            className="block font-bold leading-none"
            style={{
              fontFamily: 'var(--font-mono)',
              color: 'var(--posi-accent)',
              fontSize: '1.25rem',
              letterSpacing: '0.06em',
            }}
          >
            {badge}
          </span>
          <div className="mt-3" style={{ height: '1px', width: '2rem', background: 'var(--posi-border)' }} />
        </div>
      )}
      <h3 className="text-sm font-semibold mb-3 leading-tight" style={{ color: 'var(--posi-text)' }}>
        {title}
      </h3>
      <p className="text-xs leading-relaxed mb-4 text-justify" style={{ color: 'var(--posi-muted)' }}>
        {desc}
      </p>
      <span
        className="mt-auto text-[11px] font-semibold transition-opacity opacity-80 group-hover:opacity-100"
        style={{ color: 'var(--posi-accent)' }}
      >
        {cta}
      </span>
    </>
  )

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className} style={style}>
        {inner}
      </a>
    )
  }

  return (
    <Link href={href} className={className} style={style}>
      {inner}
    </Link>
  )
}
