/**
 * Cloudflare Pages Function — proxy for Korean National Library Open API ISBN lookup.
 * Required env var: NLK_API_KEY  (register at www.nl.go.kr/NL/search/openApi/openApiInfo.do)
 *
 * NLK API response: <root><result><item>...</item></result></root>
 * Each item has <type_name>도서</type_name> for books.
 *
 * Usage: GET /api/nlk-isbn?isbn=9791158391485
 */
export async function onRequestGet({ request, env }) {
  const certKey = env.NLK_API_KEY
  if (!certKey) return json({ found: false, error: 'NLK_API_KEY not configured' }, 503)

  const url  = new URL(request.url)
  const isbn = url.searchParams.get('isbn')

  if (!isbn) return json({ error: 'Missing isbn parameter' }, 400)
  const clean = isbn.replace(/[-\s]/g, '')
  if (!/^\d{10}$|^\d{13}$/.test(clean)) return json({ error: 'Invalid isbn' }, 400)

  const params = new URLSearchParams({
    key: certKey,
    kwd: clean,
    srchTarget: 'total',
    pageNum: '1',
    pageSize: '5',
  })

  let upstream
  try {
    upstream = await fetch(
      `https://www.nl.go.kr/NL/search/openApi/search.do?${params.toString()}`,
      {
        headers: { 'User-Agent': 'POSI/0.1 (mailto:posi@panoramagroup.org)' },
        signal: AbortSignal.timeout(8000),
      }
    )
  } catch {
    return json({ found: false, error: 'Upstream fetch failed' }, 502)
  }

  if (!upstream.ok) return json({ found: false, error: `NLK ${upstream.status}` }, 502)

  const xml = await upstream.text()

  const total = parseInt(xmlText(xml, 'total') || '0', 10)
  if (total === 0) return json({ found: false }, 200)

  // Parse all <item> blocks and prefer books (도서); fall back to first item
  const itemBlocks = xmlAll(xml, 'item')
  if (itemBlocks.length === 0) return json({ found: false }, 200)

  const bookBlock = itemBlocks.find(b => xmlText(b, 'type_name') === '도서') ?? itemBlocks[0]

  const title = xmlText(bookBlock, 'title_info')
  if (!title) return json({ found: false }, 200)

  const authorRaw = xmlText(bookBlock, 'author_info')
  const authors = authorRaw ? cleanNlkAuthors(authorRaw) : []

  const publisher = xmlText(bookBlock, 'pub_info') || null
  const yearRaw   = xmlText(bookBlock, 'pub_year_info') || ''
  const year      = yearRaw.match(/\d{4}/)?.[0] ?? null

  return json({ found: true, title, authors, year, publisher }, 200)
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
    'Cache-Control': 'public, max-age=86400',
  }
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  })
}
