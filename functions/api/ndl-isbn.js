/**
 * Cloudflare Pages Function — proxy for Japan National Diet Library SRU ISBN lookup.
 * No API key required; CORS bypass only.
 *
 * Endpoint: https://ndlsearch.ndl.go.jp/api/sru  (new, replaces iss.ndl.go.jp which 303-redirects)
 *
 * The new NDL endpoint returns recordPacking="string": DC content inside <recordData> is
 * HTML-encoded. xmlText() HTML-decodes it, then we parse DC fields from the resulting string.
 *
 * Usage: GET /api/ndl-isbn?isbn=9784003010105
 */
export async function onRequestGet({ request }) {
  const url = new URL(request.url)
  const isbn = url.searchParams.get('isbn')

  if (!isbn) return json({ error: 'Missing isbn parameter' }, 400)

  const clean = isbn.replace(/[-\s]/g, '')
  if (!/^\d{10}$|^\d{13}$/.test(clean)) {
    return json({ error: 'Invalid isbn' }, 400)
  }

  const params = new URLSearchParams({
    operation: 'searchRetrieve',
    version: '1.2',
    query: `isbn="${clean}"`,
    recordSchema: 'dc',
    maximumRecords: '1',
  })

  let upstream
  try {
    upstream = await fetch(`https://ndlsearch.ndl.go.jp/api/sru?${params.toString()}`, {
      headers: { 'User-Agent': 'POSI/0.1 (mailto:posi@panoramagroup.org)' },
      signal: AbortSignal.timeout(10000),
    })
  } catch {
    return json({ found: false, error: 'Upstream fetch failed' }, 502)
  }

  if (!upstream.ok) return json({ found: false, error: `NDL ${upstream.status}` }, 502)

  const xml = await upstream.text()

  const total = parseInt(xmlText(xml, 'numberOfRecords') || '0', 10)
  if (total === 0) return json({ found: false }, 200)

  // Extract <recordData> and HTML-decode it (recordPacking=string on the new NDL endpoint)
  const recordBlock = xmlAll(xml, 'record')[0]
  if (!recordBlock) return json({ found: false }, 200)

  const dc = xmlText(recordBlock, 'recordData')   // HTML-decoded DC string
  if (!dc) return json({ found: false }, 200)

  const title = xmlText(dc, 'title')
  if (!title) return json({ found: false }, 200)

  const creatorsRaw = xmlAll(dc, 'creator')
  const authors = creatorsRaw.flatMap(cleanNdlCreator).filter(Boolean)

  const publisher = xmlText(dc, 'publisher') || null
  const dateRaw   = xmlText(dc, 'date') || xmlText(dc, 'issued') || ''
  const year      = dateRaw.match(/\d{4}/)?.[0] ?? null
  const subjects  = xmlAll(dc, 'subject')

  return json({ found: true, title, authors, year, publisher, subjects }, 200)
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() })
}

/**
 * NDL creator: may pack multiple authors into one element separated by " ; ".
 * Strips role brackets [原作][著], trailing role kanji, and birth/death years.
 * Returns an array (use with flatMap).
 */
function cleanNdlCreator(raw) {
  return raw
    .split(/\s*;\s*/)
    .map(s => s
      .replace(/\[.*?\]/g, '')
      .replace(/\s*(?:著者?|編著?|訳者?|監修|画|絵)$/, '')
      .replace(/,\s*\d{4}[-–]\d{0,4}\.?$/, '')
      .trim()
    )
    .filter(Boolean)
}

function xmlText(xml, tag) {
  const re = new RegExp(
    `<(?:[a-z_]+:)?${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:[a-z_]+:)?${tag}>`, 'i'
  )
  const raw = re.exec(xml)?.[1] ?? ''
  return raw
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim()
}

function xmlAll(xml, tag) {
  const re = new RegExp(
    `<(?:[a-z_]+:)?${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:[a-z_]+:)?${tag}>`, 'gi'
  )
  const out = []
  let m
  while ((m = re.exec(xml)) !== null) {
    const val = m[1]
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim()
    if (val) out.push(val)
  }
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
