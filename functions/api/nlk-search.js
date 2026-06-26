/**
 * Cloudflare Pages Function — Korean book search via KolisNet (국가자료종합목록).
 * KolisNet is the National Union Catalog and returns only books/monographs.
 * Required env var: NLK_API_KEY  (same key for all nl.go.kr OpenAPI services)
 *
 * KolisNet only supports XML (apiType=json is ignored).
 * Response: <root><paramData><total>N</total>...</paramData><result><item>...</item></result></root>
 * Fields: title_info, type_name (일반도서), author_info, pub_info, pub_year_info, isbn
 *
 * Usage: GET /api/nlk-search?q=토지&target=title
 *        target: title | author | total (default: total)
 */
export async function onRequestGet({ request, env }) {
  const certKey = env.NLK_API_KEY
  if (!certKey) return json({ total: 0, items: [], error: 'NLK_API_KEY not configured' }, 503)

  const url    = new URL(request.url)
  const q      = url.searchParams.get('q') ?? ''
  const target = url.searchParams.get('target') ?? 'total'

  if (!q.trim()) return json({ total: 0, items: [] }, 200)

  const srchTarget = ['title', 'author', 'total'].includes(target) ? target : 'total'

  const params = new URLSearchParams({
    key: certKey,
    kwd: q,
    srchTarget,
    pageNum: '1',
    pageSize: '20',
  })

  let upstream
  try {
    upstream = await fetch(
      `https://www.nl.go.kr/NL/search/openApi/searchKolisNet.do?${params.toString()}`,
      {
        headers: { 'User-Agent': 'POSI/0.1 (mailto:posi@panoramagroup.org)' },
        signal: AbortSignal.timeout(10000),
      }
    )
  } catch {
    return json({ total: 0, items: [], error: 'Upstream fetch failed' }, 502)
  }

  if (!upstream.ok) return json({ total: 0, items: [], error: `KolisNet ${upstream.status}` }, 502)

  const xml = await upstream.text()

  // KolisNet error check (XML error has no <total>)
  if (xml.includes('<error>') || xml.includes('<error_code>')) {
    return json({ total: 0, items: [], error: 'KolisNet API error' }, 502)
  }

  // <total> is inside <paramData>, but xmlText searches the whole document
  const total = parseInt(xmlText(xml, 'total') || '0', 10)
  const itemBlocks = xmlAll(xml, 'item')

  const items = itemBlocks
    .filter(block => {
      const typeName = xmlText(block, 'type_name')
      // Include book types; exclude theses, journals, maps, articles, etc.
      return !typeName || typeName.includes('도서') || typeName === '고서' || typeName === '만화'
    })
    .map(block => {
      const title = xmlText(block, 'title_info')
      if (!title) return null

      const authorRaw = xmlText(block, 'author_info')
      const authors   = authorRaw ? cleanNlkAuthors(authorRaw) : []

      const publisher  = xmlText(block, 'pub_info') || null
      const yearRaw    = xmlText(block, 'pub_year_info') || ''
      const year       = yearRaw ? parseInt(yearRaw.match(/\d{4}/)?.[0] ?? '', 10) || null : null
      const isbnRaw    = xmlText(block, 'isbn').replace(/[-\s]/g, '')
      const isbnArr    = /^\d{10,13}$/.test(isbnRaw) ? [isbnRaw] : []

      return { title, authors, year, publisher, isbn: isbnArr, cover_url: null, edition_count: 1 }
    })
    .filter(Boolean)
    .slice(0, 15)

  return json({ total, items }, 200)
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() })
}

function cleanNlkAuthors(raw) {
  return raw
    .replace(/\[.*?\]/g, ' ')
    .replace(/\s+(저|지음|글|엮음|편|역|옮김|著|著者|글·그림|감독|作曲|작곡|편곡|편저|기획|그림|사진|공저)\b/g, ' ')
    .split(/[;]/)
    .map(a => a.trim())
    .filter(Boolean)
}

function xmlText(xml, tag) {
  const re  = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i')
  const raw = re.exec(xml)?.[1] ?? ''
  return raw
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim()
}

function xmlAll(xml, tag) {
  const re  = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'gi')
  const out = []
  let m
  while ((m = re.exec(xml)) !== null) out.push(m[1])
  return out
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store',
  }
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  })
}
