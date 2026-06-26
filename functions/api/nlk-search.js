/**
 * Cloudflare Pages Function — proxy for Korean National Library keyword/title/author search.
 * Required env var: NLK_API_KEY
 *
 * NLK API response uses <item> elements (not <doc>) with snake_case field names.
 * Each item has a <type_name> field; we filter to 도서 (books) only.
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
    pageSize: '30',   // fetch more to compensate for non-book filtering
  })

  let upstream
  try {
    upstream = await fetch(
      `https://www.nl.go.kr/NL/search/openApi/search.do?${params.toString()}`,
      {
        headers: { 'User-Agent': 'POSI/0.1 (mailto:posi@panoramagroup.org)' },
        signal: AbortSignal.timeout(10000),
      }
    )
  } catch {
    return json({ total: 0, items: [], error: 'Upstream fetch failed' }, 502)
  }

  if (!upstream.ok) return json({ total: 0, items: [], error: `NLK ${upstream.status}` }, 502)

  const xml = await upstream.text()
  const total = parseInt(xmlText(xml, 'total') || '0', 10)

  // NLK uses <item> elements, not <doc>
  const itemBlocks = xmlAll(xml, 'item')

  const items = itemBlocks
    .filter(block => {
      // Only books (도서); exclude 잡지, 지도, 음악, 웹사이트, 학위논문, etc.
      const typeName = xmlText(block, 'type_name')
      return typeName === '도서'
    })
    .map(block => {
      const title = xmlText(block, 'title_info')
      if (!title) return null

      const authorRaw = xmlText(block, 'author_info')
      const authors = authorRaw ? cleanNlkAuthors(authorRaw) : []

      const publisher = xmlText(block, 'pub_info') || null
      const yearRaw   = xmlText(block, 'pub_year_info') || ''
      const year      = yearRaw ? parseInt(yearRaw.match(/\d{4}/)?.[0] ?? '', 10) || null : null

      const isbnRaw  = xmlText(block, 'isbn') || ''
      const isbn     = isbnRaw.replace(/[-\s]/g, '')
      const isbnArr  = /^\d{10,13}$/.test(isbn) ? [isbn] : []

      // Cover image: NLK returns placeholder "http://cover.nl.go.kr/" for missing images
      const imgRaw   = xmlText(block, 'image_url') || ''
      const coverUrl = imgRaw && imgRaw !== 'http://cover.nl.go.kr/' && imgRaw.length > 30
        ? imgRaw
        : null

      return { title, authors, year, publisher, isbn: isbnArr, cover_url: coverUrl, edition_count: 1 }
    })
    .filter(Boolean)
    .slice(0, 15)

  return json({ total, items }, 200)
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() })
}

/**
 * Clean NLK author strings.
 * Examples: "박경리 저" → "박경리"
 *           "한국토지공사 [편]" → "한국토지공사"
 *           "신날새 가수[1985-] 김윤 작곡" → ["신날새", "김윤"]
 */
function cleanNlkAuthors(raw) {
  return raw
    // Remove bracketed content like [편], [1985-], [엮음]
    .replace(/\[.*?\]/g, ' ')
    // Remove role suffixes (Korean + Chinese)
    .replace(/\s+(저|지음|글|엮음|편|역|옮김|著|著者|글·그림|감독|作曲|작곡|편곡|편저|기획|그림|사진|공저)\b/g, ' ')
    // Split on semicolons or common role-based separators
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
