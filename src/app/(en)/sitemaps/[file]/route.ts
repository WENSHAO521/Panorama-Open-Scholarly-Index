// Sitemaps of the journal pages that are not static files (/journal/?issn=, /record/?code=): every journal in
// the directory has one, but the main /sitemap.xml lists only the static record pages. Listed in robots.txt.
//   /sitemaps/index.xml           sitemap index of the parts below
//   /sitemaps/journals-<n>.xml    up to 40,000 journal page addresses each
import { getDirectory } from '@/lib/global-journals'
import { SITE_URL } from '@/lib/structured-data'

export const dynamic = 'force-static'
export const dynamicParams = false

const PER_FILE = 40000

function journalUrls(): string[] {
  // Static pages (/journal/<code>/) are already in /sitemap.xml.
  return [...new Set(getDirectory().records.map(r => r.h).filter(h => h.includes('?')))].sort()
}

const parts = () => Math.ceil(journalUrls().length / PER_FILE)
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const xml = (body: string) => new Response(`<?xml version="1.0" encoding="UTF-8"?>\n${body}\n`, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } })

export function generateStaticParams() {
  return [{ file: 'index.xml' }, ...Array.from({ length: parts() }, (_, n) => ({ file: `journals-${n + 1}.xml` }))]
}

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params
  if (file === 'index.xml') {
    const entries = Array.from({ length: parts() }, (_, n) => `<sitemap><loc>${SITE_URL}/sitemaps/journals-${n + 1}.xml</loc></sitemap>`)
    return xml(`<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</sitemapindex>`)
  }
  const n = Number(file.match(/^journals-(\d+)\.xml$/)![1])
  const urls = journalUrls().slice((n - 1) * PER_FILE, n * PER_FILE)
  return xml(`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `<url><loc>${esc(SITE_URL + u)}</loc><changefreq>weekly</changefreq></url>`).join('\n')}\n</urlset>`)
}
