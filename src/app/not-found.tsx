import Link from 'next/link'
import type { Metadata } from 'next'
import { SearchBar } from '@/components/SearchBar'

export const metadata: Metadata = {
  title: 'Page Not Found',
  robots: { index: false, follow: true },
}

const USEFUL_LINKS = [
  { href: '/journals', label: 'All Journal Records' },
  { href: '/search', label: 'Search' },
  { href: '/subjects', label: 'PSC Subjects' },
  { href: '/about', label: 'About POSI' },
]

export default function NotFound() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">

      <div className="border-l-4 pl-5" style={{ borderColor: 'var(--posi-accent)' }}>
        <p
          className="text-xs font-bold uppercase mb-2"
          style={{ color: 'var(--posi-accent)', fontFamily: 'var(--font-mono)', letterSpacing: '0.2em' }}
        >
          404
        </p>
        <h1 className="text-2xl font-bold leading-tight" style={{ color: 'var(--posi-text)' }}>
          Page Not Found
        </h1>
        <p className="text-sm leading-relaxed mt-2 max-w-xl" style={{ color: 'var(--posi-muted)' }}>
          The record or page you're looking for doesn't exist, may have moved, or the URL may
          contain a typo. Try a search below, or jump to one of the sections most people are
          looking for.
        </p>
      </div>

      <div className="p-6" style={{ background: 'var(--posi-primary)' }}>
        <SearchBar />
      </div>

      <section className="bg-white" style={{ border: '1px solid var(--posi-border)' }}>
        <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--posi-border-light)', background: 'var(--posi-bg)' }}>
          <h2 className="text-xs font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--posi-muted)' }}>
            Where You Might Be Headed
          </h2>
        </div>
        <div className="divide-y" style={{ divideColor: 'var(--posi-border-light)' } as React.CSSProperties}>
          {USEFUL_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center justify-between px-5 py-3 text-xs font-semibold hover:bg-gray-50 transition-colors"
              style={{ color: 'var(--posi-text)' }}
            >
              {link.label}
              <span style={{ color: 'var(--posi-accent)' }}>→</span>
            </Link>
          ))}
        </div>
      </section>

      <p className="text-xs" style={{ color: 'var(--posi-muted)' }}>
        <Link href="/" className="hover:underline" style={{ color: 'var(--posi-accent)' }}>
          ← Return to the POSI homepage
        </Link>
      </p>

    </div>
  )
}
