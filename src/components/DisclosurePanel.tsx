// Neutral, institutional-toned disclosure block — for Governance/Conflict
// of Interest and Responsible Use on the homepage. Deliberately not built
// on Callout.tsx: those variants (info/warning/danger/success) all read as
// "flagging something to the reader," but a conflict-of-interest or
// responsible-use disclosure isn't a warning — it's routine transparency
// (§16 of the Stage 1 brief: "it is institutional transparency," not a red
// alert). Visually formalizes the left-accent-border block style the
// homepage already used for its "Every metric is reproducible" section.
import Link from 'next/link'

export function DisclosurePanel({
  title,
  children,
  href,
  cta,
}: {
  title: string
  children: React.ReactNode
  href: string
  cta: string
}) {
  return (
    <div
      className="p-6 pl-7"
      style={{
        background: 'var(--posi-surface)',
        border: '1px solid var(--posi-border)',
        borderLeftWidth: '3px',
        borderLeftColor: 'var(--posi-accent)',
      }}
    >
      <h2
        className="text-sm font-bold uppercase tracking-[0.1em] mb-3"
        style={{ color: 'var(--posi-text)' }}
      >
        {title}
      </h2>
      <div className="text-xs leading-relaxed text-justify max-w-3xl" style={{ color: 'var(--posi-muted)' }}>
        {children}
      </div>
      <Link
        href={href}
        className="inline-block mt-3 text-[11px] font-semibold hover:underline"
        style={{ color: 'var(--posi-accent)' }}
      >
        {cta}
      </Link>
    </div>
  )
}
