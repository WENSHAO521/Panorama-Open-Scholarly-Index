/**
 * Cloudflare Pages Function — proxy for Taiwan NCL (National Central Library) SRU title/author search.
 * No API key required; CORS bypass only.
 *
 * Usage: GET /api/taiwan-search?q=台灣&target=title
 *        target: title | author | any (default: any)
 */
export async function onRequestGet({ request }) {
  const url    = new URL(request.url)
  const q      = (url.searchParams.get('q') ?? '').trim()
  const target = url.searchParams.get('target') ?? 'any'

  if (!q) return json({ total: 0, items: [] }, 200)

  const escaped = q.replace(/"/g, '')
  let cql
  if (target === 'title')       cql = `title="${escaped}"`
  else if (target === 'author') cql = `creator="${escaped}"`
  else                          cql = `(title="${escaped}" or creator="${escaped}")`

  const params = new URLSearchParams({
    version: '1.1',
    operation: 'searchRetrieve',
    query: cql,
    recordSchema: 'dc',
    maximumRecords: '15',
    startRecord: '1',
  })

  let upstream
  try {
    upstream = await fetch(`https://ncltw.alma.exlibrisgroup.com/view/sru/886NCL_INST?${params.toString()}`, {
      headers: { 'User-Agent': 'POSI/0.1 (mailto:posi@panoramagroup.org)' },
      signal: AbortSignal.timeout(12000),
    })
  } catch {
    return json({ total: 0, items: [], error: 'Upstream fetch failed' }, 502)
  }

  if (!upstream.ok) return json({ total: 0, items: [], error: `NCL-TW ${upstream.status}` }, 502)

  const xml = await upstream.text()
  const total = parseInt(xmlText(xml, 'numberOfRecords') || '0', 10)

  const recordBlocks = xmlAll(xml, 'zs:record').length
    ? xmlAll(xml, 'zs:record')
    : xmlAll(xml, 'record')

  const items = recordBlocks.map(block => {
    // NCL title format: "Main title : subtitle / " — strip the trailing " / "
    const rawTitle = xmlText(block, 'title')
    if (!rawTitle) return null
    const title = rawTitle.split(' / ')[0].trim()
    if (!title) return null

    // NCL Alma uses <dc:contributor>; Chinese names use "|" as surname/given separator
    // Format: "村上|貴仁, 1970- 文字作者" or "蘇|楓雅 (翻譯學), 譯者"
    const contributors = xmlAll(block, 'contributor')
    const authors = contributors.map(c => {
      let s = c.replace(/\|/g, '')           // join surname|given → surname given
               .replace(/\s*\(.*?\)/g, '')   // strip qualifications in parens
               .replace(/,\s*\d{4}.*$/, '')  // strip ", YYYY-..." and everything after
               .replace(/,\s*[一-鿿぀-ヿ]+$/, '') // strip ", 役者" style role words
               .trim()
      return s
    }).filter(Boolean)

    const publisher  = xmlText(block, 'publisher') || null
    const dateRaw    = xmlText(block, 'date')
    const year       = parseInt(dateRaw.match(/\d{4}/)?.[0] ?? '', 10) || null
    const identifiers = xmlAll(block, 'identifier')
    const isbn = identifiers
      .map(id => id.replace(/isbn[:\s]*/i, '').replace(/[-\s]/g, '').trim())
      .find(id => /^\d{10,13}$/.test(id)) ?? ''

    return { title, authors, year, publisher, isbn: isbn ? [isbn] : [], cover_url: null, edition_count: 1 }
  }).filter(Boolean)

  return json({ total, items }, 200)
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() })
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
