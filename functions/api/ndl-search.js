/**
 * Cloudflare Pages Function — proxy for Japan National Diet Library SRU title/author search.
 * No API key required; CORS bypass only.
 *
 * Endpoint: https://ndlsearch.ndl.go.jp/api/sru  (new, replaces iss.ndl.go.jp which 303-redirects)
 *
 * The new NDL endpoint returns recordPacking="string", meaning DC content inside <recordData>
 * is HTML-encoded (e.g. &lt;dc:title&gt;). We extract <recordData>, let xmlText() HTML-decode it,
 * then parse DC fields from the resulting string.
 *
 * Usage: GET /api/ndl-search?q=銀河鉄道の夜&target=title
 *        target: title | author | any (default: any)
 */
export async function onRequestGet({ request }) {
  const url    = new URL(request.url)
  const q      = (url.searchParams.get('q') ?? '').trim()
  const target = url.searchParams.get('target') ?? 'any'

  if (!q) return json({ total: 0, items: [] }, 200)

  let cql
  if (target === 'title')       cql = `title="${q.replace(/"/g, '')}"`
  else if (target === 'author') cql = `creator="${q.replace(/"/g, '')}"`
  else                          cql = `(title="${q.replace(/"/g, '')}" or creator="${q.replace(/"/g, '')}")`

  const params = new URLSearchParams({
    operation: 'searchRetrieve',
    version: '1.2',
    recordSchema: 'dc',
    maximumRecords: '15',
    startRecord: '1',
    query: cql,
  })

  let upstream
  try {
    upstream = await fetch(`https://ndlsearch.ndl.go.jp/api/sru?${params.toString()}`, {
      headers: { 'User-Agent': 'POSI/0.1 (mailto:posi@panoramagroup.org)' },
      signal: AbortSignal.timeout(12000),
    })
  } catch {
    return json({ total: 0, items: [], error: 'Upstream fetch failed' }, 502)
  }

  if (!upstream.ok) return json({ total: 0, items: [], error: `NDL ${upstream.status}` }, 502)

  const xml = await upstream.text()
  const total = parseInt(xmlText(xml, 'numberOfRecords') || '0', 10)

  // Each <record> block contains <recordData> with HTML-encoded DC content (recordPacking=string).
  // xmlText() HTML-decodes the extracted value, giving us parseable DC XML.
  const recordBlocks = xmlAll(xml, 'record')

  const items = recordBlocks.map(block => {
    const dc = xmlText(block, 'recordData')   // HTML-decoded DC string
    if (!dc) return null

    const title = xmlText(dc, 'title')
    if (!title) return null

    const creatorsRaw = xmlAll(dc, 'creator')
    const authors = creatorsRaw.flatMap(cleanNdlCreator).filter(Boolean)

    const publisher = xmlText(dc, 'publisher') || null
    const dateRaw   = xmlText(dc, 'date') || xmlText(dc, 'issued') || ''
    const year      = parseInt(dateRaw.match(/\d{4}/)?.[0] ?? '', 10) || null

    // NDL identifiers: "ISBN:XXXX" or "urn:isbn:XXXX"
    const identifiers = xmlAll(dc, 'identifier')
    const isbn = identifiers
      .map(id => id.replace(/(?:urn:)?isbn[:\s]*/i, '').replace(/[-\s]/g, '').trim())
      .find(id => /^\d{10,13}$/.test(id)) ?? ''

    return { title, authors, year, publisher, isbn: isbn ? [isbn] : [], cover_url: null, edition_count: 1 }
  }).filter(Boolean)

  return json({ total, items }, 200)
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() })
}

/**
 * NDL creator format: "村上春樹 著" or "宮沢賢治 [原作] ; 別役実, 杉井ギサブロウ著"
 * Splits on " ; " (NDL sometimes packs multiple creators into one element),
 * strips role brackets [原作][著][編], trailing role words, and birth/death years.
 * Returns an array (use with flatMap).
 */
function cleanNdlCreator(raw) {
  return raw
    .split(/\s*;\s*/)
    .map(s => s
      .replace(/\[.*?\]/g, '')                // strip [原作], [著], [編], etc.
      .replace(/\s*(?:著者?|編著?|訳者?|監修|画|絵)$/, '') // strip trailing role kanji (with or without space)
      .replace(/,\s*\d{4}[-–]\d{0,4}\.?$/, '') // strip Western birth/death years
      .trim()
    )
    .filter(Boolean)
}

function xmlText(xml, tag) {
  const re  = new RegExp(`<(?:[a-z_]+:)?${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:[a-z_]+:)?${tag}>`, 'i')
  const raw = re.exec(xml)?.[1] ?? ''
  return raw
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim()
}

function xmlAll(xml, tag) {
  const re  = new RegExp(`<(?:[a-z_]+:)?${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:[a-z_]+:)?${tag}>`, 'gi')
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
    'Cache-Control': 'no-store',
  }
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  })
}
