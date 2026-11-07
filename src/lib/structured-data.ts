// schema.org JSON-LD for search engines: the site (WebSite + Organization, on every page) and each static
// journal record page (Periodical). Kept to facts the page itself shows.
import type { Journal } from './types'
import { alternateTitleText } from './titles'

export const SITE_URL = 'https://posi.panorama-sg.com'

const PUBLISHER = { '@type': 'Organization', name: 'Panorama Scholarly Group Ltd', url: 'https://panorama-sg.com' }

export function siteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      { ...PUBLISHER, '@id': `${SITE_URL}/#publisher`, logo: `${SITE_URL}/posi-logo.svg` },
      {
        '@type': 'WebSite', '@id': `${SITE_URL}/#website`, url: `${SITE_URL}/`, name: 'Panorama Open Scholarly Index (POSI)',
        publisher: { '@id': `${SITE_URL}/#publisher` },
        potentialAction: { '@type': 'SearchAction', target: `${SITE_URL}/journals/?q={search_term_string}`, 'query-input': 'required name=search_term_string' },
      },
    ],
  }
}

export function periodicalJsonLd(j: Journal, path: string) {
  const issn = [j.issn_online, j.issn_print].filter((x): x is string => !!x)
  const sameAs = [
    j.website_url || null,
    ...issn.map(i => `https://portal.issn.org/resource/ISSN/${i}`),
    j.openalex_source_id ? `https://openalex.org/${j.openalex_source_id}` : null,
  ].filter((x): x is string => !!x)
  return {
    '@context': 'https://schema.org',
    '@type': 'Periodical',
    '@id': `${SITE_URL}${path}`,
    url: `${SITE_URL}${path}`,
    name: j.title,
    ...(j.alternate_titles?.length ? { alternateName: j.alternate_titles.map(alternateTitleText).filter(Boolean) } : {}),
    ...(issn.length ? { issn } : {}),
    ...(j.publisher ? { publisher: { '@type': 'Organization', name: j.publisher } } : {}),
    ...(j.language ? { inLanguage: j.language } : {}),
    ...(j.open_access != null ? { isAccessibleForFree: j.open_access } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  }
}

/** The script tag's text: JSON with `<` escaped so a title cannot close the tag. */
export function jsonLdText(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
