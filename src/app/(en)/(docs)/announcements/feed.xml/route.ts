// RSS 2.0 feed of the news items (/announcements/feed.xml), newest first. Linked from every page's <head>.
import { getSortedAnnouncements } from '@/lib/announcements'
import { SITE_URL } from '@/lib/structured-data'

export const dynamic = 'force-static'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const rfc822 = (iso: string) => new Date(`${iso}T00:00:00Z`).toUTCString()

export function GET() {
  const items = getSortedAnnouncements()
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>POSI news</title>
<link>${SITE_URL}/announcements/</link>
<atom:link href="${SITE_URL}/announcements/feed.xml" rel="self" type="application/rss+xml"/>
<description>News and announcements from the Panorama Open Scholarly Index (POSI).</description>
<language>en</language>
${items[0] ? `<lastBuildDate>${rfc822(items[0].date)}</lastBuildDate>\n` : ''}${items.map(a => `<item>
<title>${esc(a.title)}</title>
<link>${SITE_URL}/announcements/${a.slug}/</link>
<guid isPermaLink="true">${SITE_URL}/announcements/${a.slug}/</guid>
<pubDate>${rfc822(a.date)}</pubDate>
<description>${esc(a.summary)}</description>
</item>`).join('\n')}
</channel>
</rss>
`
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } })
}
