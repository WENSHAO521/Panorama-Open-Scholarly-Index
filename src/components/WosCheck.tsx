// A link out to Clarivate's own Master Journal List for this ISSN. POSI does
// not hold or republish Web of Science coverage (SCIE, SSCI, AHCI, ESCI):
// the reader checks it at the source, which stays current where a copied
// label would go stale.

import { ArrowSquareOut } from '@phosphor-icons/react/dist/ssr'

export const mjlHref = (issn: string) => `https://mjl.clarivate.com/search-results?issn=${encodeURIComponent(issn)}`

export function WosCheck({ issn }: { issn: string }) {
  return (
    <div>
      <a href={mjlHref(issn)} target="_blank" rel="noopener noreferrer" className="btn w-full justify-start">
        <ArrowSquareOut className="h-4 w-4" /> Check Web of Science listing
      </a>
      <p className="mt-1.5 text-[11.5px] leading-snug" style={{ color: 'var(--soft)' }}>
        Opens Clarivate’s Master Journal List. POSI is independent of Web of Science and does not record its coverage.
      </p>
    </div>
  )
}
