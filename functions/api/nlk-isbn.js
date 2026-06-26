/**
 * Cloudflare Pages Function — Korean book ISBN lookup.
 * Strategy:
 *   1. Try SEOJI (Korean ISBN Agency) — authoritative JSON API, cert_key=NLK_API_KEY
 *      Response: { "TOTAL_COUNT": "N", "docs": [{ TITLE, AUTHOR, PUBLISHER, EA_ISBN, PUBLISH_PREDATE }] }
 *   2. Fallback to search.do (소장자료) if SEOJI returns nothing
 *      Response JSON: { "total": "N", "result": [{ titleInfo, authorInfo, pubInfo, pubYearInfo, isbn, typeCode }] }
 *      Note: titleInfo/authorInfo contain HTML <span> tags that must be stripped.
 *
 * Required env var: NLK_API_KEY
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

  // ── Step 1: SEOJI (Korean ISBN Agency) ─────────────────────────────────────
  const seoji = await trySeoji(certKey, clean)
  if (seoji) return json({ found: true, ...seoji }, 200)

  // ── Step 2: search.do fallback ──────────────────────────────────────────────
  const fallback = await trySearchDo(certKey, clean)
  if (fallback) return json({ found: true, ...fallback }, 200)

  return json({ found: false }, 200)
}

async function trySeoji(certKey, isbn) {
  try {
    const params = new URLSearchParams({
      cert_key: certKey,
      result_style: 'json',
      page_no: '1',
      page_size: '5',
      isbn,
    })
    const res = await fetch(
      `https://www.nl.go.kr/seoji/SearchApi.do?${params.toString()}`,
      {
        headers: { 'User-Agent': 'POSI/0.1 (mailto:posi@panoramagroup.org)' },
        signal: AbortSignal.timeout(7000),
      }
    )
    if (!res.ok) return null
    const data = await res.json()
    // SEOJI error: { "RESULT": "ERROR", "ERR_CODE": "...", "ERR_MESSAGE": "..." }
    if (data.RESULT === 'ERROR' || data.ERR_CODE) return null
    const total = parseInt(data.TOTAL_COUNT ?? '0', 10)
    if (total === 0 || !Array.isArray(data.docs) || data.docs.length === 0) return null

    // Prefer physical books (EBOOK_YN === 'N'); fall back to first
    const item = data.docs.find(d => d.EBOOK_YN === 'N') ?? data.docs[0]

    const title = (item.TITLE ?? '').trim()
    if (!title) return null

    const authorRaw = (item.AUTHOR ?? '').trim()
    const authors = authorRaw ? cleanSeojiAuthors(authorRaw) : []
    const publisher = (item.PUBLISHER ?? '').trim() || null
    const year = (item.PUBLISH_PREDATE ?? '').match(/\d{4}/)?.[0] ?? null

    return { title, authors, year, publisher }
  } catch {
    return null
  }
}

async function trySearchDo(certKey, isbn) {
  try {
    const params = new URLSearchParams({
      key: certKey,
      kwd: isbn,
      srchTarget: 'total',
      apiType: 'json',
      pageNum: '1',
      pageSize: '5',
    })
    const res = await fetch(
      `https://www.nl.go.kr/NL/search/openApi/search.do?${params.toString()}`,
      {
        headers: { 'User-Agent': 'POSI/0.1 (mailto:posi@panoramagroup.org)' },
        signal: AbortSignal.timeout(7000),
      }
    )
    if (!res.ok) return null
    const data = await res.json()
    if (data.errorCode) return null
    const total = parseInt(data.total ?? '0', 10)
    if (total === 0 || !Array.isArray(data.result) || data.result.length === 0) return null

    // search.do mixes books/journals/theses — prefer typeCode B1 (일반도서)
    const item = data.result.find(r => r.typeCode === 'B1') ?? data.result[0]

    // titleInfo and authorInfo contain HTML <span class="searching_txt">...</span>
    const title = stripHtml((item.titleInfo ?? '').trim())
    if (!title) return null

    const authorRaw = stripHtml((item.authorInfo ?? '').trim())
    const authors = authorRaw ? cleanNlkAuthors(authorRaw) : []
    const publisher = stripHtml((item.pubInfo ?? '').trim()) || null
    const year = (item.pubYearInfo ?? '').match(/\d{4}/)?.[0] ?? null

    return { title, authors, year, publisher }
  } catch {
    return null
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() })
}

// ─── Author cleanup ───────────────────────────────────────────────────────────

/**
 * SEOJI author formats:
 *   "박경리"
 *   "저자 : 박경리"                     ← role : name prefix
 *   "셸 실버스타인 글·그림 ;김목인 옮김"  ← name role ;name role (semicolon-separated)
 */
function cleanSeojiAuthors(raw) {
  return raw
    .split(/[;]/)
    .map(part => {
      // Handle "role : name" prefix
      const colonIdx = part.indexOf(' : ')
      if (colonIdx > -1) part = part.slice(colonIdx + 3)
      // Strip trailing role words
      return part
        .replace(/\[.*?\]/g, ' ')
        .replace(/\s+(저|지음|글|엮음|편|역|옮김|著|著者|글·그림|감독|作曲|작곡|편곡|편저|기획|그림|사진|공저)\b/g, ' ')
        .trim()
    })
    .filter(Boolean)
}

function cleanNlkAuthors(raw) {
  return raw
    .replace(/\[.*?\]/g, ' ')
    .replace(/\s+(저|지음|글|엮음|편|역|옮김|著|著者|글·그림|감독|作曲|작곡|편곡|편저|기획|그림|사진|공저)\b/g, ' ')
    .split(/[;]/)
    .map(a => a.trim())
    .filter(Boolean)
}

function stripHtml(str) {
  return str.replace(/<[^>]+>/g, '').trim()
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
